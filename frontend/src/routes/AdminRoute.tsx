import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type AdminRouteProps = {
  children: ReactNode;
  requiredRoles?: string[]; // Danh sách các role được phép truy cập
};

const AdminRoute = ({ children, requiredRoles }: AdminRouteProps) => {
  const { isAdmin, isSuperAdmin, isTenantAdmin, user, loading } = useAuth();
  const location = useLocation();

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

  // Nếu không phải admin (bao gồm super_admin, tenant_admin, admin, staff)
  if (!isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Nếu có yêu cầu role cụ thể
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role || "";
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      // Redirect về dashboard nếu không có quyền
      return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }
  }

  return children;
};

export default AdminRoute;

