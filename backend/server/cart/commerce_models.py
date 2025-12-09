from django.db import models

from products.models import Xe


class Cart(models.Model):
    user = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="carts", null=True, blank=True
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        owner = self.user.username if self.user else f"guest:{self.session_key}"
        return f"Cart #{self.id} - {owner}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    class Meta:
        unique_together = ("cart", "xe")

    def __str__(self):
        return f"{self.xe.ten_xe} x {self.quantity}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Chờ xử lý"),
        ("processing", "Đang xử lý"),
        ("paid", "Đã thanh toán"),
        ("shipped", "Đang giao"),
        ("completed", "Hoàn thành"),
        ("cancelled", "Đã hủy"),
    ]

    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    note = models.CharField(max_length=500, blank=True)
    shipping_name = models.CharField(max_length=255, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)
    shipping_address = models.CharField(max_length=500, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[("unpaid", "Chưa thanh toán"), ("paid", "Đã thanh toán"), ("failed", "Thất bại")],
        default="unpaid",
    )
    # Các trường cho thuê xe
    start_date = models.DateField(null=True, blank=True, help_text="Ngày bắt đầu thuê xe")
    end_date = models.DateField(null=True, blank=True, help_text="Ngày kết thúc thuê xe")
    pickup_location = models.CharField(max_length=500, blank=True, help_text="Địa điểm nhận xe")
    return_location = models.CharField(max_length=500, blank=True, help_text="Địa điểm trả xe")
    rental_days = models.IntegerField(default=1, help_text="Số ngày thuê")

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.xe.ten_xe} x {self.quantity}"

