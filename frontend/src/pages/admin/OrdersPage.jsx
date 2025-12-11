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
    { value: "pending", label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
    { value: "processing", label: "Đang chuẩn bị xe", color: "bg-blue-100 text-blue-700" },
    { value: "paid", label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
    { value: "shipped", label: "Đã nhận xe", color: "bg-purple-100 text-purple-700" },
    { value: "completed", label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    { value: "cancelled", label: "Đã hủy", color: "bg-red-100 text-red-700" },
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
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

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

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
              orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
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
                    <td className="px-4 py-3 text-gray-800 font-semibold">
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
                        className={`px-2 py-1 rounded text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                          statusInfo.color
                        } ${updatingStatus[order.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.actualPaymentStatus === "paid" || order.payment_status === "paid" ? "bg-green-100 text-green-700" :
                        order.actualPaymentStatus === "unpaid" || order.payment_status === "unpaid" ? "bg-yellow-100 text-yellow-700" :
                        order.actualPaymentStatus === "failed" || order.payment_status === "failed" ? "bg-red-100 text-red-700" :
                        order.paymentInfo?.status === "completed" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {order.paymentInfo?.status === "completed" ? "paid" :
                         order.actualPaymentStatus || 
                         order.payment_status || 
                         order.paymentInfo?.status || 
                         "unpaid"}
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
