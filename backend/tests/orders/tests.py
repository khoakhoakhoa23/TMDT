from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from products.models import LoaiXe, Xe
from orders.models import Cart, CartItem, Order, OrderItem
from datetime import datetime, timedelta


class CartAPITest(TestCase):
    """Test cases cho Cart API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.loai_xe = LoaiXe.objects.create(
            ma_loai="SUV",
            ten_loai="SUV"
        )
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=5,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_create_cart_requires_auth(self):
        """Test tạo cart cần authentication"""
        response = self.client.post("/api/cart/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_cart_authenticated(self):
        """Test tạo cart khi đã đăng nhập"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post("/api/cart/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_add_item_to_cart(self):
        """Test thêm item vào cart"""
        self.client.force_authenticate(user=self.user)
        
        # Tạo cart
        cart_response = self.client.post("/api/cart/", {}, format="json")
        cart_id = cart_response.data["id"]
        
        # Thêm item
        item_data = {
            "cart": cart_id,
            "xe": self.xe.ma_xe,
            "quantity": 2,
            "start_date": "2025-01-01",
            "end_date": "2025-01-05"
        }
        
        response = self.client.post("/api/cart-item/", item_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["quantity"], 2)
    
    def test_get_user_cart(self):
        """Test lấy cart của user"""
        self.client.force_authenticate(user=self.user)
        
        # Tạo cart
        self.client.post("/api/cart/", {}, format="json")
        
        # Lấy cart
        response = self.client.get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreater(len(results), 0)


class OrderAPITest(TestCase):
    """Test cases cho Order API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.loai_xe = LoaiXe.objects.create(
            ma_loai="SUV",
            ten_loai="SUV"
        )
        self.xe = Xe.objects.create(
            ma_xe="X001",
            ten_xe="Test Car",
            slug="test-car",
            gia=500000000,
            gia_thue=500000,
            so_luong=5,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
    
    def test_create_order_requires_auth(self):
        """Test tạo order cần authentication"""
        response = self.client.post("/api/order/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_user_orders(self):
        """Test lấy danh sách orders của user"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get("/api/order/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
