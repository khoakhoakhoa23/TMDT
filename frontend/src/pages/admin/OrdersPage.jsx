import { useEffect, useState } from "react";
import orderApi from "../../api/orderApi";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await orderApi.getAll();
        
        if (!res || !res.data) {
          throw new Error("Invalid response from server");
        }
        
        setOrders(res.data.results || res.data || []);
      } catch (err) {
        console.error("Orders fetch error", err);
        const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách đơn hàng";
        setError(errorMessage);
        setOrders([]); // Reset orders on error
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
          <p className="text-gray-600">Đang tải đơn hàng...</p>
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
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <span className="text-gray-600">{orders.length} đơn</span>
      </div>
      <div className="bg-white rounded-lg shadow border overflow-x-auto max-w-full">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Khách hàng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Xe</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pick-Up</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Drop-Off</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Số ngày</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tổng tiền</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Thanh toán</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  Chưa có đơn hàng
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">#{order.id}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{order.shipping_name || order.user?.username || "N/A"}</div>
                    <div className="text-xs text-gray-500">{order.shipping_phone || order.user?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{order.items?.[0]?.xe?.ten_xe || "N/A"}</div>
                    <div className="text-xs text-gray-500">{order.items?.[0]?.xe?.loai_xe?.ten_loai || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="text-xs">{order.pickup_location || "—"}</div>
                    {order.start_date && (
                      <div className="text-xs text-gray-500">
                        {new Date(order.start_date).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="text-xs">{order.return_location || "—"}</div>
                    {order.end_date && (
                      <div className="text-xs text-gray-500">
                        {new Date(order.end_date).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.rental_days || (order.start_date && order.end_date
                      ? Math.ceil(
                          (new Date(order.end_date) - new Date(order.start_date)) /
                            (1000 * 60 * 60 * 24)
                        )
                      : "—")}{" "}
                    {order.rental_days ? "ngày" : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    {order.total_price ? `$${(order.total_price / 23000).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === "completed" ? "bg-green-100 text-green-700" :
                      order.status === "paid" ? "bg-blue-100 text-blue-700" :
                      order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      order.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {order.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.payment_status === "paid" ? "bg-green-100 text-green-700" :
                      order.payment_status === "unpaid" ? "bg-yellow-100 text-yellow-700" :
                      order.payment_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {order.payment_status || order.payment_method || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;



