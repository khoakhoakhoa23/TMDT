import uuid
from django.db import models
from django.utils.text import slugify


class TenantStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Hoạt động'
    INACTIVE = 'INACTIVE', 'Không hoạt động'
    LOCKED = 'LOCKED', 'Bị khóa'


class TenantTheme(models.TextChoices):
    DEFAULT = 'default', 'Mặc định'
    CAR_RENTAL = 'car-rental', 'Thuê xe'
    HOTEL = 'hotel', 'Khách sạn'
    ECOMMERCE = 'ecommerce', 'Thương mại điện tử'


class Tenant(models.Model):
    """
    Multi-tenant root entity (e.g., a company/client in SaaS).
    """

    # Giữ nguyên integer ID để tương thích với dữ liệu hiện tại
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, db_index=True, blank=True, default="", help_text="Mã tenant duy nhất")
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    address = models.CharField(max_length=500, blank=True, help_text="Địa chỉ công ty")
    phone = models.CharField(max_length=20, blank=True, help_text="Số điện thoại")
    email = models.EmailField(blank=True, help_text="Email liên hệ")
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=TenantStatus.choices,
        default=TenantStatus.ACTIVE
    )

    # Theme & Branding
    theme = models.CharField(
        max_length=50,
        choices=TenantTheme.choices,
        default=TenantTheme.DEFAULT,
        help_text="Giao diện website"
    )
    logo = models.URLField(blank=True, help_text="Logo công ty")
    primary_color = models.CharField(max_length=7, default="#3B82F6", help_text="Màu chủ đạo (hex)")
    banner_image = models.URLField(blank=True, help_text="Ảnh banner")
    description = models.TextField(blank=True, help_text="Mô tả công ty")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status', 'deleted_at']),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code or self.slug})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:255] or "tenant"
        if not self.code:
            self.code = slugify(self.name)[:50].upper() or "TENANT"
        super().save(*args, **kwargs)

