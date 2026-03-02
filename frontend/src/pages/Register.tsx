import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import authApi from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

// Floating Input Component với animation
function FloatingInput({ name, type, placeholder, disabled, error, register, label }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mb-4">
      <input
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
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-[shake_0.5s_ease-in-out] whitespace-pre-line">
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
function SuccessAlert({ onLoginClick }) {
  return (
    <div className="text-center animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-green-500/30 animate-[bounce_1s_infinite]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đăng ký thành công!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Tài khoản của bạn đã được tạo thành công.
        <br />
        Vui lòng đăng nhập để tiếp tục.
      </p>
      <AnimatedButton
        onClick={onLoginClick}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 max-w-xs mx-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Đăng nhập ngay
      </AnimatedButton>
    </div>
  );
}

// Background Decorations
function BackgroundDecorations() {
  return (
    <>
      {/* Floating circles */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-[float_8s_ease-in-out_infinite]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
      
      {/* Small floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/50 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-blue-400/50 rounded-full animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-pink-400/50 rounded-full animate-[float_4s_ease-in-out_infinite]"></div>
    </>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    }
  });

  const password = watch("password", "");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) navigate("/");
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      await authApi.register(data);
      setIsSuccess(true);
    } catch (err) {
      const errorData = err.response?.data || {};
      let errorMessage = "Đăng ký thất bại!";

      if (typeof errorData === "object") {
        const errors = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`;
            }
            return `${key}: ${value}`;
          })
          .join("\n");
        if (errors) errorMessage = errors;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <BackgroundDecorations />
      
      <div className="relative w-full max-w-md px-4">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-[fadeInDown_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30 animate-[bounce_2s_infinite]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tạo tài khoản mới
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Tham gia cùng chúng tôi ngay hôm nay</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-white/50 dark:border-gray-700/50 p-8 animate-[fadeInUp_0.6s_ease-out]">
          {isSuccess ? (
            <SuccessAlert onLoginClick={handleLoginClick} />
          ) : (
            <>
              {error && <ErrorAlert message={error} />}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FloatingInput
                  name="username"
                  type="text"
                  placeholder="Tên đăng nhập"
                  register={register}
                  label="Tên đăng nhập"
                  disabled={loading}
                  error={errors.username?.message}
                />

                <FloatingInput
                  name="email"
                  type="email"
                  placeholder="Email"
                  register={register}
                  label="Email"
                  disabled={loading}
                  error={errors.email?.message}
                />

                <div className="relative mb-4">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    {...register("password", {
                      required: "Mật khẩu là bắt buộc",
                      minLength: {
                        value: 8,
                        message: "Mật khẩu phải có ít nhất 8 ký tự"
                      }
                    })}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      errors.password
                        ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20"
                        : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <label className={`absolute left-4 pointer-events-none transition-all duration-300 ${
                    password?.length > 0 ? "-top-2.5 text-xs bg-white dark:bg-gray-800 px-2 text-blue-500 dark:text-blue-400 font-medium" : "top-3.5 text-gray-500 dark:text-gray-400"
                  }`}>
                    Mật khẩu
                  </label>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">{errors.password.message}</p>
                  )}
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

                {/* Password strength indicator */}
                <div className="space-y-2 mb-4">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${password?.length >= 1 ? (password?.length >= 8 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${password?.length >= 3 ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${password?.length >= 6 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${password?.length >= 8 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mật khẩu phải có ít nhất 8 ký tự
                  </p>
                </div>

                <AnimatedButton
                  loading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </AnimatedButton>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 hover:underline"
                  >
                    Đăng nhập ngay
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
