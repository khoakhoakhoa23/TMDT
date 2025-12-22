"""
Email Service - Xử lý gửi email trong ứng dụng
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service class để gửi email"""
    
    @staticmethod
    def send_email(
        subject,
        message,
        recipient_list,
        html_message=None,
        from_email=None
    ):
        """
        Gửi email đơn giản
        
        Args:
            subject: Tiêu đề email
            message: Nội dung text
            recipient_list: Danh sách email nhận
            html_message: Nội dung HTML (optional)
            from_email: Email gửi (default: settings.DEFAULT_FROM_EMAIL)
        """
        try:
            from_email = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
            
            if html_message:
                # Gửi email với HTML
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=from_email,
                    to=recipient_list
                )
                email.attach_alternative(html_message, "text/html")
                email.send()
            else:
                # Gửi email text đơn giản
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=recipient_list,
                    fail_silently=False,
                )
            
            logger.info(f"Email sent successfully to {recipient_list}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def send_verification_email(user, verification_token):
        """
        Gửi email xác thực tài khoản
        
        Args:
            user: User object
            verification_token: Token để verify
        """
        verification_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/verify-email/{verification_token}/"
        
        subject = "Xác thực tài khoản - MORENT"
        
        # Render HTML template
        html_message = render_to_string('emails/verification.html', {
            'user': user,
            'verification_url': verification_url,
            'site_name': getattr(settings, 'SITE_NAME', 'MORENT'),
        })
        
        # Plain text version
        text_message = f"""
Xin chào {user.username},

Cảm ơn bạn đã đăng ký tài khoản tại MORENT!

Vui lòng click vào link sau để xác thực email của bạn:
{verification_url}

Link này sẽ hết hạn sau 24 giờ.

Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.

Trân trọng,
KHOA MORENT
        """
        
        return EmailService.send_email(
            subject=subject,
            message=text_message,
            recipient_list=[user.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_password_reset_email(user, reset_token):
        """
        Gửi email reset password
        
        Args:
            user: User object
            reset_token: Token để reset password
        """
        reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/reset-password/{reset_token}/"
        
        subject = "Đặt lại mật khẩu - MORENT"
        
        # Render HTML template
        html_message = render_to_string('emails/password_reset.html', {
            'user': user,
            'reset_url': reset_url,
            'site_name': getattr(settings, 'SITE_NAME', 'MORENT'),
        })
        
        # Plain text version
        text_message = f"""
Xin chào {user.username},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại MORENT.

Click vào link sau để đặt lại mật khẩu:
{reset_url}

Link này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ MORENT
        """
        
        return EmailService.send_email(
            subject=subject,
            message=text_message,
            recipient_list=[user.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_order_confirmation_email(order):
        """
        Gửi email xác nhận đơn hàng
        
        Args:
            order: Order object
        """
        user = order.user
        
        subject = f"Xác nhận đơn hàng #{order.id} - MORENT"
        
        # Render HTML template
        html_message = render_to_string('emails/order_confirmation.html', {
            'user': user,
            'order': order,
            'site_name': getattr(settings, 'SITE_NAME', 'MORENT'),
        })
        
        # Plain text version
        order_items = "\n".join([
            f"- {item.xe.ten_xe if item.xe else 'N/A'} x{item.quantity} - {item.price_at_purchase:,.0f} VNĐ"
            for item in order.items.all()
        ])
        
        text_message = f"""
Xin chào {user.username},

Cảm ơn bạn đã đặt hàng tại MORENT!

Thông tin đơn hàng:
- Mã đơn hàng: #{order.id}
- Ngày đặt: {order.created_at.strftime('%d/%m/%Y %H:%M')}
- Tổng tiền: {order.total_price:,.0f} VNĐ
- Trạng thái: {order.get_status_display()}

Chi tiết đơn hàng:
{order_items}

Bạn có thể xem chi tiết đơn hàng tại: {getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/dashboard/profile

Trân trọng,
Đội ngũ MORENT
        """
        
        return EmailService.send_email(
            subject=subject,
            message=text_message,
            recipient_list=[user.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_payment_success_email(order, payment):
        """
        Gửi email xác nhận thanh toán thành công
        
        Args:
            order: Order object
            payment: Payment object
        """
        user = order.user
        
        subject = f"Thanh toán thành công - Đơn hàng #{order.id} - MORENT"
        
        # Render HTML template
        html_message = render_to_string('emails/payment_success.html', {
            'user': user,
            'order': order,
            'payment': payment,
            'site_name': getattr(settings, 'SITE_NAME', 'MORENT'),
            'site_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        })
        
        # Plain text version
        text_message = f"""
Xin chào {user.username},

Thanh toán của bạn đã được xác nhận thành công!

Thông tin thanh toán:
- Mã đơn hàng: #{order.id}
- Số tiền: {payment.amount:,.0f} VNĐ
- Phương thức: {payment.get_payment_method_display()}
- Mã giao dịch: {payment.transaction_id or 'N/A'}
- Thời gian: {payment.paid_at.strftime('%d/%m/%Y %H:%M') if payment.paid_at else 'N/A'}

Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!

Trân trọng,
KHOA MORENT
        """
        
        return EmailService.send_email(
            subject=subject,
            message=text_message,
            recipient_list=[user.email],
            html_message=html_message
        )

