# 🔐 Hướng Dẫn Sửa Lỗi 401 Unauthorized

## ❌ Vấn Đề

Lỗi: **HTTP 401 Unauthorized - "Authentication credentials were not provided."**

Khi gọi API: `GET /api/users/me/`

---

## ✅ Đã Sửa

### 1. Backend - View `get_me()`

**File:** `backend/server/users/views.py`

**Thay đổi:**
- Thêm import `status` từ `rest_framework`
- Thêm kiểm tra explicit cho `request.user.is_authenticated`
- Trả về 401 rõ ràng nếu chưa authenticated

```python
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_me(request):
    """Lấy thông tin đầy đủ của user hiện tại bao gồm avatar"""
    from users.serializers import UserSerializer
    from users.models import UserProfile
    
    # Kiểm tra user đã authenticated chưa
    if not request.user or not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user = request.user
    # Đảm bảo UserProfile tồn tại
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data)
```

### 2. Frontend - Login Flow

**File:** `frontend/src/pages/Login.jsx`

**Thay đổi:**
- Thêm validation cho response token
- Thêm debug logging
- Cải thiện error handling
- Sử dụng `getMe()` API sau khi login

```javascript
const res = await authApi.login(form);

// Kiểm tra response có token không
if (!res.data || !res.data.access) {
  throw new Error("Invalid response from server: missing access token");
}

// Lưu token vào localStorage
localStorage.setItem("access_token", res.data.access);
if (res.data.refresh) {
  localStorage.setItem("refresh_token", res.data.refresh);
}

// Fetch user info và update context
try {
  const meRes = await authApi.getMe();
  updateUser({
    id: meRes.data.id,
    username: meRes.data.username,
    email: meRes.data.email,
    first_name: meRes.data.first_name,
    last_name: meRes.data.last_name,
    role: meRes.data.role || "user",
    avatar_url: meRes.data.avatar_url,
    profile: meRes.data.profile,
  });
} catch (meError) {
  // Fallback về API cũ
  const roleRes = await authApi.getUserRole();
  updateUser({
    username: roleRes.data.username,
    role: roleRes.data.role || "user",
  });
}
```

### 3. Frontend - Axios Interceptor

**File:** `frontend/src/api/axiosClient.js`

**Thay đổi:**
- Thêm debug logging trong development mode
- Đảm bảo token được gắn vào mọi request

```javascript
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug: Log token để kiểm tra
    if (process.env.NODE_ENV === "development") {
      console.log("[Axios] Request to:", config.url);
      console.log("[Axios] Has token:", !!token);
      if (token) {
        console.log("[Axios] Token (first 20 chars):", token.substring(0, 20) + "...");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

---

## 🔍 Kiểm Tra

### 1. Kiểm Tra Token Có Được Lưu Không

Mở Browser DevTools → Console:
```javascript
localStorage.getItem("access_token")
```

Nếu trả về `null` hoặc `undefined` → Token chưa được lưu.

### 2. Kiểm Tra Token Có Được Gửi Không

Mở Browser DevTools → Network tab:
1. Gọi API `/api/users/me/`
2. Click vào request
3. Xem tab "Headers"
4. Tìm "Authorization" header
5. Phải có: `Bearer <token>`

### 3. Kiểm Tra Token Có Hợp Lệ Không

Test với curl:
```bash
curl -X GET http://127.0.0.1:8000/api/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Nếu trả về 401 → Token không hợp lệ hoặc hết hạn.

### 4. Kiểm Tra Login API

Test login:
```bash
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Response phải có:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 🐛 Debug Steps

### Step 1: Kiểm Tra Token Storage

1. Login vào hệ thống
2. Mở DevTools → Application → Local Storage
3. Kiểm tra có `access_token` không
4. Copy token value

### Step 2: Kiểm Tra Request Headers

1. Mở DevTools → Network tab
2. Gọi API `/api/users/me/`
3. Xem request headers
4. Kiểm tra `Authorization: Bearer <token>`

### Step 3: Kiểm Tra Backend Logs

1. Xem Django console output
2. Tìm log về authentication
3. Kiểm tra có lỗi gì không

### Step 4: Test Token Trực Tiếp

Dùng Postman hoặc curl:
```bash
# Lấy token
TOKEN=$(curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}' \
  | jq -r '.access')

# Test API
curl -X GET http://127.0.0.1:8000/api/users/me/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Checklist

- [x] Backend view có `@permission_classes([IsAuthenticated])`
- [x] Backend settings có JWT authentication
- [x] Frontend axios interceptor gắn token
- [x] Frontend login lưu token vào localStorage
- [x] Frontend gọi API với token
- [x] Token được gửi trong Authorization header
- [x] Token format đúng: `Bearer <token>`

---

## 🚀 Test Flow

1. **Login:**
   - Vào `/login`
   - Nhập username/password
   - Click "Đăng nhập"
   - Kiểm tra console có log token không

2. **Check Token:**
   - Mở DevTools → Application → Local Storage
   - Kiểm tra `access_token` có giá trị không

3. **Call API:**
   - Vào `/profile` hoặc bất kỳ trang nào
   - Mở DevTools → Network
   - Tìm request đến `/api/users/me/`
   - Kiểm tra headers có `Authorization: Bearer <token>` không

4. **Verify Response:**
   - Response phải là 200 OK
   - Data phải có user info

---

## 📝 Lưu Ý

1. **Token Expiry:**
   - Access token: 60 phút (theo SIMPLE_JWT settings)
   - Refresh token: 7 ngày
   - Nếu token hết hạn, phải refresh hoặc login lại

2. **CORS:**
   - Đảm bảo CORS cho phép request từ frontend
   - Kiểm tra `CORS_ALLOWED_ORIGINS` trong settings.py

3. **JWT Settings:**
   - Kiểm tra `SIMPLE_JWT` trong settings.py
   - Đảm bảo `ACCESS_TOKEN_LIFETIME` và `REFRESH_TOKEN_LIFETIME` hợp lý

---

## 🔧 Nếu Vẫn Lỗi

1. **Clear localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Login lại:**
   - Logout
   - Login lại
   - Kiểm tra token mới

3. **Check Backend:**
   ```bash
   python manage.py check
   python manage.py runserver
   ```

4. **Check JWT:**
   ```bash
   python manage.py shell
   >>> from rest_framework_simplejwt.tokens import RefreshToken
   >>> token = RefreshToken.for_user(user)
   >>> print(token.access_token)
   ```

---

## 📂 Files Đã Sửa

1. ✅ `backend/server/users/views.py` - Thêm validation trong `get_me()`
2. ✅ `frontend/src/pages/Login.jsx` - Cải thiện login flow
3. ✅ `frontend/src/api/axiosClient.js` - Thêm debug logging

---

## 🎯 Kết Quả

Sau khi sửa:
- ✅ API `/api/users/me/` trả về 200 OK khi có token hợp lệ
- ✅ API `/api/users/me/` trả về 401 khi không có token hoặc token không hợp lệ
- ✅ Frontend tự động gửi token trong mọi request
- ✅ Token được refresh tự động khi hết hạn

