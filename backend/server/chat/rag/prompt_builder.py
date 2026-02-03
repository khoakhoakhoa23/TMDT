"""
Prompt Builder - Module xay dung Prompt
Theo cau hoi nguoi dung va ket qua tim kiem de xay dung Prompt
"""

from typing import List, Dict, Any, Optional
from .models import Document, DocumentType


class PromptBuilder:
    """
    Prompt Builder
    Xay dung Prompt theo yeu cau RAG
    """
    
    # System prompt
    SYSTEM_PROMPT = """Ban la chatbot tu van ban va cho thue xe cua TMDT.

QUY TAC:
- Chi duoc tra loi dua tren du lieu duoc cung cap
- Khong du doan, khong bia
- Neu thieu thong tin, tra loi: 
  "Em chua co thong tin chinh xac, em se chuyen anh/chi sang tuyen vien."

DU LIEU LIEN QUAN:
{retrieved_context}

CAU HOI KHACH:
{user_question}

YEU CAU TRA LOI:
- Ngan gon
- Ro rang
- Tieng Viet
- Giong tu van chuyen nghiep
- Co CTA (dat xe, de lai SDT hoac goi hotline)
- Khong tiet lo rang ban la AI hoac su dung du lieu tu database"""
    
    # Template dinh dang context
    CONTEXT_TEMPLATES = {
        DocumentType.CAR: """### THONG TIN XE ###
Tieu de: {title}
Noi dung:
{content}
---""",
        DocumentType.POLICY: """### CHINH SACH ###
Tieu de: {title}
Noi dung:
{content}
---""",
        DocumentType.FAQ: """### CAU HOI THUONG GAP ###
Tieu de: {title}
Noi dung:
{content}
---""",
        DocumentType.GENERAL: """### THONG TIN CHUNG ###
Tieu de: {title}
Noi dung:
{content}
---""",
    }
    
    # Template tra loi khi khong co ket qua tim kiem
    NO_CONTEXT_RESPONSE = (
        "Em chua co thong tin chinh xac ve van de nay. "
        "Em se chuyen anh/chi sang tuyen vien de duoc ho tro tot nhat a. "
        "Xin vui long cho trong giay lat hoac lien he hotline 1900 xxxx."
    )
    
    # De xuat tra loi nhanh
    QUICK_REPLIES_SUGGESTIONS = {
        DocumentType.CAR: [
            "📅 Dat xe ngay",
            "💰 Bao gia chi tiet",
            "📞 Goi tu van",
            "🚗 Xe khac",
        ],
        DocumentType.POLICY: [
            "📋 Chi tiet hon",
            "❓ Hoi dap",
            "📞 Lien he ho tro",
        ],
        DocumentType.FAQ: [
            "❓ Cau hoi khac",
            "📋 Xem tat ca FAQ",
            "📞 Goi hotline",
        ],
    }
    
    def __init__(self, system_prompt: str = None):
        """
        Khoi tao Prompt Builder
        
        Args:
            system_prompt: System prompt tuy chinh
        """
        self.system_prompt = system_prompt or self.SYSTEM_PROMPT
    
    def build_prompt(
        self,
        user_question: str,
        documents: List[Document],
        conversation_history: List[Dict] = None
    ) -> List[Dict[str, str]]:
        """
        Xay dung danh sach prompt hoan chinh
        
        Args:
            user_question: Cau hoi nguoi dung
            documents: Danh sach tai lieu tim duoc
            conversation_history: Lich su cuoc tro chuyen
            
        Returns:
            Danh sach tin nhan (co the su dung cho OpenAI API)
        """
        messages = []
        
        # Xay dung tin nhan he thong
        system_message = self._build_system_message(documents, user_question)
        messages.append({
            "role": "system",
            "content": system_message
        })
        
        # Them lich su cuoc tro chuyen (neu co)
        if conversation_history:
            for msg in conversation_history[-5:]:  # Su dung toi da 5 cuoc tro chuyen gan nhat
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Them cau hoi nguoi dung
        messages.append({
            "role": "user",
            "content": user_question
        })
        
        return messages
    
    def _build_system_message(
        self,
        documents: List[Document],
        user_question: str
    ) -> str:
        """
        Xay dung tin nhan he thong
        
        Args:
            documents: Tai lieu tim duoc
            user_question: Cau hoi nguoi dung
            
        Returns:
            Noi dung tin nhan he thong
        """
        # Xay dung context
        if documents:
            context = self._format_context(documents)
        else:
            context = "Khong co du lieu lien quan trong he thong."
        
        # Dien vao template
        system_message = self.system_prompt.format(
            retrieved_context=context,
            user_question=user_question
        )
        
        return system_message
    
    def _format_context(self, documents: List[Document]) -> str:
        """
        Din Dang dang tai lieu tim duoc thanh context
        
        Args:
            documents: Danh sach tai lieu
            
        Returns:
            Chuoi context da dinh dang
        """
        if not documents:
            return "Khong co du lieu lien quan."
        
        formatted_parts = []
        
        for doc in documents:
            template = self.CONTEXT_TEMPLATES.get(
                doc.doc_type,
                self.CONTEXT_TEMPLATES[DocumentType.GENERAL]
            )
            
            formatted_parts.append(
                template.format(
                    title=doc.title,
                    content=doc.content,
                    metadata=doc.metadata
                )
            )
        
        return "\n\n".join(formatted_parts)
    
    def get_quick_replies(
        self,
        documents: List[Document]
    ) -> List[str]:
        """
        Lay de xuat tra loi nhanh theo ket qua tim kiem
        
        Args:
            documents: Tai lieu tim duoc
            
        Returns:
            Danh sach tra loi nhanh
        """
        if not documents:
            return [
                "📞 Goi hotline",
                "❓ Hoi cau khac",
                "📋 Xem tat ca xe",
            ]
        
        # Thu thap tat ca tra loi co the
        all_replies = set()
        doc_types = set()
        
        for doc in documents:
            doc_types.add(doc.doc_type)
            
            # Them tra loi theo loai
            type_replies = self.QUICK_REPLIES_SUGGESTIONS.get(doc.doc_type, [])
            all_replies.update(type_replies)
        
        # Tra loi mac dinh (luon them)
        all_replies.update([
            "📞 Goi hotline",
            "❓ Hoi cau khac",
        ])
        
        return list(all_replies)[:5]  # Tra ve toi da 5
    
    def should_escalate_to_human(
        self,
        documents: List[Document],
        question: str
    ) -> bool:
        """
        Xac dinh co can chuyen tu van vien khong
        
        Args:
            documents: Tai lieu tim duoc
            question: Cau hoi nguoi dung
            
        Returns:
            Co can chuyen tu van vien khong
        """
        # Khong tim duoc tai lieu lien quan
        if not documents:
            return True
        
        # Van de qua tong quat hoac lien quan quyet dinh phuc tap
        escalation_keywords = [
            "dat coc", "dat xe", "mua xe",
            "thanh toan", "hop dong",
            "khieu nai", "phan anh",
            "giai quyet", "boi thuong",
        ]
        
        question_lower = question.lower()
        if any(kw in question_lower for kw in escalation_keywords):
            # Neu chi co mot ket qua khong lien quan, de xuat chuyen tu van vien
            if len(documents) < 2:
                return True
        
        return False
    
    def format_car_info(self, document: Document) -> Dict[str, Any]:
        """
        Din dang thong tin xe
        
        Args:
            document: Tai lieu xe
            
        Returns:
            Thong tin xe da dinh dang
        """
        metadata = document.metadata
        
        return {
            'ten_xe': metadata.get('ten_xe', ''),
            'ma_xe': metadata.get('ma_xe', ''),
            'gia_ban': metadata.get('gia_ban', 0),
            'gia_thue': metadata.get('gia_thue', 0),
            'trang_thai': metadata.get('trang_thai', ''),
            'loai_xe': metadata.get('loai_xe', ''),
        }
    
    def build_no_context_response(self) -> str:
        """
        Xay dung tra loi khi khong co context
        
        Returns:
            Noi dung tra loi
        """
        return self.NO_CONTEXT_RESPONSE
    
    def calculate_token_estimate(
        self,
        documents: List[Document],
        user_question: str
    ) -> int:
        """
        Uoc tinh so token cua Prompt
        
        Args:
            documents: Danh sach tai lieu
            user_question: Cau hoi nguoi dung
            
        Returns:
            So token uoc tinh
        """
        # Uoc tinh thô: moi ky tu khoang 0.25 token
        context_length = sum(len(doc.content) for doc in documents)
        question_length = len(user_question)
        system_length = len(self.system_prompt)
        
        total_chars = context_length + question_length + system_length
        return int(total_chars * 0.25)


# Global Prompt Builder instance
_prompt_builder: Optional[PromptBuilder] = None


def get_prompt_builder(system_prompt: str = None) -> PromptBuilder:
    """
    Lay global Prompt Builder instance
    
    Args:
        system_prompt: System prompt tuy chinh
        
    Returns:
        PromptBuilder instance
    """
    global _prompt_builder
    if _prompt_builder is None:
        _prompt_builder = PromptBuilder(system_prompt)
    return _prompt_builder


def reset_prompt_builder():
    """Reset global Prompt Builder (dung cho testing)"""
    global _prompt_builder
    _prompt_builder = None
