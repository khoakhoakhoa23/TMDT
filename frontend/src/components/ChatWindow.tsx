import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';

const ChatWindow = () => {
  const {
    isOpen,
    messages,
    loading,
    error,
    isTyping,
    sendMessage,
    sendQuickReply,
    closeChat,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tự động cuộn xuống dưới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input khi mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Định dạng thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Xử lý gửi
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const content = inputValue.trim();
    setInputValue('');
    await sendMessage(content);
  };

  // Xử lý click reply nhanh
  const handleQuickReply = async (reply) => {
    await sendQuickReply(reply);
  };

  // Hiển thị bọc tin nhắn
  const renderMessage = (message) => {
    const isUser = message.message_type === 'user';
    
    return (
      <div
        key={message.id || message.created_at}
        className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Avatar bot */}
        {!isUser && (
          <div className="flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
          </div>
        )}

        {/* Bọc tin nhắn */}
        <div
          className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          <span
            className={`text-xs mt-1 block ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Avatar user */}
        {isUser && (
          <div className="flex-shrink-0 ml-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Hiển thị reply nhanh
  const renderQuickReplies = () => {
    if (messages.length === 0) return null;
    
    const lastBotMessage = [...messages].reverse().find(msg => msg.message_type === 'bot');
    if (!lastBotMessage || !lastBotMessage.quick_replies || (lastBotMessage.quick_replies as string[]).length === 0) {
      return null;
    }

    const quickReplies = lastBotMessage.quick_replies as string[];
    
    return (
      <div className="flex flex-wrap gap-2 mt-3 px-2">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleQuickReply(reply)}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors duration-200 border border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reply}
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Trợ lý ảo TMDT</h3>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              Đang hoạt động
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={closeChat}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Thu nhỏ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Khu vực tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Tin nhắn chào mừng */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h4 className="text-gray-700 font-medium mb-1">Xin chào! 👋</h4>
            <p className="text-sm text-gray-500">Tôi có thể giúp bạn tìm xe thuê phù hợp</p>
          </div>
        )}

        {/* Tin nhắn lỗi */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-3 text-sm">
            {error}
          </div>
        )}

        {/* Danh sách tin nhắn */}
        {messages.map(renderMessage)}
        
        {/* Hiển thị đang gõ */}
        {isTyping && (
          <div className="flex w-full justify-start mb-4">
            <div className="flex-shrink-0 mr-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Reply nhanh */}
        {renderQuickReplies()}

        <div ref={messagesEndRef} />
      </div>

      {/* Khu vực nhập liệu */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
