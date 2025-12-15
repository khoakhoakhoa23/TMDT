import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import userApi from "../api/userApi";
import NotificationDropdown from "../components/NotificationDropdown";
import WishlistPanel from "../components/WishlistPanel";
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import RentalHistory from "../components/RentalHistory";
import AvatarUploader from "../components/AvatarUploader";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await userApi.getProfile();
      setUser(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err?.response?.data?.detail || err?.message || "Không tải được thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (formData) => {
    try {
      const response = await userApi.uploadAvatar(formData);
      // Cập nhật user trong state
      setUser(response.data);
      // Đồng bộ với AuthContext để Header cũng cập nhật
      await refreshUser();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.detail || "Upload avatar thất bại",
      };
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      await userApi.updateProfile(data);
      await fetchProfile();
      // Đồng bộ với AuthContext
      await refreshUser();
      setShowEditModal(false);
      return { success: true, message: "Cập nhật thông tin thành công!" };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.detail || err?.response?.data?.message || "Cập nhật thất bại",
      };
    }
  };

  const handleChangePassword = async (data) => {
    try {
      await userApi.changePassword(data);
      setShowPasswordModal(false);
      return { success: true, message: "Đổi mật khẩu thành công!" };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.detail || "Đổi mật khẩu thất bại",
      };
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "staff":
        return "Nhân viên";
      default:
        return "Khách hàng";
    }
  };

  const getStatusText = (isActive) => {
    return isActive ? "Hoạt động" : "Đã khóa";
  };

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-none p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400 mr-3 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Lỗi</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-300">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const fullName = user?.first_name || user?.last_name 
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : user?.username || "N/A";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header với Notifications và Wishlist */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Thông tin cá nhân</h1>
          <div className="flex items-center space-x-3">
            {/* Wishlist Icon */}
            <button
              onClick={() => {
                setShowWishlist(true);
                setShowNotifications(false);
              }}
              className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
              title="Danh sách yêu thích"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Notifications Icon */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowWishlist(false);
                }}
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
                title="Thông báo"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <AvatarUploader
                  currentAvatar={user?.avatar_url}
                  onUpload={handleAvatarUpload}
                  className="w-32 h-32 mx-auto"
                />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-4 transition-colors duration-300">{fullName}</h2>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{user?.email || "N/A"}</p>
              </div>

              {/* Profile Info */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Tên đăng nhập</label>
                  <p className="text-gray-800 dark:text-gray-100 font-semibold transition-colors duration-300">{user?.username || "N/A"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Email</label>
                  <p className="text-gray-800 dark:text-gray-100 transition-colors duration-300">{user?.email || "N/A"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Vai trò</label>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold transition-colors duration-300">
                    {getRoleText(user?.role)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Trạng thái</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-300 ${getStatusColor(user?.is_active)}`}>
                    {getStatusText(user?.is_active)}
                  </span>
                </div>

                {user?.date_joined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Ngày tham gia</label>
                    <p className="text-gray-800 dark:text-gray-100 transition-colors duration-300">
                      {new Date(user.date_joined).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-300">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Cập nhật thông tin
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Rental History */}
          <div className="lg:col-span-2">
            <RentalHistory />
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onUpdate={handleUpdateProfile}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onChangePassword={handleChangePassword}
      />

      {/* Wishlist Panel */}
      <WishlistPanel isOpen={showWishlist} onClose={() => setShowWishlist(false)} />
    </div>
  );
};

export default ProfilePage;

