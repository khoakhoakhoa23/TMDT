import { useEffect, useState } from "react";
import authApi from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await authApi.getUserRole();
        setRole(res.data.role);
      } catch {
        navigate("/login"); // chưa login → đá sang login
        
      }
    }

    loadRole();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Xin chào!</h1>
      <p>Vai trò người dùng: {role}</p>
    </div>
  );
}
