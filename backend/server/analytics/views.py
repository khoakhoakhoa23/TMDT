from django.db.models import Sum, Q
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from orders.models import Order, OrderItem


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def doanh_thu_hom_nay(request):
    """Tính doanh thu hôm nay"""
    today = now().date()

    # Tính doanh thu từ các đơn hàng đã thanh toán hôm nay
    orders_today = Order.objects.filter(
        created_at__date=today,
        payment_status="paid"
    )
    
    tong_tien = sum(order.total_price for order in orders_today)

    return Response({"ngay": str(today), "doanh_thu": float(tong_tien)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def doanh_thu_thang(request, year, month):
    """Tính doanh thu trong tháng"""
    # Tính doanh thu từ các đơn hàng đã thanh toán trong tháng
    orders_month = Order.objects.filter(
        created_at__year=year,
        created_at__month=month,
        payment_status="paid"
    )
    
    doanh_thu = sum(order.total_price for order in orders_month)
    return Response({"nam": year, "thang": month, "doanh_thu": float(doanh_thu)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tong_xe_da_ban(request):
    """Tính tổng số xe đã bán"""
    # Tính tổng số xe đã bán từ các đơn hàng đã thanh toán
    total = OrderItem.objects.filter(
        order__payment_status="paid"
    ).aggregate(total_sold=Sum("quantity"))["total_sold"] or 0
    return Response({"tong_xe_da_ban": total})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_xe_ban_chay(request):
    """Lấy top 5 xe bán chạy"""
    # Lấy top 5 xe bán chạy từ các đơn hàng đã thanh toán
    top = (
        OrderItem.objects.filter(order__payment_status="paid")
        .values("xe__ten_xe")
        .annotate(total_sold=Sum("quantity"))
        .order_by("-total_sold")[:5]
    )
    return Response(list(top))
