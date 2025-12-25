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

class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ("percentage", "Phần trăm"),
        ("fixed", "Số tiền cố định"),
    ]
    
    code = models.CharField(max_length=50, unique=True, help_text="Mã coupon")
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPE_CHOICES, default="percentage"
    )
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Giá trị giảm giá"
    )
    min_order_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Đơn hàng tối thiểu"
    )
    max_discount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, help_text="Giảm tối đa (cho percentage)"
    )
    valid_from = models.DateTimeField(help_text="Ngày bắt đầu hiệu lực")
    valid_to = models.DateTimeField(help_text="Ngày kết thúc hiệu lực")
    usage_limit = models.IntegerField(null=True, blank=True, help_text="Giới hạn số lần sử dụng")
    used_count = models.IntegerField(default=0, help_text="Số lần đã sử dụng")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.code} - {self.description}"
    
    def is_valid(self):
        """Kiểm tra coupon có hợp lệ không"""
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_to:
            return False
        if self.usage_limit and self.used_count >= self.usage_limit:
            return False
        return True
    
    def calculate_discount(self, order_total):
        """Tính số tiền được giảm"""
        from decimal import Decimal
        
        if self.discount_type == "percentage":
            discount = order_total * (self.discount_value / Decimal("100"))
            if self.max_discount:
                discount = min(discount, self.max_discount)
            return discount
        else:  # fixed
            return min(self.discount_value, order_total)


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
        ("reserved", "Đã giữ chỗ"),
        ("processing", "Đang xử lý"),
        ("paid", "Đã thanh toán"),
        ("shipped", "Đang giao"),
        ("completed", "Hoàn thành"),
        ("cancelled", "Đã hủy"),
        ("expired", "Hết hạn giữ chỗ"),
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
    start_time = models.TimeField(null=True, blank=True, help_text="Giờ bắt đầu thuê xe")
    end_time = models.TimeField(null=True, blank=True, help_text="Giờ kết thúc thuê xe")
    pickup_location = models.CharField(max_length=500, blank=True, help_text="Địa điểm nhận xe")
    return_location = models.CharField(max_length=500, blank=True, help_text="Địa điểm trả xe")
    rental_days = models.IntegerField(default=1, help_text="Số ngày thuê")
    rental_hours = models.IntegerField(default=0, help_text="Số giờ thuê (nếu < 1 ngày)")
    
    # Các trường tính toán giá
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Giá cơ bản (theo ngày/giờ)")
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Phí giao xe")
    pickup_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Phí nhận xe")
    additional_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Phụ phí khác")
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Số tiền được giảm (từ coupon)")
    late_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Phí trễ (nếu trả muộn)")
    
    # Coupon
    coupon_code = models.CharField(max_length=50, blank=True, help_text="Mã coupon đã sử dụng")
    coupon = models.ForeignKey("Coupon", on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    
    # Trả xe thực tế
    actual_return_date = models.DateField(null=True, blank=True, help_text="Ngày trả xe thực tế")
    actual_return_time = models.TimeField(null=True, blank=True, help_text="Giờ trả xe thực tế")
    
    # Giữ chỗ
    reserved_until = models.DateTimeField(null=True, blank=True, help_text="Thời hạn giữ chỗ (timeout)")

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.xe.ten_xe} x {self.quantity}"
