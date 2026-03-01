import { useState, useEffect, useRef } from "react";
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

// Floating Input Component với animation
function FloatingInput({ name, type, placeholder, value, onChange, onBlur, disabled, error }) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  return (
    <div className="relative mb-4">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur && onBlur(e);
        }}
        onFocus={() => setIsFocused(true)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 ${
          error
            ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20"
            : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      <label
        className={`absolute left-4 pointer-events-none transition-all duration-300 ${
          isFocused || hasValue
            ? "-top-2.5 text-xs bg-white dark:bg-gray-800 px-2 text-blue-500 dark:text-blue-400 font-medium"
            : "top-3.5 text-gray-500 dark:text-gray-400"
        } ${error ? "text-red-500 dark:text-red-400" : ""}`}
      >
        {placeholder}
      </label>
      {error && (
        <svg className="absolute right-4 top-3.5 w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );
}

// Animated Button Component
function AnimatedButton({ children, loading, disabled, className, onClick, type }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={`relative overflow-hidden w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${className} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${isPressed ? "scale-95" : ""} ${isHovered && !disabled && !loading ? "shadow-lg transform -translate-y-0.5" : ""}`}
    >
      <span className={`relative z-10 flex items-center justify-center gap-2 ${loading ? "opacity-0" : "opacity-100"}`}>
        {children}
      </span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full ${
        isHovered && !disabled ? "animate-[shimmer_1.5s_infinite]" : ""
      }`}></div>
    </button>
  );
}

// Social Login Button Component
function SocialButton({ children, icon, onClick, loading, disabled, label }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 font-medium transition-all duration-300 ${
        isHovered && !disabled && !loading ? "transform scale-[1.02] shadow-md" : ""
      } disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label || children}</span>
    </button>
  );
}

// Google Login Button Component
function GoogleLoginButton({ onSuccess, onError, disabled, loading }) {
  if (!HAS_GOOGLE_OAUTH) return null;

  const googleLogin = useGoogleLogin({ onSuccess, onError });

  return (
    <div className="relative">
      <SocialButton
        label="Đăng nhập bằng Google"
        icon={
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
        onClick={() => googleLogin()}
        loading={loading}
        disabled={disabled}
      />
    </div>
  );
}

// Facebook Login Button Component
function FacebookLoginButton({ onSuccess, onError, disabled, loading }) {
  useEffect(() => {
    if (!HAS_FACEBOOK_OAUTH) return;
    if (window.FB) return;

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/vi_VN/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://connect.facebook.net/vi_VN/sdk.js"]');
      if (existingScript) existingScript.remove();
    };
  }, []);

  if (!HAS_FACEBOOK_OAUTH) return null;

  const handleFacebookLogin = () => {
    if (!window.FB) {
      onError(new Error("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau."));
      return;
    }

    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isHTTPS && !isLocalhost) {
      onError(new Error("Facebook Login yêu cầu HTTPS."));
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          onSuccess({ access_token: response.authResponse.accessToken });
        } else {
          onError(new Error("Bạn cần cấp quyền để đăng nhập."));
        }
      },
      { scope: "public_profile", return_scopes: true }
    );
  };

  return (
    <SocialButton
      label="Đăng nhập bằng Facebook"
      icon={
        <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      }
      onClick={handleFacebookLogin}
      loading={loading}
      disabled={disabled}
    />
  );
}

// Animated Error Alert
function ErrorAlert({ message }) {
  return (
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-[shake_0.5s_ease-in-out]">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 animate-[pulse_1s_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Responsive Card Component
function GlassCard({ children, className = "" }) {
  return (
    <div className={`
      bg-white/80 dark:bg-gray-800/80 
      backdrop-blur-xl 
      rounded-2xl sm:rounded-3xl 
      shadow-xl sm:shadow-2xl 
      shadow-blue-500/10 
      border border-white/50 dark:border-gray-700/50 
      p-4 sm:p-6 md:p-8
      transition-all duration-300
      w-full
      ${className}
    `}>
      {children}
    </div>
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
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  // Google Login Handler
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError("");
    
    try {
      const res = await authApi.googleLogin(tokenResponse.access_token);
      if (!res.data || !res.data.access) {
        throw new Error("Invalid response from server");
      }
      localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) localStorage.setItem("refresh_token", res.data.refresh);
      
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
      const errorMessage = err.response?.data?.detail || "Đăng nhập bằng Google thất bại!";
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google OAuth error:", error);
    setError("Đăng nhập bằng Google thất bại!");
    setGoogleLoading(false);
  };

  // Facebook Login Handler
  const handleFacebookSuccess = async (tokenResponse) => {
    setFacebookLoading(true);
    setError("");
    
    try {
      const res = await authApi.facebookLogin(tokenResponse.access_token);
      if (!res.data || !res.data.access) {
        throw new Error("Invalid response from server");
      }
      localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) localStorage.setItem("refresh_token", res.data.refresh);
      
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
      const errorMessage = err.response?.data?.detail || "Đăng nhập bằng Facebook thất bại!";
      setError(errorMessage);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleFacebookError = (error) => {
    console.error("Facebook OAuth error:", error);
    setError("Đăng nhập bằng Facebook thất bại!");
    setFacebookLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) navigate("/");
  }, [navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authApi.login(form);
      if (!res.data || !res.data.access) {
        throw new Error("Invalid response from server");
      }
      localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) localStorage.setItem("refresh_token", res.data.refresh);

      try {
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
          const roleRes = await authApi.getUserRole();
          updateUser({
            username: roleRes.data.username,
            role: roleRes.data.role || "user",
          });
        }
      } catch (roleError) {
        console.error("Error fetching user info:", roleError);
      }

      const redirect = location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Sai tài khoản hoặc mật khẩu!";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden px-4 py-8">
      {/* Floating circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-[float_6s_ease-in-out_infinite] hidden sm:block"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl animate-[float_8s_ease-in-out_infinite] hidden sm:block"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
      
      {/* Small floating particles - hidden on mobile */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400/50 rounded-full animate-[float_4s_ease-in-out_infinite] hidden sm:block"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-purple-400/50 rounded-full animate-[float_5s_ease-in-out_infinite] hidden sm:block"></div>
      <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-green-400/50 rounded-full animate-[float_6s_ease-in-out_infinite] hidden sm:block"></div>
      
      <div className="relative w-full max-w-sm sm:max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8 animate-[fadeInDown_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/30 animate-[bounce_2s_infinite]">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Chào mừng trở lại
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Đăng nhập để tiếp tục</p>
        </div>

        {/* Login Card with responsive glassmorphism */}
        <GlassCard className="animate-[fadeInUp_0.6s_ease-out]">
          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <FloatingInput
              name="username"
              type="text"
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              error={error && !form.username}
            />

            <div className="relative mb-3 sm:mb-4">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                  error && !form.password
                    ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <label className={`absolute left-4 pointer-events-none transition-all duration-300 ${
                form.password.length > 0 ? "-top-2.5 text-xs bg-white dark:bg-gray-800 px-2 text-blue-500 dark:text-blue-400 font-medium" : "top-3.5 text-gray-500 dark:text-gray-400"
              }`}>
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mb-2">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <AnimatedButton
              loading={loading}
              disabled={loading || googleLoading || facebookLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </AnimatedButton>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-300 text-xs sm:text-sm">
                  hoặc tiếp tục với
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading || facebookLoading}
                loading={googleLoading}
              />
              <FacebookLoginButton
                onSuccess={handleFacebookSuccess}
                onError={handleFacebookError}
                disabled={loading || googleLoading}
                loading={facebookLoading}
              />
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-center text-xs text-gray-500 dark:text-gray-400 animate-[fadeIn_0.5s_ease-out_0.7s_both]">
          © 2024 TMDT. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
}
