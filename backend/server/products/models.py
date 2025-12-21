from django.db import models
from django.contrib.auth.models import User


class Location(models.Model):
    """Địa điểm nhận/trả xe"""
    ten_dia_diem = models.CharField(max_length=255, unique=True, help_text="Tên địa điểm")
    dia_chi_chi_tiet = models.TextField(blank=True, help_text="Địa chỉ chi tiết")
    trang_thai = models.BooleanField(default=True, help_text="Đang hoạt động")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ten_dia_diem']
        verbose_name = "Địa điểm"
        verbose_name_plural = "Địa điểm"

    def __str__(self):
        return self.ten_dia_diem


class LoaiXe(models.Model):
    ma_loai = models.CharField(max_length=10, primary_key=True)
    ten_loai = models.CharField(max_length=255)

    def __str__(self):
        return self.ten_loai


class Xe(models.Model):
    ma_xe = models.CharField(max_length=10, primary_key=True)
    ten_xe = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    gia = models.IntegerField()
    gia_khuyen_mai = models.IntegerField(null=True, blank=True)
    gia_thue = models.IntegerField(default=0, help_text="Giá thuê mỗi ngày (VNĐ)")
    so_luong = models.IntegerField()
    mau_sac = models.CharField(max_length=50)
    loai_xe = models.ForeignKey(LoaiXe, on_delete=models.CASCADE)
    mo_ta_ngan = models.TextField(blank=True)
    mo_ta = models.TextField(blank=True)
    trang_thai = models.CharField(
        max_length=20,
        choices=[("in_stock", "Còn hàng"), ("out_of_stock", "Hết hàng")],
        default="in_stock",
    )
    image_url = models.URLField(max_length=500, blank=True)
    image = models.ImageField(upload_to="cars/", blank=True, null=True, help_text="Upload ảnh từ máy tính")
    # Thông tin kỹ thuật
    dung_tich_nhien_lieu = models.IntegerField(default=70, help_text="Dung tích nhiên liệu (L)")
    hop_so = models.CharField(
        max_length=20,
        choices=[("manual", "Số sàn"), ("automatic", "Số tự động")],
        default="manual",
        help_text="Loại hộp số"
    )
    so_cho = models.IntegerField(default=2, help_text="Số chỗ ngồi")
    loai_nhien_lieu = models.CharField(
        max_length=20,
        choices=[("gasoline", "Xăng"), ("electric", "Điện"), ("hybrid", "Hybrid")],
        default="gasoline",
        help_text="Loại nhiên liệu"
    )
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=500, blank=True)
    seo_keywords = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return self.ten_xe


class Review(models.Model):
    """Đánh giá và nhận xét của khách hàng về xe"""
    xe = models.ForeignKey("Xe", on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField(
        choices=[(1, "1 sao"), (2, "2 sao"), (3, "3 sao"), (4, "4 sao"), (5, "5 sao")],
        default=5,
        help_text="Đánh giá từ 1-5 sao"
    )
    comment = models.TextField(help_text="Nội dung đánh giá")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("xe", "user")  # Mỗi user chỉ đánh giá 1 lần cho 1 xe
        verbose_name = "Đánh giá"
        verbose_name_plural = "Đánh giá"

    def __str__(self):
        return f"{self.user.username} - {self.xe.ten_xe} ({self.rating} sao)"


class CarImage(models.Model):
    """Ảnh của xe - mỗi xe có thể có nhiều ảnh"""
    xe = models.ForeignKey("Xe", on_delete=models.CASCADE, related_name="car_images")
    image = models.ImageField(upload_to="cars/", help_text="Upload ảnh xe")
    image_url = models.URLField(max_length=500, blank=True, help_text="URL ảnh (nếu có)")
    is_primary = models.BooleanField(default=False, help_text="Ảnh chính")
    order = models.IntegerField(default=0, help_text="Thứ tự hiển thị")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_primary", "-order", "created_at"]
        verbose_name = "Ảnh xe"
        verbose_name_plural = "Ảnh xe"
        indexes = [
            models.Index(fields=["xe", "is_primary"]),
        ]

    def __str__(self):
        return f"{self.xe.ten_xe} - Image {self.id}"

    def save(self, *args, **kwargs):
        # Nếu set is_primary=True, bỏ primary của các ảnh khác
        if self.is_primary:
            CarImage.objects.filter(xe=self.xe, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    excerpt = models.CharField(max_length=500, blank=True)
    content = models.TextField()
    image_url = models.URLField(max_length=500, blank=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=500, blank=True)
    seo_keywords = models.CharField(max_length=500, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
