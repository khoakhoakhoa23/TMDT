"""
Script test gửi email
Chạy: python test_email.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail
from core.email_service import EmailService
from django.contrib.auth.models import User

def test_simple_email():
    """Test gửi email đơn giản"""
    print("=" * 50)
    print("Test 1: Gửi email đơn giản")
    print("=" * 50)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    recipient = input("Nhập email nhận (hoặc Enter để skip): ").strip()
    if not recipient:
        print("Skip test gửi email đơn giản")
        return
    
    try:
        send_mail(
            'Test Email từ MORENT',
            'Đây là email test từ hệ thống MORENT. Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động!',
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        print(f"✅ Email đã được gửi đến {recipient}")
        print("Vui lòng kiểm tra hộp thư (có thể ở Spam)")
    except Exception as e:
        print(f"❌ Lỗi gửi email: {str(e)}")
        print("\nCó thể do:")
        print("1. EMAIL_BACKEND đang là console (chỉ in ra console)")
        print("2. Chưa cấu hình EMAIL_HOST_USER và EMAIL_HOST_PASSWORD trong .env")
        print("3. App Password Gmail sai hoặc chưa tạo")
        print("\nXem hướng dẫn trong EMAIL_SETUP_GUIDE.md")

def test_password_reset_email():
    """Test gửi email reset password"""
    print("\n" + "=" * 50)
    print("Test 2: Gửi email reset password")
    print("=" * 50)
    
    email = input("Nhập email của user (hoặc Enter để skip): ").strip()
    if not email:
        print("Skip test email reset password")
        return
    
    try:
        user = User.objects.get(email=email)
        print(f"Tìm thấy user: {user.username}")
        
        from django.utils.crypto import get_random_string
        reset_token = get_random_string(length=64)
        
        email_sent = EmailService.send_password_reset_email(user, reset_token)
        
        if email_sent:
            print(f"✅ Email reset password đã được gửi đến {email}")
            print(f"Token: {reset_token}")
            print("Vui lòng kiểm tra hộp thư (có thể ở Spam)")
        else:
            print("❌ EmailService trả về False - không gửi được email")
    except User.DoesNotExist:
        print(f"❌ Không tìm thấy user với email: {email}")
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("TEST EMAIL CONFIGURATION")
    print("=" * 50)
    print()
    
    test_simple_email()
    test_password_reset_email()
    
    print("\n" + "=" * 50)
    print("Hoàn thành test!")
    print("=" * 50)

