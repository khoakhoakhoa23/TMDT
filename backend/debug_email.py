"""
Script debug email - Kiểm tra và test gửi email
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.contrib.auth.models import User
from users.models import UserProfile

def check_email_config():
    """Kiểm tra cấu hình email"""
    print("=" * 60)
    print("KIỂM TRA CẤU HÌNH EMAIL")
    print("=" * 60)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(CHƯA CẤU HÌNH)'}")
    print(f"EMAIL_HOST_PASSWORD: {'***' if settings.EMAIL_HOST_PASSWORD else '(CHƯA CẤU HÌNH)'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'N/A')}")
    print()
    
    # Phân tích
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("⚠️  CẢNH BÁO: Email backend đang dùng CONSOLE!")
        print("   → Email chỉ in ra console, KHÔNG gửi thật đến Gmail")
        print("   → Cần đổi sang SMTP trong .env file")
        print()
    
    if not settings.EMAIL_HOST_USER:
        print("❌ EMAIL_HOST_USER chưa được cấu hình!")
        print("   → Cần thêm vào .env: EMAIL_HOST_USER=your-email@gmail.com")
        print()
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("❌ EMAIL_HOST_PASSWORD chưa được cấu hình!")
        print("   → Cần thêm vào .env: EMAIL_HOST_PASSWORD=your-app-password")
        print()
    
    if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
        print("✅ Cấu hình email cơ bản đã có")
        print()

def test_send_email():
    """Test gửi email đơn giản"""
    print("=" * 60)
    print("TEST GỬI EMAIL")
    print("=" * 60)
    
    recipient = "tanhkhoa06@gmail.com"
    print(f"Gửi email đến: {recipient}")
    print()
    
    try:
        send_mail(
            subject='Test Email từ MORENT',
            message='Đây là email test từ hệ thống MORENT. Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("✅ Email đã được gửi!")
        print(f"   → Kiểm tra hộp thư: {recipient}")
        print("   → Có thể ở thư mục Spam")
    except Exception as e:
        print(f"❌ LỖI GỬI EMAIL: {str(e)}")
        print()
        print("Nguyên nhân có thể:")
        print("1. EMAIL_BACKEND đang là console (chỉ in ra console)")
        print("2. Chưa cấu hình EMAIL_HOST_USER và EMAIL_HOST_PASSWORD")
        print("3. App Password Gmail sai")
        print("4. Network/Firewall chặn")
        print()
        import traceback
        traceback.print_exc()

def test_password_reset_email():
    """Test gửi email reset password"""
    print("\n" + "=" * 60)
    print("TEST EMAIL RESET PASSWORD")
    print("=" * 60)
    
    email = "tanhkhoa06@gmail.com"
    print(f"Tìm user với email: {email}")
    
    try:
        user = User.objects.get(email=email)
        print(f"✅ Tìm thấy user: {user.username} (ID: {user.id})")
        
        # Lấy hoặc tạo profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        print(f"   Profile: {'Tạo mới' if created else 'Đã có'}")
        
        # Tạo token
        from django.utils.crypto import get_random_string
        from django.utils import timezone
        reset_token = get_random_string(length=64)
        profile.email_verification_token = reset_token
        profile.email_verification_sent_at = timezone.now()
        profile.save()
        print(f"   Token: {reset_token[:20]}...")
        
        # Gửi email
        from core.email_service import EmailService
        print("\nĐang gửi email reset password...")
        email_sent = EmailService.send_password_reset_email(user, reset_token)
        
        if email_sent:
            print("✅ Email reset password đã được gửi!")
            print(f"   → Kiểm tra hộp thư: {email}")
            print(f"   → Link reset: http://localhost:5173/reset-password/{reset_token}/")
        else:
            print("❌ EmailService trả về False - không gửi được email")
            
    except User.DoesNotExist:
        print(f"❌ Không tìm thấy user với email: {email}")
        print("   → Cần đăng ký user với email này trước")
    except Exception as e:
        print(f"❌ LỖI: {str(e)}")
        import traceback
        traceback.print_exc()

def check_recent_password_resets():
    """Kiểm tra các password reset gần đây"""
    print("\n" + "=" * 60)
    print("KIỂM TRA PASSWORD RESET GẦN ĐÂY")
    print("=" * 60)
    
    email = "tanhkhoa06@gmail.com"
    try:
        user = User.objects.get(email=email)
        profile = UserProfile.objects.get(user=user)
        
        if profile.email_verification_token:
            print(f"✅ Có token reset password:")
            print(f"   Token: {profile.email_verification_token}")
            print(f"   Gửi lúc: {profile.email_verification_sent_at}")
            print(f"   Link: http://localhost:5173/reset-password/{profile.email_verification_token}/")
        else:
            print("❌ Không có token reset password")
    except User.DoesNotExist:
        print(f"❌ Không tìm thấy user: {email}")
    except UserProfile.DoesNotExist:
        print(f"❌ Không tìm thấy profile cho user: {email}")

if __name__ == "__main__":
    check_email_config()
    print()
    
    # Test gửi email
    test_send_email()
    print()
    
    # Test password reset email
    test_password_reset_email()
    print()
    
    # Check recent resets
    check_recent_password_resets()
    
    print("\n" + "=" * 60)
    print("HOÀN THÀNH DEBUG")
    print("=" * 60)
    print("\nNếu email không được gửi:")
    print("1. Kiểm tra .env file có cấu hình EMAIL_HOST_USER và EMAIL_HOST_PASSWORD")
    print("2. Đảm bảo EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
    print("3. Kiểm tra App Password Gmail đúng chưa")
    print("4. Xem hướng dẫn trong EMAIL_SETUP_GUIDE.md")

