import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import wishlistApi from "../api/wishlistApi";

const WishlistPanel = ({ isOpen, onClose }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Chỉ fetch khi isOpen thay đổi

  // Lắng nghe sự kiện thay đổi wishlist từ localStorage
  useEffect(() => {
    if (!isOpen) return; // Chỉ lắng nghe khi panel mở
    
    const handleStorageChange = () => {
      fetchWishlist();
    };

    // Lắng nghe sự kiện storage từ các tab khác
    window.addEventListener("storage", handleStorageChange);
    
    // Custom event để lắng nghe từ cùng tab
    window.addEventListener("wishlistUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wishlistUpdated", handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Chỉ setup listener khi isOpen thay đổi

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when panel is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistApi.getAll();
      const data = response.data.results || response.data || [];
      // Đảm bảo mỗi item có cấu trúc đúng: { id, car, added_at }
      const formattedData = data.map(item => {
        // Nếu item đã có cấu trúc đúng (có car property)
        if (item.car) {
          return item;
        }
        // Nếu item là car object trực tiếp, wrap nó
        return {
          id: item.id || Date.now(),
          car: item,
          added_at: item.added_at || new Date().toISOString(),
        };
      });
      setWishlistItems(formattedData);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      await wishlistApi.remove(itemId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      // Update locally even if API fails
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleCarClick = (car) => {
    const carId = car.ma_xe || car.id;
    if (carId) {
      navigate(`/detail/${carId}`);
      onClose();
    }
  };

  const getImageUrl = (imageUrl, image) => {
    if (imageUrl) {
      if (imageUrl.startsWith("http")) {
        return imageUrl;
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      return baseUrl.replace("/api", "") + (imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl);
    }
    if (image) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const imagePath = image.startsWith("/") ? image : "/" + image;
      return baseUrl.replace("/api", "") + imagePath;
    }
    return "/images/img_car.png";
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return `${(price / 1000).toFixed(0)}k VNĐ`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Danh sách yêu thích</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-500 text-sm mb-2">Danh sách yêu thích trống</p>
              <button
                onClick={() => {
                  navigate("/category");
                  onClose();
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Khám phá xe
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {wishlistItems.map((item) => {
                const car = item.car || item;
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Car Image */}
                      <div
                        onClick={() => handleCarClick(car)}
                        className="flex-shrink-0 cursor-pointer"
                      >
                        <img
                          src={getImageUrl(car.image_url, car.image)}
                          alt={car.ten_xe || "Car"}
                          className="w-20 h-20 object-contain rounded-lg bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
                          onError={(e) => {
                            e.target.src = "/images/img_car.png";
                          }}
                        />
                      </div>

                      {/* Car Info */}
                      <div
                        onClick={() => handleCarClick(car)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h3 className="font-semibold text-gray-900 truncate">
                          {car.ten_xe || "N/A"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {car.loai_xe?.ten_loai || car.loai_xe_detail?.ten_loai || "N/A"}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          {formatPrice(car.gia_thue || car.gia_khuyen_mai || car.gia)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa khỏi danh sách yêu thích"
                      >
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={() => {
                navigate("/category");
                onClose();
              }}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Xem thêm xe
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistPanel;

