from django.urls import path
from . import views
from .rag import views as rag_views

app_name = 'chat'

urlpatterns = [
    # Chat Sessions
    path('sessions/', views.ChatSessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<str:session_id>/', views.ChatSessionDetailView.as_view(), name='session-detail'),
    
    # Chat Messages
    path('sessions/<str:session_id>/messages/', views.ChatMessageListCreateView.as_view(), name='message-list-create'),
    
    # Chat Bot
    path('sessions/<str:session_id>/send/', views.ChatBotView.as_view(), name='chat-bot'),
    
    # Quick Actions
    path('quick-actions/', views.QuickActionsView.as_view(), name='quick-actions'),
    
    # RAG Chatbot API (New!)
    path('rag/chat/<str:session_id>/', rag_views.RAGChatView.as_view(), name='rag-chat'),
    path('rag/chat/<str:session_id>/stream/', rag_views.RAGChatStreamView.as_view(), name='rag-chat-stream'),
    path('rag/search/', rag_views.RAGSearchView.as_view(), name='rag-search'),
    path('rag/index/', rag_views.RAGIndexView.as_view(), name='rag-index'),
    path('rag/health/', rag_views.RAGHealthView.as_view(), name='rag-health'),
    path('rag/quick-replies/', rag_views.RAGQuickRepliesView.as_view(), name='rag-quick-replies'),
]

