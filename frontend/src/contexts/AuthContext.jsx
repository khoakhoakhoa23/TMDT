import { createContext, useContext, useState, useEffect } from "react";
import authApi from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Thử dùng API mới /users/me/ để lấy đầy đủ thông tin
        try {
          const response = await authApi.getMe();
          setUser({
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            role: response.data.role || "user",
            avatar_url: response.data.avatar_url,
            profile: response.data.profile,
          });
        } catch (meError) {
          // Fallback về API cũ nếu API mới chưa có
          const response = await authApi.getUserRole();
          setUser({
            username: response.data.username,
            role: response.data.role || "user",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Nếu lỗi, clear user
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
    }));
  };

  const refreshUser = async () => {
    // Refresh user data từ API
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
        role: response.data.role || "user",
        avatar_url: response.data.avatar_url,
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

  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const isUser = user?.role === "user";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUser,
        refreshUser,
        logout,
        isAdmin,
        isUser,
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

