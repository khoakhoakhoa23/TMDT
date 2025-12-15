import { useState, useEffect } from "react";
import authApi from "../api/authApi";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

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
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

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
