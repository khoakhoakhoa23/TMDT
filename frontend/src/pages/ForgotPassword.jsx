import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Vui lòng nhập email");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      await authApi.requestPasswordReset(email);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Lấy lại mật khẩu
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Nhập email của bạn để nhận link đặt lại mật khẩu
            </p>
          </div>

          {success ? (
            <div className="mt-6">
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 transition-colors duration-300">
                <p className="font-medium">
                  Email đã được gửi thành công!
                </p>
                <p className="text-sm mt-1">
                  Vui lòng kiểm tra hộp thư email của bạn và click vào link để đặt lại mật khẩu.
                </p>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  Link sẽ hết hạn sau 1 giờ.
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-300"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded transition-colors duration-300">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-300"
                  placeholder="Nhập email của bạn"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {loading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-300"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

