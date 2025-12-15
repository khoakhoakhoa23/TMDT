# 🔧 Hướng Dẫn Sửa Lỗi Migration

## ❌ Lỗi Gặp Phải

```
ProgrammingError: relation "orders_order" does not exist
```

## ✅ Nguyên Nhân

Sau khi refactor, models `Cart`, `Order`, `CartItem`, `OrderItem` đã được di chuyển từ `cart` app sang `orders` app, nhưng database vẫn chưa có bảng `orders_order`, `orders_cart`, etc.

## ✅ Giải Pháp Đã Thực Hiện

### 1. Tạo Migration Mới

Đã tạo migration `0002_cart_order_orderitem_cartitem.py` cho orders app để tạo các bảng:
- `orders_cart`
- `orders_cartitem`
- `orders_order`
- `orders_orderitem`

### 2. Chạy Migration

```bash
cd backend/server
python manage.py migrate orders
```

**Kết quả:**
```
Operations to perform:
  Apply all migrations: orders
Running migrations:
  Applying orders.0002_cart_order_orderitem_cartitem... OK
```

## ✅ Kiểm Tra

### 1. Django Check
```bash
python manage.py check
```
**Kết quả:** `System check identified no issues (0 silenced).`

### 2. Kiểm Tra Migrations
```bash
python manage.py showmigrations orders
```

**Kết quả mong đợi:**
```
orders
 [X] 0001_initial
 [X] 0002_cart_order_orderitem_cartitem
```

## 📋 Các Bảng Đã Được Tạo

1. ✅ `orders_cart` - Bảng giỏ hàng
2. ✅ `orders_cartitem` - Bảng item trong giỏ hàng
3. ✅ `orders_order` - Bảng đơn hàng
4. ✅ `orders_orderitem` - Bảng item trong đơn hàng

## ⚠️ Lưu Ý Về Dữ Liệu Cũ

Nếu bạn có dữ liệu trong các bảng cũ (`cart_order`, `cart_cart`, etc.), bạn có 2 lựa chọn:

### Lựa Chọn 1: Giữ Dữ Liệu Cũ (Nếu Có)

Nếu có dữ liệu quan trọng trong `cart_order`, bạn cần:
1. Tạo data migration để di chuyển dữ liệu từ `cart` → `orders`
2. Hoặc sử dụng SQL để copy dữ liệu trực tiếp

**SQL để copy dữ liệu (PostgreSQL):**
```sql
-- Copy từ cart_order sang orders_order
INSERT INTO orders_order (
    id, user_id, created_at, status, total_price, note,
    shipping_name, shipping_phone, shipping_address, shipping_city,
    payment_method, payment_status, start_date, end_date,
    pickup_location, return_location, rental_days
)
SELECT 
    id, user_id, created_at, status, total_price, note,
    shipping_name, shipping_phone, shipping_address, shipping_city,
    payment_method, payment_status, start_date, end_date,
    pickup_location, return_location, rental_days
FROM cart_order
ON CONFLICT (id) DO NOTHING;

-- Copy từ cart_orderitem sang orders_orderitem
INSERT INTO orders_orderitem (id, order_id, xe_id, quantity, price_at_purchase)
SELECT id, order_id, xe_id, quantity, price_at_purchase
FROM cart_orderitem
ON CONFLICT (id) DO NOTHING;

-- Copy từ cart_cart sang orders_cart
INSERT INTO orders_cart (id, user_id, session_key, created_at, updated_at)
SELECT id, user_id, session_key, created_at, updated_at
FROM cart_cart
ON CONFLICT (id) DO NOTHING;

-- Copy từ cart_cartitem sang orders_cartitem
INSERT INTO orders_cartitem (id, cart_id, xe_id, quantity)
SELECT id, cart_id, xe_id, quantity
FROM cart_cartitem
ON CONFLICT (id) DO NOTHING;
```

### Lựa Chọn 2: Xóa Dữ Liệu Cũ (Nếu Không Cần)

Nếu không cần dữ liệu cũ, bạn có thể xóa các bảng cũ:

```sql
-- Xóa các bảng cũ (CẨN THẬN - sẽ mất dữ liệu!)
DROP TABLE IF EXISTS cart_cartitem CASCADE;
DROP TABLE IF EXISTS cart_orderitem CASCADE;
DROP TABLE IF EXISTS cart_cart CASCADE;
DROP TABLE IF EXISTS cart_order CASCADE;
```

## 🚀 Test Lại API

Sau khi migration xong, test lại API:

```bash
# Khởi động server
python manage.py runserver

# Test tạo order (từ frontend hoặc Postman)
POST http://127.0.0.1:8000/api/order/
```

## 📝 Tóm Tắt

✅ **Đã hoàn thành:**
- Tạo migration mới cho orders app
- Chạy migration thành công
- Bảng `orders_order` đã được tạo
- Django check pass

✅ **Cần làm tiếp:**
- Test API tạo order
- Nếu có dữ liệu cũ, di chuyển dữ liệu (tùy chọn)
- Xóa bảng cũ nếu không cần (tùy chọn)

## 🎯 Kết Quả

Lỗi `relation "orders_order" does not exist` đã được sửa! Bây giờ bạn có thể tạo order mới từ API.

