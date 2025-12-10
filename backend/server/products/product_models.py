from django.db import models


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


