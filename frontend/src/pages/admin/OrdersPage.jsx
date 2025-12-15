import { useEffect, useState } from "react";
import orderApi from "../../api/orderApi";
import paymentApi from "../../api/paymentApi";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});

  const statusOptions = [
    { value: "pending", label: "Chờ thanh toán", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
    { value: "processing", label: "Đang chuẩn bị xe", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
    { value: "paid", label: "Đã thanh toán", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    { value: "shipped", label: "Đã nhận xe", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
    { value: "completed", label: "Hoàn thành", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    { value: "cancelled", label: "Đã hủy", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch cả orders và payments
      const [ordersRes, paymentsRes] = await Promise.all([
        orderApi.getAll(),
        paymentApi.getAll().catch(() => ({ data: { results: [] } })) // Nếu lỗi thì trả về empty
      ]);
      
      if (!ordersRes || !ordersRes.data) {
        throw new Error("Invalid response from server");
      }
      
      const allOrders = ordersRes.data.results || ordersRes.data || [];
      const allPayments = paymentsRes.data.results || paymentsRes.data || [];
      
      // Tạo map payment theo order_id để dễ tra cứu
      const paymentMap = {};
      allPayments.forEach((payment) => {
        const orderId = payment.order || payment.order_id;
        if (orderId) {
          // Nếu đã có payment cho order này, ưu tiên payment có status completed
          if (!paymentMap[orderId] || payment.status === "completed") {
            paymentMap[orderId] = payment;
          }
        }
      });
      
      // Enrich orders với payment status thực tế
      const enrichedOrders = allOrders.map((order) => {
        const payment = paymentMap[order.id];
        // Ưu tiên payment status từ Payment model, nếu không có thì dùng order.payment_status
        const actualPaymentStatus = payment?.status === "completed" 
          ? "paid" 
          : payment?.status === "failed" 
          ? "failed" 
          : order.payment_status || "unpaid";
        
        return {
          ...order,
          actualPaymentStatus,
          paymentInfo: payment, // Lưu payment info để hiển thị
        };
      });
      
      // Hiển thị tất cả đơn hàng (không filter)
      setOrders(enrichedOrders);
    } catch (err) {
      console.error("Orders fetch error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách đơn hàng";
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus({ ...updatingStatus, [orderId]: true });
      await orderApi.updateStatus(orderId, newStatus);
      
      // Cập nhật local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (err) {
      console.error("Update status error", err);
      alert(err?.response?.data?.detail || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setUpdatingStatus({ ...updatingStatus, [orderId]: false });
    }
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { 
      label: status || "pending", 
      color: "bg-gray-100 text-gray-700" 
    };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4 transition-colors duration-300"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-300">Lỗi: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Đơn hàng</h1>
        <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{orders.length} đơn</span>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 transition-colors duration-300">
          <p className="text-yellow-800 dark:text-yellow-400 text-sm transition-colors duration-300">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full transition-colors duration-300">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Khách hàng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Xe</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Pick-Up</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Drop-Off</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Số ngày</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Tổng tiền</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Thanh toán</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  Chưa có đơn hàng
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <tr key={order.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">#{order.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      <div className="font-medium">{order.shipping_name || order.user?.username || "N/A"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">{order.shipping_phone || order.user?.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      <div className="font-medium">{order.items?.[0]?.xe?.ten_xe || "N/A"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">{order.items?.[0]?.xe?.loai_xe?.ten_loai || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      <div className="text-xs">{order.pickup_location || "—"}</div>
                      {order.start_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                          {new Date(order.start_date).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      <div className="text-xs">{order.return_location || "—"}</div>
                      {order.end_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                          {new Date(order.end_date).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      {(() => {
                        const days = order.rental_days || (order.start_date && order.end_date
                          ? Math.ceil(
                              (new Date(order.end_date) - new Date(order.start_date)) /
                                (1000 * 60 * 60 * 24)
                            )
                          : null);
                        return days ? `${days} ngày` : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 font-semibold transition-colors duration-300">
                      {(() => {
                        const days = order.rental_days || (order.start_date && order.end_date
                          ? Math.ceil(
                              (new Date(order.end_date) - new Date(order.start_date)) /
                                (1000 * 60 * 60 * 24)
                            )
                          : 1);
                        
                        const car = order.items?.[0]?.xe;
                        const pricePerDay = car?.gia_thue || car?.gia_khuyen_mai || car?.gia || 0;
                        const calculatedTotal = pricePerDay * days;
                        let finalTotal = order.total_price || 0;
                        
                        if (finalTotal === 0 || (calculatedTotal > 0 && finalTotal < calculatedTotal)) {
                          finalTotal = calculatedTotal;
                        }
                        
                        return finalTotal > 0 ? `${(finalTotal / 1000).toFixed(0)}k VNĐ` : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingStatus[order.id]}
                        className={`px-2 py-1 rounded text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          statusInfo.color
                        } ${updatingStatus[order.id] ? "opacity-50 cursor-not-allowed" : ""} transition-colors duration-300`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        order.actualPaymentStatus === "paid" || order.payment_status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                        order.actualPaymentStatus === "unpaid" || order.payment_status === "unpaid" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                        order.actualPaymentStatus === "failed" || order.payment_status === "failed" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                        order.paymentInfo?.status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        {order.paymentInfo?.status === "completed" ? "paid" :
                         order.actualPaymentStatus || 
                         order.payment_status || 
                         order.paymentInfo?.status || 
                         "unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs transition-colors duration-300">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("vi-VN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
