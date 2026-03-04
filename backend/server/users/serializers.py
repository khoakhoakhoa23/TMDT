from rest_framework import serializers
from django.contrib.auth.models import User
from users.models import Admin, NhanVien, KhachHang, NCC, UserProfile, UserRole, UserStatus
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# ==================== JWT Token Serializer ====================

class TokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer - thêm thông tin tenant vào token.
    
    QUY TẮC QUAN TRỌNG:
    - tenantId trong JWT là nguồn xác thực CHÍNH
    - KHÔNG BAO GIỜ tin tenantId từ URL
    - Luôn sử dụng tenantId từ JWT để query và authorize
    
    JWT Payload Example:
    {
        "userId": "123",
        "role": "TENANT_ADMIN",
        "tenantId": "uuid-of-tenant",
        "tenantCode": "ACME",
        "tenantName": "Acme Corporation",
        "status": "ACTIVE"
    }
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Lấy profile để lấy role và tenant
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = None
        
        # User ID
        token['userId'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        
        # Role - ưu tiên từ profile, fallback theo Django user type
        if user.is_superuser:
            token['role'] = UserRole.SUPER_ADMIN
        elif profile:
            token['role'] = profile.role
        else:
            token['role'] = UserRole.CUSTOMER
        
        # Tenant Information - QUAN TRỌNG nhất
        if profile:
            if profile.tenant_id:
                # Non-SUPER_ADMIN: có tenant
                token['tenantId'] = str(profile.tenant_id)
                token['tenantCode'] = profile.tenant.code if profile.tenant else None
                token['tenantName'] = profile.tenant.name if profile.tenant else None
            else:
                # SUPER_ADMIN: không có tenant
                token['tenantId'] = None
        
        # Status
        if profile:
            token['status'] = profile.status
        else:
            token['status'] = UserStatus.ACTIVE if user.is_active else UserStatus.LOCKED
        
        return token


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
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id", "role", "role_display", "tenant", "status", "status_display",
            "avatar", "avatar_url", "phone", "address", "date_of_birth", "gender",
            "email_verified", "created_at", "updated_at", "deleted_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "avatar_url"]

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
    role_display = serializers.SerializerMethodField()
    tenant = serializers.SerializerMethodField()
    tenant_id = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)
    avatar_url = serializers.SerializerMethodField()
    profile = UserProfileSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", 
            "is_staff", "is_superuser", "is_active", "status",
            "date_joined", "last_login", "role", "role_display", 
            "tenant", "tenant_id", "password", "avatar_url", "profile"
        ]
        read_only_fields = ["id", "date_joined", "last_login", "avatar_url", "profile"]

    def get_role(self, obj):
        """Lấy role từ UserProfile"""
        profile = getattr(obj, 'profile', None)
        if not profile:
            # Fallback: kiểm tra is_superuser
            if obj.is_superuser:
                return UserRole.SUPER_ADMIN
            return None
        
        if obj.is_superuser:
            return UserRole.SUPER_ADMIN
        return profile.role

    def get_role_display(self, obj):
        """Lấy display name của role"""
        role = self.get_role(obj)
        if role:
            return dict(UserRole.choices).get(role, role)
        return None

    def get_status(self, obj):
        """Lấy status từ UserProfile"""
        profile = getattr(obj, 'profile', None)
        if not profile:
            return UserStatus.ACTIVE if obj.is_active else UserStatus.LOCKED
        return profile.status

    def get_tenant(self, obj):
        """Lấy thông tin tenant"""
        try:
            profile = getattr(obj, 'profile', None)
            if profile and profile.tenant:
                t = profile.tenant
                return {
                    "id": str(t.id), 
                    "name": t.name, 
                    "code": t.code,
                    "slug": t.slug
                }
        except Exception:
            pass
        return None

    def get_tenant_id(self, obj):
        """Lấy tenant ID dạng string"""
        try:
            profile = getattr(obj, 'profile', None)
            if profile and profile.tenant_id:
                return str(profile.tenant_id)
        except Exception:
            pass
        return None

    def get_avatar_url(self, obj):
        """Trả về URL đầy đủ của avatar từ profile
        
        Logic ưu tiên:
        1. avatar_url (OAuth provider: Facebook, Google, etc.) - nếu có → dùng
        2. avatar (ImageField - file upload) - nếu có → dùng
        3. None - fallback về avatar mặc định ở frontend
        """
        try:
            profile = getattr(obj, 'profile', None)
            if profile:
                # Ưu tiên 1: Avatar URL từ OAuth provider
                if profile.avatar_url:
                    return profile.avatar_url
                
                # Ưu tiên 2: Avatar từ file upload
                if profile.avatar:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(profile.avatar.url)
                    return profile.avatar.url
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


# ==================== Admin User Serializer ====================

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer cho admin API - chỉ dùng trong /admin/tenants/:tenantId/users/
    Đã được filter sẵn theo tenant
    """
    role = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    tenant = serializers.SerializerMethodField()
    tenant_id = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)
    avatar_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", 
            "is_staff", "is_superuser", "is_active", "status", "status_display",
            "date_joined", "last_login", "role", "role_display", 
            "tenant", "tenant_id", "password", "avatar_url"
        ]
        read_only_fields = ["id", "date_joined", "last_login", "avatar_url", "is_superuser"]

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        if not profile:
            if obj.is_superuser:
                return UserRole.SUPER_ADMIN
            return None
        
        if obj.is_superuser:
            return UserRole.SUPER_ADMIN
        return profile.role

    def get_role_display(self, obj):
        role = self.get_role(obj)
        if role:
            return dict(UserRole.choices).get(role, role)
        return None

    def get_status(self, obj):
        profile = getattr(obj, 'profile', None)
        if not profile:
            return UserStatus.ACTIVE if obj.is_active else UserStatus.LOCKED
        return profile.status

    def get_status_display(self, obj):
        status = self.get_status(obj)
        if status:
            return dict(UserStatus.choices).get(status, status)
        return None

    def get_tenant(self, obj):
        try:
            profile = getattr(obj, 'profile', None)
            if profile and profile.tenant:
                t = profile.tenant
                return {"id": str(t.id), "name": t.name, "code": t.code, "slug": t.slug}
        except Exception:
            pass
        return None

    def get_tenant_id(self, obj):
        try:
            profile = getattr(obj, 'profile', None)
            if profile and profile.tenant_id:
                return str(profile.tenant_id)
        except Exception:
            pass
        return None

    def get_avatar_url(self, obj):
        try:
            profile = getattr(obj, 'profile', None)
            if profile:
                if profile.avatar_url:
                    return profile.avatar_url
                if profile.avatar:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(profile.avatar.url)
                    return profile.avatar.url
        except Exception:
            pass
        return None
