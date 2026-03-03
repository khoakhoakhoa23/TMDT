import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authApi from "../api/authApi";

type UserRole = "super_admin" | "tenant_admin" | "admin" | "staff" | "user" | string | undefined;

type User =
  | {
      id?: number;
      username?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      role?: UserRole;
      avatar_url?: string | null;
      tenant?: {
        id: number;
        name: string;
        slug: string;
      } | null;
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
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
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
            tenant: response.data.tenant || null,
            profile: response.data.profile,
          });
        } catch {
          const response = await authApi.getUserRole();
          setUser({
            username: response.data.username,
            role: response.data.role || "user",
            tenant: response.data.tenant || null,
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
        tenant: response.data.tenant || null,
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
    user?.role === "super_admin" ||
    user?.role === "tenant_admin" ||
    user?.role === "admin" ||
    user?.role === "staff";
  const isSuperAdmin = user?.role === "super_admin";
  const isTenantAdmin = user?.role === "tenant_admin";
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
        isSuperAdmin,
        isTenantAdmin,
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

