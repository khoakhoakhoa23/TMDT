# TMDT - Website Thương Mại Điện Tử (Car Rental E-commerce)

## 📋 Mô tả
Website thuê xe với đầy đủ tính năng: đăng ký/đăng nhập, OAuth (Google, Facebook), thanh toán, quản lý đơn hàng, email notifications, và nhiều tính năng khác.

## 🛠️ Công nghệ
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT + OAuth (Google, Facebook)
- **Payment:** MoMo, ZaloPay, VNPay (với QR code)
- **Email:** Gmail SMTP
- **Real-time:** Django Channels (WebSocket)

## 🚀 Cách chạy Local

### Backend
```bash
cd backend
pip install -r requirements.txt
cd server
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📦 Deploy Production

Xem hướng dẫn chi tiết trong:
- `DEPLOYMENT_GUIDE.md` - Hướng dẫn đầy đủ
- `DEPLOY_QUICK_START.md` - Deploy nhanh 15 phút

**Quick Deploy:**
- Backend: Render.com
- Frontend: Vercel.com

## ✨ Tính năng chính

- ✅ Đăng ký/Đăng nhập (JWT)
- ✅ OAuth Login (Google, Facebook)
- ✅ Quên mật khẩu qua email
- ✅ Quản lý sản phẩm (xe)
- ✅ Shopping Cart
- ✅ Đặt hàng & Thanh toán
- ✅ Email notifications
- ✅ Advanced Search & Filter
- ✅ Reviews & Ratings
- ✅ Admin Dashboard
- ✅ Real-time notifications (WebSocket)

## 📝 Environment Variables

Xem `backend/ENV_EXAMPLE.txt` để biết các biến môi trường cần thiết.

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy
- `DEPLOY_QUICK_START.md` - Deploy nhanh
- Các file hướng dẫn khác trong repo
