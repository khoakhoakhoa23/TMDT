# ✅ Tóm Tắt Sửa Lỗi Throttling

## 🔍 Nguyên Nhân

1. **Throttling rate quá thấp:**
   - `anon: 60/hour` - Chỉ 60 requests/giờ
   - `user: 120/hour` - Chỉ 120 requests/giờ
   - Payment.jsx polling mỗi 3 giây → 1200 requests/giờ → Vượt quá limit

2. **Frontend có polling:**
   - Payment.jsx: Polling mỗi 3 giây
   - Nhiều component cùng gọi API

---

## ✅ Đã Sửa

### 1. Backend - settings.py

**File:** `backend/server/server/settings.py`

**Thay đổi:**
```python
"DEFAULT_THROTTLE_CLASSES": (
    # TẮT throttling trong development
    [] if DEBUG else [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ]
),
"DEFAULT_THROTTLE_RATES": {
    "anon": os.getenv("DRF_THROTTLE_ANON", "10000/hour" if DEBUG else "100/hour"),
    "user": os.getenv("DRF_THROTTLE_USER", "20000/hour" if DEBUG else "1000/hour"),
},
```

**Kết quả:**
- ✅ **Development (DEBUG=True):** Throttling TẮT hoàn toàn
- ✅ **Production (DEBUG=False):** Throttling BẬT với rate hợp lý

### 2. Frontend - axiosClient.js

**File:** `frontend/src/api/axiosClient.js`

**Thay đổi:**
- Thêm xử lý lỗi 429 (Throttled)
- Hiển thị warning message
- Không retry tự động (để component tự xử lý)

### 3. Frontend - Payment.jsx

**File:** `frontend/src/pages/Payment.jsx`

**Thay đổi:**
- Xử lý lỗi 429: Tăng interval từ 3 giây lên 10 giây khi bị throttled
- Tránh spam requests

### 4. Frontend - Components

**Files:**
- `frontend/src/components/NotificationDropdown.jsx`
- `frontend/src/components/WishlistPanel.jsx`

**Thay đổi:**
- Thêm eslint-disable để tránh warning
- Đảm bảo useEffect chỉ chạy khi cần

---

## 🚀 Cách Kiểm Tra

1. **Restart Django server:**
   ```bash
   python manage.py runserver
   ```

2. **Kiểm tra throttling đã tắt:**
   - Development: Throttling phải TẮT (empty list)
   - Test nhiều requests → Không bị lỗi 429

3. **Test với Postman:**
   - Gửi nhiều requests liên tiếp
   - Kiểm tra response không có 429

---

## 📝 Lưu Ý

- **Development:** Throttling TẮT → Có thể test tự do
- **Production:** Throttling BẬT → Bảo vệ server
- **Polling:** Payment.jsx vẫn polling, nhưng không bị throttled trong dev

