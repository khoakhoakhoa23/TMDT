"""
RAG Data Models - Cac model du lieu cho RAG chatbot
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum


class DocumentType(str, Enum):
    """Loai tai lieu"""
    CAR = "car"              # Thong tin xe
    POLICY = "policy"        # Chinh sach thue xe
    FAQ = "faq"              # Cau hoi thuong gap
    GENERAL = "general"      # Thong tin chung


@dataclass
class Document:
    """Tai lieu du lieu cho vector store"""
    id: str                          # Ma dinh danh tai lieu
    doc_type: DocumentType           # Loai tai lieu
    title: str                       # Tieu de
    content: str                     # Noi dung (doan van ban)
    metadata: Dict[str, Any] = field(default_factory=dict)  # Metadata
    embedding: Optional[List[float]] = None  # Vector (tao khi retrieval)
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyen thanh dictionary"""
        return {
            'id': self.id,
            'doc_type': self.doc_type.value,
            'title': self.title,
            'content': self.content,
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Document':
        """Tao tu dictionary"""
        return cls(
            id=data['id'],
            doc_type=DocumentType(data['doc_type']),
            title=data['title'],
            content=data['content'],
            metadata=data.get('metadata', {}),
        )


@dataclass
class RetrievalResult:
    """Ket qua tim kiem"""
    documents: List[Document]        # Tai lieu tim duoc
    scores: List[float]              # Diem tuong dong
    query: str                       # Truy van goc
    total_docs_found: int            # Tong so tai lieu tim duoc
    
    def has_results(self) -> bool:
        """Co ket qua khong"""
        return len(self.documents) > 0


@dataclass
class ChatRequest:
    """Yeu cau chat"""
    session_id: str                  # ID phien chat
    user_question: str               # Cau hoi nguoi dung
    user_id: Optional[str] = None    # ID nguoi dung (tuy chon)
    context: Dict[str, Any] = field(default_factory=dict)  # Bo canh
    conversation_history: List[Dict] = field(default_factory=list)  # Lich su cuoc tro chuyen


@dataclass
class ChatResponse:
    """Phan hoi chat"""
    answer: str                      # Noi dung phan hoi
    sources: List[Document] = field(default_factory=list)  # Tai lieu su dung
    requires_human: bool = False     # Co can chuyen tu van vien
    metadata: Dict[str, Any] = field(default_factory=dict)  # Thong tin bo sung


@dataclass
class CarInfo:
    """Thong tin xe"""
    ma_xe: str
    ten_xe: str
    loai_xe: str
    gia_ban: int
    gia_thue_ngay: int
    so_luong: int
    mau_sac: str
    trang_thai: str
    mo_ta: str
    hop_so: str
    so_cho: int
    loai_nhien_lieu: str
    
    def to_document(self) -> Document:
        """Chuyen thanh tai lieu"""
        content = f"""
        Xe: {self.ten_xe}
        Ma xe: {self.ma_xe}
        Loai xe: {self.loai_xe}
        Gia ban: {self.gia_ban:,.0f} VND
        Gia thue: {self.gia_thue_ngay:,.0f} VND/ngay
        So luong: {self.so_luong}
        Mau sac: {self.mau_sac}
        Trang thai: {self.trang_thai}
        Hop so: {self.hop_so}
        So cho: {self.so_cho}
        Nhien lieu: {self.loai_nhien_lieu}
        Mo ta: {self.mo_ta}
        """.strip()
        
        return Document(
            id=f"car_{self.ma_xe}",
            doc_type=DocumentType.CAR,
            title=self.ten_xe,
            content=content,
            metadata={
                'ma_xe': self.ma_xe,
                'ten_xe': self.ten_xe,
                'loai_xe': self.loai_xe,
                'gia_ban': self.gia_ban,
                'gia_thue': self.gia_thue_ngay,
                'trang_thai': self.trang_thai,
            }
        )


@dataclass
class PolicyInfo:
    """Thong tin chinh sach"""
    policy_id: str
    category: str
    title: str
    content: str
    conditions: List[str] = field(default_factory=list)
    
    def to_document(self) -> Document:
        """Chuyen thanh tai lieu"""
        content = f"""
        Chinh sach: {self.title}
        Danh muc: {self.category}
        Noi dung: {self.content}
        Dieu kien: {', '.join(self.conditions) if self.conditions else 'Khong co'}
        """.strip()
        
        return Document(
            id=f"policy_{self.policy_id}",
            doc_type=DocumentType.POLICY,
            title=self.title,
            content=content,
            metadata={
                'category': self.category,
                'policy_id': self.policy_id,
            }
        )


@dataclass
class FAQItem:
    """Cau hoi thuong gap"""
    faq_id: str
    question: str
    answer: str
    category: str
    keywords: List[str] = field(default_factory=list)
    
    def to_document(self) -> Document:
        """Chuyen thanh tai lieu"""
        content = f"""
        Cau hoi: {self.question}
        Tra loi: {self.answer}
        Danh muc: {self.category}
        Tu khoa: {', '.join(self.keywords) if self.keywords else 'Khong co'}
        """.strip()
        
        return Document(
            id=f"faq_{self.faq_id}",
            doc_type=DocumentType.FAQ,
            title=self.question,
            content=content,
            metadata={
                'category': self.category,
                'faq_id': self.faq_id,
                'keywords': self.keywords,
            }
        )
