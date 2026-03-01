import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authApi from "../api/authApi";

type UserRole = "admin" | "staff" | "user" | string | undefined;

type User =
  | {
      id?: number;
      username?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      role?: UserRole;
      avatar_url?: string | null;
      profile?: unknown;
    }
  | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isUser: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
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
        } catch {
          const response = await authApi.getUserRole();
          setUser({
            username: response.data.username,
            role: response.data.role || "user",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => ({
      ...(prev || {}),
      ...(userData as User),
    }));
  };

  const refreshUser = async () => {
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

  const isAdmin =
    user?.role === "admin" || user?.role === "staff";
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

