import axiosClient from "./axiosClient";

export type TenantTheme = "default" | "car-rental" | "hotel" | "ecommerce";
export type TenantStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export interface Tenant {
  id: number | string;
  name: string;
  code: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  status: TenantStatus;
  status_display?: string;
  theme?: TenantTheme;
  theme_display?: string;
  logo?: string | null;
  primary_color?: string;
  banner_image?: string | null;
  description?: string;
  locked?: boolean;
  message?: string;
  created_at?: string;
  updated_at?: string;
  user_count?: number;
}

export interface TenantStats {
  tenant: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: {
    tenant_admin: number;
    staff: number;
    customer: number;
  };
}

const tenantApi = {
  // ========== Public APIs (Không yêu cầu auth) ==========

  /**
   * Lấy thông tin tenant công khai theo ID.
   * URL: GET /api/public/tenants/:tenantId
   *
   * KHÔNG yêu cầu authentication.
   * KHÔNG sử dụng Default Tenant.
   */
  getPublicTenant(tenantId: string) {
    return axiosClient.get(`public/tenants/${tenantId}/`);
  },

  /**
   * Lấy thông tin tenant công khai theo slug.
   * URL: GET /api/public/tenants/slug/:slug
   */
  getPublicTenantBySlug(slug: string) {
    return axiosClient.get(`public/tenants/slug/${slug}/`);
  },

  // ========== Admin APIs (Yêu cầu auth) ==========

  getAll(params?: { page?: number; page_size?: number; search?: string }) {
    return axiosClient.get("tenants/", { params });
  },

  getById(id: string) {
    return axiosClient.get(`tenants/${id}/`);
  },

  create(data: Partial<Tenant>) {
    return axiosClient.post("tenants/", data);
  },

  update(id: string, data: Partial<Tenant>) {
    return axiosClient.put(`tenants/${id}/`, data);
  },

  delete(id: string) {
    return axiosClient.delete(`tenants/${id}/`);
  },

  // ========== Tenant-based User Management ==========
  // Lấy danh sách users của một tenant
  getUsers(tenantId: string, params?: {
    page?: number;
    page_size?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    return axiosClient.get(`admin/tenants/${tenantId}/users/`, { params });
  },

  // Lấy chi tiết một user trong tenant
  getUser(tenantId: string, userId: number) {
    return axiosClient.get(`admin/tenants/${tenantId}/users/${userId}/`);
  },

  // Tạo user mới trong tenant
  createUser(tenantId: string, data: {
    username: string;
    email?: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
  }) {
    return axiosClient.post(`admin/tenants/${tenantId}/users/`, data);
  },

  // Cập nhật user trong tenant
  updateUser(tenantId: string, userId: number, data: Partial<{
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    status: string;
  }>) {
    return axiosClient.patch(`admin/tenants/${tenantId}/users/${userId}/`, data);
  },

  // Xóa user trong tenant
  deleteUser(tenantId: string, userId: number) {
    return axiosClient.delete(`admin/tenants/${tenantId}/users/${userId}/`);
  },

  // Lấy thống kê tenant
  getStats(tenantId: string) {
    return axiosClient.get(`admin/tenants/${tenantId}/stats/`);
  },

  // ========== My Tenant (Current Tenant for TENANT_ADMIN) ==========
  // Lấy thông tin tenant hiện tại của user đang đăng nhập
  getMyTenant() {
    return axiosClient.get("tenant/me/");
  },

  // Cập nhật thông tin tenant hiện tại
  updateMyTenant(data: Partial<Tenant>) {
    return axiosClient.patch("tenant/me/", data);
  },
};

export default tenantApi;
