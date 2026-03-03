"""
Chat Service Module - Module xu ly chat
Tich hop retrieval, Prompt builder va Gemini/OpenAI/Groq API
"""
import sys
import time
import traceback
from typing import Dict, Any, Optional, List
from datetime import datetime

# Custom exceptions for better error handling
class ChatServiceError(Exception):
    """Base exception for chat service"""
    pass

class RetrievalError(ChatServiceError):
    """Exception when retrieval fails"""
    pass

class AIAPIError(ChatServiceError):
    """Exception when AI API call fails"""
    pass

class TimeoutError(ChatServiceError):
    """Exception when request times out"""
    pass

# Thêm đường dẫn cho config
sys.path.insert(0, '../../..')

from .models import ChatRequest, ChatResponse, Document
from .retrieval import RetrievalService, get_retrieval_service
from .prompt_builder import PromptBuilder, get_prompt_builder
from .openai_client import OpenAIClient, get_openai_client
from .gemini_client import GeminiClient, get_gemini_client
# Import Groq với try-except để không crash khi module không có
try:
    from .groq_client import GroqClient, get_groq_client
    GROQ_AVAILABLE = True
except ImportError:
    GroqClient = None
    get_groq_client = None
    GROQ_AVAILABLE = False
from .local_embeddings import LocalEmbeddingClient, get_local_embedding_client
from .logging_utils import ChatLogger, get_logger
from .memory import ConversationManager, get_memory_manager


class ChatService:
    """
    Chat Service
    Tong hop tat ca cac thanh phan RAG, xu ly yeu cau chat
    """
    
    def __init__(
        self,
        retrieval_service: RetrievalService = None,
        prompt_builder: PromptBuilder = None,
        ai_client=None,
        memory_manager: ConversationManager = None,
        logger: ChatLogger = None,
        auto_build_index: bool = True
    ):
        """
        Khoi tao Chat Service

        Args:
            retrieval_service: Instance cua Retrieval Service
            prompt_builder: Instance cua Prompt Builder
            ai_client: Instance cua Gemini/OpenAI/Groq Client
            memory_manager: Instance cua Memory Manager
            logger: Instance cua Logger
            auto_build_index: Co tu dong xay dung index khong
        """
        self.retrieval_service = retrieval_service or get_retrieval_service()
        self.prompt_builder = prompt_builder or get_prompt_builder()
        self.memory_manager = memory_manager or get_memory_manager()
        self.logger = logger or get_logger()

        # Thứ tự ưu tiên: Groq -> Gemini -> OpenAI
        self.ai_client = ai_client
        if self.ai_client is None:
            # Ưu tiên 1: Groq (miễn phí, nhanh nhất) - chỉ thử nếu module có sẵn
            if GROQ_AVAILABLE and get_groq_client is not None:
                try:
                    from config_ai import GROQ_API_KEY
                    if GROQ_API_KEY and GROQ_API_KEY != "gsk_...":
                        groq_client = get_groq_client()
                        if groq_client.is_available():
                            self.ai_client = groq_client
                            self.use_gemini = False
                            self.use_groq = True
                            print("OK: ChatService using GROQ AI")
                        else:
                            raise Exception("Groq khong kha dung")
                    else:
                        raise Exception("Groq API key chua cau hinh")
                except Exception:
                    pass  # Fallback sang Gemini
            else:
                # Groq không có sẵn, bỏ qua
                pass
                # Ưu tiên 2: Gemini
                try:
                    gemini_client = get_gemini_client()
                    if gemini_client.is_available():
                        self.ai_client = gemini_client
                        self.use_gemini = True
                        self.use_groq = False
                        print("OK: ChatService using Gemini AI")
                    else:
                        raise Exception("Gemini không khả dụng")
                except Exception:
                    # Fallback cuối: OpenAI
                    self.ai_client = get_openai_client()
                    self.use_gemini = False
                    self.use_groq = False
                    print("OK: ChatService using OpenAI AI")

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
            session_id: ID cua phien chat
            user_question: Cau hoi nguoi dung
            user_id: ID nguoi dung (neu co)
            conversation_history: Lich su chat (neu co)
            context: Them thong tin ve request

        Returns:
            ChatResponse: Phan hoi tu chatbot
        """
        start_time = time.time()

        try:
            # Log request
            self.logger.log_chat_request(session_id, user_question, user_id)

            # 1. Laylich su cuoc tro chuyen
            if conversation_history is None:
                conversation_history = self.memory_manager.get_history(session_id)

            # 2. Tìm kiếm tài liệu liên quan - Cải thiện với hybrid search
            self.logger.logger.info(f"Searching for: {user_question}")
            relevant_docs = []
            
            try:
                # Semantic search với top_k lớn hơn để có nhiều lựa chọn
                semantic_docs = self.retrieval_service.search(
                    query=user_question,
                    top_k=8
                )
                self.logger.logger.info(f"Found {len(semantic_docs)} documents from semantic search")
                
                # Keyword search để bổ sung
                keyword_docs = self.retrieval_service.keyword_search(
                    query=user_question, 
                    top_k=5
                )
                self.logger.logger.info(f"Found {len(keyword_docs)} documents from keyword search")
                
                # Kết hợp và loại bỏ trùng lặp
                doc_ids_seen = set()
                for doc in semantic_docs + keyword_docs:
                    if doc.id not in doc_ids_seen:
                        relevant_docs.append(doc)
                        doc_ids_seen.add(doc.id)
                
                # Giới hạn số lượng documents để tránh prompt quá dài
                relevant_docs = relevant_docs[:7]
                self.logger.logger.info(f"Total unique documents: {len(relevant_docs)}")
                
            except (RetrievalError, ConnectionError, TimeoutError) as e:
                self.logger.logger.warning(f"Search failed: {e}, using keyword search only")
                # Fallback to keyword search only if semantic search fails
                try:
                    relevant_docs = self.retrieval_service.keyword_search(user_question, top_k=5)
                except Exception as fallback_error:
                    self.logger.logger.error(f"Fallback search also failed: {fallback_error}")
                    relevant_docs = []

            # 3. Xây dựng prompt với context đầy đủ
            messages = self.prompt_builder.build_prompt(
                user_question=user_question,
                documents=relevant_docs,
                conversation_history=conversation_history,
                context=context
            )

            # 4. Chuyển đổi tin nhắn theo định dạng của AI (nếu cần)
            if self.use_gemini:
                # Gemini format - chuyển đổi messages sang format Gemini
                gemini_messages = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    if role == "system":
                        # Gemini không hỗ trợ system message, chuyển thành user message với prefix
                        gemini_messages.append({
                            "role": "user",
                            "parts": [f"[SYSTEM INSTRUCTIONS]\n{content}"]
                        })
                    elif role == "assistant":
                        gemini_messages.append({
                            "role": "model",
                            "parts": [content]
                        })
                    else:
                        gemini_messages.append({
                            "role": "user",
                            "parts": [content]
                        })
                messages = gemini_messages

            # 5. Gọi AI API với messages đã được format
            try:
                if self.use_gemini:
                    response_text = self.ai_client.chat_completion(messages)["content"]
                else:
                    # OpenAI/Groq format - messages đã đúng format
                    response_text = self.ai_client.chat(messages)
            except (AIAPIError, ConnectionError, TimeoutError) as api_error:
                self.logger.logger.error(f"AI API call failed: {api_error}")
                
                # Thử dùng keyword search result trực tiếp
                if relevant_docs:
                    self.logger.logger.info("Attempting fallback response generation")
                    try:
                        response_text = self._generate_fallback_response(relevant_docs, user_question)
                    except Exception as fallback_error:
                        self.logger.logger.error(f"Fallback response generation failed: {fallback_error}")
                        raise AIAPIError(f"AI API failed and fallback also failed: {fallback_error}") from fallback_error
                else:
                    raise AIAPIError(f"AI API call failed: {api_error}") from api_error
            except Exception as unknown_error:
                # Log full traceback for unknown errors
                self.logger.logger.error(f"Unknown AI error: {unknown_error}\n{traceback.format_exc()}")
                raise AIAPIError(f"Unexpected error during AI call: {unknown_error}") from unknown_error

            # 6. Luu lich su
            self.memory_manager.add_message(session_id, "user", user_question)
            self.memory_manager.add_message(session_id, "assistant", response_text)

            # 7. Tinh toan thoi gian phan hoi
            processing_time = time.time() - start_time

            # 8. Log response
            self.logger.log_chat_response(session_id, response_text, processing_time)

            # 9. Trả về kết quả
            return ChatResponse(
                answer=response_text,
                sources=[doc.metadata for doc in relevant_docs],
                processing_time=processing_time
            )

        except Exception as e:
            # Log full traceback for debugging
            self.logger.log_error("Chat processing failed", f"{str(e)}\n{traceback.format_exc()}")
            
            # Determine error type for better user feedback
            error_type = type(e).__name__
            user_message = "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau!"
            
            if "timeout" in str(e).lower() or error_type == "TimeoutError":
                user_message = "Xin lỗi, yêu cầu của bạn đang mất quá lâu. Vui lòng thử lại sau!"
            elif "connection" in str(e).lower() or "network" in str(e).lower():
                user_message = "Xin lỗi, không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet!"
            elif "api" in str(e).lower():
                user_message = "Xin lỗi, dịch vụ AI đang gặp sự cố. Vui lòng thử lại sau!"
            
            return ChatResponse(
                answer=user_message,
                sources=[],
                processing_time=time.time() - start_time,
                error=str(e),
                error_type=error_type
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
        Xu ly yeu cau chat voi phan hoi streaming

        Args:
            session_id: ID cua phien chat
            user_question: Cau hoi nguoi dung
            user_id: ID nguoi dung (neu co)
            conversation_history: Lich su chat (neu co)
            context: Them thong tin ve request

        Yields:
            dict: Cac chunk cua response
        """
        start_time = time.time()

        try:
            # Log request
            self.logger.log_chat_request(session_id, user_question, user_id)

            # 1. Laylich su cuoc tro chuyen
            if conversation_history is None:
                conversation_history = self.memory_manager.get_history(session_id)

            # 2. Tìm kiếm tài liệu liên quan - Sử dụng cùng logic như chat()
            self.logger.logger.info(f"Searching for: {user_question}")
            relevant_docs = []
            
            try:
                semantic_docs = self.retrieval_service.search(query=user_question, top_k=8)
                keyword_docs = self.retrieval_service.keyword_search(query=user_question, top_k=5)
                
                doc_ids_seen = set()
                for doc in semantic_docs + keyword_docs:
                    if doc.id not in doc_ids_seen:
                        relevant_docs.append(doc)
                        doc_ids_seen.add(doc.id)
                
                relevant_docs = relevant_docs[:7]
                self.logger.logger.info(f"Total unique documents: {len(relevant_docs)}")
            except Exception as e:
                self.logger.logger.warning(f"Search failed: {e}, using keyword search only")
                relevant_docs = self.retrieval_service.keyword_search(user_question, top_k=5)

            # 3. Xây dựng prompt với logic cải thiện
            messages = self.prompt_builder.build_prompt(
                user_question=user_question,
                documents=relevant_docs,
                conversation_history=conversation_history,
                context=context
            )

            # 4. Chuyển đổi tin nhắn theo định dạng của AI
            if self.use_gemini:
                gemini_messages = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    if role == "system":
                        gemini_messages.append({
                            "role": "user",
                            "parts": [f"[SYSTEM INSTRUCTIONS]\n{content}"]
                        })
                    elif role == "assistant":
                        gemini_messages.append({
                            "role": "model",
                            "parts": [content]
                        })
                    else:
                        gemini_messages.append({
                            "role": "user",
                            "parts": [content]
                        })
                stream = self.ai_client.chat_completion_stream(gemini_messages)
            else:
                # OpenAI/Groq format - messages đã đúng format
                stream = self.ai_client.chat_stream(messages)

            # 5. Stream response
            full_response = ""
            for chunk in stream:
                if chunk:
                    full_response += chunk
                    yield {
                        "type": "chunk",
                        "content": chunk,
                        "streaming": True
                    }

            # 6. Luu lich su
            self.memory_manager.add_message(session_id, "user", user_question)
            self.memory_manager.add_message(session_id, "assistant", full_response)

            # 7. Log response
            processing_time = time.time() - start_time
            self.logger.log_chat_response(session_id, full_response, processing_time)

            yield {
                "type": "complete",
                "answer": full_response,
                "sources": [doc.metadata for doc in relevant_docs],
                "processing_time": processing_time
            }

        except Exception as e:
            self.logger.log_error("Chat streaming failed", e)
            yield {
                "type": "error",
                "error": str(e)
            }

    def _generate_fallback_response(self, docs: List[Document], question: str) -> str:
        """Tạo response fallback từ tài liệu khi AI fail - Cải thiện với format tốt hơn"""
        if not docs:
            return (
                "Em xin lỗi, hiện tại hệ thống đang gặp sự cố kỹ thuật. "
                "Anh/chị vui lòng thử lại sau hoặc liên hệ hotline 1900 xxxx để được hỗ trợ trực tiếp ạ."
            )
        
        # Tạo response từ documents với format tốt hơn
        context_parts = []
        for doc in docs[:3]:  # Chỉ lấy 3 documents đầu
            title = doc.title or doc.metadata.get("title", "Thông tin")
            content = doc.content[:300] if doc.content else ""
            
            # Thêm metadata nếu là xe
            if doc.doc_type == DocumentType.CAR and doc.metadata:
                meta_info = []
                if doc.metadata.get("gia_thue"):
                    meta_info.append(f"Giá thuê: {doc.metadata.get('gia_thue'):,} VNĐ/ngày")
                if doc.metadata.get("loai_xe"):
                    meta_info.append(f"Loại: {doc.metadata.get('loai_xe')}")
                if meta_info:
                    content = f"{', '.join(meta_info)}\n{content}"
            
            context_parts.append(f"**{title}**:\n{content}")

        context = "\n\n".join(context_parts)

        return (
            f"Dựa trên thông tin từ hệ thống, em tìm thấy:\n\n{context}\n\n"
            "Nếu anh/chị cần thông tin chi tiết hơn, vui lòng để lại số điện thoại hoặc gọi hotline 1900 xxxx "
            "để được tư vấn viên hỗ trợ tốt nhất ạ."
        )

    def clear_session(self, session_id: str):
        """Xoa lich su cua mot session"""
        self.memory_manager.clear_history(session_id)
        self.logger.logger.info(f"Cleared session: {session_id}")


# Singleton
_chat_service = None

def get_chat_service() -> ChatService:
    """Lay ChatService singleton"""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
