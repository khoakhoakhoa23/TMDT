import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../api/orderApi";

const RentalHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await orderApi.getMyOrders();
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err?.response?.data?.detail || "Không tải được lịch sử thuê xe");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      paid: "Đã thanh toán",
      shipped: "Đang giao",
      completed: "Đã hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
      processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
      paid: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
      shipped: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
      completed: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      cancelled: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    };
    return colorMap[status] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return `${(price / 1000).toFixed(0)}k VNĐ`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (car) => {
    if (car?.image_url) {
      if (car.image_url.startsWith("http")) {
        return car.image_url;
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      return baseUrl.replace("/api", "") + (car.image_url.startsWith("/") ? car.image_url : "/" + car.image_url);
    }
    return "/images/img_car.png";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4 transition-colors duration-300"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải lịch sử thuê xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Lịch sử thuê xe</h2>
        <button
          onClick={fetchOrders}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center transition-colors duration-300"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2 transition-colors duration-300">Chưa có đơn thuê xe nào</p>
          <button
            onClick={() => navigate("/category")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300"
          >
            Thuê xe ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const car = order.items?.[0]?.xe || order.items?.[0];
            return (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-none transition-all bg-white dark:bg-gray-700/50 transition-colors duration-300"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Car Image */}
                  {car && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(car)}
                        alt={car.ten_xe || "Car"}
                        className="w-24 h-24 object-contain rounded-lg bg-gray-100 dark:bg-gray-600 p-2 transition-colors duration-300"
                        onError={(e) => {
                          e.target.src = "/images/img_car.png";
                        }}
                      />
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                          {car?.ten_xe || `Đơn hàng #${order.id}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Mã đơn: #{order.id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3 transition-colors duration-300">
                      <div>
                        <span className="font-medium">Ngày thuê:</span> {formatDate(order.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">Ngày trả:</span> {formatDate(order.end_date)}
                      </div>
                      <div>
                        <span className="font-medium">Số ngày:</span> {order.rental_days || "—"} ngày
                      </div>
                      <div>
                        <span className="font-medium">Tổng tiền:</span>{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-semibold transition-colors duration-300">
                          {formatPrice(order.total_price)}
                        </span>
                      </div>
                    </div>

                    {order.pickup_location && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-300">
                        <span className="font-medium">Địa điểm nhận:</span> {order.pickup_location}
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-3">
                      <button
                        onClick={() => navigate(`/dashboard`)}
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RentalHistory;

