from rest_framework import serializers
from .models import Language, TranslationCache, TranslationRequest, TranslationKey


class LanguageSerializer(serializers.ModelSerializer):
    """Serializer for Language model"""
    
    class Meta:
        model = Language
        fields = ['id', 'code', 'name', 'native_name', 'is_active', 'is_default']
        read_only_fields = ['id']


class TranslationCacheSerializer(serializers.ModelSerializer):
    """Serializer for TranslationCache model"""
    
    class Meta:
        model = TranslationCache
        fields = [
            'id', 'source_text', 'source_lang', 'target_lang',
            'translated_text', 'ai_provider', 'confidence_score',
            'hit_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'hit_count']


class TranslationRequestSerializer(serializers.ModelSerializer):
    """Serializer for TranslationRequest model"""
    
    class Meta:
        model = TranslationRequest
        fields = [
            'id', 'content_type', 'content_id', 'original_text',
            'source_lang', 'target_lang', 'translated_text',
            'ai_provider', 'confidence_score', 'status', 'error_message',
            'requested_by', 'reviewed_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TranslationKeySerializer(serializers.ModelSerializer):
    """Serializer for TranslationKey model"""
    
    class Meta:
        model = TranslationKey
        fields = ['id', 'key', 'description', 'translations', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============== Request/Response Serializers ==============

class TranslateRequestSerializer(serializers.Serializer):
    """Request serializer for translation endpoint"""
    text = serializers.CharField(required=True, allow_blank=False)
    source_lang = serializers.CharField(default='auto', max_length=10)
    target_lang = serializers.CharField(default='vi', max_length=10)
    provider = serializers.CharField(required=False, allow_null=True, max_length=20)
    context = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    use_cache = serializers.BooleanField(default=True)


class TranslateResponseSerializer(serializers.Serializer):
    """Response serializer for translation endpoint"""
    translated_text = serializers.CharField()
    detected_lang = serializers.CharField()
    target_lang = serializers.CharField()
    provider = serializers.CharField()
    confidence = serializers.FloatField(allow_null=True)
    cached = serializers.BooleanField()


class BatchTranslateRequestSerializer(serializers.Serializer):
    """Request serializer for batch translation"""
    texts = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        min_length=1,
        max_length=100
    )
    source_lang = serializers.CharField(default='auto', max_length=10)
    target_lang = serializers.CharField(default='vi', max_length=10)
    provider = serializers.CharField(required=False, allow_null=True, max_length=20)
    context = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class BatchTranslateResponseSerializer(serializers.Serializer):
    """Response serializer for batch translation"""
    results = serializers.ListField()
    total = serializers.IntegerField()
    success_count = serializers.IntegerField()


class DetectLanguageRequestSerializer(serializers.Serializer):
    """Request serializer for language detection"""
    text = serializers.CharField(required=True, allow_blank=False)


class DetectLanguageResponseSerializer(serializers.Serializer):
    """Response serializer for language detection"""
    detected_lang = serializers.CharField()
    confidence = serializers.FloatField(allow_null=True)
