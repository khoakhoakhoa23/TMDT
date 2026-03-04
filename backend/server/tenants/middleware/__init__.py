"""
Multi-Tenant Middleware Package

Cung cấp các middleware và utilities cho multi-tenant isolation.

Cấu trúc:
- authentication.py: JWT authentication middleware  
- tenant_validation.py: Tenant validation middleware
- permissions.py: DRF Permission classes (đã có sẵn trong core/)

Usage:
    from tenants.middleware import TenantContextMiddleware, check_tenant_access
"""

from .authentication import JWTAuthenticationMiddleware
from .tenant_validation import (
    TenantContextMiddleware,
    check_tenant_access,
    require_tenant,
    get_tenant_from_request,
)

__all__ = [
    "JWTAuthenticationMiddleware",
    "TenantContextMiddleware", 
    "check_tenant_access",
    "require_tenant",
    "get_tenant_from_request",
]
