from rest_framework import serializers
from django.contrib.auth.models import User
from users.models import Admin, NhanVien, KhachHang, NCC, UserProfile


# ==================== Admin Serializers ====================

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = "__all__"


# ==================== People Serializers ====================

class NhanVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = NhanVien
        fields = "__all__"


class KhachHangSerializer(serializers.ModelSerializer):
    class Meta:
        model = KhachHang
        fields = "__all__"


class NCCSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCC
        fields = "__all__"


# ==================== Auth Serializers ====================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def create(self, validated_data):
        from django.utils.crypto import get_random_string
        from django.utils import timezone
        from users.models import UserProfile
        
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        
        # Tạo UserProfile và email verification token
        profile, created = UserProfile.objects.get_or_create(user=user)
        verification_token = get_random_string(length=64)
        profile.email_verification_token = verification_token
        profile.email_verification_sent_at = timezone.now()
        profile.save()
        
        # Gửi email verification
        try:
            from core.email_service import EmailService
            EmailService.send_verification_email(user, verification_token)
        except Exception as e:
            # Log error nhưng không fail registration
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send verification email: {str(e)}")
        
        return user


# ==================== User Profile Serializer ====================

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer cho UserProfile"""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["avatar", "avatar_url", "phone", "address", "date_of_birth", "gender"]
        read_only_fields = ["avatar_url"]

    def get_avatar_url(self, obj):
        """Trả về URL đầy đủ của avatar
        
        Logic ưu tiên:
        1. avatar_url (OAuth provider) - nếu có → dùng
        2. avatar (ImageField) - nếu có → dùng
        3. None - fallback
        """
        # Ưu tiên 1: Avatar URL từ OAuth provider
        if obj.avatar_url:
            return obj.avatar_url
        
        # Ưu tiên 2: Avatar từ file upload
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


# ==================== User Serializers ====================

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)
    avatar_url = serializers.SerializerMethodField()
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser", "is_active", "date_joined", "last_login", "role", "password", "avatar_url", "profile"]
        read_only_fields = ["id", "date_joined", "last_login", "avatar_url", "profile"]

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        elif obj.is_staff:
            return "staff"
        else:
            return "user"

    def get_avatar_url(self, obj):
        """Trả về URL đầy đủ của avatar từ profile
        
        Logic ưu tiên:
        1. avatar_url (OAuth provider: Facebook, Google, etc.) - nếu có → dùng
        2. avatar (ImageField - file upload) - nếu có → dùng
        3. None - fallback về avatar mặc định ở frontend
        """
        try:
            if hasattr(obj, "profile") and obj.profile:
                # Ưu tiên 1: Avatar URL từ OAuth provider
                if obj.profile.avatar_url:
                    return obj.profile.avatar_url
                
                # Ưu tiên 2: Avatar từ file upload
                if obj.profile.avatar:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.profile.avatar.url)
                    return obj.profile.avatar.url
        except Exception:
            pass
        return None

    def validate_username(self, value):
        """Kiểm tra username không trùng khi tạo mới"""
        if self.instance is None:  # Tạo mới
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError("Username đã tồn tại.")
        else:  # Cập nhật
            if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate_email(self, value):
        """Kiểm tra email không trùng khi tạo mới"""
        if value:
            if self.instance is None:  # Tạo mới
                if User.objects.filter(email=value).exists():
                    raise serializers.ValidationError("Email đã tồn tại.")
            else:  # Cập nhật
                if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def create(self, validated_data):
        """Tạo user mới"""
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Nếu không có password, set mật khẩu mặc định
            user.set_password('password123')
        user.save()
        return user

    def update(self, instance, validated_data):
        """Cập nhật user"""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
