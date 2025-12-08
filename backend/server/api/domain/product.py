from django.db import models


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
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=500, blank=True)
    seo_keywords = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return self.ten_xe


