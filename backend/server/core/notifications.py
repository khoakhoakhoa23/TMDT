"""
Helper functions để tạo notifications tự động
"""
from .models import Notification
from django.utils import timezone
from datetime import timedelta


def create_notification(user, type, title, message, order=None):
    """Tạo notification cho user"""
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        order=order,
    )


def create_order_status_notification(order, old_status, new_status):
    """Tạo notification khi order status thay đổi"""
    status_messages = {
        "pending": "Chờ xử lý",
        "processing": "Đang xử lý",
        "paid": "Đã thanh toán",
        "shipped": "Đang giao",
        "completed": "Hoàn thành",
        "cancelled": "Đã hủy",
    }
    
    old_status_text = status_messages.get(old_status, old_status)
    new_status_text = status_messages.get(new_status, new_status)
    
    title = "Cập nhật trạng thái đơn hàng"
    message = f"Đơn hàng #{order.id} đã chuyển từ '{old_status_text}' sang '{new_status_text}'"
    
    return create_notification(
        user=order.user,
        type="order_status",
        title=title,
        message=message,
        order=order,
    )


def create_payment_success_notification(order, payment):
    """Tạo notification khi thanh toán thành công"""
    title = "Thanh toán thành công"
    message = f"Đơn hàng #{order.id} đã được thanh toán thành công với số tiền {payment.amount:,.0f} VNĐ"
    
    return create_notification(
        user=order.user,
        type="payment_success",
        title=title,
        message=message,
        order=order,
    )


def create_rental_expiry_notification(order):
    """Tạo notification khi rental sắp hết hạn hoặc đã hết hạn"""
    if not order.end_date:
        return None
    
    end_date = order.end_date
    today = timezone.now().date()
    days_remaining = (end_date - today).days
    
    if days_remaining < 0:
        # Đã hết hạn
        title = "Hết hạn thuê xe"
        message = f"Đơn hàng #{order.id} đã hết hạn thuê xe vào ngày {end_date.strftime('%d/%m/%Y')}. Vui lòng trả xe."
    elif days_remaining <= 1:
        # Sắp hết hạn (còn 1 ngày hoặc ít hơn)
        title = "Sắp hết hạn thuê xe"
        message = f"Đơn hàng #{order.id} sẽ hết hạn thuê xe vào ngày {end_date.strftime('%d/%m/%Y')}. Còn {days_remaining} ngày."
    else:
        # Còn nhiều ngày, không cần thông báo
        return None
    
    return create_notification(
        user=order.user,
        type="rental_expiry",
        title=title,
        message=message,
        order=order,
    )


def check_and_create_rental_expiry_notifications():
    """Kiểm tra và tạo notifications cho các order sắp hết hạn (dùng cho cron job)"""
    from orders.models import Order
    from django.utils import timezone
    
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Tìm các order sắp hết hạn (hôm nay hoặc ngày mai)
    orders = Order.objects.filter(
        end_date__lte=tomorrow,
        end_date__gte=today,
        status__in=["paid", "shipped", "completed"],
    )
    
    notifications_created = 0
    for order in orders:
        # Kiểm tra xem đã có notification cho order này chưa (tránh spam)
        existing = Notification.objects.filter(
            user=order.user,
            order=order,
            type="rental_expiry",
            created_at__date=today,
        ).exists()
        
        if not existing:
            create_rental_expiry_notification(order)
            notifications_created += 1
    
    return notifications_created

