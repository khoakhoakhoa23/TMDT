from core.views_permissions import IsNhanVien
from .product import LoaiXeViewSet, XeViewSet
from .people import NhanVienViewSet, KhachHangViewSet, NCCViewSet
from .billing import HoaDonNhapViewSet, ChiTietHDNViewSet, HoaDonXuatViewSet, ChiTietHDXViewSet
from .warranty import BaoHanhViewSet
from .account import AdminViewSet
from .content import BlogPostViewSet
from .commerce import CartViewSet, CartItemViewSet, OrderViewSet, checkout
from .stats import doanh_thu_hom_nay, doanh_thu_thang, tong_xe_da_ban, top_xe_ban_chay
from .auth import RegisterAPIView, user_role
from .media import upload_media

__all__ = [
    "IsNhanVien",
    "LoaiXeViewSet",
    "XeViewSet",
    "NhanVienViewSet",
    "KhachHangViewSet",
    "NCCViewSet",
    "HoaDonNhapViewSet",
    "ChiTietHDNViewSet",
    "HoaDonXuatViewSet",
    "ChiTietHDXViewSet",
    "BaoHanhViewSet",
    "AdminViewSet",
    "BlogPostViewSet",
    "CartViewSet",
    "CartItemViewSet",
    "OrderViewSet",
    "checkout",
    "upload_media",
    "doanh_thu_hom_nay",
    "doanh_thu_thang",
    "tong_xe_da_ban",
    "top_xe_ban_chay",
    "RegisterAPIView",
    "user_role",
]

