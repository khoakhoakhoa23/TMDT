from django.db.models import Sum
from django.utils.timezone import now
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models import HoaDonXuat, ChiTietHDX


@api_view(["GET"])
def doanh_thu_hom_nay(request):
    today = now().date()

    tong_tien = 0
    for hd in HoaDonXuat.objects.filter(ngay=today):
        for ct in hd.chitiethdx_set.all():
            tong_tien += ct.so_luong * ct.xe.gia

    return Response({"ngay": str(today), "doanh_thu": tong_tien})


@api_view(["GET"])
def doanh_thu_thang(request, year, month):
    doanh_thu = 0
    for hd in HoaDonXuat.objects.filter(ngay__year=year, ngay__month=month):
        for ct in hd.chitiethdx_set.all():
            doanh_thu += ct.so_luong * ct.xe.gia
    return Response({"nam": year, "thang": month, "doanh_thu": doanh_thu})


@api_view(["GET"])
def tong_xe_da_ban(request):
    total = ChiTietHDX.objects.aggregate(total_sold=Sum("so_luong"))["total_sold"] or 0
    return Response({"tong_xe_da_ban": total})


@api_view(["GET"])
def top_xe_ban_chay(request):
    top = (
        ChiTietHDX.objects.values("xe__ten_xe")
        .annotate(total_sold=Sum("so_luong"))
        .order_by("-total_sold")[:5]
    )
    return Response(top)


