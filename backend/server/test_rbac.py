"""
Test script to verify multi-tenant RBAC implementation.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))
django.setup()

import requests
from django.contrib.auth import get_user_model

BASE_URL = "http://127.0.0.1:8000/api"


def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def get_tokens(username, password):
    """Get JWT tokens"""
    resp = requests.post(
        f"{BASE_URL}/login/",
        json={"username": username, "password": password}
    )
    if resp.status_code == 200:
        return resp.json()
    print(f"Login failed: {resp.text}")
    return None


def test_super_admin():
    """Test Super Admin permissions"""
    print_header("Testing SUPER ADMIN")

    tokens = get_tokens("superadmin", "superadmin123")
    if not tokens:
        return

    access = tokens["access"]
    headers = {"Authorization": f"Bearer {access}"}

    # Test 1: Can access all tenants data
    resp = requests.get(f"{BASE_URL}/xe/", headers=headers)
    print(f"GET /xe/ (all data): {resp.status_code}")

    # Test 2: Can create tenant
    resp = requests.post(
        f"{BASE_URL}/tenants/",
        json={"name": "New Tenant", "slug": "new-tenant"},
        headers=headers
    )
    print(f"POST /tenants/: {resp.status_code}")

    # Test 3: Can view all users
    resp = requests.get(f"{BASE_URL}/accounts/", headers=headers)
    print(f"GET /accounts/: {resp.status_code}")

    # Test 4: Can view analytics
    resp = requests.get(f"{BASE_URL}/thongke/doanhthu-homnay/", headers=headers)
    print(f"GET /thongke/doanhthu-homnay/: {resp.status_code}")

    # Test 5: Get user role
    resp = requests.get(f"{BASE_URL}/me/", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"User role: {data.get('role')}, tenant: {data.get('tenant')}")


def test_tenant_admin():
    """Test Tenant Admin permissions"""
    print_header("Testing TENANT ADMIN (tmtd)")

    tokens = get_tokens("admin_tmtd", "admin123")
    if not tokens:
        return

    access = tokens["access"]
    headers = {"Authorization": f"Bearer {access}"}

    # Test 1: Can access own tenant data only
    resp = requests.get(f"{BASE_URL}/xe/", headers=headers)
    print(f"GET /xe/ (own tenant): {resp.status_code}")

    # Test 2: Cannot access other tenants
    # (This should be filtered by tenant)
    resp = requests.get(
        f"{BASE_URL}/xe/",
        headers={**headers, "X-Tenant": "company-a"}
    )
    print(f"GET /xe/ with X-Tenant=company-a: {resp.status_code}")

    # Test 3: Can manage own tenant users
    resp = requests.get(f"{BASE_URL}/accounts/", headers=headers)
    print(f"GET /accounts/ (filtered to tenant): {resp.status_code}")

    # Test 4: Cannot create new tenant
    resp = requests.post(
        f"{BASE_URL}/tenants/",
        json={"name": "Hacker Tenant", "slug": "hacker"},
        headers=headers
    )
    print(f"POST /tenants/ (should fail): {resp.status_code}")

    # Test 5: Can create user in own tenant
    import random
    resp = requests.post(
        f"{BASE_URL}/accounts/",
        json={
            "username": f"user_{random.randint(1000, 9999)}",
            "email": f"test_{random.randint(1000, 9999)}@test.com",
            "password": "test123",
            "role": "user"
        },
        headers=headers
    )
    print(f"POST /accounts/ (create user): {resp.status_code}")

    # Test 6: Get user role
    resp = requests.get(f"{BASE_URL}/me/", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"User role: {data.get('role')}, tenant: {data.get('tenant')}")


def test_regular_user():
    """Test regular user permissions"""
    print_header("Testing REGULAR USER")

    # First, get a regular user token
    User = get_user_model()
    user = User.objects.filter(
        profile__tenant__slug="tmtd",
        profile__role="user"
    ).first()

    if not user:
        print("No regular user found, creating one...")
        from users.models import UserProfile
        from tenants.models import Tenant
        tenant = Tenant.objects.filter(slug="tmtd").first()
        user = User.objects.create_user(
            username="testuser",
            email="testuser@tmtd.com",
            password="test123"
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.tenant = tenant
        profile.role = "user"
        profile.save()

    tokens = get_tokens("testuser", "test123")
    if not tokens:
        return

    access = tokens["access"]
    headers = {"Authorization": f"Bearer {access}"}

    # Test 1: Can view products
    resp = requests.get(f"{BASE_URL}/xe/", headers=headers)
    print(f"GET /xe/: {resp.status_code}")

    # Test 2: Cannot create products
    resp = requests.post(
        f"{BASE_URL}/xe/",
        json={"ma_xe": "TEST001", "ten_xe": "Test", "gia": 100, "so_luong": 10},
        headers=headers
    )
    print(f"POST /xe/ (should fail): {resp.status_code}")

    # Test 3: Cannot access admin endpoints
    resp = requests.get(f"{BASE_URL}/accounts/", headers=headers)
    print(f"GET /accounts/ (should fail): {resp.status_code}")

    # Test 4: Cannot access analytics
    resp = requests.get(f"{BASE_URL}/thongke/doanhthu-homnay/", headers=headers)
    print(f"GET /thongke/ (should fail): {resp.status_code}")

    # Test 5: Can create order
    resp = requests.get(f"{BASE_URL}/order/", headers=headers)
    print(f"GET /order/ (own orders): {resp.status_code}")

    # Test 6: Get user role
    resp = requests.get(f"{BASE_URL}/me/", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"User role: {data.get('role')}, tenant: {data.get('tenant')}")


def test_tenant_isolation():
    """Test that data is properly isolated between tenants"""
    print_header("Testing TENANT ISOLATION")

    # Create a car in TMTD tenant
    tokens = get_tokens("admin_tmtd", "admin123")
    access = tokens["access"]
    headers = {"Authorization": f"Bearer {access}"}

    # Create car for TMTD
    resp = requests.post(
        f"{BASE_URL}/xe/",
        json={
            "ma_xe": "TMTD001",
            "ten_xe": "Xe TMTD",
            "gia": 500000000,
            "so_luong": 10,
            "loai_xe": "sedan",
            "mau_sac": "Đen"
        },
        headers=headers
    )
    print(f"Create car in TMTD: {resp.status_code}")

    # Switch to Company A and try to see TMTD's car
    tokens_a = get_tokens("admin_company-a", "admin123")
    access_a = tokens_a["access"]
    headers_a = {"Authorization": f"Bearer {access_a}"}

    resp = requests.get(f"{BASE_URL}/xe/TMTD001/", headers=headers_a)
    print(f"Company A access TMTD car: {resp.status_code}")

    # Create car for Company A
    resp = requests.post(
        f"{BASE_URL}/xe/",
        json={
            "ma_xe": "COMPA001",
            "ten_xe": "Xe Company A",
            "gia": 300000000,
            "so_luong": 5,
            "loai_xe": "suv",
            "mau_sac": "Trắng"
        },
        headers=headers_a
    )
    print(f"Create car in Company A: {resp.status_code}")

    # Verify Company A sees only their own cars
    resp = requests.get(f"{BASE_URL}/xe/", headers=headers_a)
    if resp.status_code == 200:
        count = len(resp.json().get("results", []))
        print(f"Company A sees {count} cars")


if __name__ == "__main__":
    print("\n" + "#" * 60)
    print("#  MULTI-TENANT RBAC TEST SUITE")
    print("#" * 60)

    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/schema/", timeout=2)
    except Exception:
        print("\nERROR: Server not running at http://127.0.0.1:8000")
        print("Please start the server first: python manage.py runserver")
        sys.exit(1)

    test_super_admin()
    test_tenant_admin()
    test_regular_user()
    test_tenant_isolation()

    print("\n" + "=" * 60)
    print("  ALL TESTS COMPLETED")
    print("=" * 60 + "\n")
