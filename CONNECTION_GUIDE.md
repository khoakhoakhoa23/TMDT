# Hướng dẫn kết nối Frontend và Backend

## 📋 Yêu cầu

- Backend Django chạy trên `http://127.0.0.1:8000`
- Frontend React/Vite chạy trên `http://localhost:5173` (hoặc port khác)

## 🔧 Cấu hình Backend

### 1. CORS Settings
Backend đã được cấu hình để cho phép CORS từ frontend:
- Trong development mode, tất cả origins đều được cho phép
- CORS headers đã được cấu hình đầy đủ

### 2. Permissions
- **Public endpoints** (không cần authentication):
  - `GET /api/xe/` - List và retrieve xe
  - `GET /api/loaixe/` - List và retrieve loại xe
  - `POST /api/register/` - Đăng ký
  - `POST /api/login/` - Đăng nhập

- **Protected endpoints** (cần authentication):
  - `POST /api/order/` - Tạo đơn hàng
  - `GET /api/order/` - Lấy danh sách đơn hàng
  - `GET /api/me/` - Lấy thông tin user
  - Tất cả các endpoints khác cần admin

## 🔧 Cấu hình Frontend

### 1. Environment Variables
Tạo file `.env` trong thư mục `frontend/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/
```

### 2. API Base URL
Frontend đã được cấu hình để sử dụng:
- Default: `http://127.0.0.1:8000/api/`
- Có thể override bằng environment variable `VITE_API_BASE_URL`

## 🚀 Chạy ứng dụng

### Backend
```bash
cd backend/server
python manage.py runserver
```
Backend sẽ chạy trên `http://127.0.0.1:8000`

### Frontend
```bash
cd frontend
npm install  # Nếu chưa install dependencies
npm run dev
```
Frontend sẽ chạy trên `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

## 🔐 Authentication Flow

### 1. Đăng ký
```javascript
POST /api/register/
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Đăng nhập
```javascript
POST /api/login/
{
  "username": "user123",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Frontend sẽ tự động lưu tokens vào `localStorage`:
- `access_token` - Dùng cho các API calls
- `refresh_token` - Dùng để refresh access token

### 3. Sử dụng Token
Frontend tự động gắn token vào header:
```
Authorization: Bearer <access_token>
```

### 4. Token Refresh
Khi access token hết hạn (401), frontend tự động:
1. Gọi `/api/refresh/` với refresh token
2. Lấy access token mới
3. Retry request ban đầu

## 📡 API Endpoints chính

### Xe (Cars)
- `GET /api/xe/` - Lấy danh sách xe (public)
- `GET /api/xe/{id}/` - Lấy chi tiết xe (public)
- `POST /api/xe/` - Tạo xe mới (admin only)
- `PUT /api/xe/{id}/` - Cập nhật xe (admin only)
- `DELETE /api/xe/{id}/` - Xóa xe (admin only)

### Loại Xe (Categories)
- `GET /api/loaixe/` - Lấy danh sách loại xe (public)
- `GET /api/loaixe/{id}/` - Lấy chi tiết loại xe (public)

### Orders
- `POST /api/order/` - Tạo đơn hàng (authenticated)
- `GET /api/order/` - Lấy danh sách đơn hàng (authenticated)
- `GET /api/order/{id}/` - Lấy chi tiết đơn hàng (authenticated)

### Cart
- `GET /api/cart/` - Lấy giỏ hàng
- `POST /api/cart/` - Tạo giỏ hàng
- `POST /api/cart-item/` - Thêm item vào giỏ
- `DELETE /api/cart-item/{id}/` - Xóa item khỏi giỏ

### Statistics
- `GET /api/thongke/doanhthu-homnay/` - Doanh thu hôm nay
- `GET /api/thongke/tong-xe-da-ban/` - Tổng xe đã bán
- `GET /api/thongke/top-xe-ban-chay/` - Top xe bán chạy

## 🐛 Troubleshooting

### CORS Error
Nếu gặp lỗi CORS:
1. Kiểm tra backend đã chạy chưa
2. Kiểm tra `CORS_ALLOWED_ORIGINS` trong `settings.py`
3. Trong development, `CORS_ALLOW_ALL_ORIGINS = True` đã được bật

### 401 Unauthorized
- Kiểm tra token có trong `localStorage` không
- Kiểm tra token có hết hạn không
- Frontend sẽ tự động refresh token nếu có refresh_token

### 404 Not Found
- Kiểm tra API endpoint có đúng không
- Kiểm tra backend có chạy không
- Kiểm tra `baseURL` trong `axiosClient.js`

### 500 Internal Server Error
- Kiểm tra backend logs
- Kiểm tra database connection
- Kiểm tra migrations đã chạy chưa: `python manage.py migrate`

## 📝 Notes

1. **Price Calculation**: 
   - Backend ưu tiên `gia_thue` cho thuê xe
   - Nếu không có `gia_thue`, sẽ dùng `gia_khuyen_mai`
   - Cuối cùng mới dùng `gia`

2. **Order Creation**:
   - Cần gửi `items` array với `xe` (ma_xe), `quantity`, `price_at_purchase`
   - Có thể gửi thêm các trường thuê xe: `start_date`, `end_date`, `pickup_location`, `return_location`, `rental_days`

3. **Pagination**:
   - Mặc định mỗi page có 10 items
   - Có thể dùng `?page=2` để lấy page tiếp theo

4. **Search**:
   - Xe có thể search theo: `ten_xe`, `mau_sac`, `loai_xe__ten_loai`, `seo_keywords`
   - Dùng query param: `?search=keyword`

