/**
 * Login Helpers - Xử lý redirect sau khi login

Sử dụng:
  import { getLoginRedirectPath } from './loginHelpers';
  
  const redirect = getLoginRedirectPath(user);
  navigate(redirect, { replace: true });
 */

type UserRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "EMPLOYEE" | "STAFF" | "CUSTOMER" | string | undefined;

type User = {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  role_display?: string;
  avatar_url?: string | null;
  tenant?: {
    id: string;
    name: string;
    code?: string;
    slug: string;
  } | null;
  tenant_id?: string | null;
  profile?: unknown;
} | null;

/**
 * Lấy đường dẫn redirect sau khi login thành công.
 * 
 * QUY TẮC:
 * - SUPER_ADMIN → /admin
 * - TENANT_ADMIN/EMPLOYEE/STAFF → /tenant/:tenantId/dashboard
 * - CUSTOMER → /
 * 
 * @param user - User object từ AuthContext
 * @param fallbackPath - Đường dẫn mặc định nếu không xác định được
 * @returns Đường dẫn redirect
 */
export const getLoginRedirectPath = (
  user: User | null,
  fallbackPath: string = "/"
): string => {
  if (!user) return fallbackPath;

  const userRole = user.role?.toUpperCase();
  const tenantId = user.tenant_id || user.tenant?.id;

  // SUPER_ADMIN → /admin
  if (userRole === "SUPER_ADMIN") {
    return "/admin";
  }

  // TENANT_ADMIN/EMPLOYEE/STAFF → /tenant/:tenantId/dashboard
  if (tenantId && ["TENANT_ADMIN", "EMPLOYEE", "STAFF"].includes(userRole || "")) {
    return `/tenant/${tenantId}/dashboard`;
  }

  // CUSTOMER hoặc default → /
  return fallbackPath;
};

/**
 * Kiểm tra xem URL có phải là tenant URL không
 */
export const isTenantUrl = (pathname: string): boolean => {
  return /^\/tenant\/[^/]+/.test(pathname);
};

/**
 * Lấy tenantId từ URL
 */
export const getTenantIdFromUrl = (pathname: string): string | null => {
  const match = pathname.match(/^\/tenant\/([^/]+)/);
  return match ? match[1] : null;
};

/**
 * Validate xem user có quyền truy cập tenant URL không
 */
export const canAccessTenantUrl = (
  user: User | null,
  pathname: string
): boolean => {
  if (!user) return false;

  const userRole = user.role?.toUpperCase();
  const urlTenantId = getTenantIdFromUrl(pathname);
  const userTenantId = user.tenant_id || user.tenant?.id;

  // SUPER_ADMIN có thể truy cập mọi tenant URL
  if (userRole === "SUPER_ADMIN") {
    return true;
  }

  // Nếu không phải tenant URL → cho phép
  if (!urlTenantId) {
    return true;
  }

  // TENANT_ADMIN/EMPLOYEE/STAFF chỉ được truy cập tenant của mình
  if (["TENANT_ADMIN", "EMPLOYEE", "STAFF"].includes(userRole || "")) {
    return userTenantId === urlTenantId;
  }

  return false;
};
