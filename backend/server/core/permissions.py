from rest_framework.permissions import BasePermission


class IsNhanVien(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.groups.filter(name="NhanVien").exists()
            or request.user.is_superuser
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request, "user", None)) and request.user.is_authenticated and request.user.is_superuser


class IsTenantAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated or user.is_superuser:
            return False
        profile = getattr(user, "profile", None)
        return bool(profile) and getattr(profile, "role", None) == "tenant_admin" and getattr(profile, "tenant_id", None)


class IsTenantMember(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        return bool(profile) and bool(getattr(profile, "tenant_id", None))


class IsSuperAdminOrTenantAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        return bool(profile) and getattr(profile, "role", None) == "tenant_admin" and getattr(profile, "tenant_id", None)

