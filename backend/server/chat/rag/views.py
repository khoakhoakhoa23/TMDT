"""
RAG Chat API Endpoints - Cac API endpoint cho RAG chatbot
Cung cap REST API cho RAG chatbot
"""

from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import json

from .chat_service import get_chat_service
from .openai_client import get_openai_client
from .models import DocumentType


class RAGChatView(APIView):
    """
    RAG Chatbot API
    """
    permission_classes = [AllowAny]
    
    def post(self, request, session_id):
        """
        Gui tin nhan va lay phan hoi AI
        
        Request Body:
        {
            "content": "Cau hoi nguoi dung",
            "user_id": "ID nguoi dung tuy chon",
            "context": {
                "Bo canh bo sung tuy chon": "..."
            }
        }
        """
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_id = request.data.get('user_id')
        context = request.data.get('context', {})
        
        try:
            chat_service = get_chat_service()
            
            # Xu ly yeu cau chat
            response = chat_service.chat(
                session_id=session_id,
                user_question=content,
                user_id=user_id,
                context=context
            )
            
            # Lay goi y tra loi nhanh
            quick_replies = chat_service.get_quick_replies(content)
            
            return Response({
                'answer': response.answer,
                'sources': [s.id for s in response.sources],
                'requires_human': response.requires_human,
                'quick_replies': quick_replies,
                'metadata': response.metadata,
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request, session_id):
        """
        Lay trang thai chat service
        """
        try:
            chat_service = get_chat_service()
            status_info = chat_service.get_status()
            
            return Response({
                'session_id': session_id,
                'status': status_info,
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGChatStreamView(APIView):
    """
    RAG Streaming Chat API
    """
    permission_classes = [AllowAny]
    
    def post(self, request, session_id):
        """
        Gui tin nhan theo kieu streaming va lay phan hoi AI
        """
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_id = request.data.get('user_id')
        context = request.data.get('context', {})
        
        try:
            chat_service = get_chat_service()
            
            # Lay phan hoi streaming
            response_generator = chat_service.chat_with_stream(
                session_id=session_id,
                user_question=content,
                user_id=user_id,
                context=context
            )
            
            # Tra ve phan hoi streaming
            from django.http import StreamingHttpResponse
            return StreamingHttpResponse(
                (chunk for chunk in response_generator),
                content_type='text/plain; charset=utf-8'
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGSearchView(APIView):
    """
    Knowledge Base Search API
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Tim kiem trong co so kien thuc
        
        Query Params:
        - q: Noi dung truy van
        - top_k: So luong tra ve (mac dinh 5)
        - doc_type: Loc loai tai lieu (tuy chon)
        """
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            top_k = int(request.query_params.get('top_k', 5))
            doc_type = request.query_params.get('doc_type')
            
            chat_service = get_chat_service()
            
            # Thuc hien tim kiem
            from .rag.retrieval import RetrievalService
            from .rag.models import DocumentType
            
            if doc_type:
                try:
                    doc_type_enum = DocumentType(doc_type)
                    result = chat_service.retrieval_service.search(
                        query, top_k=top_k, doc_types=[doc_type_enum]
                    )
                except ValueError:
                    result = chat_service.retrieval_service.search(query, top_k=top_k)
            else:
                result = chat_service.retrieval_service.search(query, top_k=top_k)
            
            return Response({
                'query': query,
                'results': [
                    {
                        'id': doc.id,
                        'type': doc.doc_type.value,
                        'title': doc.title,
                        'score': score,
                        'content_preview': doc.content[:200] + '...' if len(doc.content) > 200 else doc.content,
                    }
                    for doc, score in zip(result.documents, result.scores)
                ],
                'total_found': result.total_docs_found,
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGIndexView(APIView):
    """
    Knowledge Base Index Management API
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Lay trang thai index
        """
        try:
            chat_service = get_chat_service()
            status_info = chat_service.get_status()
            
            return Response({
                'document_count': status_info['document_count'],
                'index_stats': status_info['index_stats'],
                'openai_available': status_info['openai_available'],
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Xay dung lai index cua co so kien thuc
        
        Request Body:
        {
            "use_db": false,  // Co tai du lieu xe tu database khong
            "include_cars": true,
            "include_policies": true,
            "include_faqs": true
        }
        """
        try:
            chat_service = get_chat_service()
            
            use_db = request.data.get('use_db', False)
            
            # Xay dung lai index
            doc_count = chat_service.rebuild_index(use_db=use_db)
            
            return Response({
                'success': True,
                'document_count': doc_count,
                'message': f'Index da duoc xay dung lai, tong so {doc_count} tai lieu',
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGHealthView(APIView):
    """
    Health Check API
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Thuc hien kiem tra suc khoe
        """
        try:
            chat_service = get_chat_service()
            health = chat_service.health_check()
            
            # Lay thong tin OpenAI client
            openai_client = get_openai_client()
            model_info = openai_client.get_model_info()
            
            return Response({
                **health,
                'model': model_info,
            })
            
        except Exception as e:
            return Response(
                {
                    'status': 'unhealthy',
                    'error': str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class RAGQuickRepliesView(APIView):
    """
    Quick Replies Suggestion API
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Lay goi y tra loi nhanh theo cau hoi
        
        Query Params:
        - q: Cau hoi nguoi dung
        """
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            chat_service = get_chat_service()
            quick_replies = chat_service.get_quick_replies(query)
            
            return Response({
                'query': query,
                'quick_replies': quick_replies,
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
