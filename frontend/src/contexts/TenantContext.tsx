import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import tenantApi from "../api/tenantApi";
import axios, { AxiosError } from "axios";

export type TenantTheme = "default" | "car-rental" | "hotel" | "ecommerce";
export type TenantStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export interface Tenant {
  id: number;
  name: string;
  code: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  status: TenantStatus;
  is_active: boolean;
  theme: TenantTheme;
  theme_display?: string;
  logo?: string | null;
  primary_color: string;
  banner_image?: string | null;
  description?: string;
  locked?: boolean;
  message?: string;
  created_at?: string;
}

type TenantContextValue = {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  tenantId: string | null;
  setTenantId: (id: string) => void;
  refetch: () => Promise<void>;
  isActive: boolean;
  isLocked: boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

type TenantProviderProps = {
  children: ReactNode;
  tenantId?: string;
};

/**
 * TenantProvider - Quản lý thông tin tenant từ URL.
 *
 * QUY TẮC:
 * - Lấy tenantId từ URL params
 * - Gọi API public để lấy thông tin tenant
 * - KHÔNG sử dụng Default Tenant
 * - KHÔNG fallback về tenant khác
 *
 * Flow:
 * 1. User truy cập /tenant/:tenantId
 * 2. TenantProvider lấy tenantId từ props
 * 3. Gọi API /api/public/tenants/:tenantId
 * 4. Lưu tenant vào context
 * 5. Render giao diện theo tenant.theme
 */
export const TenantProvider = ({
  children,
  tenantId: initialTenantId,
}: TenantProviderProps) => {
  const [tenantId, setTenantIdState] = useState<string | null>(
    initialTenantId || null
  );
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async (id: string) => {
    if (!id) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await tenantApi.getPublicTenant(id);
      setTenant(response.data);
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err)
          ? (err.response?.data as any)?.error ||
            (err.response?.data as any)?.detail ||
            err.message
          : err instanceof Error
            ? err.message
            : "Tenant không tồn tại";
      setError(errorMessage);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTenantId) {
      fetchTenant(initialTenantId);
    }
  }, [initialTenantId]);

  const setTenantId = (id: string) => {
    setTenantIdState(id);
    fetchTenant(id);
  };

  const refetch = async () => {
    if (tenantId) {
      await fetchTenant(tenantId);
    }
  };

  const isActive = tenant?.status === "ACTIVE" && tenant?.is_active;
  const isLocked = tenant?.locked || tenant?.status === "LOCKED";

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        tenantId,
        setTenantId,
        refetch,
        isActive,
        isLocked,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};

export default TenantContext;
