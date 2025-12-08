from .product import LoaiXeSerializer, XeSerializer
from .people import NhanVienSerializer, KhachHangSerializer, NCCSerializer
from .billing import ChiTietHDNSerializer, HoaDonNhapSerializer, HoaDonXuatSerializer, ChiTietHDXSerializer
from .warranty import BaoHanhSerializer
from .content import BlogPostSerializer
from .commerce import CartItemSerializer, CartSerializer, OrderItemSerializer, OrderSerializer
from .account import AdminSerializer
from .auth import RegisterSerializer

__all__ = [
    "LoaiXeSerializer",
    "XeSerializer",
    "NhanVienSerializer",
    "KhachHangSerializer",
    "NCCSerializer",
    "ChiTietHDNSerializer",
    "HoaDonNhapSerializer",
    "HoaDonXuatSerializer",
    "ChiTietHDXSerializer",
    "BaoHanhSerializer",
    "BlogPostSerializer",
    "CartItemSerializer",
    "CartSerializer",
    "OrderItemSerializer",
    "OrderSerializer",
    "AdminSerializer",
    "RegisterSerializer",
]

