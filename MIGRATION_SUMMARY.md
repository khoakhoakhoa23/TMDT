# Tóm tắt Migration - Thêm trường thuê xe

## ✅ Đã hoàn thành

### 1. Model Xe - Thêm trường `gia_thue`
- **File**: `backend/server/products/product_models.py`
- **Thay đổi**: Thêm trường `gia_thue = models.IntegerField(default=0, help_text="Giá thuê mỗi ngày (VNĐ)")`
- **Migration**: `products/migrations/0002_xe_gia_thue.py`

### 2. Model Order - Thêm các trường thuê xe
- **File**: `backend/server/cart/commerce_models.py`
- **Các trường đã thêm**:
  - `start_date`: Ngày bắt đầu thuê xe
  - `end_date`: Ngày kết thúc thuê xe
  - `pickup_location`: Địa điểm nhận xe
  - `return_location`: Địa điểm trả xe
  - `rental_days`: Số ngày thuê
- **Migration**: `cart/migrations/0002_order_end_date_order_pickup_location_and_more.py`

### 3. Serializers - Cập nhật
- **File**: `backend/server/orders/serializers_commerce.py`
- Đã thêm các trường mới vào `OrderSerializer`

### 4. Admin - Cập nhật hiển thị
- **File**: `backend/server/products/admin.py`
  - Thêm `gia_thue` vào `list_display` của XeAdmin
- **File**: `backend/server/orders/admin.py`
  - Thêm `start_date`, `end_date`, `rental_days` vào `list_display` của OrderAdmin

### 5. Frontend - Cập nhật sử dụng trường mới
- **Components**: CarCard, RentalForm
- **Pages**: Detail, Payment, Dashboard
- Đã cập nhật để ưu tiên sử dụng `gia_thue` thay vì `gia`

## 📝 Cách sử dụng

### Backend API

#### Tạo Order với thông tin thuê xe:
```python
POST /api/order/
{
    "items": [{
        "xe": "MA_XE_001",
        "quantity": 1,
        "price_at_purchase": 500000
    }],
    "start_date": "2024-01-15",
    "end_date": "2024-01-20",
    "pickup_location": "123 Đường ABC, Quận 1, TP.HCM",
    "return_location": "123 Đường ABC, Quận 1, TP.HCM",
    "rental_days": 5,
    "total_price": 2500000
}
```

### Frontend

#### Sử dụng gia_thue:
```javascript
// Ưu tiên sử dụng gia_thue
const price = car.gia_thue || car.gia_khuyen_mai || car.gia;
```

## 🚀 Bước tiếp theo

1. **Chạy migration**:
   ```bash
   cd backend/server
   python manage.py migrate
   ```

2. **Cập nhật dữ liệu hiện có** (nếu cần):
   - Có thể cần set giá trị mặc định cho `gia_thue` của các Xe hiện có
   - Có thể cần cập nhật các Order cũ với thông tin thuê xe nếu cần

3. **Kiểm tra**:
   - Đảm bảo API hoạt động đúng với các trường mới
   - Kiểm tra validation và business logic

