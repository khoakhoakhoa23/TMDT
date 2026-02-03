"""
OpenAI Client Wrapper - Module goi OpenAI
Cung cap interface tuong tac voi OpenAI API
"""

import os
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from openai import OpenAI
from openai.types.chat import ChatCompletion
import tiktoken


@dataclass
class EmbeddingResult:
    """Ket qua embedding"""
    embedding: List[float]
    model: str
    usage: Dict[str, int]


@dataclass
class ChatCompletionResult:
    """Ket qua chat completion"""
    content: str
    model: str
    usage: Dict[str, int]
    finish_reason: str


class OpenAIClient:
    """
    OpenAI API Client
    Tat ca tuong tac voi OpenAI
    """
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        embedding_model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.3
    ):
        """
        Khoi tao OpenAI client
        
        Args:
            api_key: OpenAI API key
            model: Ten chat model
            embedding_model: Ten embedding model
            max_tokens: So token toi da
            temperature: Tham so nhiet do
        """
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY', '')
        self.model = model or os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
        self.embedding_model = embedding_model or os.environ.get(
            'EMBEDDING_MODEL', 'text-embedding-3-small'
        )
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        # Khoi tao client
        self.client = OpenAI(api_key=self.api_key)
        
        # Khoi tao token encoder
        self._token_encoder = None
        self._embedding_token_encoder = None
    
    def _get_token_encoder(self):
        """Lay token encoder"""
        if self._token_encoder is None:
            self._token_encoder = tiktoken.encoding_for_model(self.model)
        return self._token_encoder
    
    def _get_embedding_token_encoder(self):
        """Lay token encoder cho embedding model"""
        if self._embedding_token_encoder is None:
            try:
                self._embedding_token_encoder = tiktoken.encoding_for_model(
                    self.embedding_model
                )
            except KeyError:
                self._embedding_token_encoder = tiktoken.get_encoding(
                    "cl100k_base"
                )
        return self._embedding_token_encoder
    
    def count_tokens(self, text: str) -> int:
        """
        Dem so token cua van ban
        
        Args:
            text: Van ban dau vao
            
        Returns:
            So token
        """
        encoder = self._get_token_encoder()
        return len(encoder.encode(text))
    
    def count_embedding_tokens(self, text: str) -> int:
        """
        Dem so token cua embedding
        
        Args:
            text: Van ban dau vao
            
        Returns:
            So token
        """
        encoder = self._get_embedding_token_encoder()
        return len(encoder.encode(text))
    
    def get_embedding(self, text: str) -> EmbeddingResult:
        """
        Lay vector embedding cua van ban
        
        Args:
            text: Van ban dau vao
            
        Returns:
            Ket qua embedding
        """
        # Lam sach van ban
        text = text.replace("\n", " ")
        
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=text,
        )
        
        return EmbeddingResult(
            embedding=response.data[0].embedding,
            model=self.embedding_model,
            usage={
                'prompt_tokens': response.usage.prompt_tokens,
                'total_tokens': response.usage.total_tokens,
            }
        )
    
    def get_embeddings(self, texts: List[str]) -> List[EmbeddingResult]:
        """
        Lay nhieu vector embedding
        
        Args:
            texts: Danh sach van ban
            
        Returns:
            Danh sach ket qua embedding
        """
        # Lam sach van ban
        texts = [t.replace("\n", " ") for t in texts]
        
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=texts,
        )
        
        return [
            EmbeddingResult(
                embedding=data.embedding,
                model=self.embedding_model,
                usage={
                    'prompt_tokens': response.usage.prompt_tokens,
                    'total_tokens': response.usage.total_tokens,
                }
            )
            for data in response.data
        ]
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = None,
        temperature: float = None,
        stream: bool = False
    ) -> ChatCompletionResult:
        """
        Gui yeu cau chat completion
        
        Args:
            messages: Danh sach tin nhan
            max_tokens: So token toi da
            temperature: Tham so nhiet do
            stream: Co xuat streaming khong
            
        Returns:
            Ket qua chat completion
        """
        max_tokens = max_tokens or self.max_tokens
        temperature = temperature if temperature is not None else self.temperature
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream,
        )
        
        return ChatCompletionResult(
            content=response.choices[0].message.content,
            model=self.model,
            usage={
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens,
            },
            finish_reason=response.choices[0].finish_reason,
        )
    
    def chat_completion_stream(self, messages: List[Dict[str, str]]):
        """
        Gui yeu cau chat completion theo kieu streaming
        
        Args:
            messages: Danh sach tin nhan
            
        Yields:
            Cac chunk noi dung
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
        )
        
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def is_available(self) -> bool:
        """
        Kiem tra API co san khong
        
        Returns:
            Co san khong
        """
        try:
            # Thu lay danh sach model
            self.client.models.list()
            return True
        except Exception:
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Lay thong tin model
        
        Returns:
            Tu dien thong tin model
        """
        return {
            'chat_model': self.model,
            'embedding_model': self.embedding_model,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'available': self.is_available(),
        }


# Global client instance
_default_client: Optional[OpenAIClient] = None


def get_openai_client(
    api_key: str = None,
    model: str = None,
    embedding_model: str = None
) -> OpenAIClient:
    """
    Lay global OpenAI client instance
    
    Args:
        api_key: API key
        model: Chat model
        embedding_model: Embedding model
        
    Returns:
        OpenAIClient instance
    """
    global _default_client
    if _default_client is None:
        _default_client = OpenAIClient(api_key, model, embedding_model)
    return _default_client


def reset_client():
    """
    Reset global client (dung cho testing)
    """
    global _default_client
    _default_client = None
