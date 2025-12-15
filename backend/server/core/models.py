from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    """Model lưu thông báo cho người dùng"""
    
    TYPE_CHOICES = [
        ("rental_expiry", "Hết hạn thuê xe"),
        ("payment_success", "Thanh toán thành công"),
        ("order_status", "Cập nhật trạng thái đơn hàng"),
        ("system", "Thông báo hệ thống"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
        help_text="Đơn hàng liên quan (nếu có)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"
