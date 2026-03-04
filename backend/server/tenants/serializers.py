from rest_framework import serializers
from .models import Tenant, TenantStatus, TenantTheme


class TenantSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    theme_display = serializers.CharField(source='get_theme_display', read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "code", "slug", "address", "phone", "email",
            "is_active", "status", "status_display",
            "theme", "theme_display",
            "logo", "primary_color", "banner_image", "description",
            "created_at", "updated_at", "deleted_at", "user_count"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_user_count(self, obj):
        """Đếm số user thuộc tenant này"""
        return obj.user_profiles.count()

    def validate_code(self, value):
        """Ensure code is uppercase"""
        return value.upper() if value else value


class TenantListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách tenant (ít fields hơn)"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    theme_display = serializers.CharField(source='get_theme_display', read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "code", "slug", "is_active", "status", "status_display",
            "theme", "theme_display", "logo", "primary_color",
            "user_count", "created_at"
        ]

    def get_user_count(self, obj):
        return obj.user_profiles.count()


class PublicTenantSerializer(serializers.ModelSerializer):
    """
    Serializer cho API public - chỉ trả về thông tin công khai.
    KHÔNG bao gồm các thông tin nhạy cảm.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    theme_display = serializers.CharField(source='get_theme_display', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "code", "slug",
            "address", "phone", "email",
            "status", "status_display", "is_active",
            "theme", "theme_display",
            "logo", "primary_color", "banner_image", "description",
            "created_at"
        ]