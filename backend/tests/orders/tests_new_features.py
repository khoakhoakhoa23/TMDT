"""
Test cases cho các tính năng mới:
- Xử lý xung đột lịch đặt
- Giữ chỗ/timeout
- Tính tiền chi tiết
- Coupon/Discount
- Phí trễ
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta, date, time
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status

from products.models import LoaiXe, Xe
from orders.models import Order, OrderItem, Coupon
from orders.utils import (
    check_schedule_conflict,
    calculate_rental_price,
    calculate_late_fee,
    reserve_order,
    release_expired_reservations,
)


class ScheduleConflictTest(TestCase):
    """Test kiểm tra xung đột lịch đặt"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="pass123")
        self.user2 = User.objects.create_user(username="user2", password="pass123")
        self.loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=1,  # Chỉ có 1 xe để test xung đột
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_no_conflict_different_dates(self):
        """Test không có xung đột khi đặt khác ngày"""
        start_date1 = date(2025, 1, 1)
        end_date1 = date(2025, 1, 5)
        start_date2 = date(2025, 1, 10)
        end_date2 = date(2025, 1, 15)
        
        # Tạo order 1
        order1 = Order.objects.create(
            user=self.user1,
            start_date=start_date1,
            end_date=end_date1,
            status="paid",
            total_price=2000000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột cho order 2
        has_conflict, conflicts = check_schedule_conflict(
            self.xe.ma_xe, start_date2, end_date2
        )
        
        self.assertFalse(has_conflict)
        self.assertEqual(len(conflicts), 0)
    
    def test_conflict_overlapping_dates(self):
        """Test có xung đột khi đặt trùng ngày"""
        start_date1 = date(2025, 1, 1)
        end_date1 = date(2025, 1, 5)
        start_date2 = date(2025, 1, 3)  # Trùng với order 1
        end_date2 = date(2025, 1, 7)
        
        # Tạo order 1
        order1 = Order.objects.create(
            user=self.user1,
            start_date=start_date1,
            end_date=end_date1,
            status="paid",
            total_price=2000000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột cho order 2
        has_conflict, conflicts = check_schedule_conflict(
            self.xe.ma_xe, start_date2, end_date2
        )
        
        self.assertTrue(has_conflict)
        self.assertGreater(len(conflicts), 0)
        self.assertEqual(conflicts[0].id, order1.id)
    
    def test_no_conflict_cancelled_order(self):
        """Test không có xung đột với order đã hủy"""
        start_date1 = date(2025, 1, 1)
        end_date1 = date(2025, 1, 5)
        start_date2 = date(2025, 1, 3)
        end_date2 = date(2025, 1, 7)
        
        # Tạo order 1 đã hủy
        order1 = Order.objects.create(
            user=self.user1,
            start_date=start_date1,
            end_date=end_date1,
            status="cancelled",  # Đã hủy
            total_price=2000000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột - không nên có vì order đã hủy
        has_conflict, conflicts = check_schedule_conflict(
            self.xe.ma_xe, start_date2, end_date2
        )
        
        self.assertFalse(has_conflict)
    
    def test_conflict_with_time(self):
        """Test xung đột với thời gian cụ thể"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 1)  # Cùng ngày
        start_time1 = time(8, 0, 0)
        end_time1 = time(12, 0, 0)
        start_time2 = time(10, 0, 0)  # Trùng với order 1
        end_time2 = time(14, 0, 0)
        
        # Tạo order 1
        order1 = Order.objects.create(
            user=self.user1,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time1,
            end_time=end_time1,
            status="paid",
            total_price=200000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột
        has_conflict, conflicts = check_schedule_conflict(
            self.xe.ma_xe, start_date, end_date, start_time2, end_time2
        )
        
        self.assertTrue(has_conflict)
    
    def test_no_conflict_different_time_same_day(self):
        """Test không xung đột khi khác giờ cùng ngày"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 1)
        start_time1 = time(8, 0, 0)
        end_time1 = time(12, 0, 0)
        start_time2 = time(14, 0, 0)  # Khác giờ
        end_time2 = time(18, 0, 0)
        
        # Tạo order 1
        order1 = Order.objects.create(
            user=self.user1,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time1,
            end_time=end_time1,
            status="paid",
            total_price=200000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột
        has_conflict, conflicts = check_schedule_conflict(
            self.xe.ma_xe, start_date, end_date, start_time2, end_time2
        )
        
        self.assertFalse(has_conflict)


class ReservationTimeoutTest(TestCase):
    """Test giữ chỗ và timeout"""
    
    def setUp(self):
        self.user = User.objects.create_user(username="user1", password="pass123")
        self.loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=1,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_reserve_order(self):
        """Test giữ chỗ order"""
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            status="pending",
            total_price=2000000
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Giữ chỗ
        reserve_order(order, timeout_minutes=15)
        
        self.assertEqual(order.status, "reserved")
        self.assertIsNotNone(order.reserved_until)
        
        # Kiểm tra reserved_until là 15 phút sau
        expected_time = timezone.now() + timedelta(minutes=15)
        time_diff = abs((order.reserved_until - expected_time).total_seconds())
        self.assertLess(time_diff, 60)  # Chênh lệch < 1 phút
    
    def test_check_reservation_expired(self):
        """Test kiểm tra order hết hạn giữ chỗ"""
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            status="reserved",
            total_price=2000000,
            reserved_until=timezone.now() - timedelta(minutes=1)  # Đã hết hạn
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        original_quantity = self.xe.so_luong
        
        # Kiểm tra hết hạn
        is_expired = order.check_reservation_expired()
        
        self.assertTrue(is_expired)
        self.assertEqual(order.status, "expired")
        
        # Kiểm tra số lượng xe đã được hoàn lại
        self.xe.refresh_from_db()
        self.assertEqual(self.xe.so_luong, original_quantity + 1)
    
    def test_release_expired_reservations(self):
        """Test giải phóng các order hết hạn"""
        # Tạo order hết hạn
        order1 = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            status="reserved",
            total_price=2000000,
            reserved_until=timezone.now() - timedelta(minutes=1)
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Tạo order chưa hết hạn
        order2 = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 10),
            end_date=date(2025, 1, 15),
            status="reserved",
            total_price=2000000,
            reserved_until=timezone.now() + timedelta(minutes=10)
        )
        OrderItem.objects.create(order=order2, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Giải phóng
        count = release_expired_reservations()
        
        self.assertEqual(count, 1)
        order1.refresh_from_db()
        self.assertEqual(order1.status, "expired")
        order2.refresh_from_db()
        self.assertEqual(order2.status, "reserved")  # Chưa hết hạn


class PriceCalculationTest(TestCase):
    """Test tính tiền chi tiết"""
    
    def setUp(self):
        self.loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,  # 500k/ngày
            so_luong=1,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_calculate_price_by_days(self):
        """Test tính giá theo ngày"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)  # 5 ngày
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date
        )
        
        self.assertEqual(price_info['rental_days'], 5)
        self.assertEqual(price_info['rental_hours'], 0)
        self.assertEqual(price_info['base_price'], Decimal('2500000'))  # 500k * 5
        self.assertEqual(price_info['delivery_fee'], Decimal('0'))
        self.assertEqual(price_info['pickup_fee'], Decimal('0'))
    
    def test_calculate_price_by_hours(self):
        """Test tính giá theo giờ (< 1 ngày)"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 1)  # Cùng ngày
        start_time = time(8, 0, 0)
        end_time = time(14, 0, 0)  # 6 giờ
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date, start_time, end_time
        )
        
        self.assertEqual(price_info['rental_days'], 0)
        self.assertEqual(price_info['rental_hours'], 6)
        # Giá giờ = giá ngày / 3
        expected_hourly = Decimal('500000') / 3 * 6
        self.assertEqual(price_info['base_price'], expected_hourly)
    
    def test_calculate_price_with_delivery(self):
        """Test tính giá có phí giao xe"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date,
            delivery_address="123 Đường ABC"
        )
        
        self.assertEqual(price_info['delivery_fee'], Decimal('100000'))
    
    def test_calculate_price_with_pickup_fee(self):
        """Test tính giá có phí nhận xe"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date,
            pickup_location="Hà Nội",
            return_location="Hồ Chí Minh"  # Khác địa điểm
        )
        
        self.assertEqual(price_info['pickup_fee'], Decimal('50000'))
    
    def test_calculate_price_with_coupon_percentage(self):
        """Test tính giá với coupon phần trăm"""
        coupon = Coupon.objects.create(
            code="DISCOUNT10",
            discount_type="percentage",
            discount_value=Decimal('10'),
            min_order_value=Decimal('1000000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
        
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)  # 5 ngày = 2,500,000
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date, coupon=coupon
        )
        
        # Subtotal = 2,500,000
        # Discount = 10% = 250,000
        self.assertEqual(price_info['discount_amount'], Decimal('250000'))
        self.assertEqual(price_info['total_price'], Decimal('2250000'))
    
    def test_calculate_price_with_coupon_fixed(self):
        """Test tính giá với coupon số tiền cố định"""
        coupon = Coupon.objects.create(
            code="FIXED100K",
            discount_type="fixed",
            discount_value=Decimal('100000'),
            min_order_value=Decimal('500000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
        
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date, coupon=coupon
        )
        
        self.assertEqual(price_info['discount_amount'], Decimal('100000'))
        self.assertEqual(price_info['total_price'], Decimal('2400000'))
    
    def test_calculate_price_days_and_hours(self):
        """Test tính giá có cả ngày và giờ lẻ"""
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 5)
        start_time = time(8, 0, 0)
        end_time = time(14, 0, 0)  # Thêm 6 giờ
        
        price_info = calculate_rental_price(
            self.xe, start_date, end_date, start_time, end_time
        )
        
        # Tính toán: từ 2025-01-01 08:00 đến 2025-01-05 14:00
        # = 4 ngày 6 giờ = 4 * 24 + 6 = 102 giờ
        # rental_days = 102 / 24 = 4, rental_hours = 102 % 24 = 6
        # Giá = 4 * 500000 + 6 * (500000/3) = 2,000,000 + 1,000,000 = 3,000,000
        base_days = Decimal('500000') * 4  # 4 ngày
        base_hours = (Decimal('500000') / 3) * 6  # 6 giờ
        expected_base = base_days + base_hours
        
        self.assertEqual(price_info['base_price'], expected_base)
        self.assertEqual(price_info['rental_days'], 4)
        self.assertEqual(price_info['rental_hours'], 6)


class CouponTest(TestCase):
    """Test Coupon model và validation"""
    
    def setUp(self):
        self.coupon = Coupon.objects.create(
            code="TEST10",
            description="Giảm 10%",
            discount_type="percentage",
            discount_value=Decimal('10'),
            min_order_value=Decimal('1000000'),
            max_discount=Decimal('500000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            usage_limit=100,
            is_active=True
        )
    
    def test_coupon_is_valid(self):
        """Test coupon hợp lệ"""
        self.assertTrue(self.coupon.is_valid())
    
    def test_coupon_expired(self):
        """Test coupon hết hạn"""
        self.coupon.valid_to = timezone.now() - timedelta(days=1)
        self.coupon.save()
        self.assertFalse(self.coupon.is_valid())
    
    def test_coupon_not_active(self):
        """Test coupon không active"""
        self.coupon.is_active = False
        self.coupon.save()
        self.assertFalse(self.coupon.is_valid())
    
    def test_coupon_usage_limit(self):
        """Test coupon vượt quá usage limit"""
        self.coupon.used_count = 100
        self.coupon.save()
        self.assertFalse(self.coupon.is_valid())
    
    def test_calculate_discount_percentage(self):
        """Test tính discount phần trăm"""
        order_total = Decimal('2000000')
        discount = self.coupon.calculate_discount(order_total)
        
        # 10% của 2,000,000 = 200,000, nhưng max là 500,000
        self.assertEqual(discount, Decimal('200000'))
    
    def test_calculate_discount_percentage_max(self):
        """Test tính discount phần trăm với max discount"""
        order_total = Decimal('10000000')  # 10 triệu
        discount = self.coupon.calculate_discount(order_total)
        
        # 10% của 10,000,000 = 1,000,000, nhưng max là 500,000
        self.assertEqual(discount, Decimal('500000'))
    
    def test_calculate_discount_fixed(self):
        """Test tính discount số tiền cố định"""
        coupon = Coupon.objects.create(
            code="FIXED100K",
            discount_type="fixed",
            discount_value=Decimal('100000'),
            min_order_value=Decimal('500000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
        
        discount = coupon.calculate_discount(Decimal('2000000'))
        self.assertEqual(discount, Decimal('100000'))
    
    def test_calculate_discount_min_order_value(self):
        """Test discount không áp dụng nếu order < min_order_value"""
        order_total = Decimal('500000')  # < 1,000,000
        discount = self.coupon.calculate_discount(order_total)
        
        self.assertEqual(discount, Decimal('0'))


class LateFeeTest(TestCase):
    """Test tính phí trễ"""
    
    def setUp(self):
        self.user = User.objects.create_user(username="user1", password="pass123")
        self.loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=1,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_no_late_fee_on_time(self):
        """Test không có phí trễ khi trả đúng giờ"""
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            end_time=time(18, 0, 0),
            actual_return_date=date(2025, 1, 5),
            actual_return_time=time(17, 0, 0),  # Trả sớm
            total_price=2000000
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        late_fee = calculate_late_fee(order)
        self.assertEqual(late_fee, Decimal('0'))
    
    def test_late_fee_one_hour(self):
        """Test phí trễ 1 giờ"""
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            end_time=time(18, 0, 0),
            actual_return_date=date(2025, 1, 5),
            actual_return_time=time(19, 0, 0),  # Trễ 1 giờ
            total_price=2000000
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        late_fee = calculate_late_fee(order)
        # 10% giá ngày * 1 giờ = 50,000
        expected = Decimal('500000') * Decimal('0.1') * 1
        self.assertEqual(late_fee, expected)
    
    def test_late_fee_one_day(self):
        """Test phí trễ 1 ngày"""
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            actual_return_date=date(2025, 1, 6),  # Trễ 1 ngày = 24 giờ
            total_price=2000000
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        late_fee = calculate_late_fee(order)
        # 10% giá ngày * 24 giờ = 1,200,000
        expected = Decimal('500000') * Decimal('0.1') * 24
        self.assertEqual(late_fee, expected)


class OrderAPITest(TestCase):
    """Test API endpoints cho các tính năng mới"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="user1", password="pass123")
        self.loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=1,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
        self.client.force_authenticate(user=self.user)
    
    def test_check_schedule_conflict_api(self):
        """Test API kiểm tra xung đột"""
        # Tạo order trước
        order = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            status="paid",
            total_price=2000000
        )
        OrderItem.objects.create(order=order, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Kiểm tra xung đột
        response = self.client.post("/api/check-schedule-conflict/", {
            "xe_id": "X001",
            "start_date": "2025-01-03",
            "end_date": "2025-01-07"
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_conflict"])
        self.assertGreater(len(response.data["conflicting_orders"]), 0)
    
    def test_calculate_price_api(self):
        """Test API tính giá"""
        response = self.client.post("/api/calculate-price/", {
            "xe_id": "X001",
            "start_date": "2025-01-01",
            "end_date": "2025-01-05",
            "delivery_address": "123 Đường ABC"
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_price", response.data)
        self.assertIn("base_price", response.data)
        self.assertIn("delivery_fee", response.data)
        self.assertEqual(response.data["delivery_fee"], 100000)
    
    def test_validate_coupon_api(self):
        """Test API validate coupon"""
        coupon = Coupon.objects.create(
            code="TEST10",
            discount_type="percentage",
            discount_value=Decimal('10'),
            min_order_value=Decimal('1000000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
        
        response = self.client.post("/api/validate-coupon/", {
            "coupon_code": "TEST10",
            "order_total": 2000000
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["valid"])
        self.assertEqual(response.data["coupon"]["code"], "TEST10")
    
    def test_create_order_with_conflict(self):
        """Test tạo order bị từ chối do xung đột"""
        # Tạo order 1
        order1 = Order.objects.create(
            user=self.user,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 5),
            status="paid",
            total_price=2000000
        )
        OrderItem.objects.create(order=order1, xe=self.xe, quantity=1, price_at_purchase=500000)
        
        # Cố tạo order 2 trùng lịch
        response = self.client.post("/api/order/", {
            "items": [{"xe_id": "X001", "quantity": 1}],
            "start_date": "2025-01-03",
            "end_date": "2025-01-07",
            "pickup_location": "Hà Nội",
            "return_location": "Hà Nội"
        }, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("xung đột", response.data["detail"].lower() or "")
    
    def test_create_order_with_coupon(self):
        """Test tạo order với coupon"""
        coupon = Coupon.objects.create(
            code="DISCOUNT10",
            discount_type="percentage",
            discount_value=Decimal('10'),
            min_order_value=Decimal('1000000'),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
        
        response = self.client.post("/api/order/", {
            "items": [{"xe_id": "X001", "quantity": 1}],
            "start_date": "2025-01-10",
            "end_date": "2025-01-15",
            "pickup_location": "Hà Nội",
            "return_location": "Hà Nội",
            "coupon_code": "DISCOUNT10"
        }, format="json")
        
        if response.status_code != status.HTTP_201_CREATED:
            # Debug: in ra lỗi nếu có
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        discount_amount = response.data.get("discount_amount", 0)
        if isinstance(discount_amount, str):
            discount_amount = float(discount_amount)
        self.assertGreater(discount_amount, 0)
        self.assertEqual(response.data.get("coupon_code", ""), "DISCOUNT10")
        
        # Kiểm tra coupon đã được sử dụng
        coupon.refresh_from_db()
        self.assertEqual(coupon.used_count, 1)

