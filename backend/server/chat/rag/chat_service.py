"""
Chat Service Module - Module xu ly chat
Tich hop retrieval, Prompt builder va Gemini/OpenAI/Groq API
"""
import sys
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

# Thêm đường dẫn cho config
sys.path.insert(0, '../../..')

from .models import ChatRequest, ChatResponse, Document
from .retrieval import RetrievalService, get_retrieval_service
from .prompt_builder import PromptBuilder, get_prompt_builder
from .openai_client import OpenAIClient, get_openai_client
from .gemini_client import GeminiClient, get_gemini_client
from .groq_client import GroqClient, get_groq_client
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
            # Ưu tiên 1: Groq (miễn phí, nhanh nhất)
            try:
                from config_ai import GROQ_API_KEY
                if GROQ_API_KEY and GROQ_API_KEY != "gsk_...":
                    groq_client = get_groq_client()
                    if groq_client.is_available():
                        self.ai_client = groq_client
                        self.use_gemini = False
                        self.use_groq = True
                        print("✅ ChatService sử dụng GROQ AI (MIỄN PHÍ!)")
                    else:
                        raise Exception("Groq không khả dụng")
                else:
                    raise Exception("Groq API key chưa cấu hình")
            except Exception:
                # Ưu tiên 2: Gemini
                try:
                    gemini_client = get_gemini_client()
                    if gemini_client.is_available():
                        self.ai_client = gemini_client
                        self.use_gemini = True
                        self.use_groq = False
                        print("✅ ChatService sử dụng Gemini AI")
                    else:
                        raise Exception("Gemini không khả dụng")
                except Exception:
                    # Fallback cuối: OpenAI
                    self.ai_client = get_openai_client()
                    self.use_gemini = False
                    self.use_groq = False
                    print("⚠️ ChatService fallback về OpenAI")

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

            # 2. Tim kiem tai lieu lien quan
            self.logger.logger.info(f"Searching for: {user_question}")
            try:
                relevant_docs = self.retrieval_service.search(
                    query=user_question,
                    top_k=5
                )
                self.logger.logger.info(f"Found {len(relevant_docs)} relevant documents")
            except Exception as e:
                self.logger.logger.warning(f"Search failed: {e}, using keyword search only")
                # Fallback to keyword search only if semantic search fails
                relevant_docs = self.retrieval_service.keyword_search(user_question, top_k=5)

            # 3. Xay dung prompt
            prompt = self.prompt_builder.build_prompt(
                question=user_question,
                context_docs=relevant_docs,
                conversation_history=conversation_history,
                context=context
            )

            # 4. Chuyen doi tin nhan theo dinh dang cua AI
            if self.use_gemini:
                # Gemini format
                messages = [
                    {
                        "role": msg["role"] if msg["role"] in ["user", "model"] else "user",
                        "parts": [msg["content"]]
                    }
                    for msg in conversation_history[-5:] + [{"role": "user", "content": user_question}]
                ]
            else:
                # OpenAI/Groq format
                messages = [
                    {
                        "role": msg["role"] if msg["role"] in ["user", "assistant", "system"] else "user",
                        "content": msg["content"]
                    }
                    for msg in conversation_history[-5:] + [{"role": "user", "content": user_question}]
                ]

            # 5. Goi AI API
            try:
                if self.use_gemini:
                    response_text = self.ai_client.chat_completion(messages)["content"]
                else:
                    response_text = self.ai_client.chat(messages)
            except Exception as api_error:
                self.logger.logger.error(f"AI API call failed: {api_error}")

                # Thử dùng keyword search result trực tiếp
                if relevant_docs:
                    response_text = self._generate_fallback_response(relevant_docs, user_question)
                else:
                    raise api_error

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
            self.logger.log_error("Chat processing failed", e)
            return ChatResponse(
                answer="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau!",
                sources=[],
                processing_time=time.time() - start_time,
                error=str(e)
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

            # 2. Tim kiem tai lieu lien quan
            self.logger.logger.info(f"Searching for: {user_question}")
            try:
                relevant_docs = self.retrieval_service.search(
                    query=user_question,
                    top_k=5
                )
                self.logger.logger.info(f"Found {len(relevant_docs)} relevant documents")
            except Exception as e:
                self.logger.logger.warning(f"Search failed: {e}, using keyword search only")
                relevant_docs = self.retrieval_service.keyword_search(user_question, top_k=5)

            # 3. Xay dung prompt
            prompt = self.prompt_builder.build_prompt(
                question=user_question,
                context_docs=relevant_docs,
                conversation_history=conversation_history,
                context=context
            )

            # 4. Chuyen doi tin nhan
            if self.use_gemini:
                messages = [
                    {
                        "role": msg["role"] if msg["role"] in ["user", "model"] else "user",
                        "parts": [msg["content"]]
                    }
                    for msg in conversation_history[-5:] + [{"role": "user", "content": user_question}]
                ]
                stream = self.ai_client.chat_completion_stream(messages)
            else:
                messages = [
                    {
                        "role": msg["role"] if msg["role"] in ["user", "assistant", "system"] else "user",
                        "content": msg["content"]
                    }
                    for msg in conversation_history[-5:] + [{"role": "user", "content": user_question}]
                ]
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
        """Tao response fallback tu tai lieu khi AI fail"""
        context_parts = []
        for doc in docs:
            title = doc.metadata.get("title", "Tài liệu")
            content = doc.content[:500] if doc.content else ""
            context_parts.append(f"**{title}**:\n{content}")

        context = "\n\n".join(context_parts)

        return f"""Dựa trên thông tin từ hệ thống, tôi tìm thấy:

{context}

---

*Lưu ý: Đây là phản hồi từ tìm kiếm trực tiếp. Để có câu trả lời chi tiết hơn, vui lòng thử lại sau.*"""

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
