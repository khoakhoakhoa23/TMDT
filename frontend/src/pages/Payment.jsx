import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import locationApi from "../api/locationApi";
import paymentApi from "../api/paymentApi";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addDaysISO = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { car } = location.state || {};
  
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    address: "",
    phone: "",
    city: "",
  });
  
  // Load rental info from localStorage hoặc từ state
  const savedRentalInfo = JSON.parse(localStorage.getItem("rental_info") || "null");
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  
  const [rentalInfo, setRentalInfo] = useState(
    savedRentalInfo || {
      pickup: { location: "", date: today, time: "07:00" },
      dropoff: { location: "", date: tomorrow, time: "17:00" },
    }
  );
  
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [agreements, setAgreements] = useState({
    marketing: false,
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Load locations from API
  useEffect(() => {
  const fetchLocations = async () => {
    try {
      const response = await locationApi.getAll();
      
      if (!response?.data) {
        throw new Error("Invalid response from locations API");
      }
      
      const locationList = response.data.results || response.data || [];
      setLocations(locationList.map((loc) => loc.ten_dia_diem || loc.name || loc));
    } catch (error) {
      console.error("Error fetching locations:", error);
      // Fallback to default locations
      setLocations([
        "Semarang",
        "Jakarta",
        "Surabaya",
        "Bandung",
        "Yogyakarta",
        "Medan",
        "Bali",
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!car) {
      navigate("/");
    }
  }, [car, navigate]);

  // Polling để kiểm tra trạng thái thanh toán
  useEffect(() => {
    // Chỉ polling khi có paymentData, có id, và status chưa completed/failed
    if (!paymentData || !paymentData.id || paymentStatus === "completed" || paymentStatus === "success" || paymentStatus === "failed") {
      return;
    }

    let isMounted = true; // Flag để tránh setState sau khi component unmount
    const paymentId = paymentData.id; // Lưu id để tránh closure issue

    const interval = setInterval(async () => {
      try {
        if (!isMounted) return; // Kiểm tra component còn mount không
        
        const response = await paymentApi.checkStatus(paymentId);
        
        if (!isMounted) return; // Kiểm tra lại sau async call
        
        if (!response || !response.data) {
          console.error("Invalid response from payment status check:", response);
          return;
        }
        
        const newStatus = response.data.status;
        
        if (!isMounted) return; // Kiểm tra lại trước khi setState
        
        setPaymentStatus(newStatus);

        if (newStatus === "completed" || newStatus === "success") {
          clearInterval(interval);
          if (isMounted) {
            alert("Thanh toán thành công!");
            navigate("/dashboard");
          }
        } else if (newStatus === "failed") {
          clearInterval(interval);
          if (isMounted) {
            alert("Thanh toán thất bại. Vui lòng thử lại.");
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        // Nếu bị throttled (429), tăng interval lên 10 giây
        if (error?.response?.status === 429) {
          console.warn("Request throttled, increasing interval to 10 seconds");
          clearInterval(interval);
          // Tạo interval mới với thời gian dài hơn
          const newInterval = setInterval(async () => {
            try {
              if (!isMounted) return;
              const response = await paymentApi.checkStatus(paymentId);
              if (!isMounted) return;
              if (response?.data?.status) {
                setPaymentStatus(response.data.status);
                if (response.data.status === "completed" || response.data.status === "success") {
                  clearInterval(newInterval);
                  if (isMounted) {
                    alert("Thanh toán thành công!");
                    navigate("/dashboard");
                  }
                }
              }
            } catch (err) {
              console.error("Error in throttled polling:", err);
            }
          }, 10000); // 10 giây thay vì 3 giây
          return; // Exit early để không tiếp tục với interval cũ
        }
        // Nếu lỗi 404 hoặc 400, dừng polling
        if (error?.response?.status === 404 || error?.response?.status === 400) {
          if (isMounted) {
            clearInterval(interval);
          }
        }
      }
    }, 3000); // Check mỗi 3 giây

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [paymentData?.id, paymentStatus, navigate]);

  // Validation
  useEffect(() => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!billingInfo.name) newErrors.name = "Vui lòng nhập tên";
      if (!billingInfo.phone) newErrors.phone = "Vui lòng nhập số điện thoại";
      if (!billingInfo.address) newErrors.address = "Vui lòng nhập địa chỉ";
      if (!billingInfo.city) newErrors.city = "Vui lòng nhập thành phố";
    }
    if (currentStep === 2) {
      if (!rentalInfo.pickup.location) newErrors.pickupLocation = "Vui lòng chọn địa điểm nhận";
      if (!rentalInfo.pickup.date) newErrors.pickupDate = "Vui lòng chọn ngày nhận";
      if (!rentalInfo.pickup.time) newErrors.pickupTime = "Vui lòng chọn giờ nhận";
      if (!rentalInfo.dropoff.location) newErrors.dropoffLocation = "Vui lòng chọn địa điểm trả";
      if (!rentalInfo.dropoff.date) newErrors.dropoffDate = "Vui lòng chọn ngày trả";
      else if (rentalInfo.dropoff.date < rentalInfo.pickup.date) {
        newErrors.dropoffDate = "Ngày trả phải sau ngày nhận";
      }
      if (!rentalInfo.dropoff.time) newErrors.dropoffTime = "Vui lòng chọn giờ trả";
    }
    setErrors(newErrors);
  }, [currentStep, billingInfo, rentalInfo]);

  const calculateTotal = () => {
    if (!car) return 0;
    const pricePerDay = car?.gia_thue > 0 ? car.gia_thue : (car?.gia_khuyen_mai > 0 ? car.gia_khuyen_mai : (car?.gia > 0 ? car.gia : 0));
    
    // Tính số ngày thuê
    let days = 1;
    if (rentalInfo.pickup.date && rentalInfo.dropoff.date) {
      const start = new Date(rentalInfo.pickup.date);
      const end = new Date(rentalInfo.dropoff.date);
      days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    }
    
    return pricePerDay * days;
  };

  const handleNext = () => {
    // Validate trước khi chuyển step
    if (currentStep === 1) {
      if (!billingInfo.name || !billingInfo.phone || !billingInfo.address || !billingInfo.city) {
        alert("Vui lòng điền đầy đủ thông tin billing");
        return;
      }
    }
    if (currentStep === 2) {
      if (!rentalInfo.pickup.location || !rentalInfo.pickup.date || !rentalInfo.pickup.time ||
          !rentalInfo.dropoff.location || !rentalInfo.dropoff.date || !rentalInfo.dropoff.time) {
        alert("Vui lòng điền đầy đủ thông tin rental");
        return;
      }
      if (rentalInfo.dropoff.date < rentalInfo.pickup.date) {
        alert("Ngày trả phải sau ngày nhận");
        return;
      }
    }
    if (currentStep === 3) {
      // Step 3: Payment method selection - không cần validation vì đã có default value
      if (!paymentMethod) {
        alert("Vui lòng chọn phương thức thanh toán");
        return;
      }
    }
    // Chuyển sang step tiếp theo
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Nếu đang ở step 5 và quay lại, reset payment state
      if (currentStep === 5) {
        setShowQRCode(false);
        setPaymentData(null);
        setPaymentStatus("pending");
      }
      setCurrentStep(currentStep - 1);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreements.terms) {
      alert("Vui lòng đồng ý với điều khoản và chính sách");
      return;
    }

    setLoading(true);
    try {
      const days = rentalInfo.pickup.date && rentalInfo.dropoff.date
        ? Math.ceil(
            (new Date(rentalInfo.dropoff.date) - new Date(rentalInfo.pickup.date)) /
              (1000 * 60 * 60 * 24)
          )
        : 1;

      const orderData = {
        items: [{
          xe_id: car?.ma_xe || car?.id,
          quantity: 1,
        }],
        shipping_name: billingInfo.name,
        shipping_phone: billingInfo.phone,
        shipping_address: billingInfo.address,
        shipping_city: billingInfo.city,
        start_date: rentalInfo.pickup.date,
        end_date: rentalInfo.dropoff.date,
        pickup_location: rentalInfo.pickup.location,
        return_location: rentalInfo.dropoff.location,
        rental_days: days,
        payment_method: paymentMethod,
      };

      // Tạo order
      const orderResponse = await axiosClient.post("order/", orderData);
      
      if (!orderResponse || !orderResponse.data || !orderResponse.data.id) {
        console.error("Invalid order response:", orderResponse);
        throw new Error("Không thể tạo đơn hàng. Vui lòng thử lại.");
      }
      
      const orderId = orderResponse.data.id;

      // Xử lý thanh toán theo phương thức
      if (["momo", "zalopay", "vnpay"].includes(paymentMethod)) {
        // Thanh toán qua gateway Việt Nam
        const returnUrl = `${window.location.origin}/payment/callback?order_id=${orderId}`;
        const paymentResponse = await paymentApi.createPayment(orderId, paymentMethod, returnUrl);
        
        if (!paymentResponse || !paymentResponse.data) {
          console.error("Invalid payment response:", paymentResponse);
          throw new Error("Không thể tạo payment request. Vui lòng thử lại.");
        }
        
        // Đảm bảo paymentData có id trước khi set
        if (!paymentResponse.data.id) {
          console.error("Payment response missing id:", paymentResponse.data);
          throw new Error("Payment response không hợp lệ. Vui lòng thử lại.");
        }
        
        setPaymentData(paymentResponse.data);
        setPaymentStatus(paymentResponse.data.status || "pending");
        setShowQRCode(true);
        setCurrentStep(5); // Chuyển sang step thanh toán
      } else {
        // Fallback cho các phương thức khác (nếu có)
        await axiosClient.post("checkout/", {
          order_id: orderId,
          payment_method: paymentMethod,
        });

        alert("Thanh toán thành công!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Payment error:", error);
      let errorMessage = "Có lỗi xảy ra khi thanh toán";
      
      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data) && error.response.data.length > 0) {
          errorMessage = error.response.data[0];
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      // Reset payment state nếu có lỗi
      setPaymentData(null);
      setPaymentStatus("pending");
      setShowQRCode(false);
    } finally {
      setLoading(false);
    }
  };

  if (!car) {
    return null;
  }

  const price = calculateTotal();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {(() => {
              const steps = showQRCode ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
              return steps.map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors duration-300 ${
                      currentStep >= step
                        ? "bg-blue-600 dark:bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {step}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors duration-300 ${
                        currentStep > step ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Step 1: Billing Info */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Billing Info</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">Please enter your billing info</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Name</label>
                  <input
                    type="text"
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Phone Number</label>
                  <input
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Address</label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                    placeholder="Address"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Town / City</label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                    placeholder="Town or city"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    required
                  />
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Rental Info */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Rental Info</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">Please select your rental date</p>
              <div className="space-y-6">
                {/* Pick-Up */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full mr-2 transition-colors duration-300"></div>
                    <label className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">Pick-Up</label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Locations</label>
                      <div className="relative">
                        <select
                          value={rentalInfo.pickup.location}
                          onChange={(e) =>
                            setRentalInfo({
                              ...rentalInfo,
                              pickup: { ...rentalInfo.pickup, location: e.target.value },
                            })
                          }
                          disabled={loadingLocations}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            errors.pickupLocation ? "border-red-500 dark:border-red-400" : ""
                          } ${loadingLocations ? "opacity-50 cursor-not-allowed" : ""} transition-colors duration-300`}
                        >
                          <option value="">Select your city</option>
                          {locations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.pickupLocation && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.pickupLocation}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Date</label>
                      <input
                        type="date"
                        value={rentalInfo.pickup.date}
                        min={today}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            pickup: { ...rentalInfo.pickup, date: e.target.value },
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                          errors.pickupDate ? "border-red-500 dark:border-red-400" : ""
                        } transition-colors duration-300`}
                      />
                      {errors.pickupDate && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.pickupDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Time</label>
                      <div className="relative">
                        <select
                          value={rentalInfo.pickup.time}
                          onChange={(e) =>
                            setRentalInfo({
                              ...rentalInfo,
                              pickup: { ...rentalInfo.pickup, time: e.target.value },
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            errors.pickupTime ? "border-red-500 dark:border-red-400" : ""
                          } transition-colors duration-300`}
                        >
                          <option value="">Select your time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.pickupTime && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.pickupTime}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Drop-Off */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full mr-2 transition-colors duration-300"></div>
                    <label className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">Drop-Off</label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Locations</label>
                      <div className="relative">
                        <select
                          value={rentalInfo.dropoff.location}
                          onChange={(e) =>
                            setRentalInfo({
                              ...rentalInfo,
                              dropoff: { ...rentalInfo.dropoff, location: e.target.value },
                            })
                          }
                          disabled={loadingLocations}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            errors.dropoffLocation ? "border-red-500 dark:border-red-400" : ""
                          } ${loadingLocations ? "opacity-50 cursor-not-allowed" : ""} transition-colors duration-300`}
                        >
                          <option value="">Select your city</option>
                          {locations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.dropoffLocation && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.dropoffLocation}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Date</label>
                      <input
                        type="date"
                        value={rentalInfo.dropoff.date}
                        min={rentalInfo.pickup.date || today}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            dropoff: { ...rentalInfo.dropoff, date: e.target.value },
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                          errors.dropoffDate ? "border-red-500 dark:border-red-400" : ""
                        } transition-colors duration-300`}
                      />
                      {errors.dropoffDate && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.dropoffDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Time</label>
                      <div className="relative">
                        <select
                          value={rentalInfo.dropoff.time}
                          onChange={(e) =>
                            setRentalInfo({
                              ...rentalInfo,
                              dropoff: { ...rentalInfo.dropoff, time: e.target.value },
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            errors.dropoffTime ? "border-red-500 dark:border-red-400" : ""
                          } transition-colors duration-300`}
                        >
                          <option value="">Select your time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.dropoffTime && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.dropoffTime}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Method Selection */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Payment Method</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                Choose your preferred payment method
              </p>
              
              <div className="space-y-4">
                {/* MoMo */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 ${
                  paymentMethod === "momo" 
                    ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500"
                  />
                  <span className="ml-3 font-semibold flex-1 text-gray-900 dark:text-gray-100 transition-colors duration-300">MoMo</span>
                  <img src="/images/momo_logo.png" alt="MoMo" className="ml-auto h-6" onError={(e) => e.target.style.display = "none"} />
                </label>

                {/* ZaloPay */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 ${
                  paymentMethod === "zalopay" 
                    ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zalopay"
                    checked={paymentMethod === "zalopay"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500"
                  />
                  <span className="ml-3 font-semibold flex-1 text-gray-900 dark:text-gray-100 transition-colors duration-300">ZaloPay</span>
                  <img src="/images/zalopay_logo.png" alt="ZaloPay" className="ml-auto h-6" onError={(e) => e.target.style.display = "none"} />
                </label>

                {/* VNPay */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 ${
                  paymentMethod === "vnpay" 
                    ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === "vnpay"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500"
                  />
                  <span className="ml-3 font-semibold flex-1 text-gray-900 dark:text-gray-100 transition-colors duration-300">VNPay</span>
                  <img src="/images/vnpay_logo.png" alt="VNPay" className="ml-auto h-6" onError={(e) => e.target.style.display = "none"} />
                </label>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Confirmation</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                We are getting to the end. Just few clicks and your rental is ready!
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.marketing}
                      onChange={(e) =>
                        setAgreements({ ...agreements, marketing: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-500 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      I agree with sending an Marketing and newsletter emails. No spam, promissed!
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) =>
                        setAgreements({ ...agreements, terms: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-500 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      I agree with our terms and conditions and privacy policy.
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || !agreements.terms}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-300 font-semibold"
                >
                  {loading ? "Processing..." : "Rent Now"}
                </button>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">All your data are safe</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      We are using the most advanced security to provide you the best experience ever.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 5: Payment QR Code (cho Momo, ZaloPay, VNPay) */}
          {currentStep === 5 && paymentData && paymentData.id && showQRCode && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Thanh toán</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                Quét mã QR để thanh toán qua {paymentMethod === "momo" ? "MoMo" : paymentMethod === "zalopay" ? "ZaloPay" : "VNPay"}
              </p>
              
              <div className="flex flex-col items-center space-y-6">
                {/* QR Code */}
                {paymentData?.qr_code && (
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <img
                      src={paymentData.qr_code}
                      alt="QR Code"
                      className="w-64 h-64"
                      onError={(e) => {
                        // Fallback nếu QR code không load được
                        e.target.style.display = "none";
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = "block";
                      }}
                    />
                    <div style={{ display: "none" }} className="w-64 h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded transition-colors duration-300">
                      QR Code không khả dụng
                    </div>
                  </div>
                )}

                {/* Payment URL */}
                {paymentData?.payment_url && (
                  <div className="w-full">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center transition-colors duration-300">Hoặc click vào link bên dưới:</p>
                    <a
                      href={paymentData.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold text-center"
                    >
                      Mở {paymentMethod === "momo" ? "MoMo" : paymentMethod === "zalopay" ? "ZaloPay" : "VNPay"} để thanh toán
                    </a>
                  </div>
                )}

                {/* Payment Status */}
                <div className="w-full">
                  <div className={`p-4 rounded-lg transition-colors duration-300 ${
                    paymentStatus === "completed" || paymentStatus === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                    paymentStatus === "failed" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      {paymentStatus === "pending" && (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Đang chờ thanh toán...</span>
                        </>
                      )}
                      {(paymentStatus === "completed" || paymentStatus === "success") && (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Thanh toán thành công!</span>
                        </>
                      )}
                      {paymentStatus === "failed" && (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>Thanh toán thất bại</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 w-full">
                  {/* Development Mode: Simulate Payment Button */}
                  {import.meta.env.DEV && paymentStatus === "pending" && (
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const response = await paymentApi.simulatePayment(paymentData.id);
                          if (response.data.success) {
                            setPaymentStatus("completed");
                            alert("Payment đã được simulate thành công (Development Mode)");
                            setTimeout(() => {
                              navigate("/dashboard");
                            }, 1000);
                          }
                        } catch (error) {
                          console.error("Simulate payment error:", error);
                          alert("Không thể simulate payment. Có thể không phải development mode.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors duration-300 font-semibold"
                    >
                      🧪 Simulate Payment (Dev Mode - Không tốn phí)
                    </button>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowQRCode(false);
                        setPaymentData(null);
                        setPaymentStatus("pending");
                        setCurrentStep(3);
                      }}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                    >
                      Quay lại
                    </button>
                    {(paymentStatus === "completed" || paymentStatus === "success") && (
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
                      >
                        Xem đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side - Rental Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 sticky top-20 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Rental Summary</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
              Prices may change depending on the length of the rental and the price of your rental car.
            </p>
            
            <div className="mb-6">
              <img
                src={car?.image_url || "/images/img_car.png"}
                alt={car?.ten_xe || "Car"}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 transition-colors duration-300">{car?.ten_xe || "Car"}</h3>
              <div className="flex items-center space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 transition-colors duration-300 ${i < 4 ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1 transition-colors duration-300">440+ Reviewer</span>
              </div>
            </div>

            {/* Rental Details Summary */}
            {(rentalInfo.pickup.date || rentalInfo.dropoff.date) && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">Rental Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Pick-Up:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                      {rentalInfo.pickup.date ? new Date(rentalInfo.pickup.date).toLocaleDateString('vi-VN') : 'N/A'} 
                      {rentalInfo.pickup.time && ` at ${rentalInfo.pickup.time}`}
                    </span>
                  </div>
                  {rentalInfo.pickup.location && (
                    <div className="text-gray-600 dark:text-gray-400 text-xs transition-colors duration-300">{rentalInfo.pickup.location}</div>
                  )}
                  <div className="flex justify-between mt-3">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Drop-Off:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                      {rentalInfo.dropoff.date ? new Date(rentalInfo.dropoff.date).toLocaleDateString('vi-VN') : 'N/A'}
                      {rentalInfo.dropoff.time && ` at ${rentalInfo.dropoff.time}`}
                    </span>
                  </div>
                  {rentalInfo.dropoff.location && (
                    <div className="text-gray-600 dark:text-gray-400 text-xs transition-colors duration-300">{rentalInfo.dropoff.location}</div>
                  )}
                  {rentalInfo.pickup.date && rentalInfo.dropoff.date && (
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Rental Days:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {Math.ceil(
                          (new Date(rentalInfo.dropoff.date) - new Date(rentalInfo.pickup.date)) /
                            (1000 * 60 * 60 * 24)
                        ) || 1} days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors duration-300">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Price per day</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  ${((car?.gia_thue || car?.gia_khuyen_mai || car?.gia || 0) / 23000).toFixed(2)}
                </span>
              </div>
              {rentalInfo.pickup.date && rentalInfo.dropoff.date && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    × {Math.ceil(
                      (new Date(rentalInfo.dropoff.date) - new Date(rentalInfo.pickup.date)) /
                        (1000 * 60 * 60 * 24)
                    ) || 1} days
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">${(price / 23000).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Tax</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">$0</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 transition-colors duration-300">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Apply promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                  />
                  <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-semibold transition-colors duration-300">
                    Apply now
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 transition-colors duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">${(price / 23000).toFixed(2)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Overall price and includes rental discount</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
