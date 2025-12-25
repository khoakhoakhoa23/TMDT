from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
import json


class UserRegistrationTest(TestCase):
    """Test cases cho đăng ký user"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_register_user_success(self):
        """Test đăng ký user thành công"""
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser").exists())
    
    def test_register_user_duplicate_username(self):
        """Test đăng ký user với username đã tồn tại"""
        User.objects.create_user(
            username="testuser",
            email="existing@example.com",
            password="pass123"
        )
        
        data = {
            "username": "testuser",
            "email": "new@example.com",
            "password": "testpass123"
        }
        
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_user_missing_fields(self):
        """Test đăng ký user thiếu thông tin"""
        data = {
            "username": "testuser"
            # Thiếu email và password
        }
        
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTest(TestCase):
    """Test cases cho đăng nhập"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            email="test@example.com"
        )
    
    def test_login_success(self):
        """Test đăng nhập thành công"""
        data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = self.client.post("/api/token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
    
    def test_login_wrong_password(self):
        """Test đăng nhập sai mật khẩu"""
        data = {
            "username": "testuser",
            "password": "wrongpass"
        }
        
        response = self.client.post("/api/token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_nonexistent_user(self):
        """Test đăng nhập với user không tồn tại"""
        data = {
            "username": "nonexistent",
            "password": "pass123"
        }
        
        response = self.client.post("/api/token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileTest(TestCase):
    """Test cases cho profile user"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
    
    def test_get_user_profile_authenticated(self):
        """Test lấy profile khi đã đăng nhập"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")
    
    def test_get_user_profile_unauthenticated(self):
        """Test lấy profile khi chưa đăng nhập"""
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_user_profile(self):
        """Test cập nhật profile"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com"
        }
        
        response = self.client.patch("/api/users/update-profile/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Kiểm tra đã cập nhật
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.email, "updated@example.com")


class TokenRefreshTest(TestCase):
    """Test cases cho refresh token"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
    
    def test_refresh_token_success(self):
        """Test refresh token thành công"""
        # Đăng nhập để lấy token
        login_response = self.client.post("/api/token/", {
            "username": "testuser",
            "password": "testpass123"
        }, format="json")
        
        refresh_token = login_response.data["refresh"]
        
        # Refresh token
        response = self.client.post("/api/token/refresh/", {
            "refresh": refresh_token
        }, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
    
    def test_refresh_token_invalid(self):
        """Test refresh token không hợp lệ"""
        response = self.client.post("/api/token/refresh/", {
            "refresh": "invalid_token"
        }, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
