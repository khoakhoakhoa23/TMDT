from __future__ import annotations

from typing import Optional

from django.db import transaction

from .models import Tenant


DEFAULT_TENANT_SLUG = "default"


def get_tenant_from_request(request) -> Optional[Tenant]:
    """
    Resolve tenant for a request.

    Priority:
    - X-Tenant header (slug)
    - request.tenant (set by middleware)
    - authenticated user's profile.tenant (if available)
    - default tenant (lazy-created)
    """
    header_slug = (request.headers.get("X-Tenant") or request.headers.get("X-Tenant-Slug") or "").strip()
    if header_slug:
        return Tenant.objects.filter(slug=header_slug, is_active=True).first()

    if hasattr(request, "tenant") and request.tenant:
        return request.tenant

    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        try:
            profile = getattr(user, "profile", None)
            if profile and getattr(profile, "tenant_id", None):
                return profile.tenant
        except Exception:
            pass

    return get_or_create_default_tenant()


@transaction.atomic
def get_or_create_default_tenant() -> Tenant:
    tenant, _ = Tenant.objects.get_or_create(
        slug=DEFAULT_TENANT_SLUG,
        defaults={"name": "Default Tenant", "is_active": True},
    )
    return tenant

