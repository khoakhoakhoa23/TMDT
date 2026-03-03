"""
Semantic Retrieval Module - Module tim kiem nguy sem
Su dung Gemini Embeddings de tim kiem tuong dong vector
"""

import os
import time
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

from .models import Document, DocumentType, RetrievalResult


class RetrievalService:
    """
    Retrieval Service - Dich vu tim kiem
    Tim kiem tuong dong dua tren vector
    """
    
    # Cau hinh tim kiem
    TOP_K = 5  # Mac dinh tra ve top-k ket qua
    SIMILARITY_THRESHOLD = 0.3  # Nguong tuong dong (0-1)
    
    # Trong loai tai lieu (co the can trong khi tim kiem)
    TYPE_WEIGHTS = {
        DocumentType.CAR: 1.0,
        DocumentType.POLICY: 1.0,
        DocumentType.FAQ: 1.0,
        DocumentType.GENERAL: 0.8,
    }
    
    def __init__(self, index_dir: str = None, client=None):
        """
        Khoi tao retrieval service

        Args:
            index_dir: Duong dan thu muc index
            client: Embedding client instance (Gemini/OpenAI/Local)
        """
        import sys
        sys.path.insert(0, '../../..')

        # Ưu tiên: Local -> Gemini -> OpenAI
        self.client = client
        if self.client is None:
            try:
                from config_ai import USE_LOCAL_EMBEDDINGS
                if USE_LOCAL_EMBEDDINGS:
                    from .local_embeddings import get_local_embedding_client
                    self.client = get_local_embedding_client()
                    if self.client.is_available():
                        print("OK: Using LOCAL Embeddings")
                    else:
                        raise Exception("Local embeddings không khả dụng")
                else:
                    raise Exception("Local embeddings không được bật")
            except Exception:
                try:
                    from .gemini_client import get_gemini_client
                    self.client = get_gemini_client()
                    if not self.client.is_available():
                        raise Exception("Gemini không khả dụng")
                    print("OK: Using Gemini for embeddings")
                except Exception:
                    from .openai_client import get_openai_client
                    self.client = get_openai_client()
                    print("OK: Using OpenAI for embeddings")
        
        # Thiet lap thu muc index
        if index_dir is None:
            base_dir = Path(__file__).parent.parent.parent.parent
            index_dir = base_dir / 'chat_rag_index'
        
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        # Luu tru tai lieu va index
        self.documents: List[Document] = []
        self.document_map: Dict[str, Document] = {}
        self.embeddings_matrix: Optional[np.ndarray] = None
        
        # Tai index da luu
        self._load_index()
    
    def _load_index(self):
        """Tai index da luu"""
        docs_file = self.index_dir / 'documents.json'
        embeddings_file = self.index_dir / 'embeddings.npy'
        
        if docs_file.exists():
            import json
            with open(docs_file, 'r', encoding='utf-8') as f:
                docs_data = json.load(f)
                self.documents = [Document.from_dict(d) for d in docs_data]
                for doc in self.documents:
                    self.document_map[doc.id] = doc
        
        if embeddings_file.exists() and self.documents:
            self.embeddings_matrix = np.load(embeddings_file)
    
    def _save_index(self):
        """Luu index vao dia"""
        import json
        
        # Luu tai lieu
        docs_file = self.index_dir / 'documents.json'
        docs_data = [doc.to_dict() for doc in self.documents]
        with open(docs_file, 'w', encoding='utf-8') as f:
            json.dump(docs_data, f, ensure_ascii=False, indent=2)
        
        # Luu vector
        if self.embeddings_matrix is not None:
            embeddings_file = self.index_dir / 'embeddings.npy'
            np.save(embeddings_file, self.embeddings_matrix)
    
    def add_document(self, document: Document):
        """
        Them mot tai lieu
        
        Args:
            document: Document object
        """
        if document.id in self.document_map:
            # Cap nhat tai lieu hien co
            idx = next(
                i for i, d in enumerate(self.documents)
                if d.id == document.id
            )
            self.documents[idx] = document
        else:
            # Them tai lieu moi
            self.documents.append(document)
        
        self.document_map[document.id] = document
        self._rebuild_embeddings()
    
    def add_documents(self, documents: List[Document]):
        """
        Them nhieu tai lieu
        
        Args:
            documents: Danh sach tai lieu
        """
        for doc in documents:
            self.add_document(doc)
        self._save_index()
    
    def _rebuild_embeddings(self):
        """Xay dung lai vector cho tat ca tai lieu"""
        if not self.documents:
            return
        
        # Lay noi dung tat ca tai lieu
        texts = [doc.content for doc in self.documents]
        
        try:
            # Lay vector theo lo
            results = self.client.get_embeddings(texts)
            
            # Xay dung ma tran vector
            self.embeddings_matrix = np.array([
                result.embedding for result in results
            ])
        except Exception as e:
            print(f"Error rebuilding embeddings: {e}. Index will rely on keyword search.")
            self.embeddings_matrix = None
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Lay vector cho mot van ban
        
        Args:
            text: Van ban dau vao
            
        Returns:
            Vector embedding
        """
        result = self.client.get_embedding(text)
        return np.array(result.embedding)
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Tinh tuong dong cosine
        
        Args:
            vec1: Vector 1
            vec2: Vector 2
            
        Returns:
            Diem tuong dong (0-1)
        """
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)

    def _keyword_search(self, query: str) -> List[Tuple[int, float]]:
        """
        Tim kiem theo tu khoa (Fallback khi Semantic fail)
        Co ho tro fuzzy matching cho typos
        """
        import re
        from difflib import SequenceMatcher
        
        query_words = set(re.findall(r'\w+', query.lower()))
        if not query_words:
            return []
        
        # Cac tu khoa pho bien can xu ly special
        greeting_words = {'hello', 'hi', 'hey', 'helo', 'heloo', 'helloo', 'xinchao', 'chào', 'chao'}
        
        # Kiem tra neu la greeting
        is_greeting = any(word in greeting_words for word in query_words)
        
        results = []
        for i, doc in enumerate(self.documents):
            doc_content = (doc.title + " " + doc.content).lower()
            doc_words = set(re.findall(r'\w+', doc_content))
            
            # Tinh overlap
            overlap = query_words.intersection(doc_words)
            
            if overlap:
                # Diem = (so tu trung / tong so tu truy van) * weight
                score = (len(overlap) / len(query_words))
                weighted_score = score * self.TYPE_WEIGHTS.get(doc.doc_type, 1.0)
                results.append((i, weighted_score, score))
            elif is_greeting:
                # Fuzzy matching cho greetings
                doc_titles_lower = doc.title.lower()
                if any(greet in doc_titles_lower or greet in doc_content for greet in ['chào', 'hello', 'xin chào', 'tôi có thể giúp', 'trợ lý']):
                    # Tim thay tu greeting trong document
                    fuzzy_score = 0.5  # Diem trung binh cho fuzzy match
                    weighted_score = fuzzy_score * self.TYPE_WEIGHTS.get(doc.doc_type, 1.0)
                    results.append((i, weighted_score, fuzzy_score))
        
        # Neu khong co ket qua, thu tim kiem looser
        if not results:
            for i, doc in enumerate(self.documents):
                doc_content = (doc.title + " " + doc.content).lower()
                # Kiem tra substring matching
                for qw in query_words:
                    if len(qw) >= 3 and qw in doc_content:
                        score = 0.3  # Diem thap hon cho substring match
                        weighted_score = score * self.TYPE_WEIGHTS.get(doc.doc_type, 1.0)
                        results.append((i, weighted_score, score))
                        break
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    
    def search(
        self,
        query: str,
        top_k: int = None,
        doc_types: List[DocumentType] = None,
        min_score: float = None
    ) -> RetrievalResult:
        """
        Tim kiem nguy sem
        
        Args:
            query: Van ban truy van
            top_k: So ket qua tra ve
            doc_types: Loc theo loai tai lieu
            min_score: Diem tuong dong toi thieu
            
        Returns:
            Ket qua tim kiem
        """
        start_time = time.time()
        
        top_k = top_k or self.TOP_K
        min_score = min_score or self.SIMILARITY_THRESHOLD
        
        if not self.documents:
            return RetrievalResult(
                documents=[],
                scores=[],
                query=query,
                total_docs_found=0
            )
        
        # Lay vector cua truy van (semantic search)
        similarities = []
        try:
            query_embedding = self._get_embedding(query)
            
            # Tinh tuong dong voi tat ca tai lieu
            for i, doc_embedding in enumerate(self.embeddings_matrix):
                score = self._cosine_similarity(query_embedding, doc_embedding)
                doc = self.documents[i]
                
                # Ap dung trong loai
                weighted_score = score * self.TYPE_WEIGHTS.get(doc.doc_type, 1.0)
                similarities.append((i, weighted_score, score))
        except Exception as e:
            # Fallback sang keyword search neu semantic fail (vd: het quota)
            print(f"Semantic search failed, falling back to keyword search: {e}")
            similarities = self._keyword_search(query)
            # Khong dung min_score cho keyword search vi thang diem khac
            min_score = 0.1 
        
        # Sap xep theo diem
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Loc va tra ve top-k
        results = []
        scores = []
        seen_ids = set()
        
        for idx, weighted_score, raw_score in similarities:
            if len(results) >= top_k:
                break
            
            doc = self.documents[idx]
            
            # Kiem tra loc theo loai
            if doc_types and doc.doc_type not in doc_types:
                continue
            
            # Kiem tra nguong diem
            if weighted_score < min_score:
                continue
            
            # Tranh trung lap tai lieu
            if doc.id in seen_ids:
                continue
            
            seen_ids.add(doc.id)
            results.append(doc)
            scores.append(weighted_score)
        
        retrieval_time = (time.time() - start_time) * 1000  # milliseconds
        
        # Ghi nhan thong tin tim kiem
        doc_types_found = [d.doc_type.value for d in results]
        self._log_retrieval(query, len(results), scores, doc_types_found)
        
        return RetrievalResult(
            documents=results,
            scores=scores,
            query=query,
            total_docs_found=len(results)
        )
    
    def search_by_type(
        self,
        query: str,
        doc_type: DocumentType,
        top_k: int = None
    ) -> RetrievalResult:
        """
        Tim kiem theo loai tai lieu
        
        Args:
            query: Van ban truy van
            doc_type: Loai tai lieu
            top_k: So ket qua tra ve
            
        Returns:
            Ket qua tim kiem
        """
        return self.search(query, top_k, [doc_type])
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        """
        Lay mot tai lieu
        
        Args:
            doc_id: Tai lieu ID
            
        Returns:
            Document object hoac None
        """
        return self.document_map.get(doc_id)
    
    def get_all_documents(self) -> List[Document]:
        """
        Lay tat ca tai lieu
        
        Returns:
            Danh sach tai lieu
        """
        return self.documents.copy()
    
    def get_document_count(self) -> int:
        """
        Lay so luong tai lieu
        
        Returns:
            So luong tai lieu
        """
        return len(self.documents)
    
    def clear_index(self):
        """Xoa sach index"""
        self.documents = []
        self.document_map = {}
        self.embeddings_matrix = None
        
        # Xoa file index
        for file in self.index_dir.glob('*'):
            if file.is_file():
                file.unlink()
    
    def _log_retrieval(
        self,
        query: str,
        num_results: int,
        scores: list,
        doc_types: list
    ):
        """Ghi log tim kiem"""
        # Lay logger
        try:
            from .logging_utils import get_logger
            logger = get_logger()
            logger.log_retrieval(query, num_results, scores, doc_types)
        except Exception:
            pass  # Log fail khong anh huong tim kiem
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Lay thong tin thong ke cua index
        
        Returns:
            Tu dien thong tin thong ke
        """
        # Thong ke theo loai
        type_counts = {}
        for doc in self.documents:
            type_name = doc.doc_type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        
        return {
            'total_documents': len(self.documents),
            'by_type': type_counts,
            'index_dir': str(self.index_dir),
            'has_embeddings': self.embeddings_matrix is not None,
            'embedding_dim': self.embeddings_matrix.shape[1] if self.embeddings_matrix is not None else 0,
        }


# Global retrieval service instance
_retrieval_service: Optional[RetrievalService] = None


def get_retrieval_service(index_dir: str = None) -> RetrievalService:
    """
    Lay global retrieval service instance
    
    Args:
        index_dir: Thu muc index
        
    Returns:
        RetrievalService instance
    """
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService(index_dir)
    return _retrieval_service


def reset_retrieval_service():
    """
    Reset global retrieval service (dung cho testing)
    """
    global _retrieval_service
    _retrieval_service = None
