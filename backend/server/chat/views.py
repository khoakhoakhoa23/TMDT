import json
import uuid
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer


class ChatSessionListCreateView(APIView):
    """Tao hoac lay danh sach phien chat"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Lay danh sach phien chat cua nguoi dung"""
        user = request.user
        if user.is_authenticated:
            sessions = ChatSession.objects.filter(user=user, is_active=True)
        else:
            # Nguoi dung anonynous su dung session_id
            session_id = request.query_params.get('session_id')
            if session_id:
                sessions = ChatSession.objects.filter(session_id=session_id)
            else:
                sessions = ChatSession.objects.none()
        
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Tao phien chat moi"""
        session_type = request.data.get('session_type', 'support')
        user = request.user if request.user.is_authenticated else None
        session_id = str(uuid.uuid4())
        
        session = ChatSession.objects.create(
            session_id=session_id,
            user=user,
            session_type=session_type,
            is_active=True
        )
        
        # Them loi chao mung
        welcome_messages = self._get_welcome_messages(session_type)
        for msg_data in welcome_messages:
            ChatMessage.objects.create(
                session=session,
                message_type='bot',
                content=msg_data['content'],
                quick_replies=msg_data.get('quick_replies', [])
            )
        
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _get_welcome_messages(self, session_type):
        """Lay loi chao mung theo loai phien chat"""
        welcome_data = {
            'support': [{
                'content': 'Xin chào! 👋 Tôi là trợ lý ảo của TMDT. Tôi có thể giúp bạn gì hôm nay?',
                'quick_replies': ['🚗 Tìm xe thuê', '💰 Báo giá', '📋 Đơn hàng', '❓ Hỏi đáp']
            }],
            'booking': [{
                'content': 'Chào bạn! Hãy để tôi giúp bạn tìm chiếc xe phù hợp nhất.',
                'quick_replies': ['🏠 Theo địa điểm', '📅 Theo ngày', '💵 Theo giá', '🚙 Loại xe']
            }],
            'inquiry': [{
                'content': 'Xin chào! Bạn đang quan tâm đến dịch vụ thuê xe của chúng tôi?',
                'quick_replies': ['📝 Điều khoản', '💳 Thanh toán', '🚨 Bảo hiểm', '📞 Liên hệ']
            }],
            'complaint': [{
                'content': 'Xin lỗi vì sự bất tiện này. Vui lòng cho tôi biết vấn đề bạn gặp phải.',
                'quick_replies': ['📦 Đơn hàng', '💰 Thanh toán', '🚗 Xe', '🏢 Khác']
            }]
        }
        return welcome_data.get(session_type, welcome_data['support'])


class ChatSessionDetailView(APIView):
    """Lay chi tiet phien chat"""
    permission_classes = [AllowAny]
    
    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)


class ChatMessageListCreateView(APIView):
    """Lay hoac tao tin nhan"""
    permission_classes = [AllowAny]
    
    def get(self, request, session_id):
        """Lay tin nhan cua phien chat"""
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        messages = session.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def post(self, request, session_id):
        """Gui tin nhan den phien chat"""
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Luu tin nhan nguoi dung
        user_message = ChatMessage.objects.create(
            session=session,
            message_type='user',
            content=content
        )
        
        # Lay tra loi tu bot
        bot_response = self._get_bot_response(session, content)
        #Hello
        # Luu tra loi cua bot
        bot_message = ChatMessage.objects.create(
            session=session,
            message_type='bot',
            content=bot_response['content'],
            quick_replies=bot_response.get('quick_replies', []),
            metadata=bot_response.get('metadata', {})
        )
        
        return Response({
            'user_message': ChatMessageSerializer(user_message).data,
            'bot_message': ChatMessageSerializer(bot_message).data
        }, status=status.HTTP_201_CREATED)
    
    def _get_bot_response(self, session, user_message):
        """Lay tra loi tu bot - rule engine"""
        message_lower = user_message.lower()
        
        # Loi chao
        greetings = ['xin chào', 'chào', 'hello', 'hi', 'hey', 'alo']
        if any(greet in message_lower for greet in greetings):
            return {
                'content': 'Xin chào! 👋 Rất vui được gặp bạn. Tôi có thể giúp gì cho bạn?',
                'quick_replies': ['🚗 Tìm xe thuê', '💰 Báo giá', '📋 Đơn hàng', '❓ Hỏi đáp']
            }
        
        # Ve thue xe
        if any(keyword in message_lower for keyword in ['thuê xe', 'cho thuê', 'rent', 'car rental']):
            return {
                'content': 'Chúng tôi có nhiều loại xe cho thuê từ các hãng như Toyota, Honda, BMW, Mercedes và nhiều hãng khác. Bạn muốn thuê xe loại nào?',
                'quick_replies': ['🚙 Sedan', '🚐 SUV', '🚘 Xe sang', '🚕 Xe 4 chỗ', '🚐 Xe 7 chỗ']
            }
        
        # Ve gia
        if any(keyword in message_lower for keyword in ['giá', 'price', 'chi phí', 'tiền', 'bao nhiêu']):
            return {
                'content': 'Giá thuê xe phụ thuộc vào loại xe và thời gian thuê. Ví dụ:\n\n• Xe 4 chỗ: từ 500.000 VNĐ/ngày\n• Xe 7 chỗ: từ 800.000 VNĐ/ngày\n• Xe sang: từ 1.500.000 VNĐ/ngày\n\nBạn muốn biết chi tiết hơn không?',
                'quick_replies': ['📅 Đặt xe ngay', '💵 So sánh giá', '🏷️ Khuyến mãi']
            }
        
        # Ve loai xe
        if any(keyword in message_lower for keyword in ['xe', 'car', 'ô tô', 'hãng', 'brand']):
            return {
                'content': 'Chúng tôi có các dòng xe:\n\n🏎️ **Sedan**: Toyota Camry, Honda Civic\n🚙 **SUV**: Toyota Fortuner, Ford Explorer\n🚘 **Sang trọng**: BMW 5 Series, Mercedes E-Class\n🚐 **MPV**: Toyota Innova, Kia Carnival\n\nBạn quan tâm đến dòng nào?',
                'quick_replies': ['🏎️ Sedan', '🚙 SUV', '🚘 Sang trọng', '📋 Xem tất cả']
            }
        
        # Ve dat xe
        if any(keyword in message_lower for keyword in ['đặt', 'đặt xe', 'booking', 'reserve', 'đặt cọc']):
            return {
                'content': 'Để đặt xe, bạn cần cung cấp thông tin:\n\n1. 📅 Ngày bắt đầu thuê\n2. 📅 Ngày kết thúc thuê  \n3. 📍 Địa điểm nhận xe\n4. 🚗 Loại xe mong muốn\n\nBạn có thể bắt đầu đặt xe ngay trên website hoặc tôi có thể hướng dẫn bạn!',
                'quick_replies': ['📝 Bắt đầu đặt', '📅 Xem lịch trống', '💰 Tính giá']
            }
        
        # Ve don hang
        if any(keyword in message_lower for keyword in ['đơn hàng', 'order', 'đơn', 'đã đặt']):
            return {
                'content': 'Bạn có thể xem đơn hàng của mình trong mục "Lịch sử thuê xe" trên website. Nếu cần hỗ trợ về đơn hàng, vui lòng cung cấp mã đơn hàng để tôi kiểm tra.',
                'quick_replies': ['📋 Xem đơn hàng', '📞 Liên hệ hỗ trợ', '❓ Câu hỏi khác']
            }
        
        # Ve lien he
        if any(keyword in message_lower for keyword in ['liên hệ', 'contact', 'số điện thoại', 'phone', 'email', 'địa chỉ']):
            return {
                'content': '📞 **Thông tin liên hệ TMDT:**\n\n• Hotline: 1900 xxxx\n• Email: support@tmtd.com\n• Địa chỉ: Quận 1, TP.HCM\n• Giờ làm việc: 8:00 - 20:00 (T2 - CN)\n\nBạn cần hỗ trợ gì thêm không?',
                'quick_replies': ['📞 Gọi ngay', '💬 Chat tiếp', '📋 Xem đơn hàng']
            }
        
        # Ve thanh toan
        if any(keyword in message_lower for keyword in ['thanh toán', 'payment', 'trả tiền', 'ví', 'momo', 'vnpay']):
            return {
                'content': 'Chúng tôi hỗ trợ nhiều phương thức thanh toán:\n\n💳 **Thẻ ngân hàng**: Visa, Mastercard, JCB\n📱 **Ví điện tử**: MoMo, ZaloPay, VNPay\n🏦 **Chuyển khoản**: ATM/Internet Banking\n💵 **Tiền mặt**: Khi nhận xe\n\nBạn muốn thanh toán bằng cách nào?',
                'quick_replies': ['💳 Thẻ ngân hàng', '📱 Ví điện tử', '🏦 Chuyển khoản']
            }
        
        # Ve huy dat / hoan tien
        if any(keyword in message_lower for keyword in ['hủy', 'huỷ', 'cancel', 'hoàn tiền', 'refund']):
            return {
                'content': '📋 **Chính sách hủy đặt xe:**\n\n• Hủy trước 48h: Hoàn 100%\n• Hủy trước 24h: Hoàn 50%\n• Hủy trong 24h: Không hoàn tiền\n\nLưu ý: Chính sách có thể thay đổi tùy theo từng xe. Bạn muốn hủy đơn hàng nào?',
                'quick_replies': ['📋 Hủy đơn', '📞 Liên hệ hỗ trợ', '❓ Chi tiết']
            }
        
        # Bao hiem
        if any(keyword in message_lower for keyword in ['bảo hiểm', 'insurance', 'an toàn', 'bảo vệ']):
            return {
                'content': '🛡️ **Bảo hiểm xe thuê:**\n\nTất cả xe đều có bảo hiểm bắt buôc và bảo hiểm vật chất. Bạn có thể thêm:\n\n• Bảo hiểm thuê xe toàn diện (CDW)\n• Bảo hiểm tài sản cá nhân\n• Bảo hiểm tai nạn\n\nBạn muốn tìm hiểu thêm về bảo hiểm nào?',
                'quick_replies': ['🛡️ Chi tiết bảo hiểm', '💰 Mua thêm bảo hiểm', '📋 Xem đơn']
            }
        
        # Cam on
        if any(keyword in message_lower for keyword in ['cảm ơn', 'thank', 'thanks', 'tks']):
            return {
                'content': 'Không có gì! 😊 Rất vui được hỗ trợ bạn. Nếu có câu hỏi khác, đừng ngần ngại hỏi nhé!',
                'quick_replies': ['🚗 Tìm xe', '📋 Đơn hàng', '❓ Hỏi khác']
            }
        
        # Tra loi mac dinh
        return {
            'content': 'Cảm ơn bạn đã nhắn tin! 🤔 Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể:\n\n• Hỏi về việc thuê xe\n• Tìm hiểu giá cả\n• Kiểm tra đơn hàng\n• Liên hệ hỗ trợ\n\nHoặc bạn có thể chọn một trong các mục dưới đây:',
            'quick_replies': ['🚗 Tìm xe thuê', '💰 Báo giá', '📋 Đơn hàng', '📞 Liên hệ']
        }


class ChatBotView(APIView):
    """Chatbot direct interface - khong can tao phien chat"""
    permission_classes = [AllowAny]
    
    def post(self, request, session_id):
        """Gui tin nhan va lay tra loi"""
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiem tra co su dung RAG mode khong
        use_rag = request.data.get('use_rag', True)  # Mac dinh bat RAG
        
        # Luu tin nhan nguoi dung
        user_message = ChatMessage.objects.create(
            session=session,
            message_type='user',
            content=content
        )
        
        # Lay tra loi tu bot
        if use_rag:
            # Su dung RAG chat
            bot_response = self._get_rag_response(session, content)
        else:
            # Su dung rule engine
            from .views import ChatMessageListCreateView
            view = ChatMessageListCreateView()
            bot_response = view._get_bot_response(session, content)
        
        # Luu tra loi cua bot
        bot_message = ChatMessage.objects.create(
            session=session,
            message_type='bot',
            content=bot_response['content'],
            quick_replies=bot_response.get('quick_replies', []),
            metadata=bot_response.get('metadata', {})
        )
        
        return Response({
            'user_message': ChatMessageSerializer(user_message).data,
            'bot_message': ChatMessageSerializer(bot_message).data,
        })
    
    def _get_rag_response(self, session, user_message):
        """
        Su dung RAG de lay tra loi
        
        Args:
            session: ChatSession object
            user_message: Tin nhan nguoi dung
            
        Returns:
            dict: Tuong chua content va quick_replies
        """
        try:
            from .rag import get_chat_service
            
            chat_service = get_chat_service()
            
            # Goi RAG service
            response = chat_service.chat(
                session_id=session.session_id,
                user_question=user_message,
            )
            
            # Lay quick replies
            quick_replies = chat_service.get_quick_replies(user_message)
            
            return {
                'content': response.answer,
                'quick_replies': quick_replies,
                'metadata': {
                    'uses_rag': True,
                    'requires_human': response.requires_human,
                    'sources': [s.id for s in response.sources],
                }
            }
            
        except Exception as e:
            # Neu RAG that bai, fallback ve rule engine
            print(f"RAG error: {e}")
            from .views import ChatMessageListCreateView
            view = ChatMessageListCreateView()
            return view._get_bot_response(session, user_message)


class QuickActionsView(APIView):
    """Quick actions interface"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Lay cac hanh dong nhanh co san"""
        actions = {
            'support': [
                {'id': 'find_car', 'icon': '🚗', 'title': 'Tìm xe thuê', 'description': 'Tìm xe phù hợp với nhu cầu'},
                {'id': 'pricing', 'icon': '💰', 'title': 'Báo giá', 'description': 'Xem bảng giá thuê xe'},
                {'id': 'orders', 'icon': '📋', 'title': 'Đơn hàng', 'description': 'Xem đơn hàng của bạn'},
                {'id': 'faq', 'icon': '❓', 'title': 'Hỏi đáp', 'description': 'Câu hỏi thường gặp'},
            ],
            'booking': [
                {'id': 'by_location', 'icon': '🏠', 'title': 'Theo địa điểm', 'description': 'Tìm xe theo vị trí'},
                {'id': 'by_date', 'icon': '📅', 'title': 'Theo ngày', 'description': 'Chọn ngày thuê xe'},
                {'id': 'by_price', 'icon': '💵', 'title': 'Theo giá', 'description': 'Chọn xe theo giá'},
                {'id': 'by_type', 'icon': '🚙', 'title': 'Loại xe', 'description': 'Chọn loại xe'},
            ],
        }
        
        return Response(actions)
