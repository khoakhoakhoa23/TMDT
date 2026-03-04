import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import authApi from "../api/authApi";
import { getTenantPrefixFromPathname, joinTenantPath } from "../utils/tenantPaths";

// Floating Input Component với animation
function FloatingInput({ id, name, type, placeholder, disabled, error, register, label }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mb-4">
      <input
        id={id}
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 ${
          error
            ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20"
            : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 pointer-events-none transition-all duration-300 ${
          isFocused
            ? "-top-2.5 text-xs bg-white dark:bg-gray-800 px-2 text-blue-500 dark:text-blue-400 font-medium"
            : "top-3.5 text-gray-500 dark:text-gray-400"
        } ${error ? "text-red-500 dark:text-red-400" : ""}`}
      >
        {label || placeholder}
      </label>
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

// Animated Error Alert
function ErrorAlert({ message }) {
  return (
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-[shake_0.5s_ease-in-out]">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 animate-[pulse_1s_infinite] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Success Alert Component
function SuccessAlert({ onBackToLogin }) {
  return (
    <div className="text-center animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 animate-[bounce_1s_infinite]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email đã được gửi!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Vui lòng kiểm tra hộp thư email của bạn và click vào link để đặt lại mật khẩu.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Link sẽ hết hạn sau 1 giờ.
      </p>
      <AnimatedButton
        onClick={onBackToLogin}
        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 max-w-xs mx-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Quay lại đăng nhập
      </AnimatedButton>
    </div>
  );
}

// Info Alert Component
function InfoAlert() {
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Nhập email của bạn</p>
          <p className="text-blue-600 dark:text-blue-400">Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn.</p>
        </div>
      </div>
    </div>
  );
}

// Background Decorations
function BackgroundDecorations() {
  return (
    <>
      {/* Floating circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-[float_8s_ease-in-out_infinite]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
      
      {/* Small floating particles */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-cyan-400/50 rounded-full animate-[float_4s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-purple-400/50 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>
      <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-blue-400/50 rounded-full animate-[float_6s_ease-in-out_infinite]"></div>
    </>
  );
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const tenantPrefix = getTenantPrefixFromPathname(location.pathname);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await authApi.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        "Không thể gửi email. Vui lòng thử lại sau.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = joinTenantPath(tenantPrefix, "/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <BackgroundDecorations />
      
      <div className="relative w-full max-w-md px-4">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-[fadeInDown_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30 animate-[bounce_2s_infinite]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Quên mật khẩu?
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Không sao, chúng tôi sẽ giúp bạn</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 border border-white/50 dark:border-gray-700/50 p-8 animate-[fadeInUp_0.6s_ease-out]">
          {success ? (
            <SuccessAlert onBackToLogin={handleBackToLogin} />
          ) : (
            <>
              <InfoAlert />
              
              {error && <ErrorAlert message={error} />}

              <form onSubmit={handleSubmit(onSubmit)}>
                <FloatingInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  register={register}
                  label="Email"
                  disabled={loading}
                  error={errors.email?.message}
                />

                <div className="mt-6">
                  <AnimatedButton
                    loading={loading}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                  </AnimatedButton>
                </div>
              </form>

              {/* Back to Login Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
                  Nhớ mật khẩu rồi?{" "}
                  <Link
                    to={joinTenantPath(tenantPrefix, "/login")}
                    className="text-cyan-600 dark:text-cyan-400 font-semibold hover:text-cyan-700 dark:hover:text-cyan-300 transition-all duration-300 hover:underline inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại đăng nhập
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 animate-[fadeIn_0.5s_ease-out_0.7s_both]">
          © 2024 TMDT. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
}
