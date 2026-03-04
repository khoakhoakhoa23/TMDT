import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authApi from "../api/authApi";

type UserRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER" | "super_admin" | "tenant_admin" | "admin" | "staff" | "user" | string | undefined;

type User =
  | {
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
    }
  | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isEmployee: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  tenantId: string | null;
  tenantCode: string | null;
  canAccessTenant: (tenantId: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * AuthProvider - Quản lý authentication state với tenant information.
 * 
 * Lưu ý: tenantId từ JWT là nguồn tin cậy duy nhất để xác định tenant của user.
 * Frontend KHÔNG được tin tưởng tenantId từ URL - phải luôn verify với JWT.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        try {
          const response = await authApi.getMe();
          setUser({
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            role: response.data.role || "CUSTOMER",
            role_display: response.data.role_display,
            avatar_url: response.data.avatar_url,
            tenant: response.data.tenant || null,
            tenant_id: response.data.tenant_id || response.data.tenant?.id || null,
            profile: response.data.profile,
          });
        } catch {
          const response = await authApi.getUserRole();
          setUser({
            username: response.data.username,
            role: response.data.role || "CUSTOMER",
            tenant: response.data.tenant || null,
            tenant_id: response.data.tenant?.id || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => ({
      ...(prev || {}),
      ...(userData as User),
    }));
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await authApi.getMe();
      setUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        role: response.data.role || "CUSTOMER",
        role_display: response.data.role_display,
        avatar_url: response.data.avatar_url,
        tenant: response.data.tenant || null,
        tenant_id: response.data.tenant_id || response.data.tenant?.id || null,
        profile: response.data.profile,
      });
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  // Check role helpers - support both old and new role formats
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "super_admin";
  const isTenantAdmin = user?.role === "TENANT_ADMIN" || user?.role === "tenant_admin";
  const isEmployee = user?.role === "EMPLOYEE" || user?.role === "employee";
  const isStaff = user?.role === "STAFF" || user?.role === "staff" || isEmployee; // backward compatibility
  const isCustomer = user?.role === "CUSTOMER" || user?.role === "user" || !user?.role;

  // Admin = SUPER_ADMIN + TENANT_ADMIN + EMPLOYEE
  const isAdmin = isSuperAdmin || isTenantAdmin || isEmployee || user?.role === "admin";
  
  const tenantId = user?.tenant_id || user?.tenant?.id || null;

  /**
   * Kiểm tra user có quyền truy cập tenant cụ thể không.
   * 
   * QUY TẮC:
   * - SUPER_ADMIN: có thể truy cập mọi tenant
   * - TENANT_ADMIN: chỉ được truy cập tenant của mình
   * - EMPLOYEE: được truy cập tenant của mình (với limited permissions)
   * - CUSTOMER: không được phép
   * 
   * @param targetTenantId - Tenant ID muốn truy cập
   * @returns true nếu được phép
   */
  const canAccessTenant = (targetTenantId: string): boolean => {
    if (isSuperAdmin) {
      return true; // SUPER_ADMIN can access any tenant
    }
    if ((isTenantAdmin || isEmployee) && tenantId) {
      return tenantId === targetTenantId; // Can only access their own tenant
    }
    return false; // CUSTOMER cannot access
  };
  
  const tenantCode = user?.tenant?.code || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUser,
        refreshUser,
        logout,
        isAdmin,
        isSuperAdmin,
        isTenantAdmin,
        isEmployee,
        isStaff,
        isCustomer,
        tenantId,
        tenantCode,
        canAccessTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

