from django.db import models
from users.models import NhanVien, KhachHang, NCC
from products.models import Xe


# ==================== Billing Models ====================

class HoaDonNhap(models.Model):
    ma_hdn = models.CharField(max_length=10, primary_key=True)
    ngay_nhap = models.DateField()
    nhan_vien = models.ForeignKey(NhanVien, on_delete=models.CASCADE)
    ncc = models.ForeignKey(NCC, on_delete=models.CASCADE)

    def __str__(self):
        return self.ma_hdn


class ChiTietHDN(models.Model):
    hoa_don = models.ForeignKey(HoaDonNhap, on_delete=models.CASCADE)
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    so_luong = models.IntegerField()
    don_gia = models.IntegerField()

    def __str__(self):
        return f"{self.hoa_don.ma_hdn} - {self.xe.ten_xe} x {self.so_luong}"


class HoaDonXuat(models.Model):
    ma_hdx = models.CharField(max_length=10, primary_key=True)
    ngay = models.DateField()
    nhan_vien = models.ForeignKey(NhanVien, on_delete=models.CASCADE)
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)

    def __str__(self):
        return self.ma_hdx


class ChiTietHDX(models.Model):
    hoa_don = models.ForeignKey(HoaDonXuat, on_delete=models.CASCADE)
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    so_luong = models.IntegerField()

    def __str__(self):
        return f"{self.hoa_don.ma_hdx} - {self.xe.ten_xe} x {self.so_luong}"


# ==================== Warranty Models ====================

class BaoHanh(models.Model):
    ma_bh = models.CharField(max_length=10, primary_key=True)
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    ngay_bh = models.DateField()
    noi_dung = models.TextField()

    def __str__(self):
        return self.ma_bh


# ==================== Commerce Models ====================

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
