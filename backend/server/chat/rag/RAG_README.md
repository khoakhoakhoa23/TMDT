# TMDT RAG Chatbot - Retrieval-Augmented Generation Chatbot su dung OpenAI

## Cau truc thu muc

```
backend/server/chat/rag/
├── __init__.py              # Khoi tao module
├── retrieval.py             # Module tim kiem nguy sem (tim kiem vector)
├── prompt_builder.py        # Prompt Builder
├── chat_service.py          # Chat Service (tich hop retrieval va LLM)
├── openai_client.py         # OpenAI Client wrapper
├── knowledge_base.py        # Quan ly co so kien thuc
├── models.py                # Model lien quan RAG
└── logging_utils.py         # Cong cu ghi log
```

## Bat dau nhanh

### 1. Cai dat dependencies
```bash
pip install openai tiktoken numpy scikit-learn
```

### 2. Cau hinh bien moi truong
```bash
# .env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Khoi tao co so kien thuc
```python
from chat.rag.knowledge_base import KnowledgeBase

kb = KnowledgeBase()
kb.build_index()  # Xay dung vector index
```

### 4. Su dung Chat service
```python
from chat.rag.chat_service import ChatService

chat_service = ChatService()
response = chat_service.chat(
    session_id="session_123",
    user_question="Xe Toyota Camry gia bao nhieu?",
    context={"user": user_data}
)
```

## Mo ta module

### retrieval.py - Tim kiem nguy sem
- Su dung OpenAI Embeddings de tao vector
- Ho tro tim kiem tuong dong top-k
- Ho tro nhieu nguon du lieu (xe, chinh sach, FAQ)

### prompt_builder.py - Xay dung Prompt
- Tuân thu quy tac he thong
- Bo sung context lien quan
- Dam bao chat luong cau tra loi

### chat_service.py - Chat Service
- Tong hop tat ca module
- Xu ly luong cuoc tro chuyen
- Ghi log

## Luong kien tri

```
Cau hoi nguoi dung -> Tim kiem nguy sem -> Context lien quan
                                                   |
                                                   v
                                             Prompt Builder
                                                   |
                                                   v
                                              OpenAI API
                                                   |
                                                   v
                                        Phan hoi + CTA
```

## Mo rong

### Them loai du lieu moi
1. Them nguon du lieu trong `knowledge_base.py`
2. Cap nhat logic index trong `retrieval.py`
3. Cap nhat prompt trong `prompt_builder.py`

### Dieu chinh tham so tim kiem
Trong `retrieval.py` sua gia tri `TOP_K`
```python
TOP_K = 5  # Mac dinh tim kiem 5 ket qua tuong dong nhat
```

## Log

Tat ca log yeu cau duoc luu trong thu muc `chat/rag/logs/`:
- `rag_chat.log` - Log chat
- `unanswered.log` - Cau hoi khong tra loi duoc

