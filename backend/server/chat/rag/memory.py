"""
Conversation Memory Manager
Quan ly lich su cuoc tro chuyen cho RAG chatbot
"""

from typing import Dict, List, Optional
from datetime import datetime
import threading


class ConversationManager:
    """
    Quan ly lich su cuoc tro chuyen trong memory
    Co the mo rong de luu vao database sau
    """
    
    def __init__(self):
        """Khoi tao ConversationManager"""
        # Dictionary: session_id -> List[Dict] (lich su chat)
        self._conversations: Dict[str, List[Dict[str, str]]] = {}
        # Lock de dam bao thread-safe
        self._lock = threading.Lock()
    
    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Lay lich su cuoc tro chuyen cua mot session
        
        Args:
            session_id: ID cua phien chat
            
        Returns:
            List[Dict]: Danh sach tin nhan, moi tin nhan co format:
                {
                    "role": "user" | "assistant" | "system",
                    "content": "Noi dung tin nhan"
                }
        """
        with self._lock:
            return self._conversations.get(session_id, []).copy()
    
    def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str
    ) -> None:
        """
        Them mot tin nhan vao lich su
        
        Args:
            session_id: ID cua phien chat
            role: Vai tro ("user", "assistant", "system")
            content: Noi dung tin nhan
        """
        with self._lock:
            if session_id not in self._conversations:
                self._conversations[session_id] = []
            
            message = {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
            self._conversations[session_id].append(message)
    
    def clear_history(self, session_id: str) -> None:
        """
        Xoa lich su cuoc tro chuyen cua mot session
        
        Args:
            session_id: ID cua phien chat
        """
        with self._lock:
            if session_id in self._conversations:
                del self._conversations[session_id]
    
    def get_all_sessions(self) -> List[str]:
        """
        Lay danh sach tat ca session_id
        
        Returns:
            List[str]: Danh sach session_id
        """
        with self._lock:
            return list(self._conversations.keys())
    
    def get_session_count(self) -> int:
        """
        Lay so luong session hien tai
        
        Returns:
            int: So luong session
        """
        with self._lock:
            return len(self._conversations)


# Singleton instance
_memory_manager: Optional[ConversationManager] = None


def get_memory_manager() -> ConversationManager:
    """
    Lay ConversationManager singleton instance
    
    Returns:
        ConversationManager: Instance cua ConversationManager
    """
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = ConversationManager()
    return _memory_manager
