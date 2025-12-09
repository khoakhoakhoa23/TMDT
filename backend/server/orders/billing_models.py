from django.db import models

from users.models import NhanVien, KhachHang, NCC
from products.models import Xe


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

