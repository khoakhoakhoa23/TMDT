"""
Translation Service - Main service for AI-powered translation
Handles caching, provider fallback, and batch translation
"""
import hashlib
import logging
from typing import Optional, List, Dict, Any

from django.conf import settings
from django.core.cache import cache

from translation.models import TranslationCache, TranslationRequest
from translation.providers import (
    BaseTranslationProvider,
    TranslationResult,
    GeminiTranslationProvider,
    GroqTranslationProvider,
    OpenAITranslationProvider,
)

logger = logging.getLogger(__name__)


class TranslationService:
    """
    Main translation service with:
    - Multiple AI provider support
    - Automatic fallback
    - Caching
    - Batch translation
    """
    
    # Provider priority (tried in order)
    PROVIDER_PRIORITY = ['groq', 'gemini', 'openai']
    
    # Cache timeout (24 hours)
    CACHE_TIMEOUT = 24 * 60 * 60
    
    def __init__(self):
        self.providers: Dict[str, BaseTranslationProvider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available providers"""
        # Groq (free, fast)
        try:
            groq = GroqTranslationProvider()
            if groq.is_available():
                self.providers['groq'] = groq
                logger.info("✅ Groq provider initialized")
        except Exception as e:
            logger.warning(f"⚠️ Groq provider failed: {e}")
        
        # Gemini (free tier)
        try:
            gemini = GeminiTranslationProvider()
            if gemini.is_available():
                self.providers['gemini'] = gemini
                logger.info("✅ Gemini provider initialized")
        except Exception as e:
            logger.warning(f"⚠️ Gemini provider failed: {e}")
        
        # OpenAI (paid)
        try:
            openai = OpenAITranslationProvider()
            if openai.is_available():
                self.providers['openai'] = openai
                logger.info("✅ OpenAI provider initialized")
        except Exception as e:
            logger.warning(f"⚠️ OpenAI provider failed: {e}")
        
        logger.info(f"Initialized {len(self.providers)} translation providers")
    
    def _get_cache_key(self, text: str, source_lang: str, target_lang: str) -> str:
        """Generate cache key for translation"""
        key_str = f"{text}:{source_lang}:{target_lang}"
        return f"translation:{hashlib.md5(key_str.encode()).hexdigest()}"
    
    def _get_from_cache(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Get translation from Django cache"""
        cache_key = self._get_cache_key(text, source_lang, target_lang)
        
        # Try Django cache first
        cached = cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit: {source_lang} -> {target_lang}")
            return cached
        
        # Try database cache
        try:
            db_cache = TranslationCache.objects.get(
                source_text=text,
                source_lang=source_lang,
                target_lang=target_lang
            )
            # Update hit count
            db_cache.hit_count += 1
            db_cache.save()

            # Store in Django cache
            cache.set(cache_key, db_cache.translated_text, self.CACHE_TIMEOUT)
            return db_cache.translated_text
        except TranslationCache.DoesNotExist:
            return None
    
    def _save_to_cache(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str, 
        translated_text: str,
        provider: str,
        confidence: Optional[float] = None
    ):
        """Save translation to cache"""
        cache_key = self._get_cache_key(text, source_lang, target_lang)
        
        # Save to Django cache
        cache.set(cache_key, translated_text, self.CACHE_TIMEOUT)
        
        # Save to database
        try:
            TranslationCache.objects.create(
                source_text=text,
                source_lang=source_lang,
                target_lang=target_lang,
                translated_text=translated_text,
                ai_provider=provider,
                confidence_score=confidence
            )
        except Exception as e:
            logger.error(f"Failed to save to DB cache: {e}")
    
    def _get_provider(self, provider_name: str = None) -> Optional[BaseTranslationProvider]:
        """Get provider by name or return first available"""
        if provider_name and provider_name in self.providers:
            return self.providers[provider_name]
        
        # Return first available provider
        for provider in self.PROVIDER_PRIORITY:
            if provider in self.providers:
                return self.providers[provider]
        
        return None
    
    def translate(
        self,
        text: str,
        source_lang: str = 'auto',
        target_lang: str = 'vi',
        provider: str = None,
        context: Optional[str] = None,
        use_cache: bool = True,
        save_request: bool = False,
        user=None
    ) -> TranslationResult:
        """
        Translate text with automatic provider fallback
        """
        if not text or not text.strip():
            return TranslationResult(
                translated_text="",
                provider="none",
                confidence=1.0
            )
        
        # Check cache
        if use_cache:
            cached = self._get_from_cache(text, source_lang, target_lang)
            if cached:
                return TranslationResult(
                    translated_text=cached,
                    provider="cache",
                    confidence=1.0
                )
        
        # Get provider
        translation_provider = self._get_provider(provider)
        if not translation_provider:
            raise Exception("No translation provider available. Please configure at least one AI provider.")
        
        # Detect language if auto
        detected_lang = source_lang
        if source_lang == 'auto':
            try:
                detected_lang = translation_provider.detect_language(text)
            except Exception as e:
                logger.warning(f"Failed to detect language: {e}")
                detected_lang = 'en'
        
        # Translate
        try:
            result = translation_provider.translate(
                text=text,
                source_lang=detected_lang,
                target_lang=target_lang,
                context=context
            )
            
            # Update detected language
            result.detected_lang = detected_lang
            
            # Save to cache
            if use_cache:
                self._save_to_cache(
                    text=text,
                    source_lang=detected_lang,
                    target_lang=target_lang,
                    translated_text=result.translated_text,
                    provider=result.provider,
                    confidence=result.confidence
                )
            
            # Save request to DB
            if save_request:
                TranslationRequest.objects.create(
                    content_type='other',
                    content_id=0,
                    original_text=text,
                    source_lang=detected_lang,
                    target_lang=target_lang,
                    translated_text=result.translated_text,
                    ai_provider=result.provider,
                    confidence_score=result.confidence,
                    status='completed',
                    requested_by=user
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Translation failed with {translation_provider.provider_name}: {e}")
            
            # Try fallback provider
            for fallback_name in self.PROVIDER_PRIORITY:
                if fallback_name == translation_provider.provider_name:
                    continue
                if fallback_name not in self.providers:
                    continue
                
                try:
                    logger.info(f"Trying fallback provider: {fallback_name}")
                    fallback_provider = self.providers[fallback_name]
                    result = fallback_provider.translate(
                        text=text,
                        source_lang=detected_lang,
                        target_lang=target_lang,
                        context=context
                    )
                    
                    # Save to cache
                    if use_cache:
                        self._save_to_cache(
                            text=text,
                            source_lang=detected_lang,
                            target_lang=target_lang,
                            translated_text=result.translated_text,
                            provider=result.provider,
                            confidence=result.confidence
                        )
                    
                    return result
                except Exception as fallback_error:
                    logger.error(f"Fallback provider {fallback_name} also failed: {fallback_error}")
                    continue
            
            raise Exception(f"All translation providers failed: {e}")
    
    def translate_batch(
        self,
        texts: List[str],
        source_lang: str = 'auto',
        target_lang: str = 'vi',
        provider: str = None,
        context: Optional[str] = None
    ) -> List[TranslationResult]:
        """
        Translate multiple texts
        """
        results = []
        
        for text in texts:
            try:
                result = self.translate(
                    text=text,
                    source_lang=source_lang,
                    target_lang=target_lang,
                    provider=provider,
                    context=context
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Translation failed for text: {e}")
                results.append(TranslationResult(
                    translated_text=text,
                    provider="error",
                    confidence=0.0
                ))
        
        return results
    
    def detect_language(self, text: str) -> str:
        """Detect language of text"""
        provider = self._get_provider()
        if not provider:
            raise Exception("No translation provider available")
        
        return provider.detect_language(text)
    
    def get_available_providers(self) -> Dict[str, bool]:
        """Get status of all providers"""
        return {
            name: provider.is_available()
            for name, provider in self.providers.items()
        }


# Global service instance
_translation_service: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    """Get global translation service instance"""
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService()
    return _translation_service


def reset_translation_service():
    """Reset global service (for testing)"""
    global _translation_service
    _translation_service = None
