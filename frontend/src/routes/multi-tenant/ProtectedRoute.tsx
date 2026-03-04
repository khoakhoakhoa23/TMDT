/**
 * Multi-Tenant Route Configuration
 * 
 * Format: /tenant/:tenantId/...
 * 
 * Routing structure:
 * - /tenant/:tenantId/login     → Login cho tenant cụ thể
 * - /tenant/:tenantId/dashboard → Dashboard của tenant
 * - /tenant/:tenantId/users     → Quản lý users trong tenant
 * 
 * Security:
 * - ProtectedRoute validate tenantId từ URL với JWT
 * - Tenant isolation được enforce ở cả frontend và backend
 */

import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// ==================== Types ====================

export type UserRole = 
  | "SUPER_ADMIN" 
  | "TENANT_ADMIN" 
  | "STAFF" 
  | "CUSTOMER"
  | "super_admin" 
  | "tenant_admin" 
  | "admin" 
  | "staff" 
  | "user"
  | string
  | undefined;

export type TenantUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  role_display?: string;
  avatar_url?: string | null;
  tenant_id?: string | null;
  tenant?: {
    id: string;
    name: string;
    code?: string;
    slug: string;
  } | null;
};

export type AuthState = {
  user: TenantUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  tenantId: string | null;
};

// ==================== ProtectedRoute Component ====================

type ProtectedRouteProps = {
  children: ReactNode;
  /** 
   * Required roles to access this route.
   * If not specified, any authenticated user can access.
   */
  requiredRoles?: UserRole[];
  /**
   * If true, validates that tenantId in URL matches tenantId in JWT.
   * This prevents cross-tenant access via URL manipulation.
   * 
   * @default true
   */
  validateTenantId?: boolean;
  /**
   * If true, SUPER_ADMIN can bypass tenant validation.
   * 
   * @default true
   */
  allowSuperAdminAccess?: boolean;
  /**
   * Custom redirect path when tenant validation fails.
   * 
   * @default "/login"
   */
  redirectOnFail?: string;
};

/**
 * ProtectedRoute - Bảo vệ route với authentication và tenant isolation.
 * 
 * QUY TẮC BẢO MẬT:
 * 1. User phải đăng nhập (có JWT token)
 * 2. TenantId trong URL phải khớp với tenantId trong JWT
 * 3. User phải có role phù hợp (nếu requiredRoles được chỉ định)
 * 
 * CƠ CHẾ HOẠT ĐỘNG:
 * 1. Decode JWT token để lấy tenantId
 * 2. So sánh với tenantId từ URL params
 * 3. Nếu không khớp → redirect về login hoặc tenant của user
 * 
 * @example
 * // Bảo vệ dashboard của tenant
 * <ProtectedRoute validateTenantId>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Chỉ cho phép admin truy cập
 * <ProtectedRoute requiredRoles={["TENANT_ADMIN", "STAFF"]}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({
  children,
  requiredRoles,
  validateTenantId = true,
  allowSuperAdminAccess = true,
  redirectOnFail = "/login",
}: ProtectedRouteProps) => {
  const { user, loading, isSuperAdmin, isTenantAdmin, tenantId: jwtTenantId } = useAuth();
  const location = useLocation();
  const params = useParams();
  
  // Lấy tenantId từ URL
  const urlTenantId = params.tenantId;

  useEffect(() => {
    // Skip validation khi đang load hoặc chưa có URL tenantId
    if (loading || !urlTenantId) return;

    // SUPER_ADMIN có thể truy cập mọi tenant
    if (allowSuperAdminAccess && isSuperAdmin) {
      return;
    }

    // Validate tenantId: URL phải khớp với JWT
    if (validateTenantId && isTenantAdmin) {
      if (urlTenantId !== jwtTenantId) {
        console.warn(
          `[ProtectedRoute] Cross-tenant access blocked! ` +
          `URL tenantId: ${urlTenantId}, JWT tenantId: ${jwtTenantId}`
        );
        // Redirect về tenant hợp lệ của user
        return;
      }
    }
  }, [loading, urlTenantId, jwtTenantId, isSuperAdmin, isTenantAdmin, validateTenantId, allowSuperAdminAccess]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <Navigate 
        to={redirectOnFail} 
        replace 
        state={{ from: location, tenantId: urlTenantId }} 
      />
    );
  }

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.role || "";
    const hasRequiredRole = requiredRoles.some(
      (role) =>
        role.toLowerCase() === userRole.toLowerCase() ||
        role === userRole
    );

    if (!hasRequiredRole) {
      // Redirect based on role
      if (isSuperAdmin) {
        return <Navigate to="/admin" replace />;
      }
      // Redirect to own tenant dashboard
      if (jwtTenantId) {
        return <Navigate to={`/tenant/${jwtTenantId}/dashboard`} replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // Tenant validation failed - redirect
  if (validateTenantId && urlTenantId && !isSuperAdmin) {
    if (urlTenantId !== jwtTenantId) {
      // Redirect về tenant của user
      if (jwtTenantId) {
        return (
          <Navigate 
            to={`/tenant/${jwtTenantId}/dashboard`} 
            replace 
            state={{ 
              error: "Bạn không có quyền truy cập tenant này!",
              from: location 
            }} 
          />
        );
      }
      return <Navigate to={redirectOnFail} replace />;
    }
  }

  return <>{children}</>;
};

// ==================== Tenant Routes Configuration ====================

/**
 * Routes configuration cho tenant
 */
export const TENANT_ROUTES = {
  LOGIN: (tenantId: string) => `/tenant/${tenantId}/login`,
  DASHBOARD: (tenantId: string) => `/tenant/${tenantId}/dashboard`,
  USERS: (tenantId: string) => `/tenant/${tenantId}/users`,
  PRODUCTS: (tenantId: string) => `/tenant/${tenantId}/products`,
  ORDERS: (tenantId: string) => `/tenant/${tenantId}/orders`,
  ANALYTICS: (tenantId: string) => `/tenant/${tenantId}/analytics`,
  SETTINGS: (tenantId: string) => `/tenant/${tenantId}/settings`,
  PROFILE: (tenantId: string) => `/tenant/${tenantId}/profile`,
} as const;

// ==================== Helper Functions ====================

/**
 * Validate tenant access - kiểm tra user có quyền truy cập tenant không
 * 
 * @param user - User từ AuthContext
 * @param targetTenantId - Tenant ID muốn truy cập
 * @returns true nếu được phép, false nếu không
 */
export const canAccessTenant = (
  user: TenantUser | null, 
  targetTenantId: string
): boolean => {
  if (!user) return false;
  
  const userRole = user.role?.toUpperCase();
  
  // SUPER_ADMIN có thể truy cập mọi tenant
  if (userRole === "SUPER_ADMIN") {
    return true;
  }
  
  // TENANT_ADMIN chỉ được truy cập tenant của mình
  if (userRole === "TENANT_ADMIN") {
    return user.tenant_id === targetTenantId || user.tenant?.id === targetTenantId;
  }
  
  // STAFF/CUSTOMER không được phép truy cập
  return false;
};

/**
 * Get redirect path after login based on role
 */
export const getLoginRedirectPath = (
  user: TenantUser | null
): string => {
  if (!user) return "/";
  
  const userRole = user.role?.toUpperCase();
  const tenantId = user.tenant_id || user.tenant?.id;
  
  // SUPER_ADMIN → admin panel
  if (userRole === "SUPER_ADMIN") {
    return "/admin";
  }
  
  // TENANT_ADMIN/STAFF → tenant dashboard
  if (tenantId && ["TENANT_ADMIN", "STAFF"].includes(userRole || "")) {
    return `/tenant/${tenantId}/dashboard`;
  }
  
  // CUSTOMER → home
  return "/";
};

/**
 * Extract tenantId from URL
 */
export const getTenantIdFromUrl = (pathname: string): string | null => {
  // Match /tenant/:tenantId/...
  const match = pathname.match(/^\/tenant\/([^/]+)/);
  return match ? match[1] : null;
};

export {
  ProtectedRoute,
};
