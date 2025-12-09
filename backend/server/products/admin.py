from django.contrib import admin
from .models import LoaiXe, Xe, BlogPost


@admin.register(LoaiXe)
class LoaiXeAdmin(admin.ModelAdmin):
    list_display = ("ma_loai", "ten_loai")
    search_fields = ("ma_loai", "ten_loai")


@admin.register(Xe)
class XeAdmin(admin.ModelAdmin):
    list_display = ("ma_xe", "ten_xe", "loai_xe", "gia", "gia_khuyen_mai", "so_luong", "trang_thai")
    list_filter = ("loai_xe", "trang_thai", "mau_sac")
    search_fields = ("ma_xe", "ten_xe", "loai_xe__ten_loai", "seo_keywords")
    prepopulated_fields = {"slug": ("ten_xe",)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "published_at")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "seo_keywords")
    prepopulated_fields = {"slug": ("title",)}
