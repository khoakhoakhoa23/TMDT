import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function XeList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    
    axiosClient
      .get("xe/")
      .then((res) => {
        setList(res.data.results || res.data); // Handle pagination
        setError("");
      })
      .catch((err) => {
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          "Không thể tải danh sách xe";
        setError(errorMessage);
        console.error("Error loading xe list:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Danh sách xe</h2>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Danh sách xe</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Danh sách xe</h2>
        <p>Không có xe nào trong danh sách.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách xe</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Mã xe</th>
              <th className="border border-gray-300 px-4 py-2">Tên xe</th>
              <th className="border border-gray-300 px-4 py-2">Giá</th>
              <th className="border border-gray-300 px-4 py-2">Số lượng</th>
              <th className="border border-gray-300 px-4 py-2">Màu sắc</th>
              <th className="border border-gray-300 px-4 py-2">Loại</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.ma_xe}>
                <td className="border border-gray-300 px-4 py-2">{x.ma_xe}</td>
                <td className="border border-gray-300 px-4 py-2">{x.ten_xe}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {x.gia?.toLocaleString("vi-VN")} đ
                </td>
                <td className="border border-gray-300 px-4 py-2">{x.so_luong}</td>
                <td className="border border-gray-300 px-4 py-2">{x.mau_sac}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {typeof x.loai_xe === "object" ? x.loai_xe.ten_loai : x.loai_xe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
