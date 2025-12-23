from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from products.models import LoaiXe, Xe, Location, Review


class LoaiXeModelTest(TestCase):
    """Test cases cho LoaiXe model"""
    
    def setUp(self):
        self.loai_xe = LoaiXe.objects.create(
            ma_loai="SEDAN",
            ten_loai="Sedan"
        )
    
    def test_loai_xe_creation(self):
        """Test tạo loại xe"""
        self.assertEqual(str(self.loai_xe), "Sedan")
        self.assertEqual(self.loai_xe.ma_loai, "SEDAN")
    
    def test_loai_xe_str(self):
        """Test __str__ method"""
        self.assertEqual(str(self.loai_xe), "Sedan")


class XeModelTest(TestCase):
    """Test cases cho Xe model"""
    
    def setUp(self):
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
    
    def test_xe_creation(self):
        """Test tạo xe"""
        self.assertEqual(str(self.xe), "Test Car")
        self.assertEqual(self.xe.ma_xe, "X001")
        self.assertEqual(self.xe.gia_thue, 500000)
        self.assertEqual(self.xe.trang_thai, "in_stock")
    
    def test_xe_default_values(self):
        """Test giá trị mặc định"""
        self.assertEqual(self.xe.dung_tich_nhien_lieu, 70)
        self.assertEqual(self.xe.hop_so, "manual")
        self.assertEqual(self.xe.so_cho, 2)
        self.assertEqual(self.xe.loai_nhien_lieu, "gasoline")


class XeAPITest(TestCase):
    """Test cases cho Xe API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.loai_xe = LoaiXe.objects.create(
            ma_loai="SUV",
            ten_loai="SUV"
        )
        self.admin_user = User.objects.create_user(
            username="admin",
            password="admin123",
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username="user",
            password="user123"
        )
        self.xe_data = {
            "ma_xe": "X001",
            "ten_xe": "Test Car",
            "slug": "test-car",
            "gia": 500000000,
            "gia_thue": 500000,
            "so_luong": 5,
            "mau_sac": "Đỏ",
            "loai_xe": self.loai_xe.ma_loai,
            "trang_thai": "in_stock"
        }
    
    def test_list_xe_public(self):
        """Test list xe không cần authentication"""
        Xe.objects.create(
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
        
        response = self.client.get("/api/xe/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data.get("results", response.data)), 0)
    
    def test_create_xe_requires_admin(self):
        """Test tạo xe cần quyền admin"""
        # Không đăng nhập
        response = self.client.post("/api/xe/", self.xe_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Đăng nhập user thường
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post("/api/xe/", self.xe_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Đăng nhập admin
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post("/api/xe/", self.xe_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_get_xe_detail(self):
        """Test lấy chi tiết xe"""
        xe = Xe.objects.create(
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
        
        response = self.client.get(f"/api/xe/{xe.ma_xe}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["ten_xe"], "Test Car")
    
    def test_search_xe(self):
        """Test tìm kiếm xe"""
        Xe.objects.create(
            ma_xe="X001",
            ten_xe="Toyota Camry",
            slug="toyota-camry",
            gia=500000000,
            gia_thue=500000,
            so_luong=5,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
        
        response = self.client.get("/api/xe/?search=Toyota")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreater(len(results), 0)
    
    def test_filter_xe_by_price(self):
        """Test lọc xe theo giá"""
        Xe.objects.create(
            ma_xe="X001",
            ten_xe="Car 1",
            slug="car-1",
            gia=500000000,
            gia_thue=500000,
            so_luong=5,
            mau_sac="Đỏ",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
        Xe.objects.create(
            ma_xe="X002",
            ten_xe="Car 2",
            slug="car-2",
            gia=1000000000,
            gia_thue=1000000,
            so_luong=3,
            mau_sac="Xanh",
            loai_xe=self.loai_xe,
            trang_thai="in_stock"
        )
        
        response = self.client.get("/api/xe/?gia_thue_max=600000")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        # Chỉ có Car 1 có giá <= 600000
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["ten_xe"], "Car 1")


class LoaiXeAPITest(TestCase):
    """Test cases cho LoaiXe API"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin",
            password="admin123",
            is_staff=True
        )
    
    def test_list_loai_xe(self):
        """Test list loại xe"""
        LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
        LoaiXe.objects.create(ma_loai="SEDAN", ten_loai="Sedan")
        
        response = self.client.get("/api/loaixe/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 2)


class LocationAPITest(TestCase):
    """Test cases cho Location API"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_list_location(self):
        """Test list địa điểm"""
        Location.objects.create(
            ten_dia_diem="Hà Nội",
            dia_chi_chi_tiet="123 Đường ABC",
            trang_thai=True
        )
        
        response = self.client.get("/api/location/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreater(len(results), 0)
