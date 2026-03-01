#!/usr/bin/env python
"""
Simple test script cho Coupon integration
"""
import sys
import os

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

try:
    import django
    django.setup()

    print("🚀 TESTING COUPON INTEGRATION")
    print("=" * 50)

    # Test imports
    try:
        from orders.models import Coupon
        from products.models import LoaiXe, Xe
        print("✅ Models imported successfully")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        sys.exit(1)

    # Test create coupon
    try:
        coupon = Coupon.objects.create(
            code="TEST10",
            description="Test coupon 10%",
            discount_type="percentage",
            discount_value=10,
            min_order_value=100000,
            usage_limit=100,
            used_count=0,
            is_active=True
        )
        print("✅ Coupon created successfully")
        print(f"   Code: {coupon.code}")
        print(f"   Discount: {coupon.discount_value}%")
        print(f"   Min order: {coupon.min_order_value}")

        # Test discount calculation
        discount = coupon.calculate_discount(500000)
        expected = 50000  # 10% of 500k
        if discount == expected:
            print(f"✅ Discount calculation correct: {discount}")
        else:
            print(f"❌ Discount calculation wrong: expected {expected}, got {discount}")

        # Cleanup
        coupon.delete()
        print("✅ Test cleanup completed")

    except Exception as e:
        print(f"❌ Coupon test failed: {e}")

    print("\n" + "=" * 50)
    print("🎉 BASIC COUPON TESTS COMPLETED!")
    print("\n📋 NEXT STEPS:")
    print("1. Start Django server: cd backend/server && python manage.py runserver")
    print("2. Test API endpoints with Postman")
    print("3. Test frontend integration")
    print("4. Run full test suite: python manage.py test tests.api.tests")

except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)





