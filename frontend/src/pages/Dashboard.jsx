import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Chart from "../components/Chart";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    doanhThuHomNay: 0,
    tongXeDaBan: 0,
    topXeBanChay: [],
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentTransactions();
  }, []);

  const fetchStats = async () => {
    try {
      const [revenueToday, totalSold, topCars] = await Promise.all([
        axiosClient.get("thongke/doanhthu-homnay/"),
        axiosClient.get("thongke/tong-xe-da-ban/"),
        axiosClient.get("thongke/top-xe-ban-chay/"),
      ]);

      setStats({
        doanhThuHomNay: revenueToday.data.doanh_thu || 0,
        tongXeDaBan: totalSold.data.tong_xe || 0,
        topXeBanChay: topCars.data.results || topCars.data || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await axiosClient.get("order/");
      const orders = response.data.results || response.data;
      setRecentTransactions(orders.slice(0, 4));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleTransactionClick = (transaction) => {
    const carId = transaction.items?.[0]?.xe?.ma_xe || transaction.items?.[0]?.xe?.id;
    if (carId) {
      navigate(`/detail/${carId}`);
      return;
    }
    navigate("/category");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  // Prepare chart data for Top 5 Car Rental
  const chartData = [
    { label: "Sport Car", value: 17439, color: "#3B82F6" },
    { label: "SUV", value: 9478, color: "#60A5FA" },
    { label: "Coupe", value: 18197, color: "#93C5FD" },
    { label: "Hatchback", value: 12510, color: "#DBEAFE" },
    { label: "MPV", value: 14406, color: "#EFF6FF" },
  ];

  const totalRentals = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Rental Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Details Rental</h2>
          
          {/* Map Placeholder */}
          <div className="bg-blue-100 rounded-lg h-64 mb-6 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300"></div>
            <div className="relative z-10 text-center">
              <svg className="w-16 h-16 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-blue-600 font-semibold">Map View</p>
            </div>
            {/* Route line */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-blue-600"></div>
            {/* Pin */}
            <div className="absolute bottom-4 right-1/4 w-6 h-6 bg-blue-600 rounded-full border-2 border-white"></div>
          </div>

          {/* Car Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center space-x-4">
            <img
              src="/images/img_car.png"
              alt="Car"
              className="w-20 h-20 object-cover rounded"
            />
            <div>
              <h3 className="font-bold text-lg">Nissan GT-R</h3>
              <p className="text-gray-600">Sport Car</p>
              <p className="text-sm text-gray-500">#9761</p>
            </div>
          </div>

          {/* Pick-Up Details */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="font-semibold">Pick - Up</span>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Locations</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Kota Semarang</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>07.00</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>20 July 2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drop-Off Details */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-semibold">Drop - Off</span>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Locations</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Kota Semarang</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>01.00</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>21 July 2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Total Rental Price */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Overall price and includes rental discount</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">${(stats.doanhThuHomNay / 23000).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Top 5 Car Rental Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Top 5 Car Rental</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          
          {/* Donut Chart */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {chartData.map((item, index) => {
                const percentage = (item.value / totalRentals) * 100;
                const offset = chartData.slice(0, index).reduce((sum, d) => sum + (d.value / totalRentals) * 100, 0);
                const circumference = 2 * Math.PI * 40;
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -offset * circumference / 100;
                
                return (
                  <circle
                    key={item.label}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold">{totalRentals.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Rental Car</p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transaction */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transaction</h2>
          <Link to="/dashboard/orders" className="text-blue-600 hover:text-blue-700 font-semibold">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => handleTransactionClick(transaction)}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <img
                  src="/images/img_car.png"
                  alt="Car"
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {transaction.items?.[0]?.xe?.ten_xe || "Nissan GT-R"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {transaction.items?.[0]?.xe?.loai_xe?.ten_loai || "Sport Car"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="font-semibold text-blue-600">
                    ${(transaction.total_price / 23000).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
