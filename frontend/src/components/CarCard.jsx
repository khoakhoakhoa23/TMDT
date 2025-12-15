import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import wishlistApi from "../api/wishlistApi";

const CarCard = ({ car, navigateTo = "category" }) => {
  // navigateTo: "category" (từ Home) hoặc "detail" (từ Category)
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);

  // Kiểm tra xem xe có trong wishlist không
  useEffect(() => {
    const checkWishlist = async () => {
      const carId = car.ma_xe || car.id;
      if (carId) {
        try {
          const response = await wishlistApi.check(carId);
          setIsFavorite(response.data.in_wishlist || false);
        } catch (error) {
          console.error("Error checking wishlist:", error);
        }
      }
    };
    checkWishlist();
  }, [car]);

  // Debug: Log dữ liệu xe để kiểm tra (uncomment để debug)
  // console.log('Car data:', car);
  // console.log('gia_thue:', car.gia_thue, 'gia_khuyen_mai:', car.gia_khuyen_mai, 'gia:', car.gia);

  // Ưu tiên gia_thue (giá thuê), nếu không có hoặc = 0 thì dùng gia, nếu có gia_khuyen_mai thì dùng nó
  let price = 0;
  if (car.gia_thue !== undefined && car.gia_thue !== null && car.gia_thue > 0) {
    price = car.gia_thue;
  } else if (car.gia_khuyen_mai !== undefined && car.gia_khuyen_mai !== null && car.gia_khuyen_mai > 0) {
    price = car.gia_khuyen_mai;
  } else if (car.gia !== undefined && car.gia !== null && car.gia > 0) {
    price = car.gia;
  }
  
  // Giá gốc (nếu có khuyến mãi và gia_thue đang dùng)
  let originalPrice = null;
  if (price === car.gia_khuyen_mai && car.gia && car.gia > car.gia_khuyen_mai) {
    originalPrice = car.gia;
  }
  
  // Lấy tên loại xe
  const loaiXeName = car.loai_xe?.ten_loai || car.loai_xe_detail?.ten_loai || (typeof car.loai_xe === 'string' ? car.loai_xe : 'N/A');
  
  // Lấy URL ảnh - ưu tiên image_url, nếu không có thì dùng image
  const getImageUrl = () => {
    if (car.image_url) {
      // Nếu là URL đầy đủ thì dùng luôn
      if (car.image_url.startsWith('http')) {
        return car.image_url;
      }
      // Nếu là relative path, thêm base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      return baseUrl.replace('/api', '') + (car.image_url.startsWith('/') ? car.image_url : '/' + car.image_url);
    }
    if (car.image) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const imagePath = car.image.startsWith('/') ? car.image : '/' + car.image;
      return baseUrl.replace('/api', '') + imagePath;
    }
    return "/images/img_car.png";
  };

  const handleCardClick = () => {
    if (navigateTo === "detail") {
      navigate(`/detail/${car.ma_xe || car.id}`);
    } else {
      navigate("/category");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none overflow-hidden hover:shadow-lg dark:hover:shadow-none transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="relative bg-gray-50 dark:bg-gray-900/50">
        <div 
          onClick={handleCardClick}
          className="w-full h-56 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          <img
            src={getImageUrl()}
            alt={car.ten_xe || "Car"}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              e.target.src = "/images/img_car.png";
            }}
          />
        </div>
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              if (isFavorite) {
                // Xóa khỏi wishlist
                const wishlistData = localStorage.getItem("wishlist");
                if (wishlistData) {
                  const items = JSON.parse(wishlistData);
                  const carId = car.ma_xe || car.id;
                  const itemToRemove = items.find(item => {
                    const itemCarId = item.car?.ma_xe || item.car?.id || item.ma_xe || item.id;
                    return itemCarId === carId;
                  });
                  if (itemToRemove) {
                    await wishlistApi.remove(itemToRemove.id);
                  }
                }
                setIsFavorite(false);
              } else {
                // Thêm vào wishlist
                await wishlistApi.add(car);
                setIsFavorite(true);
              }
            } catch (error) {
              console.error("Error toggling wishlist:", error);
            }
          }}
          className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md dark:shadow-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 z-10 border border-gray-200 dark:border-gray-700"
          title={isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          <svg
            className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-current" : "text-gray-600 dark:text-gray-300"} transition-colors duration-300`}
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 
              onClick={handleCardClick}
              className="text-lg font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
            >
              {car.ten_xe || "Tên xe"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
              {loaiXeName}
            </p>
          </div>
        </div>

        {/* Car Specifications */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{car.dung_tich_nhien_lieu || 70}L</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{car.hop_so === 'automatic' ? 'Automatic' : car.hop_so === 'manual' ? 'Manual' : car.hop_so || 'Manual'}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{car.so_cho || 2} People</span>
          </div>
        </div>

        {/* Price and Rent Button */}
        <div className="flex items-center justify-between">
          <div>
            {price > 0 ? (
              <>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                  ${(price / 23000).toFixed(2)}/day
                </div>
                {originalPrice && originalPrice > 0 && originalPrice !== price && (
                  <div className="text-sm text-gray-400 dark:text-gray-500 line-through transition-colors duration-300">
                    ${(originalPrice / 23000).toFixed(2)}
                  </div>
                )}
                {/* Debug: Hiển thị giá VNĐ nếu giá USD quá nhỏ */}
                {(price / 23000) < 0.01 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                    {price.toLocaleString('vi-VN')} VNĐ/ngày
                  </div>
                )}
              </>
            ) : (
              <div className="text-lg text-gray-500 dark:text-gray-400 transition-colors duration-300">Chưa có giá</div>
            )}
          </div>
          <button
            onClick={() => {
              if (navigateTo === "detail") {
                // Từ Category: đi đến Detail
                const token = localStorage.getItem("access_token");
                if (!token) {
                  navigate("/login", { state: { from: location } });
                  return;
                }
                navigate(`/detail/${car.ma_xe || car.id}`);
              } else {
                // Từ Home: đi đến Category
                navigate("/category");
              }
            }}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
          >
            {navigateTo === "detail" ? "Rent Now" : "View All"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
