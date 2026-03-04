import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type TenantRouteProps = {
  children: ReactNode;
  /** 
   * Required roles to access this route.
   * If not specified, any authenticated user with tenant can access.
   */
  requiredRoles?: string[];
  /**
   * If true, validates that the tenantId in URL matches the user's tenantId from JWT.
   * This prevents cross-tenant access.
   */
  validateTenantId?: boolean;
  /**
   * If true, SUPER_ADMIN can access any tenant.
   * If false, only TENANT_ADMIN can access.
   */
  allowSuperAdmin?: boolean;
};

/**
 * TenantRoute - Route wrapper đảm bảo tenant isolation ở frontend.
 * 
 * QUY TẮC BẢO MẬT:
 * 1. TENANT_ADMIN phải truy cập đúng tenant của mình
 * 2. Không cho phép nhập URL tenant khác
 * 3. SUPER_ADMIN có thể truy cập mọi tenant (nếu allowSuperAdmin=true)
 * 
 * Sử dụng:
 * <TenantRoute validateTenantId>
 *   <TenantUsersPage />
 * </TenantRoute>
 */
const TenantRoute = ({ 
  children, 
  requiredRoles, 
  validateTenantId = true,
  allowSuperAdmin = true 
}: TenantRouteProps) => {
  const { isSuperAdmin, isTenantAdmin, isAdmin, user, loading, tenantId } = useAuth();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  // Get tenantId from URL params
  const urlTenantId = params.tenantId;

  useEffect(() => {
    // Skip validation if still loading or no URL tenantId
    if (loading || !urlTenantId) return;

    // SUPER_ADMIN bypass tenant validation
    if (allowSuperAdmin && isSuperAdmin) {
      return;
    }

    // For TENANT_ADMIN: validate tenantId matches JWT
    if (isTenantAdmin && validateTenantId) {
      // If URL tenantId doesn't match JWT tenantId → redirect to own tenant
      if (urlTenantId && urlTenantId !== tenantId) {
        console.warn(`[TenantRoute] Cross-tenant access blocked. URL: ${urlTenantId}, JWT: ${tenantId}`);
        // Redirect to own tenant's page
        navigate(`/tenant/${tenantId}/dashboard`, { replace: true });
        return;
      }
    }
  }, [loading, urlTenantId, tenantId, isSuperAdmin, isTenantAdmin, validateTenantId, allowSuperAdmin, navigate]);

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

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Not an admin (SUPER_ADMIN, TENANT_ADMIN, or staff)
  if (!isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.role || "";
    const hasRequiredRole = requiredRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase() ||
      role === userRole
    );

    if (!hasRequiredRole) {
      // Redirect based on role
      if (isSuperAdmin) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // For TENANT_ADMIN: auto-redirect to own tenant page on base tenant route
  if (isTenantAdmin && !urlTenantId && validateTenantId) {
    // If accessing /tenant or /admin/tenants without tenantId, redirect to own tenant dashboard
    if (location.pathname.startsWith("/tenant") || location.pathname.startsWith("/admin/tenants")) {
      if (tenantId) {
        return <Navigate to={`/tenant/${tenantId}/dashboard`} replace />;
      }
    }
  }

  // SUPER_ADMIN: check if trying to access specific tenant without permission
  if (!isSuperAdmin && !isTenantAdmin) {
    // STAFF or CUSTOMER trying to access admin routes
    if (location.pathname.startsWith("/admin/tenants") || location.pathname.startsWith("/tenant")) {
      if (tenantId) {
        return <Navigate to={`/tenant/${tenantId}/dashboard`} replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default TenantRoute;
