#!/usr/bin/env python
"""
Test script cho Wishlist và Coupon API endpoints
"""
import os
import sys

# Add the parent directory to the path to access the Django project
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server'))

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

print("🚀 TESTING TMDT API ENDPOINTS")
print("=" * 60)

# Test basic imports
try:
    from django.contrib.auth.models import User
    from products.models import LoaiXe, Xe, Wishlist
    from orders.models import Coupon
    print("✅ Django models imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Test database connection
try:
    from django.db import connection
    cursor = connection.cursor()
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    sys.exit(1)

# Test Wishlist model
try:
    # Create test data
    user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
    loai_xe = LoaiXe.objects.create(ma_loai="SUV", ten_loai="SUV")
    xe = Xe.objects.create(
        ma_xe="X001",
        ten_xe="Test Car",
        slug="test-car",
        gia=500000000,
        gia_thue=500000,
        so_luong=5,
        mau_sac="Đỏ",
        loai_xe=loai_xe,
        trang_thai="in_stock"
    )
    print("✅ Test data created successfully")
except Exception as e:
    print(f"❌ Failed to create test data: {e}")
    sys.exit(1)

# Test Wishlist operations
try:
    # Test add to wishlist
    wishlist_item = Wishlist.objects.create(user=user, xe=xe)
    print("✅ Wishlist item created successfully")

    # Test retrieve wishlist
    wishlist_items = Wishlist.objects.filter(user=user)
    if wishlist_items.count() == 1:
        print("✅ Wishlist retrieval successful")
    else:
        print(f"❌ Wishlist retrieval failed: expected 1, got {wishlist_items.count()}")

    # Test delete from wishlist
    wishlist_item.delete()
    remaining = Wishlist.objects.filter(user=user).count()
    if remaining == 0:
        print("✅ Wishlist item deleted successfully")
    else:
        print(f"❌ Wishlist deletion failed: {remaining} items remaining")

except Exception as e:
    print(f"❌ Wishlist operations failed: {e}")

# Test Coupon model
try:
    coupon = Coupon.objects.create(
        code="TEST10",
        description="Giảm 10%",
        discount_type="percentage",
        discount_value=10,
        min_order_value=100000,
        usage_limit=100,
        used_count=0,
        is_active=True
    )
    print("✅ Coupon created successfully")

    # Test coupon validation logic
    if coupon.is_valid():
        print("✅ Coupon validation logic works")
    else:
        print("❌ Coupon validation logic failed")

    # Test discount calculation
    discount = coupon.calculate_discount(500000)  # 10% of 500k = 50k
    if discount == 50000:
        print("✅ Coupon discount calculation works")
    else:
        print(f"❌ Coupon discount calculation failed: expected 50000, got {discount}")

except Exception as e:
    print(f"❌ Coupon operations failed: {e}")

# Cleanup
try:
    user.delete()
    xe.delete()
    loai_xe.delete()
    coupon.delete()
    print("✅ Test data cleanup successful")
except Exception as e:
    print(f"❌ Test data cleanup failed: {e}")

print("\n" + "=" * 60)
print("🎉 BASIC MODEL TESTS COMPLETED!")
print("\n📋 RECOMMENDATIONS:")
print("1. Run Django server: cd backend/server && python manage.py runserver")
print("2. Test API endpoints manually using Postman or browser")
print("3. Run full test suite: python manage.py test tests.api.tests")
print("4. Check frontend integration with API calls")
