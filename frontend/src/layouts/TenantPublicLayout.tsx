import { ReactNode } from "react";
import { Outlet, useParams, Navigate } from "react-router-dom";
import { useTenant, TenantProvider } from "../contexts/TenantContext";

/**
 * TenantPublicLayout Props
 */
type TenantPublicLayoutProps = {
  children?: ReactNode;
};

/**
 * Inner component xử lý logic tenant
 * Tách riêng để có thể wrap với TenantProvider từ ngoài
 */
const TenantPublicLayoutInner = ({ children }: TenantPublicLayoutProps) => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { tenant, loading, error, isLocked, isActive } = useTenant();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Error state - Tenant không tồn tại
  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tenant không tồn tại
          </h1>
          <p className="text-gray-600">
            {error || "Không tìm thấy website này."}
          </p>
        </div>
      </div>
    );
  }

  // Tenant bị khóa
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Website tạm thời không khả dụng
          </h1>
          <p className="text-gray-600">
            {tenant.message || "Tenant này đã bị khóa."}
          </p>
        </div>
      </div>
    );
  }

  // Tenant không hoạt động
  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Website không hoạt động
          </h1>
          <p className="text-gray-600">
            Tenant này hiện không hoạt động.
          </p>
        </div>
      </div>
    );
  }

  // Apply tenant branding
  const primaryColor = tenant.primary_color || "#3B82F6";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Tenant Header */}
      <header
        className="shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo && (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-10 w-10 object-contain bg-white rounded-lg p-1"
                />
              )}
              <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
            </div>
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="text-white/90 hover:text-white"
              >
                {tenant.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      {tenant.banner_image && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={tenant.banner_image}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children || <Outlet context={{ tenant }} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-white mb-2">{tenant.name}</h3>
              {tenant.description && (
                <p className="text-sm text-gray-400">{tenant.description}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Liên hệ</h4>
              {tenant.address && (
                <p className="text-sm text-gray-400">{tenant.address}</p>
              )}
              {tenant.phone && (
                <p className="text-sm text-gray-400">ĐT: {tenant.phone}</p>
              )}
              {tenant.email && (
                <p className="text-sm text-gray-400">Email: {tenant.email}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Links</h4>
              <div className="flex flex-col gap-2">
                <a href={`/tenant/${tenantId}/products`} className="text-sm text-gray-400 hover:text-white">
                  Sản phẩm
                </a>
                <a href={`/tenant/${tenantId}/about`} className="text-sm text-gray-400 hover:text-white">
                  Giới thiệu
                </a>
                <a href={`/tenant/${tenantId}/contact`} className="text-sm text-gray-400 hover:text-white">
                  Liên hệ
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * TenantPublicLayout - Layout cho trang public của tenant.
 *
 * Flow:
 * 1. Lấy tenantId từ URL params
 * 2. Gọi API /api/public/tenants/:tenantId
 * 3. Render layout với branding của tenant
 * 4. Render template tương ứng với tenant.theme
 *
 * Usage:
 * <Route path="/tenant/:tenantId" element={<TenantPublicLayout />}>
 *   <Route index element={<TenantHome />} />
 *   <Route path="products" element={<Products />} />
 * </Route>
 */
const TenantPublicLayout = ({ children }: TenantPublicLayoutProps) => {
  const { tenantId } = useParams<{ tenantId: string }>();

  if (!tenantId) {
    return <Navigate to="/" replace />;
  }

  return (
    <TenantProvider tenantId={tenantId}>
      <TenantPublicLayoutInner>{children}</TenantPublicLayoutInner>
    </TenantProvider>
  );
};

export default TenantPublicLayout;
