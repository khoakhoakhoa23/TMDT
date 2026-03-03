"""
Translation API Views
"""
import asyncio
import logging

from django.utils.decorators import sync_and_async_middleware
from django.db import close_old_connections

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from asgiref.sync import sync_to_async

from .models import Language, TranslationCache, TranslationRequest, TranslationKey
from .serializers import (
    LanguageSerializer,
    TranslationCacheSerializer,
    TranslationRequestSerializer,
    TranslationKeySerializer,
    TranslateRequestSerializer,
    TranslateResponseSerializer,
    BatchTranslateRequestSerializer,
    BatchTranslateResponseSerializer,
    DetectLanguageRequestSerializer,
    DetectLanguageResponseSerializer,
)
from .services.translation_service import get_translation_service

logger = logging.getLogger(__name__)


class LanguageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supported languages"""
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get default language"""
        default_lang = Language.objects.filter(is_default=True).first()
        if default_lang:
            serializer = self.get_serializer(default_lang)
            return Response(serializer.data)
        return Response({'error': 'No default language set'}, status=status.HTTP_404_NOT_FOUND)


class TranslationCacheViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing translation cache"""
    queryset = TranslationCache.objects.all()
    serializer_class = TranslationCacheSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['source_lang', 'target_lang', 'ai_provider']
    search_fields = ['source_text', 'translated_text']
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all translation cache (admin only)"""
        TranslationCache.objects.all().delete()
        return Response({'message': 'Translation cache cleared'})


class TranslationRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing translation requests"""
    queryset = TranslationRequest.objects.all()
    serializer_class = TranslationRequestSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['content_type', 'status', 'source_lang', 'target_lang']
    search_fields = ['original_text', 'translated_text']


class TranslationKeyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing UI translation keys"""
    queryset = TranslationKey.objects.filter(is_active=True)
    serializer_class = TranslationKeySerializer
    permission_classes = [IsAdminUser]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Get all translations for a specific language"""
        lang = request.query_params.get('lang', 'vi')
        
        keys = TranslationKey.objects.filter(is_active=True)
        translations = {key.key: key.get_translation(lang) for key in keys}
        
        return Response(translations)


@api_view(['POST'])
@permission_classes([AllowAny])
def translate_text(request):
    """
    Translate text from one language to another
    
    POST /api/translation/translate/
    Body: {
        "text": "Hello world",
        "source_lang": "auto",  // or "en"
        "target_lang": "vi",   // or "zh", "ko", "ja"
        "provider": "groq",    // optional, auto-select if not provided
        "context": "optional context for better translation"
    }
    """
    serializer = TranslateRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        translation_service = get_translation_service()
        result = translation_service.translate(
            text=data['text'],
            source_lang=data['source_lang'],
            target_lang=data['target_lang'],
            provider=data.get('provider'),
            context=data.get('context'),
            use_cache=data.get('use_cache', True),
            save_request=False
        )
        
        response_data = {
            'translated_text': result.translated_text,
            'detected_lang': result.detected_lang or data['source_lang'],
            'target_lang': data['target_lang'],
            'provider': result.provider,
            'confidence': result.confidence,
            'cached': result.provider == 'cache'
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def translate_batch(request):
    """
    Translate multiple texts at once
    
    POST /api/translation/batch/
    Body: {
        "texts": ["Hello", "World", "How are you?"],
        "source_lang": "auto",
        "target_lang": "vi"
    }
    """
    serializer = BatchTranslateRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        translation_service = get_translation_service()
        results = translation_service.translate_batch(
            texts=data['texts'],
            source_lang=data['source_lang'],
            target_lang=data['target_lang'],
            provider=data.get('provider'),
            context=data.get('context')
        )
        
        # Count successes
        success_count = sum(1 for r in results if r.provider != 'error')
        
        response_data = {
            'results': [
                {
                    'translated_text': r.translated_text,
                    'provider': r.provider,
                    'confidence': r.confidence
                }
                for r in results
            ],
            'total': len(results),
            'success_count': success_count
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Batch translation error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def detect_language(request):
    """
    Detect the language of given text
    
    POST /api/translation/detect/
    Body: {
        "text": "Xin chào"
    }
    """
    serializer = DetectLanguageRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    text = serializer.validated_data['text']
    
    try:
        translation_service = get_translation_service()
        detected_lang = translation_service.detect_language(text)
        
        return Response({
            'detected_lang': detected_lang,
            'confidence': None  # AI providers don't always return confidence
        })
        
    except Exception as e:
        logger.error(f"Language detection error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def translation_status(request):
    """
    Get status of translation service and available providers
    
    GET /api/translation/status/
    """
    translation_service = get_translation_service()
    
    try:
        # Check provider availability synchronously
        provider_status = {}
        for name, provider in translation_service.providers.items():
            try:
                provider_status[name] = asyncio.run(provider.is_available())
            except Exception:
                provider_status[name] = False
        
        # Add missing providers as false
        for name in ['groq', 'gemini', 'openai']:
            if name not in provider_status:
                provider_status[name] = False
        
        # Get language stats
        total_cache = TranslationCache.objects.count()
        total_requests = TranslationRequest.objects.count()
        
        return Response({
            'available': len([p for p in provider_status.values() if p]) > 0,
            'providers': provider_status,
            'stats': {
                'cache_entries': total_cache,
                'total_requests': total_requests
            }
        })
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return Response({
            'available': False,
            'error': str(e)
        })
