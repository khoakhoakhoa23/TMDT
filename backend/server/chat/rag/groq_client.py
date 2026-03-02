"""
Groq Client - Miễn phí, cực nhanh!
https://console.groq.com/keys
"""

import os
import logging
from typing import List, Optional

# Bọc import Groq trong try-except để không crash khi module không có
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False

logger = logging.getLogger(__name__)

class GroqClient:
    def __init__(self, api_key: str = None):
        if not GROQ_AVAILABLE or Groq is None:
            self.client = None
            logger.warning("Groq module chua duoc cai dat. Cai dat bang: pip install groq")
            return
            
        if api_key is None:
            from config_ai import GROQ_API_KEY
            api_key = GROQ_API_KEY
        
        if not api_key or api_key == "gsk_...":
            self.client = None
            logger.warning("Groq API key chua duoc cau hinh")
            return
        
        try:
            self.client = Groq(api_key=api_key)
            self.chat_model = getattr(__import__('config_ai', fromlist=['GROQ_CHAT_MODEL']), 'GROQ_CHAT_MODEL') or "llama-3.3-70b-versatile"
            self.embedding_model = getattr(__import__('config_ai', fromlist=['GROQ_EMBEDDING_MODEL']), 'GROQ_EMBEDDING_MODEL') or "text-embedding-3-small"
            logger.info(f"OK: Groq client initialized with model: {self.chat_model}")
        except Exception as e:
            self.client = None
            logger.error(f"ERROR: Loi khoi tao Groq: {e}")
    
    def is_available(self) -> bool:
        """Kiểm tra Groq có khả dụng không"""
        return self.client is not None
    
    def chat(self, messages: List[dict], max_tokens: int = 1000, temperature: float = 0.3) -> str:
        """
        Gửi chat request đến Groq
        
        Args:
            messages: List of message dicts [{"role": "user", "content": "..."}]
            max_tokens: Số token tối đa trong response
            temperature: Độ sáng tạo (0-1)
        
        Returns:
            str: Response text
        """
        if not self.client:
            raise Exception("Groq client chưa được khởi tạo")
        
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"ERROR: Groq chat error: {e}")
            raise
    
    def chat_stream(self, messages: List[dict], max_tokens: int = 1000, temperature: float = 0.3):
        """
        Chat với streaming response
        """
        if not self.client:
            raise Exception("Groq client chưa được khởi tạo")
        
        try:
            stream = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"ERROR: Groq stream error: {e}")
            raise
    
    def get_embedding(self, text: str) -> List[float]:
        """
        Lấy embedding vector (dùng OpenAI-compatible endpoint)
        
        Note: Groq hiện tại chưa có embedding riêng,
        dùng tạm OpenAI endpoint hoặc local embeddings
        """
        raise NotImplementedError("Groq chưa hỗ trợ embeddings. Dùng config_ai.USE_LOCAL_EMBEDDINGS = True")


# Singleton instance
_groq_client = None

def get_groq_client() -> GroqClient:
    """Lấy singleton Groq client"""
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client

