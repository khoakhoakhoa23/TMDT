from django.db import models
from django.contrib.auth.models import User


class Payment(models.Model):
    """Model lưu thông tin thanh toán"""
    PAYMENT_METHODS = [
        ("momo", "MoMo"),
        ("zalopay", "ZaloPay"),
        ("vnpay", "VNPay"),
        ("credit_card", "Thẻ tín dụng"),
        ("paypal", "PayPal"),
        ("bitcoin", "Bitcoin"),
    ]

    STATUS_CHOICES = [
        ("pending", "Chờ thanh toán"),
        ("processing", "Đang xử lý"),
        ("completed", "Thành công"),
        ("failed", "Thất bại"),
        ("cancelled", "Đã hủy"),
    ]

    order = models.ForeignKey("cart.Order", on_delete=models.CASCADE, related_name="payments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Số tiền thanh toán (VNĐ)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # Thông tin thanh toán
    transaction_id = models.CharField(max_length=255, blank=True, help_text="Mã giao dịch từ gateway")
    payment_url = models.URLField(max_length=500, blank=True, help_text="URL thanh toán (QR code)")
    qr_code = models.TextField(blank=True, help_text="QR code data (base64 hoặc URL)")
    
    # Thông tin callback
    callback_data = models.JSONField(default=dict, blank=True, help_text="Dữ liệu callback từ gateway")
    ipn_url = models.URLField(max_length=500, blank=True, help_text="IPN URL để nhận callback")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["transaction_id"]),
        ]

    def __str__(self):
        return f"Payment #{self.id} - {self.payment_method} - {self.amount} VNĐ"


