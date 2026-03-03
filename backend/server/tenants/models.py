from django.db import models
from django.utils.text import slugify


class Tenant(models.Model):
    """
    Multi-tenant root entity (e.g., a company/client in SaaS).
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    address = models.CharField(max_length=500, blank=True, help_text="Địa chỉ công ty")
    phone = models.CharField(max_length=20, blank=True, help_text="Số điện thoại")
    email = models.EmailField(blank=True, help_text="Email liên hệ")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:255] or "tenant"
        super().save(*args, **kwargs)

