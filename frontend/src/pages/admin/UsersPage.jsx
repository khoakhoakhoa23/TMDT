import { useEffect, useState } from "react";
import userApi from "../../api/userApi";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await userApi.getAll();
        
        if (!res || !res.data) {
          throw new Error("Invalid response from server");
        }
        
        setUsers(res.data.results || res.data || []);
      } catch (err) {
        console.error("Users fetch error", err);
        const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách người dùng";
        setError(errorMessage);
        setUsers([]); // Reset users on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải người dùng...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 font-semibold">Lỗi: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <span className="text-gray-600">{users.length} người</span>
      </div>
      <div className="bg-white rounded-lg shadow border overflow-x-auto max-w-full">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">SĐT</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Địa chỉ</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Chưa có người dùng
                </td>
              </tr>
            ) : (
              users.map((u, index) => (
                <tr key={u.id || u.ma_kh || u.user?.id || index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    {u.ten_kh || u.full_name || u.user?.username || u.username || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.email || u.user?.email || u.user_email || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{u.sdt || u.phone || u.user?.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{u.dia_chi || u.address || u.user?.address || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;



