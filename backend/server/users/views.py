from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import os

User = get_user_model()

from users.models import Admin, NhanVien, KhachHang, NCC, UserProfile
from users.serializers import (
    AdminSerializer,
    NhanVienSerializer, KhachHangSerializer, NCCSerializer,
    RegisterSerializer, UserSerializer
)


# ==================== People ViewSets ====================

class NhanVienViewSet(viewsets.ModelViewSet):
    """ViewSet cho NhanVien"""
    queryset = NhanVien.objects.all()
    serializer_class = NhanVienSerializer
    permission_classes = [IsAdminUser]


class KhachHangViewSet(viewsets.ModelViewSet):
    """ViewSet cho KhachHang"""
    queryset = KhachHang.objects.all()
    serializer_class = KhachHangSerializer
    permission_classes = [IsAuthenticated]


class NCCViewSet(viewsets.ModelViewSet):
    """ViewSet cho NCC"""
    queryset = NCC.objects.all()
    serializer_class = NCCSerializer
    permission_classes = [IsAdminUser]


# ==================== Account ViewSets ====================

class AdminViewSet(viewsets.ModelViewSet):
    """ViewSet cho Admin"""
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminUser]


# ==================== Auth Views ====================

class RegisterAPIView(generics.CreateAPIView):
    """API đăng ký tài khoản mới"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def facebook_login(request):
    """API đăng nhập bằng Facebook OAuth - Verify Access Token và tạo JWT"""
    try:
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Token không được để trống."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Xử lý token: chuyển bytes string thành string nếu cần
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        elif isinstance(token, str) and token.startswith("b'"):
            token = token.strip("b'").strip("'")
        
        # Đảm bảo token là string
        if not isinstance(token, str):
            return Response(
                {"detail": "Token phải là string."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify Facebook token bằng cách gọi Graph API
        try:
            import requests
            
            # Lấy Facebook App ID và App Secret từ environment variables
            facebook_app_id = os.getenv("FACEBOOK_APP_ID")
            facebook_app_secret = os.getenv("FACEBOOK_APP_SECRET")
            
            if not facebook_app_id or not facebook_app_secret:
                return Response(
                    {"detail": "Facebook OAuth chưa được cấu hình. Vui lòng liên hệ admin."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Bước 1: Verify token và lấy user ID
            debug_url = f"https://graph.facebook.com/debug_token"
            debug_params = {
                "input_token": token,
                "access_token": f"{facebook_app_id}|{facebook_app_secret}"
            }
            
            debug_response = requests.get(debug_url, params=debug_params, timeout=10)
            
            if debug_response.status_code != 200:
                return Response(
                    {"detail": f"Token Facebook không hợp lệ. Lỗi: {debug_response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                debug_data = debug_response.json()
            except Exception as e:
                return Response(
                    {"detail": f"Không thể parse response từ Facebook. Lỗi: {str(e)}, Response: {debug_response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not debug_data.get("data", {}).get("is_valid"):
                error_message = debug_data.get("data", {}).get("error", {}).get("message", "Token không hợp lệ")
                return Response(
                    {"detail": f"Token Facebook không hợp lệ hoặc đã hết hạn. Chi tiết: {error_message}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_id = debug_data.get("data", {}).get("user_id")
            app_id = debug_data.get("data", {}).get("app_id")
            
            # Verify app_id khớp với FACEBOOK_APP_ID
            # Chuyển sang string để so sánh (app_id có thể là string hoặc int)
            if str(app_id) != str(facebook_app_id):
                return Response(
                    {"detail": f"Token Facebook không thuộc ứng dụng này. App ID: {app_id}, Expected: {facebook_app_id}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Bước 2: Lấy thông tin user từ Graph API
            # Lấy picture với type=large để có chất lượng tốt hơn
            userinfo_url = f"https://graph.facebook.com/v18.0/{user_id}"
            userinfo_params = {
                "fields": "id,name,email,picture.type(large)",
                "access_token": token
            }
            
            userinfo_response = requests.get(userinfo_url, params=userinfo_params, timeout=10)
            
            if userinfo_response.status_code != 200:
                return Response(
                    {"detail": f"Không thể lấy thông tin từ Facebook. Lỗi: {userinfo_response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            userinfo = userinfo_response.json()
            
            facebook_email = userinfo.get("email")
            facebook_name = userinfo.get("name", "")
            facebook_picture = userinfo.get("picture", {}).get("data", {}).get("url") if userinfo.get("picture") else None
            facebook_id = userinfo.get("id")

            # Nếu không có email (chỉ có public_profile), tạo email từ user_id
            if not facebook_email:
                # Tạo email giả từ Facebook ID để user có thể đăng nhập
                # Format: facebook_{user_id}@facebook.local
                facebook_email = f"facebook_{facebook_id}@facebook.local"

            # Tìm hoặc tạo user
            user = None
            try:
                # Tìm user theo email
                user = User.objects.get(email=facebook_email)
                # Cập nhật avatar URL nếu có
                profile, created = UserProfile.objects.get_or_create(user=user)
                if facebook_picture:
                    profile.avatar_url = facebook_picture
                    profile.save()
            except User.DoesNotExist:
                # Tạo user mới nếu chưa có
                base_username = facebook_email.split("@")[0]
                username = base_username
                counter = 1
                # Đảm bảo username không trùng
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                # Tách tên thành first_name và last_name
                name_parts = facebook_name.split(" ", 1) if facebook_name else ["", ""]
                first_name = name_parts[0] if len(name_parts) > 0 else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                # Tạo user mới với password random
                random_password = get_random_string(length=50)
                user = User.objects.create_user(
                    username=username,
                    email=facebook_email,
                    first_name=first_name,
                    last_name=last_name,
                    password=random_password
                )
                # Set unusable password để user không thể login bằng password thông thường
                user.set_unusable_password()
                user.save()

                # Tạo UserProfile và lưu Facebook avatar URL
                profile, created = UserProfile.objects.get_or_create(user=user)
                if facebook_picture:
                    profile.avatar_url = facebook_picture
                    profile.save()

            # Tạo JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Lấy thông tin user đầy đủ
            from users.serializers import UserSerializer
            user_serializer = UserSerializer(user, context={"request": request})

            return Response({
                "access": access_token,
                "refresh": refresh_token,
                "user": user_serializer.data
            }, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"Không thể kết nối với Facebook API: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Lỗi xác thực Facebook: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {"detail": f"Lỗi server: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """API đăng nhập bằng Google OAuth - Verify ID Token và tạo JWT"""
    try:
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Token không được để trống."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Xử lý token: chuyển bytes string thành string nếu cần
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        elif isinstance(token, str) and token.startswith("b'"):
            # Xử lý trường hợp token là string representation của bytes
            token = token.strip("b'").strip("'")
        
        # Đảm bảo token là string
        if not isinstance(token, str):
            return Response(
                {"detail": "Token phải là string."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra format: JWT có 3 segments, access token thường không có format này
        token_parts = token.split('.')
        is_jwt = len(token_parts) == 3

        # Verify Google token
        try:
            # Import google-auth chỉ khi cần thiết (lazy import)
            try:
                import google.auth.transport.requests
                import google.oauth2.id_token
            except ImportError:
                return Response(
                    {"detail": "Google OAuth chưa được cài đặt. Vui lòng cài đặt package: pip install google-auth"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Lấy Google Client ID từ environment variable
            google_client_id = os.getenv("GOOGLE_CLIENT_ID")
            if not google_client_id:
                return Response(
                    {"detail": "Google OAuth chưa được cấu hình. Vui lòng liên hệ admin."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Verify Google token
            request_obj = google.auth.transport.requests.Request()
            idinfo = None
            
            # Nếu token có format JWT (3 segments), thử verify như ID token
            if is_jwt:
                try:
                    idinfo = google.oauth2.id_token.verify_oauth2_token(
                        token, request_obj, google_client_id
                    )
                except ValueError as e:
                    # ID token không hợp lệ, thử như access token
                    is_jwt = False
            
            # Nếu không phải JWT hoặc verify ID token thất bại, xử lý như access token
            if not is_jwt or idinfo is None:
                import requests
                try:
                    userinfo_response = requests.get(
                        "https://www.googleapis.com/oauth2/v2/userinfo",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10
                    )
                    if userinfo_response.status_code == 200:
                        userinfo = userinfo_response.json()
                        # Tạo dict tương tự như idinfo để xử lý thống nhất
                        idinfo = {
                            "email": userinfo.get("email"),
                            "name": userinfo.get("name", ""),
                            "picture": userinfo.get("picture"),
                            "sub": userinfo.get("id")
                        }
                    else:
                        error_detail = userinfo_response.json().get("error", {}).get("message", "Unknown error")
                        raise ValueError(f"Google API error ({userinfo_response.status_code}): {error_detail}")
                except requests.exceptions.RequestException as e:
                    return Response(
                        {"detail": f"Không thể kết nối với Google API: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    return Response(
                        {"detail": f"Token Google không hợp lệ: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Lấy thông tin từ token (ID token hoặc từ UserInfo API)
            google_email = idinfo.get("email")
            google_name = idinfo.get("name", "")
            google_picture = idinfo.get("picture")  # URL trực tiếp từ Google
            google_sub = idinfo.get("sub")

            if not google_email:
                return Response(
                    {"detail": "Không thể lấy email từ Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Tìm hoặc tạo user
            user = None
            try:
                # Tìm user theo email
                user = User.objects.get(email=google_email)
                # Cập nhật avatar URL nếu có
                profile, created = UserProfile.objects.get_or_create(user=user)
                if google_picture:
                    profile.avatar_url = google_picture
                    profile.save()
            except User.DoesNotExist:
                # Tạo user mới nếu chưa có
                # Tạo username từ email (loại bỏ @ và domain)
                base_username = google_email.split("@")[0]
                username = base_username
                counter = 1
                # Đảm bảo username không trùng
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                # Tách tên thành first_name và last_name
                name_parts = google_name.split(" ", 1) if google_name else ["", ""]
                first_name = name_parts[0] if len(name_parts) > 0 else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                # Tạo user mới với password random (an toàn cho Google OAuth)
                # User không cần biết password, chỉ login bằng Google
                random_password = get_random_string(length=50)
                user = User.objects.create_user(
                    username=username,
                    email=google_email,
                    first_name=first_name,
                    last_name=last_name,
                    password=random_password
                )
                # Set unusable password để user không thể login bằng password thông thường
                user.set_unusable_password()
                user.save()

                # Tạo UserProfile nếu chưa có
                profile, created = UserProfile.objects.get_or_create(user=user)
                # Có thể lưu Google avatar URL vào profile nếu cần
                # (Cần thêm field google_avatar_url vào UserProfile model nếu muốn)

            # Tạo JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Lấy thông tin user đầy đủ
            from users.serializers import UserSerializer
            user_serializer = UserSerializer(user, context={"request": request})

            return Response({
                "access": access_token,
                "refresh": refresh_token,
                "user": user_serializer.data
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            # Token không hợp lệ
            return Response(
                {"detail": f"Token Google không hợp lệ: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Lỗi xác thực Google: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {"detail": f"Lỗi server: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_role(request):
    """Lấy role của user hiện tại"""
    user = request.user
    role = "user"
    if user.is_superuser:
        role = "admin"
    elif user.is_staff:
        role = "staff"
    return Response({"username": user.username, "role": role})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_me(request):
    """Lấy thông tin đầy đủ của user hiện tại bao gồm avatar"""
    from users.serializers import UserSerializer
    from users.models import UserProfile
    
    # Kiểm tra user đã authenticated chưa
    if not request.user or not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user = request.user
    # Đảm bảo UserProfile tồn tại
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Upload avatar mới cho user hiện tại"""
    from users.models import UserProfile
    from users.serializers import UserSerializer
    
    user = request.user
    
    # Đảm bảo UserProfile tồn tại
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Kiểm tra file có trong request không
    if "avatar" not in request.FILES:
        return Response(
            {"detail": "Không có file avatar trong request."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    avatar_file = request.FILES["avatar"]
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if avatar_file.content_type not in allowed_types:
        return Response(
            {"detail": "File phải là ảnh (JPEG, PNG, GIF, WebP)."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            {"detail": "File ảnh không được vượt quá 5MB."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Xóa avatar cũ nếu có
    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass
    
    # Lưu avatar mới
    profile.avatar = avatar_file
    profile.save()
    
    # Trả về thông tin user đã cập nhật
    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Lấy và cập nhật thông tin profile của user hiện tại"""
    user = request.user
    
    if request.method == "GET":
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Không cho phép user tự thay đổi role
            if 'is_staff' in request.data or 'is_superuser' in request.data:
                return Response(
                    {"detail": "Không được phép thay đổi vai trò."},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Đổi mật khẩu của user hiện tại"""
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")
    
    if not old_password or not new_password or not confirm_password:
        return Response(
            {"detail": "Vui lòng điền đầy đủ thông tin."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {"detail": "Mật khẩu cũ không đúng."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {"detail": "Mật khẩu mới và xác nhận mật khẩu không khớp."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {"detail": "Mật khẩu mới phải có ít nhất 8 ký tự."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({"detail": "Đổi mật khẩu thành công."})


@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Yêu cầu reset password - gửi email"""
    email = request.data.get("email")
    
    if not email:
        return Response(
            {"detail": "Email không được để trống."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Không tiết lộ email có tồn tại hay không (security best practice)
        return Response(
            {"detail": "Nếu email tồn tại, chúng tôi đã gửi link reset password."},
            status=status.HTTP_200_OK
        )
    
    # Tạo reset token
    from django.utils.crypto import get_random_string
    from django.utils import timezone
    from users.models import UserProfile
    
    profile, created = UserProfile.objects.get_or_create(user=user)
    reset_token = get_random_string(length=64)
    profile.email_verification_token = reset_token  # Tạm dùng field này cho reset token
    profile.email_verification_sent_at = timezone.now()
    profile.save()
    
    # Gửi email reset password
    try:
        from core.email_service import EmailService
        email_sent = EmailService.send_password_reset_email(user, reset_token)
        
        if not email_sent:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("Failed to send password reset email: EmailService returned False")
            return Response(
                {"detail": "Không thể gửi email. Vui lòng kiểm tra cấu hình email và thử lại sau."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email: {str(e)}", exc_info=True)
        return Response(
            {"detail": f"Không thể gửi email: {str(e)}. Vui lòng kiểm tra cấu hình email trong .env file."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(
        {"detail": "Nếu email tồn tại, chúng tôi đã gửi link reset password."},
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password với token"""
    token = request.data.get("token")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")
    
    if not token or not new_password or not confirm_password:
        return Response(
            {"detail": "Vui lòng điền đầy đủ thông tin."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {"detail": "Mật khẩu mới và xác nhận mật khẩu không khớp."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {"detail": "Mật khẩu mới phải có ít nhất 8 ký tự."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Tìm user với token
    from users.models import UserProfile
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        profile = UserProfile.objects.get(email_verification_token=token)
        
        # Kiểm tra token còn hiệu lực không (1 giờ)
        if profile.email_verification_sent_at:
            time_diff = timezone.now() - profile.email_verification_sent_at
            if time_diff > timedelta(hours=1):
                return Response(
                    {"detail": "Token đã hết hạn. Vui lòng yêu cầu reset lại."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Reset password
        user = profile.user
        user.set_password(new_password)
        user.save()
        
        # Xóa token
        profile.email_verification_token = ""
        profile.save()
        
        return Response({"detail": "Đặt lại mật khẩu thành công."})
        
    except UserProfile.DoesNotExist:
        return Response(
            {"detail": "Token không hợp lệ hoặc đã hết hạn."},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify email với token"""
    token = request.data.get("token")
    
    if not token:
        return Response(
            {"detail": "Token không được để trống."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from users.models import UserProfile
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        profile = UserProfile.objects.get(email_verification_token=token)
        
        # Kiểm tra token còn hiệu lực không (24 giờ)
        if profile.email_verification_sent_at:
            time_diff = timezone.now() - profile.email_verification_sent_at
            if time_diff > timedelta(hours=24):
                return Response(
                    {"detail": "Token đã hết hạn. Vui lòng đăng ký lại."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verify email
        profile.email_verified = True
        profile.email_verification_token = ""
        profile.save()
        
        return Response({"detail": "Email đã được xác thực thành công."})
        
    except UserProfile.DoesNotExist:
        return Response(
            {"detail": "Token không hợp lệ hoặc đã hết hạn."},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """Gửi lại email verification"""
    user = request.user
    
    if user.profile.email_verified:
        return Response(
            {"detail": "Email đã được xác thực rồi."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from django.utils.crypto import get_random_string
    from django.utils import timezone
    
    profile = user.profile
    verification_token = get_random_string(length=64)
    profile.email_verification_token = verification_token
    profile.email_verification_sent_at = timezone.now()
    profile.save()
    
    # Gửi email verification
    try:
        from core.email_service import EmailService
        EmailService.send_verification_email(user, verification_token)
        return Response({"detail": "Email xác thực đã được gửi lại."})
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send verification email: {str(e)}")
        return Response(
            {"detail": "Không thể gửi email. Vui lòng thử lại sau."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== User ViewSet ====================

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet để quản lý tất cả tài khoản User (CRUD - chỉ admin)
    """
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        """Tạo user mới với password"""
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        """Cập nhật user, bao gồm password nếu có"""
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
