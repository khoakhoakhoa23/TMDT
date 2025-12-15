# 🖼️ Hệ Thống Avatar Đồng Bộ - Hướng Dẫn

## ✅ Đã Hoàn Thành

### Backend

1. **Model**: `UserProfile` đã có sẵn với trường `avatar`
2. **API Endpoints**:
   - `GET /api/users/me/` - Lấy thông tin user đầy đủ + avatar
   - `POST /api/users/upload-avatar/` - Upload avatar mới
3. **Serializer**: `UserSerializer` đã có `avatar_url` field
4. **Admin**: Đã đăng ký `UserProfile` trong Django admin

### Frontend

1. **AuthContext**: 
   - Đã cập nhật để fetch user với avatar từ `/api/users/me/`
   - Có function `refreshUser()` để refresh user data
2. **AvatarUploader Component**: Component mới để upload avatar
3. **Header**: Đã cập nhật để hiển thị avatar từ context
4. **ProfilePage**: Đã tích hợp AvatarUploader

---

## 📋 Cách Sử Dụng

### 1. Backend - Chạy Migrations

```bash
cd backend/server
python manage.py migrate users
```

### 2. Frontend - Sử dụng Avatar

#### Trong Header:
Avatar tự động hiển thị từ `AuthContext`:
```jsx
const { user } = useAuth();
// user.avatar_url sẽ có URL của avatar
```

#### Trong ProfilePage:
```jsx
<AvatarUploader
  currentAvatar={user?.avatar_url}
  onUpload={handleAvatarUpload}
  className="w-32 h-32 mx-auto"
/>
```

#### Upload Avatar:
```jsx
const handleAvatarUpload = async (formData) => {
  try {
    const response = await userApi.uploadAvatar(formData);
    await refreshUser(); // Đồng bộ với context
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

---

## 🔄 Đồng Bộ Avatar

Khi upload avatar ở bất kỳ đâu:
1. Gọi `userApi.uploadAvatar(formData)`
2. Gọi `refreshUser()` từ `AuthContext`
3. Avatar sẽ tự động cập nhật ở:
   - Header
   - ProfilePage
   - Bất kỳ component nào dùng `useAuth()`

---

## 📝 API Details

### GET /api/users/me/
**Response:**
```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "http://localhost:8000/media/avatars/avatar.jpg",
  "profile": {
    "avatar": "/media/avatars/avatar.jpg",
    "avatar_url": "http://localhost:8000/media/avatars/avatar.jpg",
    "phone": "0123456789",
    "address": "123 Main St",
    "date_of_birth": "1990-01-01",
    "gender": "male"
  }
}
```

### POST /api/users/upload-avatar/
**Request:**
- Content-Type: `multipart/form-data`
- Body: `{ "avatar": File }`

**Response:**
```json
{
  "id": 1,
  "username": "user123",
  "avatar_url": "http://localhost:8000/media/avatars/new_avatar.jpg",
  ...
}
```

---

## 🎨 AvatarUploader Component

### Props:
- `currentAvatar` (string): URL của avatar hiện tại
- `onUpload` (function): Callback khi upload thành công
- `className` (string): CSS classes

### Features:
- ✅ Preview trước khi upload
- ✅ Validate file type (JPEG, PNG, GIF, WebP)
- ✅ Validate file size (max 5MB)
- ✅ Loading state
- ✅ Error handling
- ✅ Fallback to initials nếu không có avatar

---

## 🚀 Testing

1. **Test Upload Avatar:**
   - Vào `/profile`
   - Click vào avatar
   - Chọn file ảnh
   - Avatar sẽ cập nhật ngay

2. **Test Đồng Bộ:**
   - Upload avatar ở ProfilePage
   - Kiểm tra Header có cập nhật không
   - Refresh page → Avatar vẫn còn

3. **Test Fallback:**
   - Xóa avatar trong database
   - Kiểm tra hiển thị initials

---

## 📂 Files Đã Tạo/Sửa

### Backend:
- ✅ `backend/server/users/models.py` - UserProfile model
- ✅ `backend/server/users/serializers.py` - UserSerializer với avatar_url
- ✅ `backend/server/users/views.py` - get_me(), upload_avatar()
- ✅ `backend/server/users/admin.py` - UserProfileAdmin
- ✅ `backend/server/api/urls.py` - Routes

### Frontend:
- ✅ `frontend/src/components/AvatarUploader.jsx` - Component mới
- ✅ `frontend/src/contexts/AuthContext.jsx` - refreshUser()
- ✅ `frontend/src/components/Header.jsx` - Hiển thị avatar
- ✅ `frontend/src/pages/ProfilePage.jsx` - AvatarUploader
- ✅ `frontend/src/api/authApi.js` - getMe()
- ✅ `frontend/src/api/userApi.js` - uploadAvatar()

---

## ⚠️ Lưu Ý

1. **Media Files**: Đảm bảo `MEDIA_ROOT` và `MEDIA_URL` đã được cấu hình trong `settings.py`
2. **CORS**: Đảm bảo CORS cho phép request từ frontend
3. **File Size**: Giới hạn 5MB, có thể thay đổi trong `upload_avatar()` view
4. **File Types**: Chỉ chấp nhận JPEG, PNG, GIF, WebP

---

## 🔧 Troubleshooting

### Avatar không hiển thị:
1. Kiểm tra `MEDIA_URL` trong settings.py
2. Kiểm tra `MEDIA_ROOT` có đúng không
3. Kiểm tra file có tồn tại trong `media/avatars/` không
4. Kiểm tra CORS settings

### Upload thất bại:
1. Kiểm tra file size < 5MB
2. Kiểm tra file type hợp lệ
3. Kiểm tra permissions của thư mục `media/avatars/`
4. Kiểm tra logs trong Django console

### Avatar không đồng bộ:
1. Đảm bảo gọi `refreshUser()` sau khi upload
2. Kiểm tra `AuthContext` có được dùng đúng không
3. Kiểm tra `user.avatar_url` có được cập nhật không

