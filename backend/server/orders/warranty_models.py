from django.db import models

from users.models import KhachHang
from products.models import Xe


class BaoHanh(models.Model):
    ma_bh = models.CharField(max_length=10, primary_key=True)
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)
    xe = models.ForeignKey(Xe, on_delete=models.CASCADE)
    ngay_bh = models.DateField()
    noi_dung = models.TextField()

    def __str__(self):
        return self.ma_bh

