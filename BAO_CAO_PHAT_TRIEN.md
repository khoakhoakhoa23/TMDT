# BÁO CÁO PHÁT TRIỂN LOGIC WEBSITE BÁN/THUÊ XE

## 📊 TỔNG QUAN

Dựa trên phân tích codebase, hệ thống đã có nền tảng tốt với nhiều tính năng đã được implement. Dưới đây là danh sách các phần logic cần phát triển hoặc hoàn thiện.

---

## ✅ ĐÃ CÓ ĐẦY ĐỦ

### 1. **Core Features**
- ✅ Models và Database structure (Xe, Order, Cart, Payment, Review, etc.)
- ✅ Authentication & Authorization (JWT, OAuth Google/Facebook)
- ✅ User Management (Profile, Avatar, Email verification)
- ✅ Product Management (CRUD, Search, Filter, Images)
- ✅ Cart & Checkout
- ✅ Order Management
- ✅ Payment Gateways (MoMo, ZaloPay, VNPay - mô phỏng)
- ✅ Review & Rating System
- ✅ Email Service
- ✅ Notifications System
- ✅ Analytics APIs

### 2. **Advanced Features**
- ✅ Coupon System (Model + Validation API)
- ✅ Price Calculation (Rental price, delivery fee, pickup fee)
- ✅ Schedule Conflict Checking
- ✅ Distance Calculation (Geocoding, Route calculation)
- ✅ Location Management

---

## ⚠️ CẦN PHÁT TRIỂN/HOÀN THIỆN

### 🔴 **ƯU TIÊN CAO**

#### 1. **Wishlist Backend API** 
**Trạng thái:** ❌ Chưa có backend, chỉ có frontend localStorage

**Cần làm:**
- Tạo model `Wishlist` hoặc `WishlistItem` trong `products/models.py`
- Tạo ViewSet trong `products/views.py` hoặc tạo app mới `wishlist/`
- API endpoints:
  - `GET /api/wishlist/` - Lấy danh sách wishlist
  - `POST /api/wishlist/` - Thêm xe vào wishlist
  - `DELETE /api/wishlist/{id}/` - Xóa khỏi wishlist
  - `GET /api/wishlist/check/?car_id=X001` - Kiểm tra xe có trong wishlist
- Tích hợp vào frontend (thay thế localStorage)

**File cần tạo/sửa:**
- `backend/server/products/models.py` (thêm Wishlist model)
- `backend/server/products/views.py` (thêm WishlistViewSet)
- `backend/server/api/urls.py` (thêm routes)
- `frontend/src/api/wishlistApi.js` (cập nhật để gọi API thật)

---

#### 2. **Coupon Integration trong Checkout Flow**
**Trạng thái:** ⚠️ Có API validate nhưng chưa tích hợp vào checkout

**Cần làm:**
- Tích hợp coupon vào `checkout()` function trong `orders/views_commerce.py`
- Tăng `used_count` khi áp dụng coupon thành công
- Validate coupon trước khi tạo order
- Tính discount và lưu vào order
- Frontend: Thêm UI nhập coupon code trong checkout page

**File cần sửa:**
- `backend/server/orders/views_commerce.py` (checkout function)
- `frontend/src/pages/Payment.jsx` (thêm coupon input)

---

#### 3. **Order Reservation Timeout Logic**
**Trạng thái:** ⚠️ Có field `reserved_until` nhưng chưa có logic tự động

**Cần làm:**
- Tạo management command để chạy cron job: `release_expired_reservations`
- Tự động chuyển order từ "reserved" → "expired" sau khi hết hạn
- Tự động restore số lượng xe khi order hết hạn
- Có thể dùng Celery hoặc Django management command + cron

**File cần tạo:**
- `backend/server/orders/management/commands/release_expired_orders.py`
- Cấu hình cron job hoặc Celery beat

**File cần sửa:**
- `backend/server/orders/utils.py` (đã có function `release_expired_reservations()`)

---

#### 4. **Late Fee Calculation & Workflow**
**Trạng thái:** ⚠️ Có function `calculate_late_fee()` nhưng chưa tích hợp

**Cần làm:**
- Tạo API endpoint để tính late fee khi admin cập nhật `actual_return_date`
- Tự động tính late fee khi trả xe muộn
- Cập nhật `total_price` của order khi có late fee
- Frontend: Hiển thị late fee trong order details

**File cần tạo/sửa:**
- `backend/server/orders/api_views.py` (thêm API tính late fee)
- `backend/server/orders/views_commerce.py` (tích hợp vào order update)
- `frontend/src/pages/admin/OrdersPage.jsx` (hiển thị late fee)

---

### 🟡 **ƯU TIÊN TRUNG BÌNH**

#### 5. **Payment Callback Auto-Processing**
**Trạng thái:** ⚠️ Có endpoint nhưng cần kiểm tra logic đầy đủ

**Cần làm:**
- Kiểm tra và hoàn thiện logic trong `payments/views.py` → `payment_callback()`
- Tự động cập nhật order status khi payment thành công
- Tự động gửi email xác nhận thanh toán
- Tự động tạo notification
- Xử lý edge cases (duplicate callbacks, invalid signatures, etc.)

**File cần kiểm tra/sửa:**
- `backend/server/payments/views.py`

---

#### 6. **WebSocket Real-time Notifications**
**Trạng thái:** ⚠️ Có infrastructure (Django Channels) nhưng cần kiểm tra hoạt động

**Cần làm:**
- Kiểm tra WebSocket connection hoạt động
- Test real-time notifications khi:
  - Order status thay đổi
  - Payment thành công
  - Review mới được tạo
- Frontend: Kiểm tra WebSocket client kết nối đúng

**File cần kiểm tra:**
- `backend/server/core/routing.py`
- `backend/server/core/consumers.py`
- `backend/server/core/notifications.py`
- `frontend/src/` (WebSocket client code)

---

#### 7. **Hóa Đơn Nhập/Xuất Workflow**
**Trạng thái:** ⚠️ Có models nhưng thiếu logic nghiệp vụ

**Cần làm:**
- Logic tạo hóa đơn nhập: Tự động tăng `so_luong` của xe khi nhập
- Logic tạo hóa đơn xuất: Tự động giảm `so_luong` của xe khi xuất
- Validation: Không cho xuất nếu `so_luong` < số lượng xuất
- API endpoints đầy đủ cho CRUD operations
- Frontend UI cho admin quản lý hóa đơn

**File cần sửa:**
- `backend/server/orders/views.py` (HoaDonNhapViewSet, HoaDonXuatViewSet)
- `frontend/src/pages/admin/` (tạo UI quản lý hóa đơn)

---

#### 8. **Bảo Hành Management Workflow**
**Trạng thái:** ⚠️ Có model nhưng thiếu logic và UI

**Cần làm:**
- Logic tạo bảo hành: Liên kết với order/khách hàng/xe
- API endpoints đầy đủ
- Frontend UI cho admin và khách hàng xem bảo hành
- Email notification khi tạo bảo hành mới

**File cần sửa:**
- `backend/server/orders/views.py` (BaoHanhViewSet)
- `frontend/src/pages/admin/` (UI quản lý bảo hành)
- `frontend/src/pages/ProfilePage.jsx` (khách hàng xem bảo hành)

---

### 🟢 **ƯU TIÊN THẤP (Nice to Have)**

#### 9. **Blog Management UI**
**Trạng thái:** ✅ Có model và API, cần kiểm tra UI

**Cần làm:**
- Kiểm tra admin UI cho blog management
- Frontend: Trang hiển thị blog posts
- SEO optimization cho blog posts

**File cần kiểm tra:**
- `frontend/src/pages/` (trang blog)
- `backend/server/products/admin.py` (admin interface)

---

#### 10. **Admin Dashboard UI Enhancement**
**Trạng thái:** ✅ Có API analytics, cần kiểm tra UI

**Cần làm:**
- Kiểm tra dashboard hiển thị đầy đủ:
  - Doanh thu hôm nay/tháng
  - Top xe bán chạy
  - Số lượng đơn hàng
  - Biểu đồ thống kê
- Thêm export reports (Excel, PDF)

**File cần kiểm tra:**
- `frontend/src/pages/admin/AnalyticsPage.jsx`

---

#### 11. **Advanced Search & Filter UI**
**Trạng thái:** ✅ Có backend API, cần kiểm tra UI

**Cần làm:**
- Kiểm tra filter sidebar hoạt động đầy đủ
- Search suggestions/autocomplete
- URL params cho filters (để share link)

**File cần kiểm tra:**
- `frontend/src/pages/Category.jsx`
- `frontend/src/pages/XeList.jsx`

---

## 📋 KẾ HOẠCH PHÁT TRIỂN ĐỀ XUẤT

### **Phase 1: Core Missing Features (1-2 tuần)**
1. Wishlist Backend API
2. Coupon Integration trong Checkout
3. Order Reservation Timeout Logic

### **Phase 2: Workflow Completion (1-2 tuần)**
4. Late Fee Calculation & Workflow
5. Payment Callback Auto-Processing
6. Hóa Đơn Nhập/Xuất Workflow

### **Phase 3: Enhancement & Testing (1 tuần)**
7. WebSocket Real-time Notifications Testing
8. Bảo Hành Management Workflow
9. UI/UX Improvements

---

## 🔍 CÁC FILE QUAN TRỌNG CẦN XEM XÉT

### Backend
- `backend/server/products/models.py` - Thêm Wishlist model
- `backend/server/orders/views_commerce.py` - Tích hợp coupon vào checkout
- `backend/server/orders/utils.py` - Logic tính giá, late fee
- `backend/server/payments/views.py` - Payment callback logic
- `backend/server/core/notifications.py` - Real-time notifications

### Frontend
- `frontend/src/api/wishlistApi.js` - Cập nhật để dùng API thật
- `frontend/src/pages/Payment.jsx` - Thêm coupon input
- `frontend/src/pages/admin/OrdersPage.jsx` - Hiển thị late fee
- `frontend/src/pages/admin/` - UI cho hóa đơn, bảo hành

---

## 📝 GHI CHÚ

1. **Payment Gateways:** Hiện đang ở chế độ mô phỏng (sandbox). Cần tích hợp API thật từ MoMo/ZaloPay/VNPay khi deploy production.

2. **Database:** Đảm bảo migrations đã chạy đầy đủ trước khi phát triển features mới.

3. **Testing:** Nên viết tests cho các features mới, đặc biệt là:
   - Wishlist API
   - Coupon validation
   - Order reservation timeout
   - Late fee calculation

4. **Documentation:** Cập nhật API documentation khi thêm endpoints mới.

---

## ✅ KẾT LUẬN

Hệ thống đã có nền tảng tốt với ~70% tính năng đã hoàn thiện. Các phần còn lại chủ yếu là:
- Tích hợp các tính năng đã có vào workflow
- Hoàn thiện logic nghiệp vụ
- Tối ưu UI/UX

Ưu tiên phát triển **Wishlist Backend API** và **Coupon Integration** vì đây là 2 tính năng quan trọng nhất còn thiếu.

