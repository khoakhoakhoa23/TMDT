from rest_framework.permissions import BasePermission


class IsNhanVien(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.groups.filter(name="NhanVien").exists()
            or request.user.is_superuser
        )


