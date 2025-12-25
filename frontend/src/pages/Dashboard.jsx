import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import orderApi from "../api/orderApi";
import carApi from "../api/carApi";
import MapView from "../components/MapView";

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // Order được chọn từ Recent Transaction
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
        .filter(order => order && order.id) // Chỉ lấy orders hợp lệ
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })
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
      if (orders && Array.isArray(orders) && orders.length > 0) {
        // Lấy order có rental info gần nhất
        const validOrders = orders.filter(o => o && o.id);
        if (validOrders.length > 0) {
          const orderWithRental = validOrders.find(
            (o) => o.pickup_location || o.start_date || o.end_date
          ) || validOrders[0];
          setLatestOrder(orderWithRental);
        } else {
          setLatestOrder(null);
        }
      } else {
        setLatestOrder(null);
      }
    } catch (error) {
      console.error("Error fetching latest order:", error);
      setLatestOrder(null);
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
      
      // Chỉ xử lý orders hợp lệ
      if (Array.isArray(orders)) {
        orders.forEach((order) => {
          if (order && order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (item && item.xe) {
                const car = item.xe;
                // Kiểm tra loai_xe có thể là object hoặc nested object
                const carType = car.loai_xe?.ten_loai || 
                               car.loai_xe_detail?.ten_loai || 
                               (typeof car.loai_xe === 'string' ? car.loai_xe : "Unknown");
                if (carType && carType !== "Unknown") {
                  if (!statsMap[carType]) {
                    statsMap[carType] = 0;
                  }
                  statsMap[carType] += item.quantity || 1;
                  total += item.quantity || 1;
                }
              }
            });
          }
        });
      }
      
      // Convert to array and sort by value
      const statsArray = Object.entries(statsMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5
      
      // Nếu không có dữ liệu, dùng default
      if (statsArray.length === 0) {
        const defaultData = [
          { label: "Sport Car", value: 0, color: "#3B82F6" },
          { label: "SUV", value: 0, color: "#60A5FA" },
          { label: "Coupe", value: 0, color: "#93C5FD" },
          { label: "Hatchback", value: 0, color: "#DBEAFE" },
          { label: "MPV", value: 0, color: "#EFF6FF" },
        ];
        setCarRentalStats(defaultData);
        setTotalRentals(0);
        return;
      }
      
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
        { label: "Sport Car", value: 0, color: "#3B82F6" },
        { label: "SUV", value: 0, color: "#60A5FA" },
        { label: "Coupe", value: 0, color: "#93C5FD" },
        { label: "Hatchback", value: 0, color: "#DBEAFE" },
        { label: "MPV", value: 0, color: "#EFF6FF" },
      ];
      setCarRentalStats(defaultData);
      setTotalRentals(0);
    }
  };

  const handleTransactionClick = (transaction) => {
    // Set order được chọn để hiển thị trong Details Rental
    if (transaction && transaction.id) {
      setSelectedOrder(transaction);
    }
  };
  
  // Sử dụng selectedOrder nếu có, nếu không thì dùng latestOrder
  const displayOrder = selectedOrder || latestOrder;

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
        <div className="text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Rental Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">Details Rental</h2>
          
          {/* Car Info */}
          {displayOrder && displayOrder.items && Array.isArray(displayOrder.items) && displayOrder.items.length > 0 && displayOrder.items[0]?.xe && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 flex items-center space-x-4 border border-blue-200 dark:border-blue-800 transition-colors duration-300">
              <img
                src={getImageUrl(
                  displayOrder.items[0].xe?.image_url,
                  displayOrder.items[0].xe?.image
                )}
                alt={displayOrder.items[0].xe?.ten_xe || "Car"}
                className="w-20 h-20 object-contain rounded bg-white dark:bg-gray-700 p-2 transition-colors duration-300"
                onError={(e) => {
                  e.target.src = "/images/img_car.png";
                }}
              />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 transition-colors duration-300">{displayOrder.items[0].xe?.ten_xe || "N/A"}</h3>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{displayOrder.items[0].xe?.loai_xe?.ten_loai || displayOrder.items[0].xe?.loai_xe_detail?.ten_loai || "N/A"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">#{displayOrder.id}</p>
              </div>
            </div>
          )}

          {/* Pick-Up Details */}
          {displayOrder && (
            <>
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full transition-colors duration-300"></div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">Pick - Up</span>
                </div>
                <div className="grid grid-cols-3 gap-4 ml-5">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Locations</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">{displayOrder?.pickup_location || "N/A"}</span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Date</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {displayOrder?.start_date
                          ? new Date(displayOrder.start_date).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Time</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {displayOrder?.start_date
                          ? new Date(displayOrder.start_date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }).replace(":", ".")
                          : "07.00"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop-Off Details */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full transition-colors duration-300"></div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">Drop - Off</span>
                </div>
                <div className="grid grid-cols-3 gap-4 ml-5">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Locations</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">{displayOrder?.return_location || "N/A"}</span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Date</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {displayOrder?.end_date
                          ? new Date(displayOrder.end_date).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Time</label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 flex items-center justify-between transition-colors duration-300">
                      <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {displayOrder?.end_date
                          ? new Date(displayOrder.end_date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }).replace(":", ".")
                          : "01.00"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!displayOrder && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <p>Chưa có đơn hàng nào</p>
            </div>
          )}

          {/* Map View - Chỉ hiển thị khi order đã thành công */}
          {displayOrder && 
           displayOrder.pickup_location && 
           displayOrder.return_location &&
           (displayOrder.status === "paid" || 
            displayOrder.status === "completed" || 
            displayOrder.payment_status === "paid") && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Bản đồ tuyến đường
              </h3>
              <MapView
                pickupLocation={displayOrder.pickup_location}
                returnLocation={displayOrder.return_location}
              />
            </div>
          )}

          {/* Total Rental Price */}
          {displayOrder && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Overall price and includes rental discount</p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                  {(() => {
                    if (!displayOrder.items || !Array.isArray(displayOrder.items) || !displayOrder.items[0]?.xe) {
                      return "$0.00";
                    }
                    
                    // Tính số ngày thuê
                    const days = displayOrder.rental_days || (displayOrder.start_date && displayOrder.end_date
                      ? Math.ceil(
                          (new Date(displayOrder.end_date) - new Date(displayOrder.start_date)) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 1);
                    
                    // Lấy giá mỗi ngày từ xe
                    const car = displayOrder.items[0].xe;
                    const pricePerDay = car?.gia_thue || car?.gia_khuyen_mai || car?.gia || 0;
                    
                    // Tính tổng tiền = giá mỗi ngày * số ngày
                    const calculatedTotal = pricePerDay * days;
                    
                    // Ưu tiên dùng total_price từ backend nếu có và hợp lý
                    let finalTotal = displayOrder.total_price || 0;
                    
                    if (finalTotal === 0 || (calculatedTotal > 0 && finalTotal < calculatedTotal)) {
                      finalTotal = calculatedTotal;
                    }
                    
                    return finalTotal > 0 ? `$${(finalTotal / 23000).toFixed(2)}` : "$0.00";
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Car Rental Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Top 5 Car Rental</h2>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300">
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
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">{totalRentals.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Rental Car</p>
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
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">{item.value.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 transition-colors duration-300">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transaction */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Recent Transaction</h2>
          <Link to="/dashboard/orders" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-300">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              if (!transaction || !transaction.id) return null;
              const car = transaction.items && Array.isArray(transaction.items) && transaction.items[0] 
                ? transaction.items[0].xe 
                : null;
              return (
                <div
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors duration-300 cursor-pointer ${
                    selectedOrder && selectedOrder.id === transaction.id
                      ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md dark:shadow-none"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <img
                    src={getImageUrl(car?.image_url, car?.image)}
                    alt={car?.ten_xe || "Car"}
                    className="w-16 h-16 object-contain rounded bg-gray-50 dark:bg-gray-700 p-2 transition-colors duration-300"
                    onError={(e) => {
                      e.target.src = "/images/img_car.png";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                      {car?.ten_xe || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {car?.loai_xe?.ten_loai || car?.loai_xe_detail?.ten_loai || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          })
                        : "N/A"}
                    </p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                      ${transaction.total_price ? (transaction.total_price / 23000).toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
              );
            }).filter(Boolean)
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 transition-colors duration-300">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
