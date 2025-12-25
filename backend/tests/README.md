# Tests Directory

Thư mục này chứa tất cả các file test cho backend.

## Cấu trúc

```
tests/
├── orders/
│   ├── tests.py              # Test cơ bản cho orders
│   └── tests_new_features.py # Test cho các tính năng mới
├── products/
│   └── tests.py              # Test cho products
├── users/
│   └── tests.py              # Test cho users
├── cart/
│   └── tests.py              # Test cho cart
├── payments/
│   └── tests.py              # Test cho payments
├── core/
│   └── tests.py              # Test cho core
├── api/
│   └── tests.py              # Test cho api
└── analytics/
    └── tests.py              # Test cho analytics
```

## Chạy tests

### Chạy tất cả tests
```bash
cd backend/server
python manage.py test tests
```

### Chạy tests cho một app cụ thể
```bash
cd backend/server
python manage.py test tests.orders
python manage.py test tests.products
python manage.py test tests.users
```

### Chạy một test class cụ thể
```bash
cd backend/server
python manage.py test tests.orders.tests_new_features.ScheduleConflictTest
```

### Chạy một test method cụ thể
```bash
cd backend/server
python manage.py test tests.orders.tests_new_features.ScheduleConflictTest.test_no_conflict_different_dates
```

## Lưu ý

- Tất cả imports trong các file test đã được cập nhật để sử dụng `server.` prefix
- Ví dụ: `from products.models import Xe` → `from server.products.models import Xe`
- Đảm bảo bạn đang ở trong thư mục `backend/server` khi chạy tests

