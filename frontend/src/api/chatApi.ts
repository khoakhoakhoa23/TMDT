import axiosClient from './axiosClient';

const chatApi = {
  // Tạo phiên chat mới
  createSession: (sessionType = 'support') => {
    return axiosClient.post('/chat/sessions/', {
      session_type: sessionType,
    });
  },

  // Lấy danh sách phiên chat
  getSessions: (sessionId = null) => {
    const params = sessionId ? { session_id: sessionId } : {};
    return axiosClient.get('/chat/sessions/', { params });
  },

  // Lấy chi tiết phiên chat
  getSession: (sessionId) => {
    return axiosClient.get(`/chat/sessions/${sessionId}/`);
  },

  // Lấy tin nhắn của phiên chat
  getMessages: (sessionId) => {
    return axiosClient.get(`/chat/sessions/${sessionId}/messages/`);
  },

  // Gửi tin nhắn
  sendMessage: (sessionId, content) => {
    return axiosClient.post(`/chat/sessions/${sessionId}/messages/`, {
      content,
    });
  },

  // Chat trực tiếp với bot
  chat: (sessionId, content) => {
    return axiosClient.post(`/chat/sessions/${sessionId}/send/`, {
      content,
    });
  },

  // Lấy các hành động nhanh
  getQuickActions: () => {
    return axiosClient.get('/chat/quick-actions/');
  },
};

export default chatApi;
