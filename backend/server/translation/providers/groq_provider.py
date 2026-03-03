"""
Groq Translation Provider - Sử dụng Groq API (miễn phí, cực nhanh)
https://console.groq.com/keys
"""
import os
import logging
from typing import Optional

from .base import BaseTranslationProvider, TranslationResult

logger = logging.getLogger(__name__)

GROQ_AVAILABLE = False
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("groq chưa được cài đặt. Cài đặt bằng: pip install groq")


class GroqTranslationProvider(BaseTranslationProvider):
    """Groq API for translation - Free tier rất mạnh"""
    
    provider_name = "groq"
    
    # Language code mapping
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
    
    def __init__(self, api_key: str = None, model: str = "llama-3.3-70b-versatile"):
        if not GROQ_AVAILABLE:
            self.client = None
            self.model = model
            return
            
        if api_key is None:
            # Try to get from config_ai
            try:
                from config_ai import GROQ_API_KEY
                api_key = GROQ_API_KEY
            except:
                api_key = os.environ.get('GROQ_API_KEY', '')
        
        # Check if API key is valid
        if not api_key or api_key == "gsk_...":
            self.client = None
            logger.warning("Groq API key chưa được cấu hình")
            self.model = model
            return
        
        try:
            self.client = Groq(api_key=api_key)
            self.model = model
            logger.info(f"✅ Groq translation provider ready! Model: {self.model}")
        except Exception as e:
            self.client = None
            logger.error(f"❌ Lỗi khởi tạo Groq client: {e}")
            self.model = model
    
    def translate(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str,
        context: Optional[str] = None
    ) -> TranslationResult:
        """Translate text using Groq"""
        if not self.client:
            raise Exception("Groq client chưa được khởi tạo")
        
        # Build prompt for translation
        source_name = self.LANGUAGE_MAP.get(source_lang, source_lang)
        target_name = self.LANGUAGE_MAP.get(target_lang, target_lang)
        
        if source_lang == 'auto':
            system_prompt = f"""You are a professional translator. 
Translate the text to {target_name}.
Only return the translated text, nothing else."""
        else:
            system_prompt = f"""You are a professional translator.
Translate from {source_name} to {target_name}.
Only return the translated text, nothing else."""
        
        user_message = text
        if context:
            user_message += f"\n\nContext: {context}"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=4000,
                temperature=0.1
            )
            
            translated_text = response.choices[0].message.content
            
            return TranslationResult(
                translated_text=translated_text.strip(),
                provider=self.provider_name,
                confidence=None,
                detected_lang=source_lang if source_lang != 'auto' else None
            )
            
        except Exception as e:
            logger.error(f"❌ Lỗi translation với Groq: {e}")
            raise
    
    def detect_language(self, text: str) -> str:
        """Detect language using Groq"""
        if not self.client:
            raise Exception("Groq client chưa được khởi tạo")
        
        prompt = """Detect the language of the following text.
Return ONLY the language code (e.g., 'vi', 'en', 'zh'), nothing else.

Text: """
        prompt += text
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a language detector. Return only the ISO 639-1 language code."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.1
            )
            
            lang_code = response.choices[0].message.content.strip().lower()
            
            # Validate language code
            if lang_code in self.LANGUAGE_MAP:
                return lang_code
            
            # Try to extract language code
            for code in self.LANGUAGE_MAP:
                if code in lang_code:
                    return code
            
            return 'en'
            
        except Exception as e:
            logger.error(f"❌ Lỗi detect language: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if Groq is available"""
        return self.client is not None and GROQ_AVAILABLE
