from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class ChatSession(models.Model):
    """Model phien chat"""
    SESSION_TYPES = (
        ('support', 'Hỗ trợ'),
        ('booking', 'Đặt xe'),
        ('inquiry', 'Tư vấn'),
        ('complaint', 'Khiếu nại'),
    )
    
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="chat_sessions",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='support')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Session {self.session_id} - {self.session_type}"
    
    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class ChatMessage(models.Model):
    """Model tin nhan chat"""
    MESSAGE_TYPES = (
        ('user', 'Người dùng'),
        ('bot', 'Bot'),
        ('system', 'Hệ thống'),
    )
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    quick_replies = models.JSONField(default=list, blank=True)  # Tuy chon tra loi nhanh
    metadata = models.JSONField(default=dict, blank=True)  # Du lieu bo sung
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:30]}..."

