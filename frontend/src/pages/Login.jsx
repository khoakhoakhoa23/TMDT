import { useState, useEffect } from "react";
import authApi from "../api/authApi";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

// Kiểm tra xem có Google Client ID không
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const HAS_GOOGLE_OAUTH = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== "";

// Kiểm tra xem có Facebook App ID không
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "";
const HAS_FACEBOOK_OAUTH = FACEBOOK_APP_ID && FACEBOOK_APP_ID.trim() !== "";

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

// Component riêng cho Facebook Login Button
function FacebookLoginButton({ onSuccess, onError, disabled, loading }) {
  useEffect(() => {
    // Load Facebook SDK nếu chưa có
    if (!HAS_FACEBOOK_OAUTH) return;

    if (window.FB) {
      // SDK đã được load
      return;
    }

    // Tạo script tag để load Facebook SDK
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/vi_VN/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // Initialize Facebook SDK
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script khi component unmount
      const existingScript = document.querySelector(
        'script[src="https://connect.facebook.net/vi_VN/sdk.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  if (!HAS_FACEBOOK_OAUTH) {
    return null;
  }

  const handleFacebookLogin = () => {
    if (!window.FB) {
      onError(new Error("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau."));
      return;
    }

    // Kiểm tra xem có đang chạy trên HTTPS không
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Facebook yêu cầu HTTPS, nhưng cho phép localhost trong development
    // Nếu không phải HTTPS và không phải localhost, báo lỗi
    if (!isHTTPS && !isLocalhost) {
      onError(new Error("Facebook Login yêu cầu HTTPS. Vui lòng sử dụng HTTPS hoặc localhost."));
      return;
    }

    try {
      window.FB.login(
        (response) => {
          if (response.authResponse) {
            // User đã đăng nhập và cấp quyền
            const accessToken = response.authResponse.accessToken;
            onSuccess({ access_token: accessToken });
          } else {
            // User đã đăng nhập nhưng không cấp quyền
            onError(new Error("Bạn cần cấp quyền để đăng nhập."));
          }
        },
        {
          // Tạm thời chỉ dùng public_profile nếu email permission chưa được approve
          // Sau khi email permission được approve, có thể thêm lại "email,public_profile"
          scope: "public_profile",
          return_scopes: true,
        }
      );
    } catch (error) {
      // Xử lý lỗi HTTPS requirement
      if (error.message && error.message.includes('http pages')) {
        onError(new Error("Facebook Login yêu cầu HTTPS. Vui lòng chạy app trên HTTPS hoặc dùng localhost."));
      } else {
        onError(error);
      }
    }
  };

  return (
    <>
      {/* Facebook Sign In Button */}
      <button
        type="button"
        onClick={handleFacebookLogin}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] dark:bg-[#1877F2] text-white p-2 rounded-lg hover:bg-[#166FE5] dark:hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
      >
        {loading ? (
          <span>Đang xử lý...</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Đăng nhập bằng Facebook</span>
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
  const [facebookLoading, setFacebookLoading] = useState(false);
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

  // Facebook Login Handler
  const handleFacebookSuccess = async (tokenResponse) => {
    setFacebookLoading(true);
    setError("");
    
    try {
      // Gửi token về backend để verify và lấy JWT
      const res = await authApi.facebookLogin(tokenResponse.access_token);

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
        "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại!";
      setError(errorMessage);
      console.error("Facebook login error:", err);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleFacebookError = (error) => {
    console.error("Facebook OAuth error:", error);
    setError("Đăng nhập bằng Facebook thất bại. Vui lòng thử lại!");
    setFacebookLoading(false);
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
          disabled={loading || googleLoading || facebookLoading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Google Sign In Button - chỉ hiển thị nếu có Google OAuth */}
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          disabled={loading || facebookLoading}
          loading={googleLoading}
        />

        {/* Facebook Sign In Button - chỉ hiển thị nếu có Facebook OAuth */}
        <FacebookLoginButton
          onSuccess={handleFacebookSuccess}
          onError={handleFacebookError}
          disabled={loading || googleLoading}
          loading={facebookLoading}
        />

        <div className="text-center space-y-2">
          <p className="text-sm">
            <Link
              to="/forgot-password"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
            >
              Quên mật khẩu?
            </Link>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
