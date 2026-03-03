import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { isSuperAdmin, isTenantAdmin, isAdmin, isUser, user } = useAuth();

  // Menu cho từng role
  const superAdminMenu = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/dashboard/tenants", label: "Quản lý Tenants", icon: "🏢" },
    { path: "/dashboard/analytics", label: "Analytics", icon: "📈" },
    { path: "/dashboard/profile", label: "Thông tin cá nhân", icon: "👤" },
  ];

  const tenantAdminMenu = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/dashboard/orders", label: "Đơn hàng", icon: "📦" },
    { path: "/dashboard/products", label: "Sản phẩm", icon: "🚗" },
    { path: "/dashboard/import-invoices", label: "Hóa đơn nhập", icon: "📥" },
    { path: "/dashboard/export-invoices", label: "Hóa đơn xuất", icon: "📤" },
    { path: "/dashboard/users", label: "Khách hàng", icon: "👥" },
    { path: "/dashboard/analytics", label: "Thống kê", icon: "📈" },
    { path: "/dashboard/notifications-test", label: "WS Test", icon: "🔔" },
    { path: "/dashboard/profile", label: "Thông tin cá nhân", icon: "👤" },
  ];

  const userMenu = [
    { path: "/", label: "Trang chủ", icon: "🏠" },
    { path: "/dashboard/orders", label: "Đơn thuê của tôi", icon: "📦" },
    { path: "/dashboard/profile", label: "Thông tin cá nhân", icon: "👤" },
  ];

  // Chọn menu theo role
  let menuItems = [];
  if (isSuperAdmin) {
    menuItems = superAdminMenu;
  } else if (isTenantAdmin || isAdmin) {
    menuItems = tenantAdminMenu;
  } else if (isUser) {
    menuItems = userMenu;
  } else {
    // Fallback - hiển thị menu mặc định
    menuItems = [
      { path: "/dashboard", label: "Dashboard", icon: "📊" },
      { path: "/dashboard/profile", label: "Thông tin cá nhân", icon: "👤" },
    ];
  }

  // Get role display name
  const getRoleDisplayName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isTenantAdmin) return "Admin Công ty";
    if (isAdmin) return "Admin";
    return "Khách hàng";
  };

  return (
    <aside className="w-64 bg-gray-800 dark:bg-gray-900 text-white min-h-screen border-r border-gray-700 dark:border-gray-800 transition-colors duration-300">
      <div className="p-4">
        {/* User Info */}
        <div className="mb-6 p-3 bg-gray-700 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Xin chào,</p>
          <p className="font-semibold text-white truncate">{user?.username || "User"}</p>
          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
            isSuperAdmin ? "bg-red-600" : isTenantAdmin ? "bg-blue-600" : "bg-green-600"
          }`}>
            {getRoleDisplayName()}
          </span>
        </div>

        <h2 className="text-xl font-bold mb-6 text-white dark:text-gray-100 transition-colors duration-300">
          {isSuperAdmin ? "Super Admin" : isTenantAdmin ? "Quản lý" : "Menu"}
        </h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    location.pathname === item.path
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

