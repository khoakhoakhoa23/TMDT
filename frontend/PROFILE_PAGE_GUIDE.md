# 📋 Hướng Dẫn Tích Hợp Profile Page

## ✅ Đã Hoàn Thành

### Backend APIs

1. **GET/PUT `/api/users/update-profile/`**
   - Lấy và cập nhật thông tin profile của user hiện tại
   - Fields: `first_name`, `last_name`, `email`, `username`
   - Không cho phép user tự thay đổi role

2. **POST `/api/users/change-password/`**
   - Đổi mật khẩu
   - Body: `{ old_password, new_password, confirm_password }`
   - Validation: mật khẩu mới phải có ít nhất 8 ký tự

### Frontend Components

1. **ProfilePage.jsx** - Trang chính
   - Hiển thị thông tin cá nhân
   - Tích hợp Notifications và Wishlist
   - Layout 2 cột: Profile Info (trái) + Rental History (phải)

2. **EditProfileModal.jsx** - Modal cập nhật thông tin
   - Form với validation
   - Toast notifications

3. **ChangePasswordModal.jsx** - Modal đổi mật khẩu
   - Validation mạnh (8 ký tự, chữ hoa, chữ thường, số)
   - Show/hide password

4. **RentalHistory.jsx** - Lịch sử thuê xe
   - Hiển thị danh sách orders
   - Status badges
   - Xem chi tiết

5. **NotificationDropdown.jsx** - Đã có sẵn
   - Tích hợp vào ProfilePage

6. **WishlistPanel.jsx** - Đã có sẵn
   - Tích hợp vào ProfilePage

## 🔌 Tích Hợp Vào Routes

Thêm route cho ProfilePage trong file routes của bạn:

```jsx
// Ví dụ trong App.jsx hoặc routes file
import ProfilePage from "./pages/ProfilePage";

// Thêm route
<Route path="/profile" element={<ProfilePage />} />
```

Hoặc nếu dùng MainLayout:

```jsx
<Route path="/profile" element={<MainLayout />}>
  <Route index element={<ProfilePage />} />
</Route>
```

## 📝 API Endpoints Sử Dụng

### 1. Get Profile
```javascript
GET /api/users/update-profile/
Headers: { Authorization: "Bearer <token>" }
Response: {
  id: 1,
  username: "user123",
  email: "user@example.com",
  first_name: "Nguyen",
  last_name: "Van A",
  role: "user",
  is_active: true,
  date_joined: "2025-01-01 10:00:00"
}
```

### 2. Update Profile
```javascript
PUT /api/users/update-profile/
Headers: { Authorization: "Bearer <token>" }
Body: {
  first_name: "Nguyen",
  last_name: "Van A",
  email: "newemail@example.com",
  username: "newusername"
}
Response: { ...user data }
```

### 3. Change Password
```javascript
POST /api/users/change-password/
Headers: { Authorization: "Bearer <token>" }
Body: {
  old_password: "oldpass123",
  new_password: "NewPass123",
  confirm_password: "NewPass123"
}
Response: { detail: "Đổi mật khẩu thành công." }
```

### 4. Get Orders (Rental History)
```javascript
GET /api/order/
Headers: { Authorization: "Bearer <token>" }
Response: [
  {
    id: 1,
    status: "completed",
    total_price: 800000,
    start_date: "2025-01-01",
    end_date: "2025-01-05",
    rental_days: 4,
    pickup_location: "Hà Nội",
    items: [
      {
        xe: {
          ma_xe: "X001",
          ten_xe: "Koenigsegg",
          image_url: "..."
        }
      }
    ]
  }
]
```

### 5. Get Notifications
```javascript
GET /api/notifications/
Headers: { Authorization: "Bearer <token>" }
Response: [
  {
    id: 1,
    type: "payment_success",
    title: "Thanh toán thành công",
    message: "Đơn hàng #123 đã được thanh toán",
    read: false,
    order_id: 123,
    created_at: "2025-01-01T10:00:00Z"
  }
]
```

### 6. Get Wishlist
```javascript
// Hiện tại dùng localStorage
// Khi có backend API:
GET /api/wishlist/
Headers: { Authorization: "Bearer <token>" }
```

## 🎨 UI Features

### ProfilePage
- ✅ Avatar với button thay đổi ảnh
- ✅ Hiển thị đầy đủ thông tin: username, email, role, status
- ✅ Buttons: "Cập nhật thông tin", "Đổi mật khẩu"
- ✅ Notifications và Wishlist icons ở header
- ✅ Responsive layout

### EditProfileModal
- ✅ Form validation
- ✅ Error/Success messages
- ✅ Loading state
- ✅ Auto-close sau khi thành công

### ChangePasswordModal
- ✅ Strong password validation
- ✅ Show/hide password
- ✅ Confirm password matching
- ✅ Error handling

### RentalHistory
- ✅ Hiển thị danh sách orders
- ✅ Status badges với màu sắc
- ✅ Car images
- ✅ Date formatting
- ✅ Empty state
- ✅ Refresh button

## 🧪 Test

1. **Test Get Profile:**
   - Login → Navigate to `/profile`
   - Kiểm tra thông tin hiển thị đúng

2. **Test Update Profile:**
   - Click "Cập nhật thông tin"
   - Thay đổi thông tin → Save
   - Kiểm tra thông tin được cập nhật

3. **Test Change Password:**
   - Click "Đổi mật khẩu"
   - Nhập mật khẩu cũ, mới, xác nhận
   - Kiểm tra validation
   - Test với mật khẩu yếu → Phải báo lỗi

4. **Test Rental History:**
   - Kiểm tra danh sách orders hiển thị
   - Test empty state
   - Test refresh

5. **Test Notifications:**
   - Click icon chuông
   - Kiểm tra dropdown mở
   - Kiểm tra thông báo hiển thị

6. **Test Wishlist:**
   - Click icon trái tim
   - Kiểm tra panel mở
   - Kiểm tra danh sách xe yêu thích

## 📂 Files Đã Tạo

### Backend:
- ✅ `backend/server/users/views.py` - Thêm `update_profile()` và `change_password()`
- ✅ `backend/server/api/urls.py` - Thêm routes

### Frontend:
- ✅ `frontend/src/pages/ProfilePage.jsx`
- ✅ `frontend/src/components/EditProfileModal.jsx`
- ✅ `frontend/src/components/ChangePasswordModal.jsx`
- ✅ `frontend/src/components/RentalHistory.jsx`
- ✅ `frontend/src/api/userApi.js` - Thêm `getProfile()`, `updateProfile()`, `changePassword()`

## 🎯 Kết Quả

- ✅ Trang Profile hoàn chỉnh với đầy đủ tính năng
- ✅ UI đẹp, hiện đại, responsive
- ✅ Validation mạnh
- ✅ Error handling tốt
- ✅ Tích hợp Notifications và Wishlist
- ✅ Code sạch, dễ mở rộng

## 🔄 Next Steps (Tùy Chọn)

1. **Upload Avatar:**
   - Thêm API upload ảnh
   - Lưu avatar URL vào User model
   - Hiển thị avatar thật thay vì initial

2. **Thêm Fields:**
   - Phone number
   - Address
   - Date of birth
   - Gender
   - Cần thêm vào User model và serializer

3. **Email Verification:**
   - Gửi email xác nhận khi đổi email
   - Verify email trước khi cập nhật

4. **Two-Factor Authentication:**
   - Thêm 2FA cho bảo mật cao hơn

