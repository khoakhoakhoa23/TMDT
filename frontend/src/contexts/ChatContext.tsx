import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import chatApi from "../api/chatApi";

type ChatMessage = {
  id: number | string;
  message_type: string;
  content: string;
  created_at: string;
  [key: string]: unknown;
};

type ChatSession = {
  session_id: string;
  [key: string]: unknown;
} | null;

type QuickAction = unknown;

type ChatContextValue = {
  isOpen: boolean;
  session: ChatSession;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  isTyping: boolean;
  initSession: (sessionType?: string) => Promise<ChatSession>;
  sendMessage: (content: string) => Promise<unknown>;
  sendQuickReply: (reply: string) => Promise<unknown>;
  toggleChat: () => void;
  openChat: () => Promise<void>;
  closeChat: () => void;
  clearChat: () => void;
  getQuickActions: () => Promise<QuickAction | null>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

type ChatProviderProps = {
  children: ReactNode;
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const initSession = useCallback(
    async (sessionType = "support") => {
      try {
        setLoading(true);
        setError(null);

        let sessionId = localStorage.getItem("chat_session_id");

        if (sessionId) {
          try {
            const response = await chatApi.getSession(sessionId);
            setSession(response.data);
            const messagesResponse = await chatApi.getMessages(sessionId);
            setMessages(messagesResponse.data);
            setLoading(false);
            return response.data as ChatSession;
          } catch {
            localStorage.removeItem("chat_session_id");
            sessionId = null;
          }
        }

        const response = await chatApi.createSession(sessionType);
        setSession(response.data);
        setMessages(response.data.messages || []);
        localStorage.setItem(
          "chat_session_id",
          response.data.session_id,
        );
        setLoading(false);
        return response.data as ChatSession;
      } catch (err) {
        console.error("Lỗi khởi tạo phiên chat:", err);
        setError("Không thể khởi tạo phiên chat");
        setLoading(false);
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      // Đảm bảo có session trước khi gửi tin nhắn
      let currentSession = session;
      if (!currentSession) {
        currentSession = await initSession();
        // Nếu initSession thất bại, không thể gửi tin nhắn
        if (!currentSession) {
          setError("Không thể khởi tạo phiên chat. Vui lòng thử lại.");
          return null;
        }
      }

      if (!content.trim()) return null;

      try {
        setIsTyping(true);
        setError(null);

        const tempUserMessage: ChatMessage = {
          id: Date.now(),
          message_type: "user",
          content: content.trim(),
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMessage]);

        const response = await chatApi.sendMessage(
          currentSession.session_id,
          content.trim(),
        );

        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.id !== tempUserMessage.id,
          );
          return [
            ...filtered,
            response.data.user_message,
            response.data.bot_message,
          ];
        });

        return response.data;
      } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err);
        setError("Gửi tin nhắn thất bại, vui lòng thử lại");
        setLoading(false);
        return null;
      } finally {
        setIsTyping(false);
      }
    },
    [session, initSession],
  );

  const sendQuickReply = useCallback(
    async (reply: string) => {
      return sendMessage(reply);
    },
    [sendMessage],
  );

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openChat = useCallback(async () => {
    setIsOpen(true);
    if (!session) {
      await initSession();
    }
  }, [session, initSession]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("chat_session_id");
    setSession(null);
  }, []);

  const getQuickActions = useCallback(async () => {
    try {
      const response = await chatApi.getQuickActions();
      return response.data as QuickAction;
    } catch (err) {
      console.error("Lỗi lấy hành động nhanh:", err);
      return null;
    }
  }, []);

  const value: ChatContextValue = {
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
    throw new Error("useChat phải được dùng trong ChatProvider");
  }
  return context;
};

export default ChatContext;

