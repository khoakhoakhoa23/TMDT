import { useState } from "react";
import authApi from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await authApi.login(form);

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      alert("Đăng nhập thành công!");
      navigate("/");
    } catch {
      alert("Sai tài khoản hoặc mật khẩu!");
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Đăng nhập</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Nhập username"
          onChange={handleChange}
          className="border p-2"
        />

        <input
          name="password"
          type="password"
          placeholder="Nhập password"
          onChange={handleChange}
          className="border p-2"
        />

        <button className="bg-green-600 text-white p-2 rounded mt-2">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
