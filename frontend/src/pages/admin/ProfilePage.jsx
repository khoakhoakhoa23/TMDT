import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import authApi from "../../api/authApi";

const ProfilePage = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
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
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors duration-300">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                {userInfo?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{userInfo?.username || "N/A"}</h2>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {userInfo?.role === "admin" ? "Quản trị viên" : 
                 userInfo?.role === "staff" ? "Nhân viên" : 
                 "Khách hàng"}
              </p>
            </div>
          </div>

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
                {userInfo?.role === "admin" ? "Quản trị viên" : 
                 userInfo?.role === "staff" ? "Nhân viên" : 
                 "Khách hàng"}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Để cập nhật thông tin chi tiết, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

