# Giải Pháp QR Code Thanh Toán - Không Tốn Phí

## Tổng Quan

Hệ thống đã được cấu hình để **tạo QR code thanh toán mà KHÔNG cần gọi API thanh toán thật**, giúp tiết kiệm chi phí trong quá trình phát triển và test.

## Các Tính Năng

### 1. **QR Code Generation (Miễn Phí)**
- Sử dụng thư viện `qrcode[pil]` để tạo QR code trực tiếp từ payment URL
- QR code được trả về dưới dạng **base64 image** (có thể dùng trực tiếp trong `<img src={qr_code}>`)
- **KHÔNG cần gọi API bên ngoài**, hoàn toàn miễn phí

### 2. **Development Mode**
- Khi `DEBUG=True` và `PAYMENT_DEV_MODE=True`, hệ thống tự động:
  - Tạo QR code mock với thông tin thanh toán
  - Tự động approve payment khi verify (không cần thanh toán thật)
  - Hiển thị nút "Simulate Payment" trong frontend để test nhanh

### 3. **Payment Gateways Hỗ Trợ**
- **MoMo**: QR code chứa payment URL và thông tin đơn hàng
- **ZaloPay**: QR code chứa app_trans_id và payment URL
- **VNPay**: QR code chứa payment URL với secure hash

## Cấu Hình

### Backend (.env)
```env
# Bật development mode để test payment không tốn phí
DJANGO_DEBUG=True
PAYMENT_DEV_MODE=True
```

### Dependencies
```bash
# Đã được thêm vào requirements.txt
qrcode[pil]>=7.4.2
```

## Cách Sử Dụng

### 1. **Tạo Payment Request**
```javascript
// Frontend tự động gọi API khi user chọn payment method
const paymentResponse = await paymentApi.createPayment(orderId, paymentMethod, returnUrl);
// Response sẽ có qr_code (base64 image)
```

### 2. **Hiển Thị QR Code**
```jsx
// QR code đã là base64, dùng trực tiếp
<img src={paymentData.qr_code} alt="QR Code" />
```

### 3. **Test Payment (Development Mode)**
- Khi ở development mode, sẽ có nút **"🧪 Simulate Payment (Dev Mode)"**
- Click nút này để tự động approve payment mà không cần thanh toán thật
- Payment sẽ được đánh dấu là "completed" và order sẽ được cập nhật

### 4. **Production Mode**
- Khi `PAYMENT_DEV_MODE=False`, hệ thống sẽ:
  - Tạo QR code thật từ payment gateway
  - Yêu cầu verify payment thật từ gateway
  - Không có nút simulate payment

## API Endpoints

### Tạo Payment
```
POST /api/payment/create/
{
  "order_id": 1,
  "payment_method": "momo",
  "return_url": "http://localhost:5173/payment/callback"
}
```

### Simulate Payment (Dev Mode Only)
```
POST /api/payment/{id}/simulate/
```

### Check Payment Status
```
GET /api/payment/{id}/status/
```

## Lưu Ý

1. **QR Code Format**: QR code chứa JSON với thông tin:
   ```json
   {
     "type": "momo",
     "orderId": "ORDER_1_1234567890",
     "amount": 100000,
     "orderInfo": "Thanh toan don hang 1",
     "payment_url": "https://..."
   }
   ```

2. **Fallback**: Nếu không có thư viện `qrcode`, hệ thống sẽ dùng API miễn phí `api.qrserver.com`

3. **Security**: 
   - Development mode chỉ hoạt động khi `DEBUG=True`
   - Production nên tắt `PAYMENT_DEV_MODE=False`

## Khi Nào Cần Gọi API Thật?

Khi deploy production, bạn cần:
1. Tắt `PAYMENT_DEV_MODE=False`
2. Cấu hình credentials thật cho các payment gateway:
   - `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`
   - `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`
   - `VNPAY_TMN_CODE`, `VNPAY_SECRET_KEY`
3. Uncomment code gọi API thật trong `payment_gateways.py`

## Tóm Tắt

✅ **QR Code**: Tạo trực tiếp bằng Python, không tốn phí  
✅ **Development Mode**: Test payment mà không cần thanh toán thật  
✅ **Simulate Payment**: Nút test nhanh trong frontend  
✅ **Production Ready**: Dễ dàng chuyển sang API thật khi cần

