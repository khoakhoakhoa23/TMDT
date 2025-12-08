import { useState } from "react";
import authApi from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      await authApi.register(form);
      alert("Đăng ký thành công!");
      navigate("/login");
    } catch (error) {
      alert("Đăng ký thất bại: " + JSON.stringify(error.response.data));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Đăng ký tài khoản</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Nhập username"
          onChange={handleChange}
          className="border p-2"
        />

        <input
          name="email"
          placeholder="Nhập email"
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

        <button className="bg-blue-600 text-white p-2 rounded mt-2">
          Đăng ký
        </button>
      </form>
    </div>
  );
}
