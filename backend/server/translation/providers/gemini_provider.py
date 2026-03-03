"""
Gemini Translation Provider - Sử dụng Google Gemini API cho translation
Miễn phí 15 requests/phút với gemini-1.5-flash
"""
import os
import logging
from typing import Optional

from .base import BaseTranslationProvider, TranslationResult

logger = logging.getLogger(__name__)

GEMINI_SDK_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GEMINI_SDK_AVAILABLE = True
except ImportError:
    logger.warning("google-genai chưa được cài đặt. Cài đặt bằng: pip install google-genai")


class GeminiTranslationProvider(BaseTranslationProvider):
    """Google Gemini API for translation"""
    
    provider_name = "gemini"
    
    # Language code mapping for Gemini
    LANGUAGE_MAP = {
        'vi': 'Vietnamese',
        'en': 'English',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ja': 'Japanese',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'th': 'Thai',
        'ru': 'Russian',
        'auto': 'auto'
    }
    
    def __init__(self, api_key: str = None, model: str = "gemini-2.0-flash"):
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY', '')
        self.model = model
        self.client = None
        
        if self.api_key and GEMINI_SDK_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"✅ Gemini translation provider ready! Model: {self.model}")
            except Exception as e:
                logger.error(f"❌ Lỗi khởi tạo Gemini client: {e}")
    
    def translate(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str,
        context: Optional[str] = None
    ) -> TranslationResult:
        """Translate text using Gemini"""
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo")
        
        # Build prompt for translation
        source_name = self.LANGUAGE_MAP.get(source_lang, source_lang)
        target_name = self.LANGUAGE_MAP.get(target_lang, target_lang)
        
        if source_lang == 'auto':
            prompt = f"""Translate the following text to {target_name}.
            
Only return the translated text, nothing else.

Text to translate:
{text}
"""
        else:
            prompt = f"""Translate the following text from {source_name} to {target_name}.

Only return the translated text, nothing else.

Text to translate:
{text}
"""
        
        if context:
            prompt += f"\n\nContext: {context}"
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    max_output_tokens=4000,
                    temperature=0.1  # Low temperature for accurate translation
                )
            )
            
            translated_text = ""
            if hasattr(response, 'text'):
                translated_text = response.text
            elif hasattr(response, 'parts'):
                translated_text = "".join([part.text for part in response.parts])
            
            return TranslationResult(
                translated_text=translated_text.strip(),
                provider=self.provider_name,
                confidence=None,
                detected_lang=source_lang if source_lang != 'auto' else None
            )
            
        except Exception as e:
            logger.error(f"❌ Lỗi translation với Gemini: {e}")
            raise
    
    def detect_language(self, text: str) -> str:
        """Detect language using Gemini"""
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo")
        
        prompt = f"""Detect the language of the following text.
Return ONLY the language code (e.g., 'vi', 'en', 'zh'), nothing else.

Text:
{text}
"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    max_output_tokens=10,
                    temperature=0.1
                )
            )
            
            lang_code = ""
            if hasattr(response, 'text'):
                lang_code = response.text.strip().lower()
            elif hasattr(response, 'parts'):
                lang_code = "".join([part.text for part in response.parts]).strip().lower()
            
            # Validate language code
            if lang_code in self.LANGUAGE_MAP:
                return lang_code
            
            # Try to extract language code
            for code in self.LANGUAGE_MAP:
                if code in lang_code:
                    return code
            
            return 'en'  # Default fallback
            
        except Exception as e:
            logger.error(f"❌ Lỗi detect language: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if Gemini is available"""
        return self.client is not None and GEMINI_SDK_AVAILABLE
