import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const allMenuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊", adminOnly: false },
    { path: "/dashboard/orders", label: "Đơn hàng", icon: "📦", adminOnly: true },
    { path: "/dashboard/products", label: "Sản phẩm", icon: "🚗", adminOnly: true },
    { path: "/dashboard/users", label: "Người dùng", icon: "👥", adminOnly: true, adminLabel: "Người dùng" },
    { path: "/dashboard/profile", label: "Thông tin cá nhân", icon: "👤", adminOnly: false, userLabel: "Thông tin cá nhân" },
    { path: "/dashboard/analytics", label: "Thống kê", icon: "📈", adminOnly: true },
  ];

  // Filter and map menu items based on user role
  const menuItems = allMenuItems
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => {
      // Nếu là user thường và có userLabel, dùng userLabel
      if (!isAdmin && item.userLabel) {
        return { ...item, label: item.userLabel };
      }
      // Nếu là admin và có adminLabel, dùng adminLabel
      if (isAdmin && item.adminLabel) {
        return { ...item, label: item.adminLabel };
      }
      return item;
    });

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
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

