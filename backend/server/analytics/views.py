from django.db.models import Sum, Q
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from orders.models import Order, OrderItem, Coupon


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def coupon_analytics(request):
    """Analytics tổng quan về coupon usage"""
    total_coupons = Coupon.objects.count()
    active_coupons = Coupon.objects.filter(is_active=True).count()
    used_coupons = Coupon.objects.filter(used_count__gt=0).count()

    # Tổng discount đã áp dụng
    total_discount = Order.objects.filter(
        coupon__isnull=False,
        payment_status="paid"
    ).aggregate(total=Sum("discount_amount"))["total"] or 0

    # Top coupons được sử dụng nhiều nhất
    top_coupons = (
        Order.objects.filter(coupon__isnull=False, payment_status="paid")
        .values("coupon__code", "coupon__description")
        .annotate(
            usage_count=Sum(1),
            total_discount=Sum("discount_amount")
        )
        .order_by("-usage_count")[:5]
    )

    return Response({
        "total_coupons": total_coupons,
        "active_coupons": active_coupons,
        "used_coupons": used_coupons,
        "total_discount_applied": float(total_discount),
        "top_coupons": list(top_coupons)
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def coupon_usage_over_time(request):
    """Thống kê coupon usage theo thời gian (7 ngày gần nhất)"""
    from django.db.models.functions import TruncDate
    from datetime import timedelta

    end_date = now().date()
    start_date = end_date - timedelta(days=6)

    usage_data = (
        Order.objects.filter(
            coupon__isnull=False,
            payment_status="paid",
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(
            coupon_orders=Sum(1),
            total_discount=Sum("discount_amount")
        )
        .order_by("date")
    )

    # Điền các ngày không có data
    result = []
    current_date = start_date
    usage_dict = {item["date"]: item for item in usage_data}

    while current_date <= end_date:
        if current_date in usage_dict:
            result.append({
                "date": str(current_date),
                "coupon_orders": usage_dict[current_date]["coupon_orders"],
                "total_discount": float(usage_dict[current_date]["total_discount"])
            })
        else:
            result.append({
                "date": str(current_date),
                "coupon_orders": 0,
                "total_discount": 0
            })
        current_date += timedelta(days=1)

    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def coupon_performance(request):
    """Hiệu suất của từng coupon"""
    coupons = Coupon.objects.all().order_by("-used_count")

    coupon_data = []
    for coupon in coupons:
        # Tính conversion rate (tỷ lệ sử dụng)
        orders_with_coupon = Order.objects.filter(
            coupon=coupon,
            payment_status="paid"
        ).count()

        # Tính tổng discount
        total_discount = Order.objects.filter(
            coupon=coupon,
            payment_status="paid"
        ).aggregate(total=Sum("discount_amount"))["total"] or 0

        # Tính average order value khi dùng coupon
        avg_order_value = Order.objects.filter(
            coupon=coupon,
            payment_status="paid"
        ).aggregate(avg=Sum("base_price") / Sum(1))["avg"] or 0

        coupon_data.append({
            "code": coupon.code,
            "description": coupon.description,
            "used_count": coupon.used_count,
            "usage_limit": coupon.usage_limit,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "min_order_value": coupon.min_order_value,
            "is_active": coupon.is_active,
            "total_discount_applied": float(total_discount),
            "successful_orders": orders_with_coupon,
            "average_order_value": float(avg_order_value)
        })

    return Response(coupon_data)
