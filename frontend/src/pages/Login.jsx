import { useState } from "react";
import authApi from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

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

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      navigate("/");
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Đăng nhập</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Nhập username"
          value={form.username}
          onChange={handleChange}
          className="border p-2"
          disabled={loading}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Nhập password"
          value={form.password}
          onChange={handleChange}
          className="border p-2"
          disabled={loading}
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
