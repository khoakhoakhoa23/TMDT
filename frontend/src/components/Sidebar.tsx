import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[]; // Nếu không có role giới hạn ai cũng xem được
}

const Sidebar = () => {
  const location = useLocation();
  const urlParams = useParams<{ tenantId?: string }>();
  const { 
    isSuperAdmin, 
    isTenantAdmin, 
    isEmployee, 
    isAdmin, 
    isCustomer,
    user,
    tenantId: authTenantId
  } = useAuth();

  // Determine base path: /tenant/:tenantId or /dashboard
  // Use URL tenantId if available, otherwise use auth tenantId
  const tenantId = urlParams.tenantId || authTenantId;
  const isTenantUrl = location.pathname.startsWith("/tenant/");
  // Tenant admin zone is under /tenant/:tenantId/dashboard/*
  const basePath =
    isTenantUrl && tenantId ? `/tenant/${tenantId}/dashboard` : "/dashboard";

  // ==================== Menu Definitions ====================
  
  // SUPER_ADMIN Menu - Toàn quyền hệ thống
  const superAdminMenu: MenuItem[] = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/tenants", label: "Quản lý Tenants", icon: "🏢" },
    { path: "/admin/users", label: "Quản lý Users", icon: "👥" },
    { path: "/admin/analytics", label: "Analytics", icon: "📈" },
    { path: "/admin/notifications-test", label: "WS Test", icon: "🔔" },
    { path: "/admin/profile", label: "Thông tin cá nhân", icon: "👤" },
  ];

  // TENANT_ADMIN Menu - Quản lý tenant
  const tenantAdminMenu: MenuItem[] = [
    { path: `${basePath}`, label: "Dashboard", icon: "📊" },
    { path: `${basePath}/orders`, label: "Đơn hàng", icon: "📦" },
    { path: `${basePath}/products`, label: "Sản phẩm", icon: "🚗" },
    { path: `${basePath}/locations`, label: "Địa điểm", icon: "📍" },
    { path: `${basePath}/car-types`, label: "Loại xe", icon: "🚙" },
    { path: `${basePath}/employees`, label: "Nhân viên", icon: "👨‍💼" },
    { path: `${basePath}/import-invoices`, label: "Hóa đơn nhập", icon: "📥" },
    { path: `${basePath}/export-invoices`, label: "Hóa đơn xuất", icon: "📤" },
    { path: `${basePath}/customers`, label: "Khách hàng", icon: "👥" },
    { path: `${basePath}/analytics`, label: "Thống kê", icon: "📈" },
    { path: `${basePath}/settings`, label: "Cài đặt", icon: "⚙️" },
    { path: `${basePath}/profile`, label: "Thông tin cá nhân", icon: "👤" },
  ];

  // EMPLOYEE Menu - Thao tác nghiệp vụ (hạn chế hơn)
  const employeeMenu: MenuItem[] = [
    { path: `${basePath}`, label: "Dashboard", icon: "📊" },
    { path: `${basePath}/orders`, label: "Đơn hàng", icon: "📦" },
    { path: `${basePath}/products`, label: "Sản phẩm", icon: "🚗" },
    { path: `${basePath}/locations`, label: "Địa điểm", icon: "📍" },
    { path: `${basePath}/import-invoices`, label: "Hóa đơn nhập", icon: "📥" },
    { path: `${basePath}/export-invoices`, label: "Hóa đơn xuất", icon: "📤" },
    { path: `${basePath}/customers`, label: "Khách hàng", icon: "👥" },
    { path: `${basePath}/analytics`, label: "Thống kê", icon: "📈" },
    { path: `${basePath}/profile`, label: "Thông tin cá nhân", icon: "👤" },
  ];

  // CUSTOMER Menu - Chỉ xem dữ liệu của mình
  const customerMenu: MenuItem[] = [
    { path: "/", label: "Trang chủ", icon: "🏠" },
    { path: `${basePath}/orders`, label: "Đơn thuê của tôi", icon: "📦" },
    { path: `${basePath}/profile`, label: "Thông tin cá nhân", icon: "👤" },
  ];

  // ==================== Select Menu by Role ====================
  
  let menuItems: MenuItem[] = [];
  let sidebarTitle = "Menu";
  let roleBadgeColor = "bg-green-600";

  if (isSuperAdmin) {
    menuItems = superAdminMenu;
    sidebarTitle = "Super Admin";
    roleBadgeColor = "bg-red-600";
  } else if (isTenantAdmin) {
    menuItems = tenantAdminMenu;
    sidebarTitle = "Quản trị viên";
    roleBadgeColor = "bg-blue-600";
  } else if (isEmployee) {
    menuItems = employeeMenu;
    sidebarTitle = "Nhân viên";
    roleBadgeColor = "bg-orange-600";
  } else if (isCustomer) {
    menuItems = customerMenu;
    sidebarTitle = "Khách hàng";
    roleBadgeColor = "bg-green-600";
  } else {
    // Fallback
    menuItems = [
      { path: basePath, label: "Dashboard", icon: "📊" },
      { path: `${basePath}/profile`, label: "Thông tin cá nhân", icon: "👤" },
    ];
  }

  // Get tenant name for display
  const tenantName = user?.tenant?.name || (tenantId ? `Tenant ${tenantId}` : "");

  // ==================== Helpers ====================
  
  const getRoleDisplayName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isTenantAdmin) return "Quản trị viên";
    if (isEmployee) return "Nhân viên";
    return "Khách hàng";
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-64 bg-gray-800 dark:bg-gray-900 text-white min-h-screen border-r border-gray-700 dark:border-gray-800 transition-colors duration-300">
      <div className="p-4">
        {/* User Info */}
        <div className="mb-6 p-3 bg-gray-700 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Xin chào,</p>
          <p className="font-semibold text-white truncate">{user?.username || "User"}</p>
          {tenantName && isTenantUrl && (
            <p className="text-xs text-gray-400 mt-1 truncate" title={tenantName}>
              🏢 {tenantName}
            </p>
          )}
          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${roleBadgeColor}`}>
            {getRoleDisplayName()}
          </span>
        </div>

        <h2 className="text-xl font-bold mb-6 text-white dark:text-gray-100 transition-colors duration-300">
          {sidebarTitle}
        </h2>
        
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    isActive(item.path)
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
