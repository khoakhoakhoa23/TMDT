import { createContext, useContext, useState, useEffect } from "react";
import authApi from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getUserRole();
        setUser({
          username: response.data.username,
          role: response.data.role || "user",
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Nếu lỗi, clear user
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
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

