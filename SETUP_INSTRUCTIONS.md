# Hướng dẫn Setup và Kết nối FE-BE

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend/server

# Tạo virtual environment (nếu chưa có)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Chạy migrations
python manage.py migrate

# Tạo superuser (optional)
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

Backend sẽ chạy trên: `http://127.0.0.1:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Tạo file .env (optional, có thể dùng default)
# Copy từ .env.example nếu có

# Chạy dev server
npm run dev
```

Frontend sẽ chạy trên: `http://localhost:5173` (hoặc port khác)

## ✅ Kiểm tra kết nối

### 1. Test Backend API
Mở browser và truy cập:
- API Docs: `http://127.0.0.1:8000/api/docs/`
- Admin: `http://127.0.0.1:8000/admin/`

### 2. Test Frontend
- Mở `http://localhost:5173`
- Thử đăng ký/đăng nhập
- Xem danh sách xe

### 3. Test API từ Frontend
Mở Browser DevTools (F12) → Network tab:
- Xem các API calls
- Kiểm tra status codes
- Kiểm tra request/response

## 🔧 Cấu hình đã được thiết lập

### Backend
✅ CORS đã được cấu hình để cho phép frontend
✅ Permissions đã được điều chỉnh (public cho list/retrieve xe)
✅ Order creation đã hỗ trợ các trường thuê xe
✅ Price calculation ưu tiên `gia_thue`

### Frontend
✅ Axios client đã được cấu hình với baseURL
✅ Auto token injection vào headers
✅ Auto token refresh khi hết hạn
✅ Error handling và retry logic

## 📝 API Endpoints chính

### Authentication
- `POST /api/register/` - Đăng ký
- `POST /api/login/` - Đăng nhập
- `POST /api/refresh/` - Refresh token
- `GET /api/me/` - Lấy thông tin user

### Cars
- `GET /api/xe/` - Danh sách xe (public)
- `GET /api/xe/{id}/` - Chi tiết xe (public)
- `GET /api/loaixe/` - Danh sách loại xe (public)

### Orders
- `POST /api/order/` - Tạo đơn hàng (authenticated)
- `GET /api/order/` - Danh sách đơn hàng (authenticated)

### Statistics
- `GET /api/thongke/doanhthu-homnay/` - Doanh thu hôm nay
- `GET /api/thongke/tong-xe-da-ban/` - Tổng xe đã bán
- `GET /api/thongke/top-xe-ban-chay/` - Top xe bán chạy

## 🐛 Troubleshooting

### Lỗi CORS
- Đảm bảo backend đang chạy
- Kiểm tra `CORS_ALLOWED_ORIGINS` trong settings.py
- Trong development, `CORS_ALLOW_ALL_ORIGINS = True` đã được bật

### Lỗi 401 Unauthorized
- Kiểm tra token trong localStorage
- Thử đăng nhập lại
- Kiểm tra token có hết hạn không

### Lỗi 404 Not Found
- Kiểm tra API endpoint có đúng không
- Kiểm tra backend có chạy không
- Kiểm tra baseURL trong axiosClient.js

### Lỗi 500 Internal Server Error
- Kiểm tra backend logs
- Kiểm tra database connection
- Chạy migrations: `python manage.py migrate`

## 📚 Tài liệu tham khảo

- Xem file `CONNECTION_GUIDE.md` để biết chi tiết về API
- Xem file `BACKEND_EVALUATION.md` để biết về cấu trúc backend
- Xem file `MIGRATION_SUMMARY.md` để biết về các migrations

