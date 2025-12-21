from django.db import models
from django.contrib.auth.models import User


class Admin(models.Model):
    username = models.CharField(max_length=100, primary_key=True)
    password = models.CharField(max_length=255)

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

    def __str__(self):
        return self.ten


class KhachHang(models.Model):
    ma_kh = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    dia_chi = models.CharField(max_length=255)

    def __str__(self):
        return self.ten


class NCC(models.Model):
    ma_ncc = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    dia_chi = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)

    def __str__(self):
        return self.ten


# ==================== User Profile Model ====================

class UserProfile(models.Model):
    """Model mở rộng thông tin User với avatar"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        help_text="Ảnh đại diện của người dùng"
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
