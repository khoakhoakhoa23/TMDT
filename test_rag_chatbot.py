#!/usr/bin/env python3
"""
Test RAG Chatbot - TMDT汽车租赁平台RAG聊天机器人测试
"""

import os
import sys
import json
import time

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'server'))

# Set Django settings before importing Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'server.settings'
os.environ['DJANGO_ALLOWED_HOSTS'] = 'localhost,127.0.0.1,testserver'
os.environ['DJANGO_DEBUG'] = 'True'

# 检查OpenAI API Key
if not os.environ.get('OPENAI_API_KEY'):
    print("=" * 60)
    print("WARNING: OPENAI_API_KEY not set!")
    print("Please set your OpenAI API key before running tests.")
    print("=" * 60)
    print("\nTo set the API key, run:")
    print("  export OPENAI_API_KEY='your-api-key'  (Linux/Mac)")
    print("  set OPENAI_API_KEY=your-api-key       (Windows)")
    print("\nOr create a .env file in the backend/server directory:")
    print("  OPENAI_API_KEY=your-api-key")
    print("=" * 60)


import django
django.setup()

from django.test import Client


def test_rag_chat_api():
    """测试RAG聊天API"""
    print("\n" + "=" * 60)
    print("Testing RAG Chat API")
    print("=" * 60)
    
    client = Client()
    
    # 1. Test RAG health check
    print("\n1. Testing RAG health check...")
    response = client.get('/api/chat/rag/health/')
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code == 200:
        data = response.json()
        print(f"   Status: {data.get('status', 'unknown')}")
        print(f"   OpenAI Available: {data.get('openai', 'unknown')}")
    else:
        print(f"   Warning: Health check returned {status_code}")
    
    # 2. Test RAG index status
    print("\n2. Testing RAG index status...")
    response = client.get('/api/chat/rag/index/')
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code == 200:
        data = response.json()
        print(f"   Document Count: {data.get('document_count', 0)}")
        stats = data.get('index_stats', {})
        print(f"   By Type: {stats.get('by_type', {})}")
    
    # 3. Test RAG index rebuild
    print("\n3. Testing RAG index rebuild...")
    response = client.post(
        '/api/chat/rag/index/',
        data=json.dumps({'use_db': False}),
        content_type='application/json'
    )
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code == 200:
        data = response.json()
        print(f"   Success: {data.get('success', False)}")
        print(f"   Documents: {data.get('document_count', 0)}")
    
    # 4. Test RAG search
    print("\n4. Testing RAG search...")
    response = client.get('/api/chat/rag/search/?q=Gi%C3%A1%20thu%C3%AA%20xe')
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code == 200:
        data = response.json()
        print(f"   Query: {data.get('query', '')}")
        print(f"   Total Found: {data.get('total_found', 0)}")
        results = data.get('results', [])
        print(f"   Results: {len(results)}")
        for r in results[:3]:
            print(f"     - {r.get('title', 'N/A')} (score: {r.get('score', 0):.2f})")
    
    # 5. Test RAG quick replies
    print("\n5. Testing RAG quick replies...")
    response = client.get('/api/chat/rag/quick-replies/?q=Gi%C3%A1%20thu%C3%AA%20xe%20Camry')
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code == 200:
        data = response.json()
        print(f"   Query: {data.get('query', '')}")
        print(f"   Quick Replies: {data.get('quick_replies', [])}")
    
    print("\n" + "=" * 60)
    print("RAG Chat API tests completed!")
    print("=" * 60)


def test_rag_chat_session():
    """测试完整的RAG聊天会话"""
    print("\n" + "=" * 60)
    print("Testing RAG Chat Session")
    print("=" * 60)
    
    client = Client()
    
    # 1. Create session
    print("\n1. Creating chat session...")
    response = client.post(
        '/api/chat/sessions/',
        data=json.dumps({'session_type': 'support'}),
        content_type='application/json'
    )
    status_code = response.status_code
    print(f"   Status: {status_code}")
    
    if status_code != 201:
        print("   Failed to create session!")
        return
    
    session_data = response.json()
    session_id = session_data['session_id']
    print(f"   Session ID: {session_id}")
    
    # 2. Test RAG chat
    print("\n2. Testing RAG chat...")
    test_questions = [
        "Toyota Camry giá bao nhiêu?",
        "Thuê xe cần những giấy tờ gì?",
        "Chính sách đặt cọc như thế nào?",
        "Có xe 7 chỗ nào không?",
        "Giá thuê Mercedes là bao nhiêu?",
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n   Question {i}: {question}")
        
        response = client.post(
            f'/api/chat/rag/chat/{session_id}/',
            data=json.dumps({
                'content': question,
                'use_rag': True
            }),
            content_type='application/json'
        )
        
        status_code = response.status_code
        print(f"   Status: {status_code}")
        
        if status_code == 200:
            data = response.json()
            answer = data.get('answer', '')[:200] + '...' if len(data.get('answer', '')) > 200 else data.get('answer', '')
            print(f"   Answer: {answer}")
            print(f"   Sources: {data.get('sources', [])}")
            print(f"   Quick Replies: {data.get('quick_replies', [])}")
        else:
            print(f"   Error: {response.json().get('error', 'Unknown error')}")
    
    print("\n" + "=" * 60)
    print("RAG Chat Session tests completed!")
    print("=" * 60)


def test_rag_models():
    """测试RAG数据模型"""
    print("\n" + "=" * 60)
    print("Testing RAG Models")
    print("=" * 60)
    
    # Test Document model
    print("\n1. Testing Document model...")
    from chat.rag.models import Document, DocumentType
    
    doc = Document(
        id="test_doc_1",
        doc_type=DocumentType.CAR,
        title="Toyota Camry",
        content="Toyota Camry 2024, giá bán 1.2 tỷ VNĐ",
        metadata={'gia': 1200000000}
    )
    
    print(f"   Document ID: {doc.id}")
    print(f"   Document Type: {doc.doc_type.value}")
    print(f"   Title: {doc.title}")
    
    # Test to_dict and from_dict
    doc_dict = doc.to_dict()
    print(f"   To Dict: {json.dumps(doc_dict, ensure_ascii=False, indent=2)}")
    
    doc2 = Document.from_dict(doc_dict)
    print(f"   From Dict - ID: {doc2.id}")
    print(f"   From Dict - Title: {doc2.title}")
    
    # Test CarInfo model
    print("\n2. Testing CarInfo model...")
    from chat.rag.models import CarInfo
    
    car = CarInfo(
        ma_xe="X001",
        ten_xe="Toyota Camry 2024",
        loai_xe="Sedan",
        gia_ban=1200000000,
        gia_thue_ngay=1500000,
        so_luong=5,
        mau_sac="Trắng, Đen",
        trang_thai="Còn hàng",
        mo_ta="Xe sedan hạng sang",
        hop_so="Số tự động",
        so_cho=5,
        loai_nhien_lieu="Xăng"
    )
    
    car_doc = car.to_document()
    print(f"   Car Document ID: {car_doc.id}")
    print(f"   Car Document Type: {car_doc.doc_type.value}")
    
    # Test PolicyInfo model
    print("\n3. Testing PolicyInfo model...")
    from chat.rag.models import PolicyInfo
    
    policy = PolicyInfo(
        policy_id="RENT_001",
        category="Đặt cọc",
        title="Chính sách đặt cọc",
        content="Đặt cọc 50% giá thuê",
        conditions=["Đặt cọc 50%", "Hoàn trả khi trả xe"]
    )
    
    policy_doc = policy.to_document()
    print(f"   Policy Document ID: {policy_doc.id}")
    print(f"   Policy Document Type: {policy_doc.doc_type.value}")
    
    # Test FAQItem model
    print("\n4. Testing FAQItem model...")
    from chat.rag.models import FAQItem
    
    faq = FAQItem(
        faq_id="FAQ_001",
        question="Thuê xe cần gì?",
        answer="Cần CMND và GPLX",
        category="Thuê xe",
        keywords=["thuê xe", "giấy tờ"]
    )
    
    faq_doc = faq.to_document()
    print(f"   FAQ Document ID: {faq_doc.id}")
    print(f"   FAQ Document Type: {faq_doc.doc_type.value}")
    
    print("\n" + "=" * 60)
    print("RAG Models tests completed!")
    print("=" * 60)


def test_retrieval_service():
    """测试检索服务"""
    print("\n" + "=" * 60)
    print("Testing Retrieval Service")
    print("=" * 60)
    
    try:
        from chat.rag.retrieval import RetrievalService, reset_retrieval_service
        
        # Reset to ensure clean state
        reset_retrieval_service()
        
        # Create service
        print("\n1. Creating retrieval service...")
        service = RetrievalService()
        
        # Check if index exists
        doc_count = service.get_document_count()
        print(f"   Initial document count: {doc_count}")
        
        # Get stats
        print("\n2. Getting index stats...")
        stats = service.get_index_stats()
        print(f"   Total documents: {stats['total_documents']}")
        print(f"   By type: {stats['by_type']}")
        
        print("\n" + "=" * 60)
        print("Retrieval Service tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n   Error: {e}")
        print("   (This is expected if OpenAI API key is not set)")


def test_prompt_builder():
    """测试Prompt构建器"""
    print("\n" + "=" * 60)
    print("Testing Prompt Builder")
    print("=" * 60)
    
    try:
        from chat.rag.prompt_builder import PromptBuilder, get_prompt_builder
        from chat.rag.models import Document, DocumentType
        
        # Create builder
        print("\n1. Creating prompt builder...")
        builder = get_prompt_builder()
        
        # Create test document
        doc = Document(
            id="test_doc",
            doc_type=DocumentType.CAR,
            title="Toyota Camry",
            content="Giá bán: 1.2 tỷ VNĐ, Giá thuê: 1.5 triệu/ngày",
            metadata={'gia': 1200000000}
        )
        
        # Test no context response
        print("\n2. Testing no context response...")
        no_context = builder.build_no_context_response()
        print(f"   Response: {no_context}")
        
        # Test quick replies
        print("\n3. Testing quick replies...")
        quick_replies = builder.get_quick_replies([doc])
        print(f"   Quick Replies: {quick_replies}")
        
        # Test should escalate
        print("\n4. Testing should_escalate...")
        should_escalate = builder.should_escalate_to_human(
            [doc],
            "Tôi muốn đặt xe ngay"
        )
        print(f"   Should Escalate: {should_escalate}")
        
        print("\n" + "=" * 60)
        print("Prompt Builder tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n   Error: {e}")


def test_knowledge_base():
    """测试知识库"""
    print("\n" + "=" * 60)
    print("Testing Knowledge Base")
    print("=" * 60)
    
    try:
        from chat.rag.knowledge_base import KnowledgeBase, get_knowledge_base
        
        # Create knowledge base
        print("\n1. Creating knowledge base...")
        kb = get_knowledge_base()
        
        # Get stats
        print("\n2. Getting knowledge base stats...")
        stats = kb.get_stats()
        print(f"   Total documents: {stats['total_documents']}")
        print(f"   By type: {stats.get('by_type', {})}")
        
        # Test search
        print("\n3. Testing search...")
        result = kb.search("giá thuê xe Toyota", top_k=3)
        print(f"   Query: giá thuê xe Toyota")
        print(f"   Results: {result.total_docs_found}")
        for doc in result.documents[:3]:
            print(f"     - {doc.title} (score: {result.scores[result.documents.index(doc)]:.2f})")
        
        print("\n" + "=" * 60)
        print("Knowledge Base tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n   Error: {e}")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("TMDT RAG Chatbot Tests")
    print("=" * 60)
    
    # Run all tests
    test_rag_models()
    test_retrieval_service()
    test_prompt_builder()
    test_knowledge_base()
    test_rag_chat_api()
    test_rag_chat_session()
    
    print("\n" + "=" * 60)
    print("All RAG Chatbot tests completed!")
    print("=" * 60)

