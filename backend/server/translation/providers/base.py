"""
Base provider interface for AI translation services.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TranslationResult:
    """Result from translation provider"""
    translated_text: str
    provider: str
    confidence: Optional[float] = None
    detected_lang: Optional[str] = None


class BaseTranslationProvider(ABC):
    """Abstract base class for translation providers"""
    
    provider_name: str = ""
    
    @abstractmethod
    def translate(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str,
        context: Optional[str] = None
    ) -> TranslationResult:
        """
        Translate text from source language to target language.
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'vi', 'en', 'auto')
            target_lang: Target language code (e.g., 'vi', 'en')
            context: Optional context for better translation
            
        Returns:
            TranslationResult with translated text and metadata
        """
        pass
    
    @abstractmethod
    def detect_language(self, text: str) -> str:
        """
        Detect the language of the given text.
        
        Args:
            text: Text to detect language
            
        Returns:
            Language code (e.g., 'vi', 'en')
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if the provider is available and configured.
        
        Returns:
            True if provider can be used
        """
        pass
