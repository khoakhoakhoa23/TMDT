"""
Local Embedding Client - Hoàn toàn miễn phí!
Dùng sentence-transformers để tạo embeddings ngay trên máy
"""

import logging
from typing import List
import numpy as np

logger = logging.getLogger(__name__)

class LocalEmbeddingClient:
    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Khởi tạo local embedding client
        
        Args:
            model_name: Tên model từ sentence-transformers
                - paraphrase-multilingual-MiniLM-L12-v2: Nhẹ, đa ngôn ngữ (recommended)
                - all-MiniLM-L6-v2: Rất nhẹ, tiếng Anh tốt
                - distiluse-base-multilingual-cased-v1: Chất lượng cao hơn
        """
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Tải model (lần đầu sẽ mất vài phút)"""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"📦 Đang tải model: {self.model_name}...")
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Model {self.model_name} đã sẵn sàng!")
        except Exception as e:
            logger.error(f"❌ Lỗi tải model: {e}")
            self.model = None
    
    def is_available(self) -> bool:
        """Kiểm tra model đã tải chưa"""
        return self.model is not None
    
    def get_embedding(self, text: str) -> List[float]:
        """
        Tạo embedding vector từ text
        
        Args:
            text: Input text
        
        Returns:
            List[float]: Embedding vector (384 dimensions với MiniLM)
        """
        if not self.model:
            raise Exception("Local embedding model chưa được tải")
        
        try:
            # Encode và chuyển thành list
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"❌ Lỗi tạo embedding: {e}")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Tạo embedding cho nhiều texts (batch, nhanh hơn)
        """
        if not self.model:
            raise Exception("Local embedding model chưa được tải")
        
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"❌ Lỗi tạo embeddings: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Lấy số chiều của embedding"""
        if not self.model:
            return 0
        # MiniLM-L12-v2 có 384 dimensions
        return self.model.get_sentence_embedding_dimension()


# Singleton instance
_local_embedding_client = None

def get_local_embedding_client(model_name: str = "paraphrase-multilingual-MiniLM-L12-v2") -> LocalEmbeddingClient:
    """Lấy singleton local embedding client"""
    global _local_embedding_client
    if _local_embedding_client is None:
        _local_embedding_client = LocalEmbeddingClient(model_name)
    return _local_embedding_client

