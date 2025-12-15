import { useState, useEffect } from "react";
import locationApi from "../api/locationApi";

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

const PickupDropoffForm = ({ onSearch, initialData }) => {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [pickup, setPickup] = useState({
    location: initialData?.pickup?.location || "",
    date: initialData?.pickup?.date || today,
    time: initialData?.pickup?.time || "07:00",
  });

  const [dropoff, setDropoff] = useState({
    location: initialData?.dropoff?.location || "",
    date: initialData?.dropoff?.date || tomorrow,
    time: initialData?.dropoff?.time || "17:00",
  });

  const [errors, setErrors] = useState({});

  // Load locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationApi.getAll();
        const locationList = response.data.results || response.data;
        setLocations(locationList.map((loc) => loc.ten_dia_diem || loc.name || loc));
      } catch (error) {
        console.error("Error fetching locations:", error);
        // Fallback to default locations if API fails
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

  // Validation
  useEffect(() => {
    const newErrors = {};
    
    if (!pickup.location) {
      newErrors.pickupLocation = "Vui lòng chọn địa điểm";
    }
    if (!pickup.date) {
      newErrors.pickupDate = "Vui lòng chọn ngày";
    }
    if (!pickup.time) {
      newErrors.pickupTime = "Vui lòng chọn giờ";
    }
    
    if (!dropoff.location) {
      newErrors.dropoffLocation = "Vui lòng chọn địa điểm";
    }
    if (!dropoff.date) {
      newErrors.dropoffDate = "Vui lòng chọn ngày";
    } else if (dropoff.date < pickup.date) {
      newErrors.dropoffDate = "Ngày trả phải sau ngày nhận";
    }
    if (!dropoff.time) {
      newErrors.dropoffTime = "Vui lòng chọn giờ";
    }
    
    setErrors(newErrors);
  }, [pickup, dropoff]);

  // Auto-update dropoff date if pickup date changes
  useEffect(() => {
    if (pickup.date && dropoff.date < pickup.date) {
      setDropoff({ ...dropoff, date: pickup.date });
    }
  }, [pickup.date]);

  const handleSwap = () => {
    const temp = { ...pickup };
    setPickup(dropoff);
    setDropoff(temp);
  };

  const handlePickupChange = (field, value) => {
    setPickup({ ...pickup, [field]: value });
  };

  const handleDropoffChange = (field, value) => {
    setDropoff({ ...dropoff, [field]: value });
  };

  // Lưu vào localStorage để dùng ở các trang khác
  useEffect(() => {
    if (pickup.location && pickup.date && pickup.time && dropoff.location && dropoff.date && dropoff.time) {
      localStorage.setItem("rental_info", JSON.stringify({ pickup, dropoff }));
    }
  }, [pickup, dropoff]);

  // Callback khi có thay đổi
  useEffect(() => {
    if (onSearch && Object.keys(errors).length === 0) {
      onSearch({ pickup, dropoff });
    }
  }, [pickup, dropoff, errors, onSearch]);

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center md:items-stretch">
        {/* Pick-Up Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 flex-1 w-full md:w-auto border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full transition-colors duration-300"></div>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-lg transition-colors duration-300">Pick-Up</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Locations</label>
              <div className="relative">
                <select
                  value={pickup.location}
                  onChange={(e) => handlePickupChange("location", e.target.value)}
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
              <div className="relative">
                <input
                  type="date"
                  value={pickup.date}
                  min={today}
                  onChange={(e) => handlePickupChange("date", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                    errors.pickupDate ? "border-red-500 dark:border-red-400" : ""
                  } transition-colors duration-300`}
                />
              </div>
              {errors.pickupDate && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.pickupDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Time</label>
              <div className="relative">
                <select
                  value={pickup.time}
                  onChange={(e) => handlePickupChange("time", e.target.value)}
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

        {/* Swap Button */}
        <div className="flex justify-center items-center">
          <button
            onClick={handleSwap}
            className="w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-none"
            title="Swap Pick-Up and Drop-Off"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Drop-Off Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 flex-1 w-full md:w-auto border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full transition-colors duration-300"></div>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-lg transition-colors duration-300">Drop - Off</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Locations</label>
              <div className="relative">
                <select
                  value={dropoff.location}
                  onChange={(e) => handleDropoffChange("location", e.target.value)}
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
                value={dropoff.date}
                min={pickup.date || today}
                onChange={(e) => handleDropoffChange("date", e.target.value)}
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
                  value={dropoff.time}
                  onChange={(e) => handleDropoffChange("time", e.target.value)}
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
      </div>
    </div>
  );
};

export default PickupDropoffForm;

