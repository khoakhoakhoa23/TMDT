# Gemini API Configuration - Miễn phí 15 requests/phút
GEMINI_API_KEY = "AIzaSyBwAbTkng7yKrarpbdgUYskgig8ag9qq2E"  # ⚠️ Đã hết quota
GEMINI_CHAT_MODEL = "gemini-1.5-flash"
GEMINI_EMBEDDING_MODEL = "embedding-001"

# Groq API - FREE tier mạnh nhất!
# Lấy key: https://console.groq.com/keys
GROQ_API_KEY = "gsk_..."
GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"  # Miễn phí, cực nhanh!
GROQ_EMBEDDING_MODEL = "text-embedding-3-small"  # hoặc dùng local

# Chatbot Settings
MAX_TOKENS = 1000
TEMPERATURE = 0.3

# Fallback to keyword search if AI fails
ENABLE_KEYWORD_FALLBACK = True

# Local Embeddings (Miễn phí hoàn toàn!)
USE_LOCAL_EMBEDDINGS = False
LOCAL_EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

