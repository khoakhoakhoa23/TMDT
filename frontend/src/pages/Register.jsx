import { useState, useEffect } from "react";
import authApi from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
  if (token) navigate("/");
  }, [navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.register(form);
      navigate("/login");
    } catch (err) {
      const errorData = err.response?.data || {};
      let errorMessage = "Đăng ký thất bại!";

      // Format validation errors
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
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Đăng ký tài khoản</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-3">
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
          name="email"
          type="email"
          placeholder="Nhập email"
          value={form.email}
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
          className="bg-blue-600 text-white p-2 rounded mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p className="text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
