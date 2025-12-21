# 📋 Hướng Dẫn Cập Nhật Header

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. ✅ Loại Bỏ Icon Cài Đặt
- Đã xóa hoàn toàn button Settings (icon bánh răng)
- Header giờ chỉ còn 3 icon: Wishlist, Notifications, Profile

### 2. ✅ NotificationDropdown Component
**File:** `frontend/src/components/NotificationDropdown.jsx`

**Tính năng:**
- Dropdown hiển thị danh sách thông báo
- Các loại thông báo:
  - 🕐 **Hết hạn thuê xe** (rental_expiry) - Icon màu cam
  - ✅ **Thanh toán thành công** (payment_success) - Icon màu xanh lá
  - 📄 **Cập nhật trạng thái đơn hàng** (order_status) - Icon màu xanh dương
  - ℹ️ **Thông báo hệ thống** (system) - Icon màu xám
- Hiển thị số thông báo chưa đọc (unread count)
- Đánh dấu đã đọc / đánh dấu tất cả đã đọc
- Format thời gian (ví dụ: "2 giờ trước", "Vừa xong")
- Click vào thông báo → Navigate đến dashboard
- Responsive, đẹp, có animation

### 3. ✅ WishlistPanel Component
**File:** `frontend/src/components/WishlistPanel.jsx`

**Tính năng:**
- Sidebar slide từ bên phải
- Hiển thị danh sách xe đã thả tim
- Mỗi item hiển thị:
  - Ảnh xe
  - Tên xe
  - Loại xe
  - Giá thuê
- Click vào xe → Navigate đến trang detail
- Button xóa khỏi wishlist (hiện khi hover)
- Empty state khi không có xe
- Backdrop overlay khi mở
- Responsive (full width trên mobile, 384px trên desktop)

### 4. ✅ API Files (Mock)
**Files:**
- `frontend/src/api/notificationApi.js` - API cho notifications
- `frontend/src/api/wishlistApi.js` - API cho wishlist

**Hiện tại:** Đang dùng mock data (Promise.resolve với mock data)
**Khi có backend:** Chỉ cần uncomment các dòng `return axiosClient...` và comment mock data

### 5. ✅ Header Component Đã Cập Nhật
**File:** `frontend/src/components/Header.jsx`

**Thay đổi:**
- Import NotificationDropdown và WishlistPanel
- Thêm state: `showNotifications`, `showWishlist`, `notificationCount`
- Xóa icon Settings
- Thêm logic toggle cho notifications và wishlist
- Tự động fetch notification count khi có token
- Click outside để đóng dropdown/panel

---

## 🔌 Kết Nối API Thật

### 1. Notification API

**File:** `frontend/src/api/notificationApi.js`

**Các endpoint cần có:**

```javascript
// 1. Lấy tất cả thông báo
GET /api/notifications/
Response: {
  results: [
    {
      id: 1,
      type: "rental_expiry" | "payment_success" | "order_status" | "system",
      title: "Tiêu đề",
      message: "Nội dung",
      read: false,
      created_at: "2025-12-15T10:00:00Z",
      order_id: 123  // optional
    }
  ]
}

// 2. Đánh dấu đã đọc
PATCH /api/notifications/{id}/read/

// 3. Đánh dấu tất cả đã đọc
POST /api/notifications/mark-all-read/

// 4. Xóa thông báo
DELETE /api/notifications/{id}/
```

**Cách kết nối:**
1. Mở `frontend/src/api/notificationApi.js`
2. Tìm các dòng có comment `// TODO: Thay thế bằng API thật`
3. Uncomment dòng `return axiosClient...`
4. Comment hoặc xóa phần mock data

**Ví dụ:**
```javascript
getAll() {
  // Xóa hoặc comment phần mock
  // return Promise.resolve({ data: { results: [...] } });
  
  // Uncomment dòng này
  return axiosClient.get("notifications/");
}
```

---

### 2. Wishlist API

**File:** `frontend/src/api/wishlistApi.js`

**Các endpoint cần có:**

```javascript
// 1. Lấy tất cả wishlist items
GET /api/wishlist/
Response: {
  results: [
    {
      id: 1,
      car: {
        ma_xe: "X001",
        ten_xe: "Koenigsegg",
        loai_xe: { ten_loai: "Sport" },
        gia_thue: 800000,
        image_url: "..."
      },
      added_at: "2025-12-15T10:00:00Z"
    }
  ]
}

// 2. Thêm vào wishlist
POST /api/wishlist/
Body: { car_id: "X001" }

// 3. Xóa khỏi wishlist
DELETE /api/wishlist/{id}/

// 4. Kiểm tra có trong wishlist không
GET /api/wishlist/check/?car_id=X001
Response: { in_wishlist: true }
```

**Cách kết nối:**
1. Mở `frontend/src/api/wishlistApi.js`
2. Tìm các dòng có comment `// TODO: Thay thế bằng API thật`
3. Uncomment dòng `return axiosClient...`
4. Comment hoặc xóa phần mock data

---

## 🎨 UI/UX Features

### NotificationDropdown
- ✅ Dropdown đẹp, có shadow và border
- ✅ Icon màu sắc khác nhau cho từng loại thông báo
- ✅ Highlight thông báo chưa đọc (background xanh nhạt)
- ✅ Dot indicator cho thông báo chưa đọc
- ✅ Format thời gian thân thiện
- ✅ Loading state
- ✅ Empty state
- ✅ Button "Đánh dấu tất cả đã đọc"
- ✅ Button "Xem tất cả thông báo"
- ✅ Click outside để đóng
- ✅ Responsive (320px - 384px width)

### WishlistPanel
- ✅ Sidebar slide từ bên phải
- ✅ Backdrop overlay
- ✅ Hiển thị ảnh, tên, loại, giá xe
- ✅ Button xóa (hiện khi hover)
- ✅ Click vào xe → Navigate đến detail
- ✅ Empty state với button "Khám phá xe"
- ✅ Loading state
- ✅ Footer với button "Xem thêm xe"
- ✅ Responsive (full width mobile, 384px desktop)
- ✅ Prevent body scroll khi mở

---

## 📝 Backend API Cần Tạo

### 1. Notification Endpoints

**Model cần có:**
```python
class Notification(models.Model):
    user = ForeignKey(User)
    type = CharField(choices=[...])
    title = CharField()
    message = TextField()
    read = BooleanField(default=False)
    order = ForeignKey(Order, null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

**Endpoints:**
- `GET /api/notifications/` - Lấy tất cả thông báo của user
- `PATCH /api/notifications/{id}/read/` - Đánh dấu đã đọc
- `POST /api/notifications/mark-all-read/` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/{id}/` - Xóa thông báo

**Tự động tạo thông báo khi:**
- Order status thay đổi → Tạo notification "order_status"
- Payment thành công → Tạo notification "payment_success"
- Rental sắp hết hạn → Tạo notification "rental_expiry" (cron job)

---

### 2. Wishlist Endpoints

**Model cần có:**
```python
class Wishlist(models.Model):
    user = ForeignKey(User)
    car = ForeignKey(Xe)
    added_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("user", "car")
```

**Endpoints:**
- `GET /api/wishlist/` - Lấy tất cả wishlist của user
- `POST /api/wishlist/` - Thêm xe vào wishlist (Body: `{car_id: "X001"}`)
- `DELETE /api/wishlist/{id}/` - Xóa khỏi wishlist
- `GET /api/wishlist/check/?car_id=X001` - Kiểm tra có trong wishlist không

---

## 🧪 Test

### Test NotificationDropdown:
1. Click vào icon chuông → Dropdown mở
2. Xem danh sách thông báo
3. Click vào thông báo → Navigate đến dashboard
4. Click "Đánh dấu tất cả đã đọc" → Tất cả thông báo chuyển sang đã đọc
5. Click outside → Dropdown đóng

### Test WishlistPanel:
1. Click vào icon trái tim → Panel mở từ bên phải
2. Xem danh sách xe yêu thích
3. Hover vào xe → Button xóa hiện ra
4. Click vào xe → Navigate đến trang detail
5. Click button xóa → Xe bị xóa khỏi wishlist
6. Click outside hoặc nút X → Panel đóng

---

## 📂 Files Đã Tạo/Cập Nhật

### Files Mới:
1. ✅ `frontend/src/components/NotificationDropdown.jsx`
2. ✅ `frontend/src/components/WishlistPanel.jsx`
3. ✅ `frontend/src/api/notificationApi.js`
4. ✅ `frontend/src/api/wishlistApi.js`

### Files Đã Cập Nhật:
1. ✅ `frontend/src/components/Header.jsx`

---

## 🎯 Kết Quả

- ✅ Icon Settings đã bị xóa
- ✅ NotificationDropdown hoạt động với mock data
- ✅ WishlistPanel hoạt động với mock data
- ✅ UI đẹp, responsive, có animation
- ✅ Sẵn sàng kết nối API thật (chỉ cần uncomment)

**Linter:** Không có lỗi

Bạn có thể test ngay bây giờ! Khi backend sẵn sàng, chỉ cần uncomment các dòng API trong `notificationApi.js` và `wishlistApi.js`.

