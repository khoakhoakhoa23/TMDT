from django.db import models

from .people import NhanVien, KhachHang, NCC
from .product import Xe


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

