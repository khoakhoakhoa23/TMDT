"""
Utilities cho orders: kiểm tra xung đột, tính tiền, etc.
"""
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta, datetime, date, time
from decimal import Decimal
from orders.models import Order, OrderItem
from products.models import Xe
import requests
import logging

logger = logging.getLogger(__name__)


def check_schedule_conflict(xe_id, start_date, end_date, start_time=None, end_time=None, exclude_order_id=None):
    """
    Kiểm tra xung đột lịch đặt xe
    
    Args:
        xe_id: ID của xe
        start_date: Ngày bắt đầu
        end_date: Ngày kết thúc
        start_time: Giờ bắt đầu (optional)
        end_time: Giờ kết thúc (optional)
        exclude_order_id: ID order cần loại trừ (khi update)
    
    Returns:
        (has_conflict: bool, conflicting_orders: list)
    """
    # Chuyển đổi date và time thành datetime để so sánh chính xác
    if start_time:
        start_datetime = datetime.combine(start_date, start_time)
    else:
        start_datetime = datetime.combine(start_date, time.min)
    
    if end_time:
        end_datetime = datetime.combine(end_date, end_time)
    else:
        end_datetime = datetime.combine(end_date, time.max)
    
    # Lấy tất cả orders của xe này có xung đột
    # Xung đột xảy ra khi:
    # 1. Order khác bắt đầu trong khoảng thời gian của order này
    # 2. Order khác kết thúc trong khoảng thời gian của order này
    # 3. Order khác bao trùm toàn bộ khoảng thời gian của order này
    
    conflicting_orders = Order.objects.filter(
        items__xe_id=xe_id
    ).exclude(
        status__in=["cancelled", "expired"]
    ).exclude(
        payment_status="failed"
    ).filter(
        Q(start_date__lte=end_date, end_date__gte=start_date)
    )
    
    # Loại trừ order hiện tại nếu đang update
    if exclude_order_id:
        conflicting_orders = conflicting_orders.exclude(id=exclude_order_id)
    
    # Kiểm tra chi tiết hơn với thời gian
    final_conflicts = []
    for order in conflicting_orders:
        order_start = datetime.combine(order.start_date, order.start_time or time.min)
        order_end = datetime.combine(order.end_date, order.end_time or time.max)
        
        # Kiểm tra overlap
        if not (end_datetime <= order_start or start_datetime >= order_end):
            final_conflicts.append(order)
    
    return len(final_conflicts) > 0, final_conflicts


def _calculate_distance_km(address1, address2):
    """
    Tính khoảng cách (km) giữa 2 địa chỉ sử dụng OpenRouteService API
    
    Args:
        address1: Địa chỉ điểm 1
        address2: Địa chỉ điểm 2
    
    Returns:
        float: Khoảng cách tính bằng km, hoặc None nếu lỗi
    """
    if not address1 or not address2:
        return None
    
    try:
        # Geocode địa chỉ 1
        geocode_url1 = f"https://api.openrouteservice.org/v2/geocoding/search"
        params1 = {
            "api_key": "",  # OpenRouteService miễn phí không cần key
            "text": address1,
            "boundary.country": "VN"
        }
        response1 = requests.get(geocode_url1, params=params1, timeout=5)
        
        if response1.status_code != 200:
            logger.warning(f"Geocoding failed for {address1}: {response1.status_code}")
            return None
        
        data1 = response1.json()
        if not data1.get("features") or len(data1["features"]) == 0:
            logger.warning(f"No geocoding results for {address1}")
            return None
        
        coords1 = data1["features"][0]["geometry"]["coordinates"]  # [lng, lat]
        
        # Geocode địa chỉ 2
        params2 = {
            "api_key": "",
            "text": address2,
            "boundary.country": "VN"
        }
        response2 = requests.get(geocode_url1, params=params2, timeout=5)
        
        if response2.status_code != 200:
            logger.warning(f"Geocoding failed for {address2}: {response2.status_code}")
            return None
        
        data2 = response2.json()
        if not data2.get("features") or len(data2["features"]) == 0:
            logger.warning(f"No geocoding results for {address2}")
            return None
        
        coords2 = data2["features"][0]["geometry"]["coordinates"]  # [lng, lat]
        
        # Tính khoảng cách
        directions_url = "https://api.openrouteservice.org/v2/directions/driving-car"
        directions_params = {
            "api_key": "",
            "coordinates": f"{coords1[0]},{coords1[1]}|{coords2[0]},{coords2[1]}"
        }
        directions_response = requests.get(directions_url, params=directions_params, timeout=5)
        
        if directions_response.status_code != 200:
            logger.warning(f"Directions API failed: {directions_response.status_code}")
            return None
        
        directions_data = directions_response.json()
        if directions_data.get("routes") and len(directions_data["routes"]) > 0:
            distance_m = directions_data["routes"][0]["summary"]["distance"]
            distance_km = distance_m / 1000.0
            return round(distance_km, 2)
        
        return None
    except Exception as e:
        logger.warning(f"Error calculating distance: {str(e)}")
        return None


def calculate_rental_price(xe, start_date, end_date, start_time=None, end_time=None, 
                          pickup_location=None, return_location=None, 
                          delivery_address=None, coupon=None):
    """
    Tính giá thuê xe chi tiết
    
    Args:
        xe: Xe object
        start_date: Ngày bắt đầu
        end_date: Ngày kết thúc
        start_time: Giờ bắt đầu (optional)
        end_time: Giờ kết thúc (optional)
        pickup_location: Địa điểm nhận xe
        return_location: Địa điểm trả xe
        delivery_address: Địa chỉ giao xe (nếu có)
        coupon: Coupon object (optional)
    
    Returns:
        dict với các loại phí:
        {
            'base_price': giá cơ bản,
            'delivery_fee': phí giao,
            'pickup_fee': phí nhận,
            'additional_fee': phụ phí,
            'discount_amount': số tiền giảm,
            'total_price': tổng tiền
        }
    """
    # Tính số ngày và giờ thuê
    if start_time and end_time:
        start_datetime = datetime.combine(start_date, start_time)
        end_datetime = datetime.combine(end_date, end_time)
        delta = end_datetime - start_datetime
        total_hours = delta.total_seconds() / 3600
        rental_days = int(total_hours / 24)
        rental_hours = int(total_hours % 24)
    else:
        delta = end_date - start_date
        rental_days = delta.days + 1  # +1 để tính cả ngày cuối
        rental_hours = 0
    
    # Giá cơ bản: theo ngày hoặc giờ
    daily_rate = Decimal(str(xe.gia_thue or xe.gia))
    hourly_rate = daily_rate / 3
    
    if rental_days > 0:
        base_price = daily_rate * rental_days
        # Nếu có giờ lẻ, tính thêm theo giờ (1/3 giá ngày)
        if rental_hours > 0:
            base_price += hourly_rate * rental_hours
    else:
        # Thuê theo giờ (< 1 ngày)
        base_price = hourly_rate * rental_hours
    
    # Phí giao xe (nếu có địa chỉ giao)
    delivery_fee = Decimal(0)
    if delivery_address:
        # Tính phí giao dựa trên khoảng cách
        # Sử dụng OpenRouteService API để tính khoảng cách
        try:
            distance_km = _calculate_distance_km(pickup_location, delivery_address)
            if distance_km:
                # Phí giao: 50,000 VNĐ/km (có thể config)
                delivery_fee = Decimal(str(distance_km)) * Decimal("50000")
                # Tối thiểu 50,000 VNĐ, tối đa 500,000 VNĐ
                delivery_fee = max(Decimal("50000"), min(delivery_fee, Decimal("500000")))
            else:
                # Fallback: phí cố định nếu không tính được khoảng cách
                delivery_fee = Decimal("100000")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Không thể tính phí giao xe: {str(e)}")
            # Fallback: phí cố định
            delivery_fee = Decimal("100000")
    
    # Phí nhận xe (nếu trả ở địa điểm khác)
    pickup_fee = Decimal(0)
    if return_location and pickup_location and return_location != pickup_location:
        # Tính phí nhận dựa trên khoảng cách
        try:
            distance_km = _calculate_distance_km(pickup_location, return_location)
            if distance_km:
                # Phí nhận: 30,000 VNĐ/km
                pickup_fee = Decimal(str(distance_km)) * Decimal("30000")
                # Tối thiểu 30,000 VNĐ, tối đa 300,000 VNĐ
                pickup_fee = max(Decimal("30000"), min(pickup_fee, Decimal("300000")))
            else:
                # Fallback: phí cố định
                pickup_fee = Decimal("50000")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Không thể tính phí nhận xe: {str(e)}")
            # Fallback: phí cố định
            pickup_fee = Decimal("50000")
    
    # Phụ phí (có thể thêm sau)
    additional_fee = Decimal(0)
    
    # Tổng trước giảm giá
    subtotal = base_price + delivery_fee + pickup_fee + additional_fee
    
    # Áp dụng coupon (chỉ tính discount, không tăng used_count ở đây)
    # used_count sẽ được tăng trong view khi tạo order
    discount_amount = Decimal(0)
    if coupon and coupon.is_valid():
        discount_amount = coupon.calculate_discount(subtotal)
    
    # Tổng cuối cùng
    total_price = subtotal - discount_amount
    
    return {
        'base_price': base_price,
        'delivery_fee': delivery_fee,
        'pickup_fee': pickup_fee,
        'additional_fee': additional_fee,
        'discount_amount': discount_amount,
        'total_price': max(total_price, Decimal(0)),  # Không được âm
        'rental_days': rental_days,
        'rental_hours': rental_hours,
    }


def calculate_late_fee(order):
    """
    Tính phí trễ nếu trả xe muộn
    
    Args:
        order: Order object
    
    Returns:
        late_fee: Số tiền phí trễ
    """
    if not order.actual_return_date:
        return Decimal(0)
    
    # Tính thời gian trễ
    expected_end = datetime.combine(order.end_date, order.end_time or time.max)
    actual_end = datetime.combine(
        order.actual_return_date, 
        order.actual_return_time or time.max
    )
    
    if actual_end <= expected_end:
        return Decimal(0)
    
    # Tính số giờ trễ
    late_delta = actual_end - expected_end
    late_hours = late_delta.total_seconds() / 3600
    
    # Phí trễ: 10% giá ngày cho mỗi giờ trễ (tối thiểu 1 giờ)
    late_hours = max(1, int(late_hours))
    
    # Lấy giá ngày của xe từ order item
    if order.items.exists():
        item = order.items.first()
        daily_rate = Decimal(str(item.price_at_purchase))
        late_fee = (daily_rate * Decimal("0.1")) * late_hours
        return late_fee
    
    return Decimal(0)


def reserve_order(order, timeout_minutes=15):
    """
    Giữ chỗ cho order (chuyển sang trạng thái reserved)
    
    Args:
        order: Order object
        timeout_minutes: Thời gian timeout (mặc định 15 phút)
    
    Returns:
        order với reserved_until đã set
    """
    from django.utils import timezone
    order.status = "reserved"
    order.reserved_until = timezone.now() + timedelta(minutes=timeout_minutes)
    order.save()
    return order


def release_expired_reservations():
    """
    Hàm để chạy định kỳ (cron job) để giải phóng các order hết hạn giữ chỗ
    """
    from django.utils import timezone
    now = timezone.now()
    
    expired_orders = Order.objects.filter(
        status="reserved",
        reserved_until__lt=now
    )
    
    for order in expired_orders:
        order.check_reservation_expired()
    
    return expired_orders.count()

