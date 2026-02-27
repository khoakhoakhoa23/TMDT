# Payment Gateways Configuration Guide

## Tổng quan

Hệ thống đã được tích hợp API thật cho 3 payment gateway:
- **MoMo**: RSA signature verification
- **ZaloPay**: HMAC-SHA256 signature verification
- **VNPay**: HMAC-SHA512 secure hash verification

## Cấu hình Environment Variables

### MoMo Gateway
```bash
# Production settings
MOMO_PRODUCTION=True
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Test settings (default)
MOMO_PRODUCTION=False
```

### ZaloPay Gateway
```bash
# Production settings
ZALOPAY_PRODUCTION=True
ZALOPAY_APP_ID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2

# Test settings (default)
ZALOPAY_PRODUCTION=False
```

### VNPay Gateway
```bash
# Production settings
VNPAY_PRODUCTION=True
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key

# Test settings (default)
VNPAY_PRODUCTION=False
```

### Development Mode
```bash
# Enable development mode (auto-approve payments)
DEBUG=True
PAYMENT_DEV_MODE=True
```

## API Endpoints

### Tạo Payment Request
```
POST /api/payments/create/
{
    "order_id": 123,
    "payment_method": "momo|zalopay|vnpay",
    "return_url": "https://yourapp.com/payment/success"
}
```

### IPN Callback
```
POST /api/payments/{order_id}/ipn/
# Callback data từ payment gateway
```

### Payment Status
```
GET /api/payments/{id}/status/
```

## Response Format

### Success Response
```json
{
    "success": true,
    "transaction_id": "ORDER_123_1703123456",
    "payment_url": "https://payment.momo.vn/...",
    "qr_code": "data:image/png;base64,...",
    "deep_link": "momo://app?action=pay&orderId=..."
}
```

### Error Response
```json
{
    "success": false,
    "error_code": "NETWORK_ERROR",
    "error_message": "Không thể kết nối đến MoMo API"
}
```

## Testing

### Development Mode
Khi `DEBUG=True` và `PAYMENT_DEV_MODE=True`:
- Payments sẽ được auto-approve
- Không tốn phí thực tế
- Có thể sử dụng `/api/payments/{id}/simulate/` để test

### Production Testing
1. Sử dụng test credentials từ nhà cung cấp
2. Test với số tiền nhỏ
3. Verify callbacks hoạt động đúng
4. Check database records

## Security Notes

1. **Luôn verify signature** trong production
2. **Sử dụng HTTPS** cho tất cả endpoints
3. **Validate callback data** trước khi xử lý
4. **Log tất cả transactions** để debug
5. **Không expose sensitive data** trong logs

## Troubleshooting

### MoMo Issues
- Check `MOMO_PUBLIC_KEY` format (PEM format)
- Verify `partnerCode` và `accessKey` đúng
- Check network connectivity đến MoMo API

### ZaloPay Issues
- Verify `app_id` và keys đúng
- Check `embed_data` và `items` format
- Test với ZaloPay sandbox trước

### VNPay Issues
- Check `tmn_code` và `secret_key`
- Verify URL parameters encoding
- Test với VNPay sandbox

## Dependencies

```bash
pip install cryptography>=41.0.0
```

Cryptography library được sử dụng cho RSA signature verification của MoMo.







