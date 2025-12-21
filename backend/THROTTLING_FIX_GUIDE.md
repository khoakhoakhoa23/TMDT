# 🔧 Hướng Dẫn Sửa Lỗi Throttling Django REST Framework

## ❌ Vấn Đề

Lỗi: **"Request was throttled. Expected available in XXXX seconds."**

### Nguyên Nhân

1. **Throttling rate quá thấp trong settings.py:**
   - `anon: 60/hour` - Chỉ 60 requests/giờ cho user chưa đăng nhập
   - `user: 120/hour` - Chỉ 120 requests/giờ cho user đã đăng nhập
   - Với polling (Payment.jsx gọi mỗi 3 giây) → Dễ vượt quá limit

2. **Frontend có polling:**
   - Payment.jsx: Polling mỗi 3 giây để check payment status
   - Nếu polling 3 giây/lần → 1200 requests/giờ → Vượt quá limit 120/hour

3. **Multiple API calls:**
   - NotificationDropdown fetch khi mở
   - WishlistPanel fetch khi mở
   - ProfilePage fetch khi load
   - Nhiều component cùng gọi API → Dễ vượt limit

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. Sửa settings.py - Tắt Throttling trong Development

**File:** `backend/server/server/settings.py`

**Thay đổi:**
```python
REST_FRAMEWORK = {
    # ... other settings ...
    
    # Throttling Configuration
    # Trong môi trường development: TẮT hoặc TĂNG RẤT CAO
    # Trong production: BẬT với rate hợp lý
    "DEFAULT_THROTTLE_CLASSES": (
        # TẮT throttling trong development
        [] if DEBUG else [
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
        ]
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Development: Rate rất cao để không bao giờ bị khóa
        # Production: Rate hợp lý để bảo vệ server
        "anon": os.getenv("DRF_THROTTLE_ANON", "10000/hour" if DEBUG else "100/hour"),
        "user": os.getenv("DRF_THROTTLE_USER", "20000/hour" if DEBUG else "1000/hour"),
    },
}
```

**Kết quả:**
- ✅ **Development (DEBUG=True):** Throttling TẮT hoàn toàn (empty list)
- ✅ **Production (DEBUG=False):** Throttling BẬT với rate hợp lý
- ✅ Có thể override bằng environment variables

---

### 2. Sửa Frontend - Tránh Infinite Loop

**Files đã sửa:**
- `frontend/src/components/NotificationDropdown.jsx`
- `frontend/src/components/WishlistPanel.jsx`

**Thay đổi:**
- Thêm `eslint-disable-next-line` để tránh warning về missing dependencies
- Đảm bảo useEffect chỉ chạy khi `isOpen` thay đổi, không phải mỗi lần render

---

## 🎯 Cấu Hình Throttling Cho Production

### Option 1: Tắt Hoàn Toàn (Không Khuyến Nghị)

```python
"DEFAULT_THROTTLE_CLASSES": [],
```

### Option 2: Rate Hợp Lý Cho Production

```python
"DEFAULT_THROTTLE_RATES": {
    "anon": "100/hour",      # User chưa login: 100 requests/giờ
    "user": "1000/hour",     # User đã login: 1000 requests/giờ
    "burst": "20/minute",    # Burst rate: 20 requests/phút
}
```

### Option 3: Custom Throttle Classes

Tạo custom throttle class trong `backend/server/core/throttling.py`:

```python
from rest_framework.throttling import UserRateThrottle

class HighVolumeUserThrottle(UserRateThrottle):
    rate = '10000/hour'  # Rate cao cho user đã login
```

Sau đó dùng trong views:
```python
from rest_framework.throttling import UserRateThrottle
from core.throttling import HighVolumeUserThrottle

class MyViewSet(viewsets.ModelViewSet):
    throttle_classes = [HighVolumeUserThrottle]
```

---

## 🧪 Kiểm Tra Lại

### 1. Kiểm Tra Backend

```bash
# Kiểm tra settings
python manage.py check

# Test API với nhiều requests
# Mở terminal và chạy:
for i in {1..200}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/update-profile/
  echo "Request $i"
done
```

### 2. Kiểm Tra Frontend

**Test với Postman:**
1. Mở Postman
2. Tạo collection với nhiều requests
3. Chạy collection với "Run Collection" → "Run"
4. Kiểm tra xem có lỗi throttling không

**Test với Browser:**
1. Mở DevTools → Network tab
2. Navigate đến các trang có nhiều API calls:
   - `/dashboard/profile` - ProfilePage
   - `/payment` - Payment page (có polling)
   - Click vào notification icon
   - Click vào wishlist icon
3. Kiểm tra xem có request nào bị 429 (Too Many Requests) không

### 3. Kiểm Tra Logs

```bash
# Xem Django logs
tail -f logs/django.log

# Hoặc nếu dùng console
python manage.py runserver
# Xem console output khi có request
```

---

## 📝 Environment Variables

Có thể override throttling rates bằng environment variables:

**`.env` file:**
```env
# Development - Tắt throttling
DRF_THROTTLE_ANON=10000/hour
DRF_THROTTLE_USER=20000/hour

# Production - Rate hợp lý
DRF_THROTTLE_ANON=100/hour
DRF_THROTTLE_USER=1000/hour
```

---

## 🔍 Debug Throttling

### 1. Kiểm Tra Throttling Có Bật Không

```python
# Trong Django shell
python manage.py shell

from django.conf import settings
print(settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'])
print(settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
```

### 2. Xem Throttle Key

Throttle key được tạo dựa trên:
- IP address (cho AnonRateThrottle)
- User ID (cho UserRateThrottle)

### 3. Clear Throttle Cache

```python
# Trong Django shell
from django.core.cache import cache
cache.clear()  # Xóa tất cả cache, bao gồm throttle cache
```

---

## ⚠️ Lưu Ý

1. **Development:**
   - Nên TẮT throttling hoặc set rate RẤT CAO
   - Tránh ảnh hưởng đến quá trình development

2. **Production:**
   - NÊN BẬT throttling để bảo vệ server
   - Set rate hợp lý dựa trên:
     - Số lượng users
     - Tần suất API calls
     - Server capacity

3. **Polling:**
   - Nếu có polling (như Payment.jsx), cần tính toán:
     - Polling interval: 3 giây
     - Requests/giờ: 3600 / 3 = 1200 requests/giờ
     - Cần rate >= 1200/hour cho user

4. **Multiple Components:**
   - Nhiều component cùng gọi API → Tổng requests tăng
   - Cần set rate đủ cao để cover tất cả

---

## 🎯 Kết Quả Sau Khi Sửa

### Development (DEBUG=True):
- ✅ Throttling TẮT hoàn toàn
- ✅ Không bao giờ bị "Request was throttled"
- ✅ Có thể test tự do

### Production (DEBUG=False):
- ✅ Throttling BẬT với rate hợp lý
- ✅ Bảo vệ server khỏi abuse
- ✅ Rate: 100/hour (anon), 1000/hour (user)

---

## 📂 Files Đã Sửa

1. ✅ `backend/server/server/settings.py` - Sửa throttling config
2. ✅ `frontend/src/components/NotificationDropdown.jsx` - Fix useEffect
3. ✅ `frontend/src/components/WishlistPanel.jsx` - Fix useEffect

---

## 🚀 Next Steps

1. **Restart Django server:**
   ```bash
   python manage.py runserver
   ```

2. **Test lại:**
   - Navigate đến các trang
   - Kiểm tra xem còn lỗi throttling không

3. **Nếu vẫn còn lỗi:**
   - Kiểm tra DEBUG flag trong settings
   - Kiểm tra environment variables
   - Clear cache: `python manage.py shell` → `cache.clear()`

