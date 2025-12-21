import { useState, useEffect } from "react";
import statsApi from "../../api/statsApi";
import orderApi from "../../api/orderApi";

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [revenueToday, setRevenueToday] = useState(0);
  const [totalCarsSold, setTotalCarsSold] = useState(0);
  const [topSellingCars, setTopSellingCars] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllStats();
  }, []);

  useEffect(() => {
    fetchRevenueByMonth();
  }, [selectedYear, selectedMonth]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError("");

      const [todayRes, carsSoldRes, topCarsRes, ordersRes] = await Promise.all([
        statsApi.getRevenueToday(),
        statsApi.getTotalCarsSold(),
        statsApi.getTopSellingCars(),
        orderApi.getAll().catch(() => ({ data: { results: [] } })),
      ]);

      setRevenueToday(todayRes.data?.doanh_thu || 0);
      setTotalCarsSold(carsSoldRes.data?.tong_xe_da_ban || 0);
      setTopSellingCars(topCarsRes.data || []);
      
      // Lấy danh sách đơn hàng đã thanh toán
      const allOrders = ordersRes.data?.results || ordersRes.data || [];
      const paidOrders = allOrders.filter(order => order.payment_status === "paid");
      setOrders(paidOrders.slice(0, 10)); // Lấy 10 đơn hàng gần nhất
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err?.response?.data?.detail || err?.message || "Không tải được thống kê");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueByMonth = async () => {
    try {
      const response = await statsApi.getRevenueByMonth(selectedYear, selectedMonth);
      setRevenueByMonth({
        year: response.data?.nam || selectedYear,
        month: response.data?.thang || selectedMonth,
        revenue: response.data?.doanh_thu || 0,
      });
    } catch (err) {
      console.error("Error fetching monthly revenue:", err);
      setRevenueByMonth({
        year: selectedYear,
        month: selectedMonth,
        revenue: 0,
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
    ];
    return months[month - 1] || `Tháng ${month}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4 transition-colors duration-300"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Thống kê</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doanh thu hôm nay */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border-l-4 border-blue-500 dark:border-blue-400 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors duration-300">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2 transition-colors duration-300">
                {formatCurrency(revenueToday)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Doanh thu tháng */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border-l-4 border-green-500 dark:border-green-400 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors duration-300">
                Doanh thu {getMonthName(selectedMonth)}/{selectedYear}
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2 transition-colors duration-300">
                {formatCurrency(revenueByMonth.revenue || 0)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tổng xe đã bán */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border-l-4 border-purple-500 dark:border-purple-400 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors duration-300">Tổng xe đã bán</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2 transition-colors duration-300">
                {totalCarsSold.toLocaleString()} xe
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top xe bán chạy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">Top xe bán chạy</h2>
        {topSellingCars.length > 0 ? (
          <div className="space-y-4">
            {topSellingCars.map((car, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full transition-colors duration-300">
                    <span className="text-blue-600 dark:text-blue-400 font-bold transition-colors duration-300">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                      {car.xe__ten_xe || car.ten_xe || `Xe #${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      Đã bán: {car.total_sold || 0} chiếc
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                    {car.total_sold || 0} chiếc
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
            <p>Chưa có dữ liệu xe bán chạy</p>
          </div>
        )}
      </div>

      {/* Danh sách đơn hàng đã thanh toán */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">Danh sách đơn hàng đã thanh toán</h2>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Mã đơn</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Ngày đặt</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Tổng tiền</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 font-semibold transition-colors duration-300">#{order.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      {order.user?.username || order.shipping_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 font-semibold transition-colors duration-300">
                      {formatCurrency(order.total_price || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 transition-colors duration-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
            <p>Chưa có đơn hàng đã thanh toán</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

