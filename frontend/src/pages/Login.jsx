import { useState, useEffect } from "react";
import authApi from "../api/authApi";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

// Kiểm tra xem có Google Client ID không
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const HAS_GOOGLE_OAUTH = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== "";

// Component riêng cho Google Login Button - chỉ render khi có GoogleOAuthProvider
function GoogleLoginButton({ onSuccess, onError, disabled, loading }) {
  // Chỉ sử dụng hook khi có client_id
  // Nếu không có GoogleOAuthProvider, hook sẽ throw error nhưng component sẽ không được render
  if (!HAS_GOOGLE_OAUTH) {
    return null; // Không render nếu không có client_id
  }

  // Hook chỉ hoạt động khi có GoogleOAuthProvider (đã được wrap trong App.jsx khi có client_id)
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
  });

  return (
    <>
      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Hoặc
          </span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={() => googleLogin()}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
      >
        {loading ? (
          <span>Đang xử lý...</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </>
        )}
      </button>
    </>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  // Google Login Handler
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError("");
    
    try {
      // Gửi token về backend để verify và lấy JWT
      const res = await authApi.googleLogin(tokenResponse.access_token);

      if (!res.data || !res.data.access) {
        throw new Error("Invalid response from server: missing access token");
      }

      // Lưu JWT tokens vào localStorage
      localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) {
        localStorage.setItem("refresh_token", res.data.refresh);
      }

      // Update user context
      if (res.data.user) {
        updateUser({
          id: res.data.user.id,
          username: res.data.user.username,
          email: res.data.user.email,
          first_name: res.data.user.first_name,
          last_name: res.data.user.last_name,
          role: res.data.user.role || "user",
          avatar_url: res.data.user.avatar_url,
          profile: res.data.user.profile,
        });
      }

      const redirect = location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        "Đăng nhập bằng Google thất bại. Vui lòng thử lại!";
      setError(errorMessage);
      console.error("Google login error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google OAuth error:", error);
    setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại!");
    setGoogleLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
    navigate("/");
    }
  }, [navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authApi.login(form);

      // Kiểm tra response có token không
      if (!res.data || !res.data.access) {
        throw new Error("Invalid response from server: missing access token");
      }

      // Lưu token vào localStorage
      localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) {
        localStorage.setItem("refresh_token", res.data.refresh);
      }

      // Debug: Log để kiểm tra
      console.log("[Login] Token saved:", {
        hasAccess: !!res.data.access,
        hasRefresh: !!res.data.refresh,
        accessTokenLength: res.data.access?.length,
      });

      // Fetch user info và update context
      try {
        // Thử dùng API mới /users/me/ để lấy đầy đủ thông tin
        try {
          const meRes = await authApi.getMe();
          updateUser({
            id: meRes.data.id,
            username: meRes.data.username,
            email: meRes.data.email,
            first_name: meRes.data.first_name,
            last_name: meRes.data.last_name,
            role: meRes.data.role || "user",
            avatar_url: meRes.data.avatar_url,
            profile: meRes.data.profile,
          });
        } catch (meError) {
          // Fallback về API cũ
          const roleRes = await authApi.getUserRole();
          updateUser({
            username: roleRes.data.username,
            role: roleRes.data.role || "user",
          });
        }
      } catch (roleError) {
        console.error("Error fetching user info:", roleError);
        // Không throw error, vẫn cho phép login thành công
      }

      const redirect = location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Sai tài khoản hoặc mật khẩu!";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none max-w-md mx-auto mt-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">Đăng nhập</h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 transition-colors duration-300">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Nhập username"
          value={form.username}
          onChange={handleChange}
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
          disabled={loading}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Nhập password"
          value={form.password}
          onChange={handleChange}
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
          disabled={loading}
          required
        />

        <button
          type="submit"
          className="bg-green-600 dark:bg-green-500 text-white p-2 rounded-lg mt-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300"
          disabled={loading || googleLoading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Google Sign In Button - chỉ hiển thị nếu có Google OAuth */}
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          disabled={loading}
          loading={googleLoading}
        />

        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
