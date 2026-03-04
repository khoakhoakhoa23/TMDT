import uuid
from django.db import models
from django.contrib.auth.models import User

from tenants.models import Tenant


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    TENANT_ADMIN = 'TENANT_ADMIN', 'Quản trị viên'
    EMPLOYEE = 'EMPLOYEE', 'Nhân viên'
    CUSTOMER = 'CUSTOMER', 'Khách hàng'


class UserStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Hoạt động'
    LOCKED = 'LOCKED', 'Bị khóa'


class Admin(models.Model):
    username = models.CharField(max_length=100, primary_key=True)
    password = models.CharField(max_length=255)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name="admins")

    def __str__(self):
        return self.username


class NhanVien(models.Model):
    ma_nv = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    dia_chi = models.CharField(max_length=255)
    gioi_tinh = models.CharField(max_length=10)
    ngay_sinh = models.DateField()
    chuc_vu = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name="nhan_viens")

    def __str__(self):
        return self.ten


class KhachHang(models.Model):
    ma_kh = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    dia_chi = models.CharField(max_length=255)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name="khach_hangs")

    def __str__(self):
        return self.ten


class NCC(models.Model):
    ma_ncc = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    dia_chi = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name="nha_cung_caps")

    def __str__(self):
        return self.ten


# ==================== User Profile Model ====================

class UserProfile(models.Model):
    """
    Model mở rộng thông tin User với role, tenant, và các trường bổ sung.
    Áp dụng mô hình RBAC với tenant isolation.
    
    QUY TẮC QUAN TRỌNG:
    - SUPER_ADMIN: tenant = NULL (không thuộc tenant nào)
    - TENANT_ADMIN, STAFF, CUSTOMER: tenant = NOT NULL (bắt buộc thuộc một tenant)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        help_text="Vai trò: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER",
    )
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,  # Cho phép null đối với SUPER_ADMIN
        blank=True,
        db_index=True,
        related_name="user_profiles",
        help_text="Tenant (công ty) mà user thuộc về. Null nếu là SUPER_ADMIN",
    )
    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE,
        help_text="Trạng thái tài khoản: ACTIVE, LOCKED",
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        help_text="Ảnh đại diện của người dùng (upload file)"
    )
    avatar_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Avatar URL từ OAuth provider (Facebook, Google, etc.)"
    )
    phone = models.CharField(max_length=20, blank=True, help_text="Số điện thoại")
    address = models.CharField(max_length=500, blank=True, help_text="Địa chỉ")
    date_of_birth = models.DateField(null=True, blank=True, help_text="Ngày sinh")
    gender = models.CharField(
        max_length=10,
        choices=[("male", "Nam"), ("female", "Nữ"), ("other", "Khác")],
        blank=True,
        help_text="Giới tính"
    )
    email_verified = models.BooleanField(default=False, help_text="Email đã được xác thực chưa")
    email_verification_token = models.CharField(max_length=100, blank=True, null=True, help_text="Token để verify email")
    email_verification_sent_at = models.DateTimeField(null=True, blank=True, help_text="Thời gian gửi email verification")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True, help_text="Soft delete timestamp")

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        constraints = [
            # Ràng buộc: NON_SUPER_ADMIN phải có tenant
            models.CheckConstraint(
                check=(
                    models.Q(role=UserRole.SUPER_ADMIN, tenant__isnull=True) |
                    models.Q(role__in=[UserRole.TENANT_ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER], tenant__isnull=False)
                ),
                name="non_super_admin_must_have_tenant"
            ),
        ]
        indexes = [
            models.Index(fields=['tenant', 'role'], name='idx_tenant_role'),
            models.Index(fields=['tenant', 'status'], name='idx_tenant_status'),
            models.Index(fields=['tenant', 'role', 'status'], name='idx_tenant_role_status'),
            models.Index(fields=['deleted_at'], name='idx_deleted_at'),
        ]

    def clean(self):
        """Validate model - đảm bảo role và tenant consistency"""
        from django.core.exceptions import ValidationError
        if self.role == UserRole.SUPER_ADMIN:
            # SUPER_ADMIN không thuộc tenant nào
            if self.tenant is not None:
                raise ValidationError("SUPER_ADMIN không được thuộc tenant nào")
        else:
            # Các role khác phải thuộc một tenant
            if self.tenant is None:
                raise ValidationError(f"User với role {self.role} phải thuộc một tenant")

    @property
    def is_active(self) -> bool:
        """Check if user account is active (synced with Django User.is_active)"""
        return self.user.is_active

    @property
    def is_superadmin(self) -> bool:
        """Check if user is SUPER_ADMIN"""
        return self.role == UserRole.SUPER_ADMIN or self.user.is_superuser

    @property
    def is_tenant_admin(self) -> bool:
        """Check if user is TENANT_ADMIN"""
        return self.role == UserRole.TENANT_ADMIN

    @property
    def is_staff_user(self) -> bool:
        """Check if user is STAFF"""
        return self.role == UserRole.EMPLOYEE

    @property
    def is_customer(self) -> bool:
        """Check if user is CUSTOMER"""
        return self.role == UserRole.CUSTOMER    @property
    def tenant_id(self) -> str:
        """Get tenant ID as string"""
        return str(self.tenant.id) if self.tenant else None