import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import orderApi from "../api/orderApi";
import carApi from "../api/carApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carRentalStats, setCarRentalStats] = useState([]);
  const [totalRentals, setTotalRentals] = useState(0);

  useEffect(() => {
    fetchRecentTransactions();
    fetchLatestOrder();
    fetchCarRentalStats();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      const response = await orderApi.getAll();
      const orders = response.data.results || response.data || [];
      // Sort by created_at descending and take first 4
      const sortedOrders = orders
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 4);
      setRecentTransactions(sortedOrders);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setRecentTransactions([]);
    }
  };

  const fetchLatestOrder = async () => {
    try {
      const response = await orderApi.getAll();
      const orders = response.data.results || response.data || [];
      if (orders && orders.length > 0) {
        // Lấy order có rental info gần nhất
        const orderWithRental = orders.find(
          (o) => o.pickup_location || o.start_date || o.end_date
        ) || orders[0];
        setLatestOrder(orderWithRental);
      }
    } catch (error) {
      console.error("Error fetching latest order:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarRentalStats = async () => {
    try {
      // Fetch all orders to calculate stats by car type
      const ordersResponse = await orderApi.getAll();
      const orders = ordersResponse.data.results || ordersResponse.data || [];
      
      // Fetch all cars to get car types
      const carsResponse = await carApi.getAll();
      const cars = carsResponse.data.results || carsResponse.data || [];
      
      // Count rentals by car type
      const statsMap = {};
      let total = 0;
      
      orders.forEach((order) => {
        order.items?.forEach((item) => {
          const car = item.xe;
          if (car && car.loai_xe) {
            const carType = car.loai_xe.ten_loai || car.loai_xe_detail?.ten_loai || "Unknown";
            if (!statsMap[carType]) {
              statsMap[carType] = 0;
            }
            statsMap[carType] += item.quantity || 1;
            total += item.quantity || 1;
          }
        });
      });
      
      // Convert to array and sort by value
      const statsArray = Object.entries(statsMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5
      
      // Assign colors
      const colors = ["#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#EFF6FF"];
      const chartData = statsArray.map((item, index) => ({
        ...item,
        color: colors[index] || "#EFF6FF",
      }));
      
      setCarRentalStats(chartData);
      setTotalRentals(total || chartData.reduce((sum, item) => sum + item.value, 0));
    } catch (error) {
      console.error("Error fetching car rental stats:", error);
      // Fallback to default data
      const defaultData = [
        { label: "Sport Car", value: 17439, color: "#3B82F6" },
        { label: "SUV", value: 9478, color: "#60A5FA" },
        { label: "Coupe", value: 18197, color: "#93C5FD" },
        { label: "Hatchback", value: 12510, color: "#DBEAFE" },
        { label: "MPV", value: 14406, color: "#EFF6FF" },
      ];
      setCarRentalStats(defaultData);
      setTotalRentals(defaultData.reduce((sum, item) => sum + item.value, 0));
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

  const getImageUrl = (imageUrl, image) => {
    if (imageUrl) {
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      return baseUrl.replace('/api', '') + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
    }
    if (image) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const imagePath = image.startsWith('/') ? image : '/' + image;
      return baseUrl.replace('/api', '') + imagePath;
    }
    return "/images/img_car.png";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Rental Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Details Rental</h2>
          
          {/* Map Placeholder */}
          <div className="bg-blue-100 rounded-lg h-64 mb-6 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300"></div>
            {/* Simulated map roads */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 400 300">
                {/* Horizontal roads */}
                <line x1="0" y1="100" x2="400" y2="100" stroke="#60A5FA" strokeWidth="8" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="#60A5FA" strokeWidth="8" />
                {/* Vertical roads */}
                <line x1="100" y1="0" x2="100" y2="300" stroke="#60A5FA" strokeWidth="8" />
                <line x1="300" y1="0" x2="300" y2="300" stroke="#60A5FA" strokeWidth="8" />
                {/* Buildings */}
                <rect x="50" y="50" width="40" height="40" fill="#93C5FD" opacity="0.5" />
                <rect x="150" y="150" width="40" height="40" fill="#93C5FD" opacity="0.5" />
                <rect x="250" y="50" width="40" height="40" fill="#93C5FD" opacity="0.5" />
                <rect x="350" y="150" width="40" height="40" fill="#93C5FD" opacity="0.5" />
              </svg>
            </div>
            {/* Route line */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-blue-600 opacity-80"></div>
            {/* Pin */}
            <div className="absolute bottom-6 right-1/4 w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Car Info */}
          {latestOrder && latestOrder.items && latestOrder.items[0] && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center space-x-4">
              <img
                src={getImageUrl(
                  latestOrder.items[0].xe?.image_url,
                  latestOrder.items[0].xe?.image
                )}
                alt={latestOrder.items[0].xe?.ten_xe || "Car"}
                className="w-20 h-20 object-contain rounded bg-white p-2"
                onError={(e) => {
                  e.target.src = "/images/img_car.png";
                }}
              />
              <div>
                <h3 className="font-bold text-lg">{latestOrder.items[0].xe?.ten_xe || "N/A"}</h3>
                <p className="text-gray-600">{latestOrder.items[0].xe?.loai_xe?.ten_loai || latestOrder.items[0].xe?.loai_xe_detail?.ten_loai || "N/A"}</p>
                <p className="text-sm text-gray-500">#{latestOrder.id}</p>
              </div>
            </div>
          )}

          {/* Pick-Up Details */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="font-semibold">Pick - Up</span>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Locations</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>{latestOrder?.pickup_location || "N/A"}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>
                    {latestOrder?.start_date
                      ? new Date(latestOrder.start_date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>
                    {latestOrder?.start_date
                      ? new Date(latestOrder.start_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).replace(":", ".")
                      : "07.00"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Drop-Off Details */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="font-semibold">Drop - Off</span>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Locations</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>{latestOrder?.return_location || "N/A"}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>
                    {latestOrder?.end_date
                      ? new Date(latestOrder.end_date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex items-center justify-between">
                  <span>
                    {latestOrder?.end_date
                      ? new Date(latestOrder.end_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).replace(":", ".")
                      : "01.00"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Total Rental Price */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Overall price and includes rental discount</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${latestOrder?.total_price ? (latestOrder.total_price / 23000).toFixed(2) : "0.00"}
              </p>
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
              {carRentalStats.map((item, index) => {
                const percentage = totalRentals > 0 ? (item.value / totalRentals) * 100 : 0;
                const offset = carRentalStats.slice(0, index).reduce((sum, d) => sum + (totalRentals > 0 ? (d.value / totalRentals) * 100 : 0), 0);
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
            {carRentalStats.length > 0 ? (
              carRentalStats.map((item) => (
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
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
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
            recentTransactions.map((transaction) => {
              const car = transaction.items?.[0]?.xe;
              return (
                <div
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <img
                    src={getImageUrl(car?.image_url, car?.image)}
                    alt={car?.ten_xe || "Car"}
                    className="w-16 h-16 object-contain rounded bg-gray-50 p-2"
                    onError={(e) => {
                      e.target.src = "/images/img_car.png";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {car?.ten_xe || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {car?.loai_xe?.ten_loai || car?.loai_xe_detail?.ten_loai || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          })
                        : "N/A"}
                    </p>
                    <p className="font-semibold text-blue-600">
                      ${transaction.total_price ? (transaction.total_price / 23000).toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
