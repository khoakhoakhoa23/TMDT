from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from products.models import LoaiXe, Xe, Wishlist
from orders.models import Coupon


class WishlistAPITest(TestCase):
    """Test cases cho Wishlist API"""

    def setUp(self):
        # Tạo user test
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Tạo dữ liệu test
        self.loai_xe = LoaiXe.objects.create(
            ma_loai="SUV",
            ten_loai="SUV"
        )
        self.xe1 = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car 1",
            slug="test-car-1",
            gia=500000000,
            gia_thue=500000,
            so_luong=5,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
        self.xe2 = Xe.objects.create(
            ma_xe="X002",
            ten_xe="Test Car 2",
            slug="test-car-2",
            gia=600000000,
            gia_thue=600000,
            so_luong=3,
            mau_sac="Xanh",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )

    def test_get_empty_wishlist(self):
        """Test lấy wishlist trống"""
        response = self.client.get('/api/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_add_to_wishlist(self):
        """Test thêm xe vào wishlist"""
        data = {'car_id': 'X001'}
        response = self.client.post('/api/wishlist/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Kiểm tra đã tạo trong DB
        wishlist_item = Wishlist.objects.get(user=self.user, xe=self.xe1)
        self.assertIsNotNone(wishlist_item)

    def test_add_duplicate_to_wishlist(self):
        """Test thêm xe đã có trong wishlist"""
        # Thêm lần đầu
        data = {'car_id': 'X001'}
        response1 = self.client.post('/api/wishlist/', data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Thêm lần thứ hai - nên bị lỗi
        response2 = self.client.post('/api/wishlist/', data)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_from_wishlist(self):
        """Test xóa xe khỏi wishlist"""
        # Thêm xe vào wishlist trước
        wishlist_item = Wishlist.objects.create(user=self.user, xe=self.xe1)

        # Xóa xe
        response = self.client.delete(f'/api/wishlist/{wishlist_item.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Kiểm tra đã xóa
        exists = Wishlist.objects.filter(user=self.user, xe=self.xe1).exists()
        self.assertFalse(exists)

    def test_check_wishlist_status(self):
        """Test kiểm tra xe có trong wishlist không"""
        # Xe chưa có trong wishlist
        response = self.client.get('/api/wishlist/check/', {'car_id': 'X001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['in_wishlist'])

        # Thêm xe vào wishlist
        Wishlist.objects.create(user=self.user, xe=self.xe1)

        # Kiểm tra lại
        response = self.client.get('/api/wishlist/check/', {'car_id': 'X001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['in_wishlist'])
        self.assertIsNotNone(response.data['wishlist_id'])

    def test_remove_by_car_id(self):
        """Test xóa xe khỏi wishlist bằng car_id"""
        # Thêm xe vào wishlist
        Wishlist.objects.create(user=self.user, xe=self.xe1)

        # Xóa bằng car_id
        data = {'car_id': 'X001'}
        response = self.client.post('/api/wishlist/remove-by-car/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Kiểm tra đã xóa
        exists = Wishlist.objects.filter(user=self.user, xe=self.xe1).exists()
        self.assertFalse(exists)

    def test_get_wishlist_with_data(self):
        """Test lấy wishlist có dữ liệu"""
        # Thêm 2 xe vào wishlist
        Wishlist.objects.create(user=self.user, xe=self.xe1)
        Wishlist.objects.create(user=self.user, xe=self.xe2)

        response = self.client.get('/api/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

        # Kiểm tra dữ liệu trả về
        car_ids = [item['xe']['ma_xe'] for item in response.data['results']]
        self.assertIn('X001', car_ids)
        self.assertIn('X002', car_ids)

    def test_unauthenticated_access(self):
        """Test truy cập wishlist khi chưa đăng nhập"""
        self.client.logout()
        response = self.client.get('/api/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CouponAPITest(TestCase):
    """Test cases cho Coupon API"""

    def setUp(self):
        # Tạo user test
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Tạo coupon test
        self.coupon = Coupon.objects.create(
            code="TEST10",
            description="Giảm 10%",
            discount_type="percentage",
            discount_value=10,
            min_order_value=100000,
            usage_limit=100,
            used_count=0,
            is_active=True
        )

        self.fixed_coupon = Coupon.objects.create(
            code="FIXED50K",
            description="Giảm 50k",
            discount_type="fixed",
            discount_value=50000,
            min_order_value=200000,
            usage_limit=50,
            used_count=0,
            is_active=True
        )

    def test_validate_valid_percentage_coupon(self):
        """Test validate coupon percentage hợp lệ"""
        data = {
            'coupon_code': 'TEST10',
            'order_total': 500000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['coupon']['code'], 'TEST10')
        self.assertEqual(response.data['discount_amount'], 50000)  # 10% của 500k

    def test_validate_valid_fixed_coupon(self):
        """Test validate coupon fixed amount hợp lệ"""
        data = {
            'coupon_code': 'FIXED50K',
            'order_total': 300000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['coupon']['code'], 'FIXED50K')
        self.assertEqual(response.data['discount_amount'], 50000)

    def test_validate_coupon_below_min_order(self):
        """Test validate coupon với đơn hàng dưới giá trị tối thiểu"""
        data = {
            'coupon_code': 'TEST10',
            'order_total': 50000  # Dưới 100k
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])
        self.assertIn('tối thiểu', response.data['message'])

    def test_validate_nonexistent_coupon(self):
        """Test validate coupon không tồn tại"""
        data = {
            'coupon_code': 'NONEXISTENT',
            'order_total': 500000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])
        self.assertIn('không tồn tại', response.data['message'])

    def test_validate_inactive_coupon(self):
        """Test validate coupon không hoạt động"""
        self.coupon.is_active = False
        self.coupon.save()

        data = {
            'coupon_code': 'TEST10',
            'order_total': 500000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])

    def test_validate_used_up_coupon(self):
        """Test validate coupon đã hết lượt sử dụng"""
        self.coupon.usage_limit = 5
        self.coupon.used_count = 5
        self.coupon.save()

        data = {
            'coupon_code': 'TEST10',
            'order_total': 500000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])
        self.assertIn('hết số lần sử dụng', response.data['message'])

    def test_validate_coupon_case_insensitive(self):
        """Test validate coupon không phân biệt hoa thường"""
        data = {
            'coupon_code': 'test10',  # lowercase
            'order_total': 500000
        }
        response = self.client.post('/api/validate-coupon/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
