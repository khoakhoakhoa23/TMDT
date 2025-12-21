# Hướng dẫn cấu hình Google OAuth Login

## 📋 Tổng quan

Dự án đã được tích hợp đăng nhập bằng Google OAuth. Người dùng có thể đăng nhập bằng tài khoản Google của họ.

## 🔧 Cấu hình Backend

### 1. Cài đặt dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Thêm **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `http://127.0.0.1:5173` (development)
   - URL production của bạn (khi deploy)
7. Thêm **Authorized redirect URIs** (không cần thiết cho flow này nhưng có thể thêm):
   - `http://localhost:5173`
8. Copy **Client ID** (có dạng: `xxxxx.apps.googleusercontent.com`)

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/server/` (hoặc cập nhật file `.env` hiện có):

```env
# Google OAuth Settings
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Lưu ý:** Thay `your-google-client-id.apps.googleusercontent.com` bằng Client ID bạn đã copy từ Google Cloud Console.

## 🎨 Cấu hình Frontend

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `frontend/` (hoặc cập nhật file `.env` hiện có):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Lưu ý:** Sử dụng cùng Client ID như backend.

### 3. Khởi động ứng dụng

```bash
npm run dev
```

## 🚀 Cách sử dụng

1. Người dùng truy cập trang đăng nhập
2. Click nút **"Đăng nhập bằng Google"**
3. Chọn tài khoản Google
4. Hệ thống sẽ tự động:
   - Tạo tài khoản mới nếu chưa có (dựa trên email)
   - Đăng nhập và tạo JWT token
   - Chuyển hướng về trang chủ

## 🔍 Kiểm tra

### Backend API Endpoint

- **POST** `/api/google-login/`
- **Body:**
  ```json
  {
    "token": "google-access-token"
  }
  ```
- **Response:**
  ```json
  {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token",
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@gmail.com",
      ...
    }
  }
  ```

## ⚠️ Lưu ý quan trọng

1. **Client ID phải giống nhau** giữa frontend và backend
2. **Authorized JavaScript origins** phải bao gồm domain của frontend
3. Trong **production**, cần:
   - Thêm domain production vào Google OAuth settings
   - Sử dụng HTTPS
   - Cập nhật CORS settings trong backend

## 🐛 Troubleshooting

### Lỗi: "Google OAuth chưa được cấu hình"
- Kiểm tra `GOOGLE_CLIENT_ID` trong `.env` file của backend
- Đảm bảo đã restart server sau khi thêm biến môi trường

### Lỗi: "Token Google không hợp lệ"
- Kiểm tra Client ID trong frontend có đúng không
- Kiểm tra domain frontend có trong Authorized JavaScript origins không

### Lỗi: "Invalid origin"
- Thêm domain frontend vào **Authorized JavaScript origins** trong Google Cloud Console

### Lỗi CORS
- Kiểm tra `CORS_ALLOWED_ORIGINS` trong `settings.py`
- Đảm bảo domain frontend được thêm vào

## 📚 Tài liệu tham khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)




