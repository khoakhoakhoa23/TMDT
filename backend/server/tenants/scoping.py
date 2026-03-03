from __future__ import annotations

from django.db.models import QuerySet

from tenants.utils import get_tenant_from_request


def apply_tenant_filter(qs: QuerySet, request, *, tenant_field: str = "tenant") -> QuerySet:
    """
    Apply tenant isolation to a queryset if the model has a tenant field.

    - Super Admin: returns full queryset, unless X-Tenant header provided.
    - Others: filters to current tenant.
    """
    model = getattr(qs, "model", None)
    if not model or not any(f.name == tenant_field for f in model._meta.fields):
        return qs

    user = getattr(request, "user", None)
    tenant = get_tenant_from_request(request)

    header_present = bool((request.headers.get("X-Tenant") or request.headers.get("X-Tenant-Slug") or "").strip())

    if user and getattr(user, "is_authenticated", False) and user.is_superuser:
        return qs.filter(**{tenant_field: tenant}) if (header_present and tenant) else qs

    return qs.filter(**{tenant_field: tenant}) if tenant else qs.none()


def get_current_tenant(request):
    return get_tenant_from_request(request)

