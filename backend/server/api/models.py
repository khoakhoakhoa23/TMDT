from django.db import models

# Create your models here.
class LoaiXe(models.Model):
    ma_loai = models.CharField(max_length=10, primary_key=True)
    ten_loai = models.CharField(max_length=255)

    def __str__(self):
        return self.ten_loai

class Xe(models.Model):
    ma_xe = models.CharField(max_length=10, primary_key=True)
    ten_xe = models.CharField(max_length=255)
    gia = models.IntegerField()
    so_luong = models.IntegerField()
    mau_sac = models.CharField(max_length=50)
    loai_xe = models.ForeignKey(LoaiXe, on_delete=models.CASCADE)

    def __str__(self):
        return self.ten_xe

class NhanVien(models.Model):
    ma_nv = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    dia_chi = models.CharField(max_length=255)
    gioi_tinh = models.CharField(max_length=10)
    ngay_sinh = models.DateField()
    chuc_vu = models.CharField(max_length=100)

    def __str__(self):
        return self.ten

class KhachHang(models.Model):
    ma_kh = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)
    dia_chi = models.CharField(max_length=255)

    def __str__(self):
        return self.ten

class NCC(models.Model):
    ma_ncc = models.CharField(max_length=10, primary_key=True)
    ten = models.CharField(max_length=255)
    dia_chi = models.CharField(max_length=255)
    sdt = models.CharField(max_length=20)

    def __str__(self):
        return self.ten

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


class BaoHanh(models.Model):
    ma_bh = models.CharField(max_length=10, primary_key=True)
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    ngay_bh = models.DateField()
    noi_dung = models.TextField()

    def __str__(self):
        return self.ma_bh

class Admin(models.Model):
    username = models.CharField(max_length=100, primary_key=True)
    password = models.CharField(max_length=255)


