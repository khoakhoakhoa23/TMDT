from django.utils.deprecation import MiddlewareMixin

from .models import Tenant
from .utils import get_or_create_default_tenant


class TenantMiddleware(MiddlewareMixin):
    """
    Attach `request.tenant` early, mainly for anonymous requests.

    Note: JWT authentication is performed by DRF later, so for authenticated users
    we still resolve tenant from `request.user.profile` at view/permission time.
    """

    def process_request(self, request):
        slug = (request.headers.get("X-Tenant") or request.headers.get("X-Tenant-Slug") or "").strip()
        if slug:
            request.tenant = Tenant.objects.filter(slug=slug, is_active=True).first()
            return
        request.tenant = get_or_create_default_tenant()

