from django.contrib import admin
from .models import HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX, BaoHanh, Order, OrderItem


class ChiTietHDNInline(admin.TabularInline):
    model = ChiTietHDN
    extra = 0


@admin.register(HoaDonNhap)
class HoaDonNhapAdmin(admin.ModelAdmin):
    list_display = ("ma_hdn", "ngay_nhap", "nhan_vien", "ncc")
    search_fields = ("ma_hdn", "nhan_vien__ten", "ncc__ten")
    inlines = [ChiTietHDNInline]


class ChiTietHDXInline(admin.TabularInline):
    model = ChiTietHDX
    extra = 0


@admin.register(HoaDonXuat)
class HoaDonXuatAdmin(admin.ModelAdmin):
    list_display = ("ma_hdx", "ngay", "nhan_vien", "khach_hang")
    search_fields = ("ma_hdx", "nhan_vien__ten", "khach_hang__ten")
    inlines = [ChiTietHDXInline]


@admin.register(BaoHanh)
class BaoHanhAdmin(admin.ModelAdmin):
    list_display = ("ma_bh", "khach_hang", "xe", "ngay_bh")
    search_fields = ("ma_bh", "khach_hang__ten", "xe__ten_xe")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_price", "start_date", "end_date", "rental_days", "created_at")
    list_filter = ("status", "payment_status")
    search_fields = ("id", "user__username")
    inlines = [OrderItemInline]
    readonly_fields = ("created_at",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "xe", "quantity", "price_at_purchase")
    search_fields = ("order__id", "xe__ten_xe")
