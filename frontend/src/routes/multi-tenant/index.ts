/**
 * Multi-Tenant Routing Module
 * 
 * Export all components and utilities for multi-tenant routing.
 * 
 * Usage:
 * import { ProtectedRoute, TENANT_ROUTES } from "./routes/multi-tenant";
 */

export {
  ProtectedRoute,
  TENANT_ROUTES,
  canAccessTenant,
  getLoginRedirectPath,
  getTenantIdFromUrl,
} from "./ProtectedRoute";

export type {
  UserRole,
  TenantUser,
  AuthState,
} from "./ProtectedRoute";
