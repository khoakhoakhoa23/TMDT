"""
Chat Service Module - Module xu ly chat
Tich hop retrieval, Prompt builder va OpenAI API
"""
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from .models import ChatRequest, ChatResponse, Document
from .retrieval import RetrievalService, get_retrieval_service
from .prompt_builder import PromptBuilder, get_prompt_builder
from .openai_client import OpenAIClient, get_openai_client
from .logging_utils import ChatLogger, get_logger

class ChatService:
    """
    Chat Service
    Tong hop tat ca cac thanh phan RAG, xu ly yeu cau chat
    """
    
    def __init__(
        self,
        retrieval_service: RetrievalService = None,
        prompt_builder: PromptBuilder = None,
        openai_client: OpenAIClient = None,
        logger: ChatLogger = None,
        auto_build_index: bool = True
    ):
        """
        Khoi tao Chat Service
        
        Args:
            retrieval_service: Instance cua Retrieval Service
            prompt_builder: Instance cua Prompt Builder
            openai_client: Instance cua OpenAI Client
            logger: Instance cua Logger
            auto_build_index: Co tu dong xay dung index khong
        """
        self.retrieval_service = retrieval_service or get_retrieval_service()
        self.prompt_builder = prompt_builder or get_prompt_builder()
        self.openai_client = openai_client or get_openai_client()
        self.logger = logger or get_logger()
        
        # Tu dong xay dung index
        if auto_build_index:
            self._ensure_index_built()
    
    def _ensure_index_built(self):
        """Dam bao index da duoc xay dung"""
        if self.retrieval_service.get_document_count() == 0:
            try:
                from .knowledge_base import build_knowledge_base
                build_knowledge_base()
                self.logger.logger.info("Knowledge base index built successfully")
            except Exception as e:
                self.logger.log_error("Failed to build knowledge base", e)
    
    def chat(
        self,
        session_id: str,
        user_question: str,
        user_id: Optional[str] = None,
        conversation_history: List[Dict] = None,
        context: Dict[str, Any] = None
    ) -> ChatResponse:
        """
        Xu ly yeu cau chat
        
        Args:
            session_id: ID phien chat
            user_question: Cau hoi nguoi dung
            user_id: ID nguoi dung
            conversation_history: Lich su cuoc tro chuyen
            context: Bo canh bo sung
            
        Returns:
            ChatResponse: Phan hoi chat
        """
        start_time = time.time()
        
        # 1. Tim kiem tai lieu lien quan
        retrieval_start = time.time()
        retrieval_result = self.retrieval_service.search(user_question)
        retrieval_time = (time.time() - retrieval_start) * 1000
        
        # 2. Kiem tra co can chuyen tu van vien khong
        requires_human = self.prompt_builder.should_escalate_to_human(
            retrieval_result.documents,
            user_question
        )
        
        # 3. Xay dung cau tra loi
        if requires_human or not retrieval_result.has_results():
            # Khong co ket qua lien quan, chuyen tu van vien
            answer = self.prompt_builder.build_no_context_response()
            sources = []
            
            # Ghi nhan cau hoi khong duoc tra loi
            self.logger.log_unanswered(session_id, user_question, context)
            
        else:
            # Co ket qua lien quan, xay dung Prompt
            messages = self.prompt_builder.build_prompt(
                user_question=user_question,
                documents=retrieval_result.documents,
                conversation_history=conversation_history
            )
            
            # 4. Goi OpenAI API
            try:
                completion = self.openai_client.chat_completion(messages)
                answer = completion.content
            except Exception as e:
                self.logger.log_error("OpenAI API error", e)
                answer = (
                    "Xin loi, hien tai he thong dang gap su co. "
                    "Vui long thu lai sau hoac lien he hotline 1900 xxxx de duoc ho tro."
                )
                requires_human = True
            
            sources = retrieval_result.documents
        
        # 5. Ghi log
        total_time = (time.time() - start_time) * 1000
        source_ids = [s.id for s in sources]
        
        self.logger.log_chat(
            session_id=session_id,
            user_question=user_question,
            bot_response=answer,
            sources_used=source_ids,
            retrieval_time_ms=retrieval_time,
            total_time_ms=total_time,
            metadata={
                'user_id': user_id,
                'num_sources': len(sources),
                'requires_human': requires_human,
                'context': context,
            }
        )
        
        # 6. Xay dung phan hoi
        return ChatResponse(
            answer=answer,
            sources=sources,
            requires_human=requires_human,
            metadata={
                'retrieval_time_ms': retrieval_time,
                'total_time_ms': total_time,
                'num_sources': len(sources),
            }
        )
    
    def chat_with_stream(
        self,
        session_id: str,
        user_question: str,
        user_id: Optional[str] = None,
        conversation_history: List[Dict] = None,
        context: Dict[str, Any] = None
    ):
        """
        Xu ly chat theo kieu streaming
        
        Args:
            session_id: ID phien chat
            user_question: Cau hoi nguoi dung
            user_id: ID nguoi dung
            conversation_history: Lich su cuoc tro chuyen
            context: Bo canh bo sung
            
        Yields:
            Cac chunk noi dung
        """
        # Tim kiem tai lieu lien quan
        retrieval_result = self.retrieval_service.search(user_question)
        
        requires_human = self.prompt_builder.should_escalate_to_human(
            retrieval_result.documents,
            user_question
        )
        
        if requires_human or not retrieval_result.has_results():
            # Tra ve tin nhan chuyen tu van vien
            answer = self.prompt_builder.build_no_context_response()
            self.logger.log_unanswered(session_id, user_question, context)
            yield answer
            return
        
        # Xay dung Prompt
        messages = self.prompt_builder.build_prompt(
            user_question=user_question,
            documents=retrieval_result.documents,
            conversation_history=conversation_history
        )
        
        # Goi API theo kieu streaming
        answer_parts = []
        try:
            for chunk in self.openai_client.chat_completion_stream(messages):
                answer_parts.append(chunk)
                yield chunk
            
            # Ghi log
            full_answer = ''.join(answer_parts)
            source_ids = [s.id for s in retrieval_result.documents]
            
            self.logger.log_chat(
                session_id=session_id,
                user_question=user_question,
                bot_response=full_answer,
                sources_used=source_ids,
                retrieval_time_ms=0,
                total_time_ms=0,
                metadata={
                    'user_id': user_id,
                    'num_sources': len(source_ids),
                    'requires_human': False,
                    'context': context,
                }
            )
            
        except Exception as e:
            self.logger.log_error("Streaming error", e)
            yield (
                "Xin loi, da xay ra loi. "
                "Vui long thu lai sau hoac lien he hotline."
            )
    
    def get_quick_replies(self, user_question: str) -> List[str]:
        """
        Lay goi y cau tra loi nhanh
        
        Args:
            user_question: Cau hoi nguoi dung
            
        Returns:
            Danh sach cau tra loi nhanh
        """
        retrieval_result = self.retrieval_service.search(user_question, top_k=3)
        return self.prompt_builder.get_quick_replies(retrieval_result.documents)
    
    def rebuild_index(self, use_db: bool = False) -> int:
        """
        Xay dung lai index cua knowledge base
        
        Args:
            use_db: Co lay du lieu xe tu database khong
            
        Returns:
            So luong tai lieu
        """
        self.retrieval_service.clear_index()
        
        try:
            from .knowledge_base import build_knowledge_base
            kb = build_knowledge_base(use_db=use_db)
            return kb.retrieval_service.get_document_count()
        except Exception as e:
            self.logger.log_error("Failed to rebuild index", e)
            return 0
    
    def get_status(self) -> Dict[str, Any]:
        """
        Lay trang thai service
        
        Returns:
            Thong tin trang thai
        """
        return {
            'openai_available': self.openai_client.is_available(),
            'openai_model': self.openai_client.model,
            'embedding_model': self.openai_client.embedding_model,
            'document_count': self.retrieval_service.get_document_count(),
            'index_stats': self.retrieval_service.get_index_stats(),
        }
    
    def health_check(self) -> Dict[str, Any]:
        """
        Kiem tra здоровье
        
        Returns:
            Trang thai здоровье
        """
        return {
            'status': 'healthy',
            'openai': self.openai_client.is_available(),
            'index_loaded': self.retrieval_service.get_document_count() > 0,
            'timestamp': datetime.now().isoformat(),
        }


# Global service instance
_chat_service: Optional[ChatService] = None


def get_chat_service(
    auto_build_index: bool = True
) -> ChatService:
    """
    Lay instance Chat Service toan cuc
    
    Args:
        auto_build_index: Co tu dong xay dung index khong
        
    Returns:
        Instance ChatService
    """
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService(auto_build_index=auto_build_index)
    return _chat_service


def reset_chat_service():
    """Reset Chat Service toan cuc (dung cho testing)"""
    global _chat_service
    _chat_service = None
