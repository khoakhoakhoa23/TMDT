from django.contrib import admin
from .models import Location, LoaiXe, Xe, BlogPost, Review, CarImage


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("ten_dia_diem", "dia_chi_chi_tiet", "trang_thai", "created_at")
    list_filter = ("trang_thai",)
    search_fields = ("ten_dia_diem", "dia_chi_chi_tiet")
    list_editable = ("trang_thai",)


@admin.register(LoaiXe)
class LoaiXeAdmin(admin.ModelAdmin):
    list_display = ("ma_loai", "ten_loai")
    search_fields = ("ma_loai", "ten_loai")


@admin.register(Xe)
class XeAdmin(admin.ModelAdmin):
    list_display = ("ma_xe", "ten_xe", "loai_xe", "gia", "gia_khuyen_mai", "gia_thue", "so_luong", "trang_thai")
    list_filter = ("loai_xe", "trang_thai", "mau_sac")
    search_fields = ("ma_xe", "ten_xe", "loai_xe__ten_loai", "seo_keywords")
    prepopulated_fields = {"slug": ("ten_xe",)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "published_at")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "seo_keywords")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "xe", "rating", "created_at", "updated_at")
    list_filter = ("rating", "created_at")
    search_fields = ("user__username", "xe__ten_xe", "comment")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CarImage)
class CarImageAdmin(admin.ModelAdmin):
    list_display = ("xe", "image", "is_primary", "order", "created_at")
    list_filter = ("is_primary", "created_at")
    search_fields = ("xe__ten_xe",)
    list_editable = ("is_primary", "order")
    readonly_fields = ("created_at", "updated_at")
