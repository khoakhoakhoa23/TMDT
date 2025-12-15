from django.contrib.auth.models import User
from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from users.models import Admin, NhanVien, KhachHang, NCC
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
