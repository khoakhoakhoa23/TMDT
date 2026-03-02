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
    
    # System prompt - Cải thiện với instructions rõ ràng hơn
    SYSTEM_PROMPT = """Bạn là chatbot tư vấn bán và cho thuê xe của TMDT - một nhân viên tư vấn chuyên nghiệp, thân thiện và nhiệt tình.

VAI TRÒ CỦA BẠN:
- Tư vấn khách hàng về các sản phẩm xe và dịch vụ cho thuê
- Giải đáp thắc mắc về chính sách, giá cả, thủ tục
- Hỗ trợ khách hàng tìm xe phù hợp với nhu cầu
- Tạo trải nghiệm tích cực và chuyên nghiệp

QUY TẮC TRẢ LỜI:
1. CHỈ trả lời dựa trên thông tin được cung cấp trong phần DU LIEU LIEN QUAN bên dưới
2. KHÔNG được bịa đặt, suy đoán hoặc tạo thông tin không có trong dữ liệu
3. Nếu không có thông tin chính xác, hãy thành thật và đề xuất chuyển sang tư vấn viên
4. Sử dụng ngôn ngữ tự nhiên, thân thiện nhưng chuyên nghiệp
5. Trả lời ngắn gọn, rõ ràng, dễ hiểu (2-4 câu)
6. Luôn kết thúc với Call-to-Action phù hợp (đặt xe, để lại số điện thoại, gọi hotline)

TONE VÀ PHONG CÁCH:
- Thân thiện, nhiệt tình nhưng không quá suồng sã
- Chuyên nghiệp nhưng không cứng nhắc
- Sử dụng "em" khi xưng hô với khách hàng
- Sử dụng "anh/chị" khi gọi khách hàng
- Tránh tiết lộ bạn là AI hoặc bot

DU LIEU LIEN QUAN:
{retrieved_context}

CAU HOI KHACH HANG:
{user_question}

LỊCH SỬ CUỘC TRÒ CHUYỆN:
{conversation_context}

Hãy trả lời câu hỏi của khách hàng một cách tự nhiên, chuyên nghiệp và hữu ích nhất có thể."""
    
    # Template định dạng context - Cải thiện với metadata quan trọng
    CONTEXT_TEMPLATES = {
        DocumentType.CAR: """### THÔNG TIN XE ###
Tên xe: {title}
{metadata_info}
Nội dung chi tiết:
{content}
---""",
        DocumentType.POLICY: """### CHÍNH SÁCH ###
Tiêu đề: {title}
{metadata_info}
Nội dung:
{content}
---""",
        DocumentType.FAQ: """### CÂU HỎI THƯỜNG GẶP ###
Câu hỏi: {title}
{metadata_info}
Câu trả lời:
{content}
---""",
        DocumentType.GENERAL: """### THÔNG TIN CHUNG ###
Tiêu đề: {title}
{metadata_info}
Nội dung:
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
        conversation_history: List[Dict] = None,
        context: Dict[str, Any] = None
    ) -> List[Dict[str, str]]:
        """
        Xây dựng danh sách prompt hoàn chỉnh
        
        Args:
            user_question: Câu hỏi người dùng
            documents: Danh sách tài liệu tìm được
            conversation_history: Lịch sử cuộc trò chuyện
            context: Thông tin bổ sung về request
            
        Returns:
            Danh sách tin nhắn (có thể sử dụng cho OpenAI API)
        """
        messages = []
        
        # Xây dựng tin nhắn hệ thống với context và conversation history
        system_message = self._build_system_message(
            documents, 
            user_question, 
            conversation_history
        )
        messages.append({
            "role": "system",
            "content": system_message
        })
        
        # Thêm lịch sử cuộc trò chuyện (nếu có) - tối đa 6 tin nhắn gần nhất
        if conversation_history:
            # Lọc và format lại conversation history
            formatted_history = self._format_conversation_history(conversation_history[-6:])
            for msg in formatted_history:
                messages.append(msg)
        
        # Thêm câu hỏi người dùng
        messages.append({
            "role": "user",
            "content": user_question
        })
        
        return messages
    
    def _format_conversation_history(self, history: List[Dict]) -> List[Dict[str, str]]:
        """
        Format lại conversation history để phù hợp với API
        
        Args:
            history: Lịch sử cuộc trò chuyện
            
        Returns:
            Danh sách tin nhắn đã format
        """
        formatted = []
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            # Chuyển đổi role cho phù hợp với API
            if role == "assistant":
                role = "assistant"
            elif role == "model":  # Gemini format
                role = "assistant"
            else:
                role = "user"
            
            if content.strip():
                formatted.append({
                    "role": role,
                    "content": content
                })
        
        return formatted
    
    def _build_system_message(
        self,
        documents: List[Document],
        user_question: str,
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Xây dựng tin nhắn hệ thống
        
        Args:
            documents: Tài liệu tìm được
            user_question: Câu hỏi người dùng
            conversation_history: Lịch sử cuộc trò chuyện
            
        Returns:
            Nội dung tin nhắn hệ thống
        """
        # Xây dựng context từ documents
        if documents:
            context = self._format_context(documents)
        else:
            context = "KHÔNG có dữ liệu liên quan trong hệ thống. Hãy thành thật với khách hàng và đề xuất chuyển sang tư vấn viên."
        
        # Format conversation context
        conv_context = "Chưa có lịch sử trò chuyện trước đó."
        if conversation_history and len(conversation_history) > 0:
            # Tóm tắt ngắn gọn conversation history
            recent_msgs = conversation_history[-4:]  # Lấy 4 tin nhắn gần nhất
            conv_parts = []
            for msg in recent_msgs:
                role = msg.get("role", "user")
                content = msg.get("content", "")[:100]  # Giới hạn độ dài
                if role == "user":
                    conv_parts.append(f"Khách: {content}")
                elif role in ["assistant", "model"]:
                    conv_parts.append(f"Bot: {content}")
            conv_context = "\n".join(conv_parts)
        
        # Điền vào template
        system_message = self.system_prompt.format(
            retrieved_context=context,
            user_question=user_question,
            conversation_context=conv_context
        )
        
        return system_message
    
    def _format_context(self, documents: List[Document]) -> str:
        """
        Định dạng tài liệu tìm được thành context
        
        Args:
            documents: Danh sách tài liệu
            
        Returns:
            Chuỗi context đã định dạng
        """
        if not documents:
            return "Không có dữ liệu liên quan."
        
        formatted_parts = []
        
        for idx, doc in enumerate(documents, 1):
            template = self.CONTEXT_TEMPLATES.get(
                doc.doc_type,
                self.CONTEXT_TEMPLATES[DocumentType.GENERAL]
            )
            
            # Format metadata info cho xe
            metadata_info = ""
            if doc.doc_type == DocumentType.CAR and doc.metadata:
                meta_parts = []
                if doc.metadata.get("gia_thue"):
                    meta_parts.append(f"Giá thuê: {doc.metadata.get('gia_thue'):,} VNĐ/ngày")
                if doc.metadata.get("gia_ban"):
                    meta_parts.append(f"Giá bán: {doc.metadata.get('gia_ban'):,} VNĐ")
                if doc.metadata.get("loai_xe"):
                    meta_parts.append(f"Loại xe: {doc.metadata.get('loai_xe')}")
                if doc.metadata.get("trang_thai"):
                    meta_parts.append(f"Trạng thái: {doc.metadata.get('trang_thai')}")
                if meta_parts:
                    metadata_info = "\n".join(meta_parts) + "\n"
            
            # Giới hạn độ dài content để tránh prompt quá dài
            content = doc.content
            if len(content) > 800:
                content = content[:800] + "..."
            
            formatted_parts.append(
                template.format(
                    title=doc.title,
                    content=content,
                    metadata=doc.metadata,
                    metadata_info=metadata_info
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
