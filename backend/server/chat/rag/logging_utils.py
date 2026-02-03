"""
Logging Utilities Module - Module cong cu ghi log
Xu ly ghi log cho he thong RAG, bao gom log chat va log cau hoi khong tra loi duoc
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path


class ChatLogger:
    """
    Chat Logger
    Ghi tat ca yeu cau chat va phan hoi
    """
    
    def __init__(self, log_dir: str = None):
        """
        Khoi tao logger
        
        Args:
            log_dir: Duong dan thu muc log
        """
        if log_dir is None:
            # Thu muc log mac dinh
            base_dir = Path(__file__).parent.parent.parent.parent
            log_dir = base_dir / 'logs'
        
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Thiet lap log chinh
        self._setup_main_logger()
        
        # Thiet lap log cau hoi khong tra loi
        self._setup_unanswered_logger()
    
    def _setup_main_logger(self):
        """Thiet lap logger chinh"""
        self.logger = logging.getLogger('rag_chat')
        self.logger.setLevel(logging.INFO)
        
        # Xoa cac handler hien co
        self.logger.handlers.clear()
        
        # File handler
        log_file = self.log_dir / 'rag_chat.log'
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def _setup_unanswered_logger(self):
        """Thiet lap logger cau hoi khong tra loi"""
        self.unanswered_logger = logging.getLogger('rag_unanswered')
        self.unanswered_logger.setLevel(logging.WARNING)
        self.unanswered_logger.handlers.clear()
        
        log_file = self.log_dir / 'unanswered.log'
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.WARNING)
        
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        self.unanswered_logger.addHandler(file_handler)
    
    def log_chat(
        self,
        session_id: str,
        user_question: str,
        bot_response: str,
        sources_used: list,
        retrieval_time_ms: float,
        total_time_ms: float,
        metadata: Dict[str, Any] = None
    ):
        """
        Ghi log yeu cau chat
        
        Args:
            session_id: ID phien chat
            user_question: Cau hoi nguoi dung
            bot_response: Tra loi cua bot
            sources_used: Danh sach ID tai lieu nguon su dung
            retrieval_time_ms: Thoi gian tim kiem (milliseconds)
            total_time_ms: Tong thoi gian (milliseconds)
            metadata: Metadata bo sung
        """
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'user_question': user_question,
            'bot_response': bot_response,
            'sources_used': sources_used,
            'retrieval_time_ms': retrieval_time_ms,
            'total_time_ms': total_time_ms,
            'metadata': metadata or {},
        }
        
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
    
    def log_unanswered(
        self,
        session_id: str,
        user_question: str,
        context: Dict[str, Any] = None
    ):
        """
        Ghi log cau hoi khong tra loi duoc
        
        Args:
            session_id: ID phien chat
            user_question: Cau hoi nguoi dung
            context: Thong tin bo canh
        """
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'user_question': user_question,
            'context': context or {},
        }
        
        self.unanswered_logger.warning(json.dumps(log_data, ensure_ascii=False))
    
    def log_error(self, error_message: str, exception: Exception = None):
        """
        Ghi log loi
        
        Args:
            error_message: Thong bao loi
            exception: Doi tuong ngoai le
        """
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'error': error_message,
            'exception': str(exception) if exception else None,
        }
        
        self.logger.error(json.dumps(log_data, ensure_ascii=False))
    
    def log_retrieval(
        self,
        query: str,
        num_results: int,
        scores: list,
        doc_types: list
    ):
        """
        Ghi log tim kiem
        
        Args:
            query: Noi dung truy van
            num_results: So ket qua
            scores: Diem tuong dong
            doc_types: Danh sach loai tai lieu
        """
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'num_results': num_results,
            'scores': scores,
            'doc_types': doc_types,
        }
        
        self.logger.info(f"RETRIEVAL: {json.dumps(log_data, ensure_ascii=False)}")


class UnansweredTracker:
    """
    Unanswered Question Tracker
    Dung de phan tich va cai tien chat bot
    """
    
    def __init__(self, log_dir: str = None):
        if log_dir is None:
            base_dir = Path(__file__).parent.parent.parent.parent
            log_dir = base_dir / 'logs'
        
        self.log_file = Path(log_dir) / 'unanswered_questions.jsonl'
    
    def add(self, question: str, session_id: str, metadata: Dict[str, Any] = None):
        """
        Them cau hoi khong tra loi
        
        Args:
            question: Noi dung cau hoi
            session_id: ID phien chat
            metadata: Thong tin bo sung
        """
        record = {
            'timestamp': datetime.now().isoformat(),
            'question': question,
            'session_id': session_id,
            'metadata': metadata or {},
        }
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    def get_recent(self, limit: int = 50) -> list:
        """
        Lay cac cau hoi khong tra loi gan day
        
        Args:
            limit: Gioi han so luong tra ve
            
        Returns:
            Danh sach cau hoi khong tra loi
        """
        if not self.log_file.exists():
            return []
        
        questions = []
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    questions.append(json.loads(line))
        
        return questions[-limit:]
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Lay thong tin thong ke
        
        Returns:
            Thong tin thong ke
        """
        questions = self.get_recent(1000)
        
        if not questions:
            return {'total': 0, 'by_day': {}}
        
        # Nhom theo ngay
        by_day = {}
        for q in questions:
            day = q['timestamp'][:10]
            by_day[day] = by_day.get(day, 0) + 1
        
        return {
            'total': len(questions),
            'by_day': by_day,
        }


# Global logger instance
_default_logger: Optional[ChatLogger] = None


def get_logger(log_dir: str = None) -> ChatLogger:
    """
    Lay global logger instance
    
    Args:
        log_dir: Thu muc log
        
    Returns:
        ChatLogger instance
    """
    global _default_logger
    if _default_logger is None:
        _default_logger = ChatLogger(log_dir)
    return _default_logger
