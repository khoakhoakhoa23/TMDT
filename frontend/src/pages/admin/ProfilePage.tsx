import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import authApi from "../../api/authApi";

const ProfilePage = () => {
  const { user, isSuperAdmin, isTenantAdmin } = useAuth();
  const [userInfo, setUserInfo] = useState<{
    username: string;
    role: string;
    tenant?: { id: number; name: string; slug: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError("");

        // Lấy thông tin user từ API
        const roleRes = await authApi.getUserRole();
        setUserInfo({
          username: roleRes.data.username,
          role: roleRes.data.role || "user",
          tenant: roleRes.data.tenant || null,
        });
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError(err?.response?.data?.detail || err?.message || "Không tải được thông tin");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const getRoleText = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "tenant_admin":
        return "Admin Công ty";
      case "admin":
        return "Quản trị viên";
      case "staff":
        return "Nhân viên";
      default:
        return "Khách hàng";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "tenant_admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4 transition-colors duration-300"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-300">Lỗi: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Thông tin cá nhân</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-none border border-gray-200 dark:border-gray-700 p-6 max-w-2xl transition-colors duration-300">
        <div className="space-y-4">
          {/* Avatar & Basic Info */}
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center transition-colors duration-300">
              <span className="text-2xl font-bold text-white">
                {userInfo?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{userInfo?.username || "N/A"}</h2>
              <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(userInfo?.role || "")}`}>
                {getRoleText(userInfo?.role || "")}
              </span>
            </div>
          </div>

          {/* Role & Tenant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Tên đăng nhập</label>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {userInfo?.username || "N/A"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Vai trò</label>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {getRoleText(userInfo?.role || "")}
              </div>
            </div>

            {/* Tenant Info - Only show for tenant_admin */}
            {(isTenantAdmin || userInfo?.role === "tenant_admin") && userInfo?.tenant && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Công ty (Tenant)</label>
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{userInfo.tenant.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({userInfo.tenant.slug})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Super Admin notice */}
            {isSuperAdmin && (
              <div className="md:col-span-2">
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center text-red-800 dark:text-red-400">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Bạn có quyền Super Admin - Quản lý toàn bộ hệ thống</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {isSuperAdmin
                ? "Bạn có toàn quyền quản lý hệ thống bao gồm quản lý tenants, users và analytics."
                : isTenantAdmin
                ? "Bạn có quyền quản lý tenant bao gồm đơn hàng, sản phẩm, khách hàng và hóa đơn."
                : "Để cập nhật thông tin chi tiết, vui lòng liên hệ quản trị viên."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

