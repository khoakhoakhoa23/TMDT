"""
OpenAI Translation Provider - Sử dụng OpenAI API (GPT-4, GPT-3.5)
"""
import os
import logging
from typing import Optional

from .base import BaseTranslationProvider, TranslationResult

logger = logging.getLogger(__name__)

OPENAI_AVAILABLE = False
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    logger.warning("openai chưa được cài đặt. Cài đặt bằng: pip install openai")


class OpenAITranslationProvider(BaseTranslationProvider):
    """OpenAI API for translation"""
    
    provider_name = "openai"
    
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
    
    def __init__(self, api_key: str = None, model: str = "gpt-4o-mini"):
        if not OPENAI_AVAILABLE:
            self.client = None
            self.model = model
            return
            
        if api_key is None:
            api_key = os.environ.get('OPENAI_API_KEY', '')
        
        if not api_key:
            self.client = None
            logger.warning("OpenAI API key chưa được cấu hình")
            self.model = model
            return
        
        try:
            self.client = OpenAI(api_key=api_key)
            self.model = model
            logger.info(f"✅ OpenAI translation provider ready! Model: {self.model}")
        except Exception as e:
            self.client = None
            logger.error(f"❌ Lỗi khởi tạo OpenAI client: {e}")
            self.model = model
    
    def translate(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str,
        context: Optional[str] = None
    ) -> TranslationResult:
        """Translate text using OpenAI"""
        if not self.client:
            raise Exception("OpenAI client chưa được khởi tạo")
        
        # Build prompt
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
            logger.error(f"❌ Lỗi translation với OpenAI: {e}")
            raise
    
    def detect_language(self, text: str) -> str:
        """Detect language using OpenAI"""
        if not self.client:
            raise Exception("OpenAI client chưa được khởi tạo")
        
        prompt = f"""Detect the language of the following text.
Return ONLY the language code (e.g., 'vi', 'en', 'zh'), nothing else.

Text: {text}"""
        
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
            
            # Validate
            if lang_code in self.LANGUAGE_MAP:
                return lang_code
            
            for code in self.LANGUAGE_MAP:
                if code in lang_code:
                    return code
            
            return 'en'
            
        except Exception as e:
            logger.error(f"❌ Lỗi detect language: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return self.client is not None and OPENAI_AVAILABLE
