# 🔧 Sửa Lỗi: Khách Hàng Không Cập Nhật Khi Admin Xác Nhận Thanh Toán

## ❌ Vấn Đề

Khi quản trị viên xác nhận thanh toán hoàn thành (set `order.status = "paid"`), tài khoản khách hàng không cập nhật trạng thái và không qua bước tiếp theo.

## 🔍 Nguyên Nhân

1. **Admin chỉ cập nhật `order.status`**, không cập nhật:
   - `order.payment_status`
   - `payment.status` (trong Payment model)

2. **Frontend đang polling `payment.status`** (không phải `order.status`):
   - Frontend gọi `paymentApi.checkStatus(paymentId)` mỗi 3 giây
   - Chỉ kiểm tra `payment.status`, không kiểm tra `order.status`

3. **Khi admin update order status = "paid"**:
   - `payment.status` vẫn là "pending" → Frontend không phát hiện thay đổi
   - Frontend tiếp tục chờ payment status = "completed"

## ✅ Giải Pháp Đã Áp Dụng

### 1. Tự Động Cập Nhật Payment Status Khi Admin Update Order

**File:** `backend/server/orders/views_commerce.py`

**Thay đổi:**
- Override method `update()` và `partial_update()` trong `OrderViewSet`
- Khi admin set `order.status = "paid"`, tự động:
  1. Cập nhật `order.payment_status = "paid"`
  2. Cập nhật `payment.status = "completed"` (nếu có payment)
  3. Cập nhật `payment.paid_at = timezone.now()`

**Code:**
```python
def update(self, request, *args, **kwargs):
    """Override update để tự động cập nhật payment status khi order status = 'paid'"""
    partial = kwargs.pop('partial', False)
    instance = self.get_object()
    serializer = self.get_serializer(instance, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    
    # Lấy status mới từ request data
    new_status = request.data.get('status', instance.status)
    
    # Nếu status được set thành "paid", tự động cập nhật payment_status và payment
    if new_status == "paid" and instance.status != "paid":
        with transaction.atomic():
            # Cập nhật order
            self.perform_update(serializer)
            
            # Cập nhật order.payment_status
            instance.payment_status = "paid"
            instance.save()
            
            # Cập nhật payment status nếu có
            try:
                from payments.models import Payment
                payment = Payment.objects.filter(order=instance).first()
                if payment and payment.status != "completed":
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.save()
            except Exception as e:
                # Log lỗi nhưng không fail update order
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Không thể cập nhật payment status: {str(e)}")
    else:
        self.perform_update(serializer)
    
    return Response(serializer.data)
```

## 🎯 Cách Hoạt Động

### Luồng Trước Khi Sửa:
1. Admin set `order.status = "paid"` → Chỉ cập nhật `order.status`
2. Frontend polling `payment.status` → Vẫn là "pending"
3. Frontend không phát hiện thay đổi → Không cập nhật UI

### Luồng Sau Khi Sửa:
1. Admin set `order.status = "paid"` 
2. Backend tự động:
   - Cập nhật `order.status = "paid"`
   - Cập nhật `order.payment_status = "paid"`
   - Cập nhật `payment.status = "completed"` (nếu có)
3. Frontend polling `payment.status` → Phát hiện "completed"
4. Frontend cập nhật UI và chuyển bước

## ✅ Kết Quả

- ✅ Khi admin xác nhận thanh toán, `payment.status` tự động được cập nhật thành "completed"
- ✅ Frontend polling phát hiện thay đổi ngay lập tức (trong vòng 3 giây)
- ✅ Khách hàng thấy trạng thái "Thanh toán thành công!" và chuyển bước
- ✅ Đảm bảo đồng bộ giữa `order.status`, `order.payment_status`, và `payment.status`

## 🧪 Test

1. **Tạo order và payment:**
   ```bash
   # Tạo order từ frontend
   POST /api/order/
   
   # Tạo payment
   POST /api/payment/create/
   ```

2. **Admin xác nhận thanh toán:**
   ```bash
   # Admin update order status
   PATCH /api/order/{id}/
   {
     "status": "paid"
   }
   ```

3. **Kiểm tra payment status:**
   ```bash
   # Frontend polling sẽ thấy
   GET /api/payment/{id}/status/
   # Response: { "status": "completed", ... }
   ```

4. **Frontend tự động cập nhật:**
   - Payment status = "completed"
   - Hiển thị "Thanh toán thành công!"
   - Chuyển đến `/dashboard`

## 📝 Lưu Ý

- Logic này chỉ áp dụng khi admin **set status = "paid"**
- Nếu payment không tồn tại, chỉ cập nhật `order.payment_status`
- Sử dụng `transaction.atomic()` để đảm bảo tính nhất quán
- Có error handling để không fail update order nếu payment update lỗi

## 🔄 Tương Lai (Tùy Chọn)

Có thể cải thiện thêm bằng cách:
1. **WebSocket/SSE:** Thay polling bằng real-time update
2. **Notification:** Gửi thông báo cho khách hàng khi admin xác nhận
3. **Webhook:** Gọi callback cho frontend khi payment status thay đổi

