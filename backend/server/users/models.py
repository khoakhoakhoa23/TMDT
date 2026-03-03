from django.db import models
from django.contrib.auth.models import User

from tenants.models import Tenant


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
    """Model mở rộng thông tin User với avatar"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(
        max_length=20,
        choices=[
            ("tenant_admin", "Tenant Admin"),
            ("user", "User"),
        ],
        default="user",
        help_text="Role trong tenant (Super Admin dùng is_superuser)",
    )
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="user_profiles",
        help_text="Tenant (công ty) mà user thuộc về",
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

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
