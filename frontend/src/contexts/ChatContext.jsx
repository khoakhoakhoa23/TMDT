import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import chatApi from '../api/chatApi';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Lấy hoặc tạo phiên chat
  const initSession = useCallback(async (sessionType = 'support') => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra local storage để tìm phiên đã có
      let sessionId = localStorage.getItem('chat_session_id');

      if (sessionId) {
        // Thử lấy phiên đã tồn tại
        try {
          const response = await chatApi.getSession(sessionId);
          setSession(response.data);
          // Tải tin nhắn
          const messagesResponse = await chatApi.getMessages(sessionId);
          setMessages(messagesResponse.data);
          setLoading(false);
          return response.data;
        } catch (err) {
          // Phiên không tồn tại, tạo phiên mới
          localStorage.removeItem('chat_session_id');
          sessionId = null;
        }
      }

      // Tạo phiên mới
      const response = await chatApi.createSession(sessionType);
      setSession(response.data);
      setMessages(response.data.messages || []);
      localStorage.setItem('chat_session_id', response.data.session_id);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Lỗi khởi tạo phiên chat:', err);
      setError('Không thể khởi tạo phiên chat');
      setLoading(false);
      return null;
    }
  }, []);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (content) => {
    if (!session) {
      await initSession();
    }

    if (!content.trim()) return;

    try {
      setIsTyping(true);
      setError(null);

      // Thêm tin nhắn user vào state local
      const tempUserMessage = {
        id: Date.now(),
        message_type: 'user',
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Gửi lên server
      const response = await chatApi.sendMessage(session.session_id, content.trim());

      // Cập nhật danh sách tin nhắn
      setMessages(prev => {
        // Xóa tin nhắn tạm, thêm tin nhắn thật
        const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
        return [...filtered, response.data.user_message, response.data.bot_message];
      });

      return response.data;
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      setError('Gửi tin nhắn thất bại, vui lòng thử lại');
      setLoading(false);
      return null;
    } finally {
      setIsTyping(false);
    }
  }, [session, initSession]);

  // Reply nhanh
  const sendQuickReply = useCallback(async (reply) => {
    return sendMessage(reply);
  }, [sendMessage]);

  // Đóng/mở cửa sổ chat
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Mở cửa sổ chat
  const openChat = useCallback(async () => {
    setIsOpen(true);
    if (!session) {
      await initSession();
    }
  }, [session, initSession]);

  // Đóng cửa sổ chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Xóa lịch sử chat
  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chat_session_id');
    setSession(null);
  }, []);

  // Lấy các hành động nhanh
  const getQuickActions = useCallback(async () => {
    try {
      const response = await chatApi.getQuickActions();
      return response.data;
    } catch (err) {
      console.error('Lỗi lấy hành động nhanh:', err);
      return null;
    }
  }, []);

  const value = {
    isOpen,
    session,
    messages,
    loading,
    error,
    isTyping,
    initSession,
    sendMessage,
    sendQuickReply,
    toggleChat,
    openChat,
    closeChat,
    clearChat,
    getQuickActions,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat phải được dùng trong ChatProvider');
  }
  return context;
};

export default ChatContext;
