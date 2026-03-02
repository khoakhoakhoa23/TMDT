"""
Gemini Client Wrapper - Module gọi Google Gemini API
Miễn phí, không giới hạn!
Lấy API key: https://aistudio.google.com/
"""

import os
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

# Thử import Google GenAI SDK (mới nhất)
GEMINI_SDK_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GEMINI_SDK_AVAILABLE = True
    print("OK: Google GenAI SDK da duoc cai dat!")
except ImportError:
    print("WARNING: Chua cai dat google-genai. Cai dat bang: pip install google-genai")


@dataclass
class EmbeddingResult:
    """Kết quả embedding"""
    embedding: List[float]
    model: str
    usage: Dict[str, int]


@dataclass
class ChatCompletionResult:
    """Kết quả chat completion"""
    content: str
    model: str
    usage: Dict[str, int]
    finish_reason: str


class GeminiClient:
    """
    Gemini API Client
    Hỗ trợ chat completion và embeddings
    """
    
    def __init__(
        self,
        api_key: str = None,
        chat_model: str = None,
        embedding_model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.3
    ):
        """
        Khởi tạo Gemini client
        
        Args:
            api_key: Gemini API key
            chat_model: Tên model chat (gemini-1.5-flash, gemini-1.5-pro)
            embedding_model: Tên model embedding (embedding-001)
            max_tokens: Số token tối đa
            temperature: Tham số nhiệt độ (0.0 - 1.0)
        """
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY', '')
        self.chat_model = chat_model or "gemini-1.5-flash"
        self.embedding_model = embedding_model or "embedding-001"
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        # Khởi tạo client
        self.client = None
        if self.api_key and GEMINI_SDK_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
                print(f"✅ Gemini client đã sẵn sàng! Model: {self.chat_model}")
            except Exception as e:
                print(f"❌ Lỗi khởi tạo Gemini client: {e}")
    
    def is_available(self) -> bool:
        """Kiểm tra API có sẵn không"""
        return self.client is not None
    
    def get_embedding(self, text: str) -> EmbeddingResult:
        """
        Lấy vector embedding của văn bản
        
        Args:
            text: Văn bản đầu vào
            
        Returns:
            Kết quả embedding (vector 768 chiều)
        """
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo. Vui lòng cấu hình API key.")
        
        # Làm sạch văn bản
        text = text.replace("\n", " ")
        
        try:
            # Gemini embedding API (mới)
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=[text]
            )
            
            if hasattr(response, 'embeddings') and response.embeddings:
                embedding = response.embeddings[0].values
            else:
                raise Exception("Không nhận được embedding từ Gemini")
            
            return EmbeddingResult(
                embedding=embedding,
                model=self.embedding_model,
                usage={'prompt_tokens': len(text.split())}
            )
        except Exception as e:
            print(f"❌ Lỗi Gemini embedding: {e}")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[EmbeddingResult]:
        """
        Lấy nhiều vector embedding
        
        Args:
            texts: Danh sách văn bản
            
        Returns:
            Danh sách kết quả embedding
        """
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo. Vui lòng cấu hình API key.")
        
        # Làm sạch văn bản
        texts = [t.replace("\n", " ") for t in texts]
        
        try:
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=texts
            )
            
            results = []
            for emb in response.embeddings:
                results.append(EmbeddingResult(
                    embedding=emb.values,
                    model=self.embedding_model,
                    usage={'prompt_tokens': len(texts[0].split())}
                ))
            
            return results
        except Exception as e:
            print(f"❌ Lỗi Gemini embeddings: {e}")
            raise
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = None,
        temperature: float = None,
        stream: bool = False
    ) -> ChatCompletionResult:
        """
        Gửi yêu cầu chat completion
        
        Args:
            messages: Danh sách tin nhắn [{role: 'user', content: '...'}]
            max_tokens: Số token tối đa
            temperature: Tham số nhiệt độ
            stream: Có xuất streaming không
            
        Returns:
            Kết quả chat completion
        """
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo. Vui lòng cấu hình API key.")
        
        max_tokens = max_tokens or self.max_tokens
        temperature = temperature if temperature is not None else self.temperature
        
        # Chuyển đổi messages sang định dạng Gemini
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                prompt += f"User: {content}\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n"
            elif role == 'system':
                prompt += f"System: {content}\n"
        
        prompt = prompt.strip()
        
        try:
            # Gemini chat completion
            response = self.client.models.generate_content(
                model=self.chat_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature
                )
            )
            
            content = ""
            if hasattr(response, 'text'):
                content = response.text
            elif hasattr(response, 'parts'):
                content = "".join([part.text for part in response.parts])
            
            return ChatCompletionResult(
                content=content,
                model=self.chat_model,
                usage={'prompt_tokens': self._count_tokens(prompt)},
                finish_reason="stop"
            )
        except Exception as e:
            print(f"❌ Lỗi Gemini chat: {e}")
            raise
    
    def chat_completion_stream(self, messages: List[Dict[str, str]]):
        """
        Gửi yêu cầu chat completion theo kiểu streaming
        
        Args:
            messages: Danh sách tin nhắn
            
        Yields:
            Các chunk nội dung
        """
        if not self.client:
            raise Exception("Gemini client chưa được khởi tạo. Vui lòng cấu hình API key.")
        
        # Chuyển đổi messages
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                prompt += f"User: {content}\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n"
            elif role == 'system':
                prompt += f"System: {content}\n"
        
        prompt = prompt.strip()
        
        try:
            response = self.client.models.generate_content_stream(
                model=self.chat_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    max_output_tokens=self.max_tokens,
                    temperature=self.temperature
                )
            )
            
            for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
                elif hasattr(chunk, 'parts'):
                    for part in chunk.parts:
                        if hasattr(part, 'text') and part.text:
                            yield part.text
        except Exception as e:
            print(f"❌ Lỗi Gemini streaming: {e}")
            raise
    
    def _count_tokens(self, text: str) -> int:
        """Đếm token (ước lượng đơn giản)"""
        return len(text.split())
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Lấy thông tin model
        
        Returns:
            Từ điển thông tin model
        """
        return {
            'chat_model': self.chat_model,
            'embedding_model': self.embedding_model,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'available': self.is_available(),
            'sdk_available': GEMINI_SDK_AVAILABLE
        }


# Global client instance
_default_client: Optional[GeminiClient] = None


def get_gemini_client(
    api_key: str = None,
    chat_model: str = None,
    embedding_model: str = None
) -> GeminiClient:
    """
    Lấy global Gemini client instance
    
    Args:
        api_key: API key
        chat_model: Chat model
        embedding_model: Embedding model
        
    Returns:
        GeminiClient instance
    """
    global _default_client
    if _default_client is None:
        _default_client = GeminiClient(api_key, chat_model, embedding_model)
    return _default_client


def reset_gemini_client():
    """
    Reset global client (dùng cho testing)
    """
    global _default_client
    _default_client = None


# Test function
if __name__ == "__main__":
    print("=== Test Gemini Client ===")
    client = get_gemini_client()
    info = client.get_model_info()
    print(f"Available: {info['available']}")
    print(f"SDK Available: {info['sdk_available']}")
    print(f"Chat Model: {info['chat_model']}")
    print(f"Embedding Model: {info['embedding_model']}")

