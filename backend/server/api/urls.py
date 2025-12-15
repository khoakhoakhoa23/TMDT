from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from products.views import LocationViewSet, LoaiXeViewSet, XeViewSet, BlogPostViewSet, ReviewViewSet, CarImageViewSet
from users.views import NhanVienViewSet, KhachHangViewSet, NCCViewSet, RegisterAPIView, user_role, UserViewSet, update_profile, change_password, get_me, upload_avatar, get_me, upload_avatar
from orders.views import HoaDonNhapViewSet, ChiTietHDNViewSet, HoaDonXuatViewSet, ChiTietHDXViewSet, BaoHanhViewSet
from orders.views_commerce import CartViewSet, CartItemViewSet, OrderViewSet, checkout
from payments.views import PaymentViewSet, payment_callback
from core.views import NotificationViewSet
from analytics.views import doanh_thu_hom_nay, doanh_thu_thang, tong_xe_da_ban, top_xe_ban_chay

router = DefaultRouter()
router.register(r"location", LocationViewSet)
router.register(r"loaixe", LoaiXeViewSet)
router.register(r"xe", XeViewSet)
router.register(r"review", ReviewViewSet, basename="review")
router.register(r"car-image", CarImageViewSet, basename="car-image")
router.register(r"payment", PaymentViewSet, basename="payment")
router.register(r"nhanvien", NhanVienViewSet)
router.register(r"khachhang", KhachHangViewSet)
router.register(r"ncc", NCCViewSet)
router.register(r"accounts", UserViewSet, basename="accounts")
router.register(r"hoadonnhap", HoaDonNhapViewSet)
router.register(r"chitiethdn", ChiTietHDNViewSet)
router.register(r"hoadonxuat", HoaDonXuatViewSet)
router.register(r"chitiethdx", ChiTietHDXViewSet)
router.register(r"baohanh", BaoHanhViewSet)
router.register(r"blog", BlogPostViewSet)
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"cart-item", CartItemViewSet, basename="cart-item")
router.register(r"order", OrderViewSet, basename="order")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("checkout/", checkout, name="checkout"),
    path("payment/callback/<int:order_id>/", payment_callback, name="payment_callback"),
    path("me/", user_role),  # Giữ lại để backward compatibility
    path("users/me/", get_me, name="get_me"),  # API mới trả về đầy đủ thông tin + avatar
    path("users/update-profile/", update_profile, name="update_profile"),
    path("users/change-password/", change_password, name="change_password"),
    path("users/upload-avatar/", upload_avatar, name="upload_avatar"),
    path("thongke/doanhthu-homnay/", doanh_thu_hom_nay),
    path("thongke/doanhthu/<int:year>/<int:month>/", doanh_thu_thang),
    path("thongke/tong-xe-da-ban/", tong_xe_da_ban),
    path("thongke/top-xe-ban-chay/", top_xe_ban_chay),
]
