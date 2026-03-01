import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import reviewApi from "../api/reviewApi";
import carImageApi from "../api/carImageApi";
import CarCard from "../components/CarCard";
import ReviewCard from "../components/ReviewCard";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [car, setCar] = useState(null);
  const [recentCars, setRecentCars] = useState([]);
  const [recommendationCars, setRecommendationCars] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchCarDetails();
    fetchRelatedCars();
    fetchReviews();
    fetchCarImages();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const response = await axiosClient.get(`xe/${id}/`);
      setCar(response.data);
    } catch (error) {
      console.error("Error fetching car details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedCars = async () => {
    try {
      const response = await axiosClient.get("xe/");
      const cars = response.data.results || response.data;
      // Exclude current car
      const filteredCars = cars.filter((c) => (c.ma_xe || c.id) !== id);
      setRecentCars(filteredCars.slice(0, 3));
      setRecommendationCars(filteredCars.slice(3, 6));
    } catch (error) {
      console.error("Error fetching related cars:", error);
    }
  };

  const fetchCarImages = async () => {
    try {
      const response = await carImageApi.getByCarId(id);
      const images = response.data.results || response.data || [];
      setCarImages(images);
    } catch (error) {
      console.error("Error fetching car images:", error);
      setCarImages([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewApi.getByCarId(id);
      const reviewsData = response.data.results || response.data || [];
      setReviews(reviewsData);
      
      // Check if current user has already reviewed
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const userResponse = await axiosClient.get("me/");
          const currentUserId = userResponse.data.id || userResponse.data.user?.id;
          const hasReviewed = reviewsData.some(
            (review) => review.user?.id === currentUserId
          );
          setUserHasReviewed(hasReviewed);
        } catch (error) {
          // User not authenticated or error getting user info
          setUserHasReviewed(false);
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!car) {
      alert("Không tìm thấy thông tin xe");
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmittingReview(true);
    try {
      // Sử dụng ma_xe nếu có, nếu không thì dùng id
      const xeId = car.ma_xe || car.id || id;
      await reviewApi.create({
        xe: xeId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      alert("Đánh giá của bạn đã được gửi thành công!");
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      setUserHasReviewed(true);
      fetchReviews(); // Reload reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      let errorMessage = "Có lỗi xảy ra khi gửi đánh giá";
      
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.xe) {
          errorMessage = `Lỗi: ${error.response.data.xe[0]}`;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else {
          // Get first error message
          const firstError = Object.values(error.response.data)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      }
      
      alert(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRentNow = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate("/payment", { state: { car } });
  };

  // Get image URLs for gallery
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/img_car.png";
    if (imageUrl.startsWith("http")) return imageUrl;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    return baseUrl.replace("/api", "") + (imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl);
  };

  // Get main image (first image from car_images or fallback to car.image)
  const getMainImage = () => {
    if (carImages && carImages.length > 0) {
      return carImages[0].image_url || carImages[0].image || "/images/img_car.png";
    }
    return car?.image_url || car?.image || "/images/img_car.png";
  };

  // Create image gallery from car_images or fallback to main image
  const getImageGallery = () => {
    if (carImages && carImages.length > 0) {
      return carImages.map((img) => img.image_url || img.image || "/images/img_car.png");
    }
    // Fallback to main image
    const mainImage = getMainImage();
    return [mainImage];
  };

  const mainImage = getMainImage();
  const imageGallery = getImageGallery();

  // Reset selectedImageIndex nếu vượt quá độ dài imageGallery
  useEffect(() => {
    if (selectedImageIndex >= imageGallery.length && imageGallery.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [imageGallery.length, selectedImageIndex]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải...</div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Không tìm thấy xe</p>
      </div>
    );
  }

  const price = car.gia_thue > 0 ? car.gia_thue : (car.gia_khuyen_mai > 0 ? car.gia_khuyen_mai : (car.gia > 0 ? car.gia : 0));
  const originalPrice = car.gia_khuyen_mai && car.gia && car.gia > car.gia_khuyen_mai ? car.gia : null;
  const priceUSD = (price / 23000).toFixed(2);
  const originalPriceUSD = originalPrice ? (originalPrice / 23000).toFixed(2) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Featured Car Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-lg p-8 mb-8 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sports car with the best design and acceleration
            </h1>
            <p className="text-lg text-blue-100 dark:text-blue-200 transition-colors duration-300">
              Safety and comfort while driving a futuristic and elegant sports car
            </p>
          </div>
          <div className="hidden lg:block">
            <img
              src={getImageUrl(mainImage)}
              alt={car.ten_xe}
              className="w-full h-auto object-contain"
              onError={(e) => {
                e.target.src = "/images/img_car.png";
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column - Image Gallery and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="mb-4">
              <img
                src={getImageUrl(
                  imageGallery.length > 0
                    ? imageGallery[selectedImageIndex] || imageGallery[0]
                    : mainImage
                )}
                alt={car.ten_xe}
                className="w-full h-64 sm:h-80 md:h-96 object-contain bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 transition-colors duration-300"
                onError={(e) => {
                  e.target.src = "/images/img_car.png";
                }}
              />
            </div>
            {/* Thumbnails */}
            {imageGallery.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageGallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? "border-blue-600 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-20 sm:h-24 object-contain bg-gray-50 dark:bg-gray-900/50 p-2 transition-colors duration-300"
                      onError={(e) => {
                        e.target.src = "/images/img_car.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">{car.ten_xe}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < 4 ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"} transition-colors duration-300`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">440+ Reviewer</span>
              </div>
            </div>

            {car.mo_ta && (
              <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">{car.mo_ta}</p>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">Type Car</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                  {car.loai_xe?.ten_loai || car.loai_xe_detail?.ten_loai || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">Capacity</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">{car.so_cho || 2} Person</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">Steering</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                  {car.hop_so === "automatic" ? "Automatic" : car.hop_so === "manual" ? "Manual" : car.hop_so || "Manual"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">Gasoline</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">{car.dung_tich_nhien_lieu || 70}L</p>
              </div>
            </div>

            {/* Price and Rent Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                    ${priceUSD}/days
                  </span>
                  {originalPriceUSD && (
                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through transition-colors duration-300">
                      ${originalPriceUSD}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleRentNow}
                className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
              >
                Rent Now
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Reviews</h2>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold transition-colors duration-300">
                {reviews.length}
              </span>
            </div>

            {/* Add Review Button */}
            {!userHasReviewed && localStorage.getItem("access_token") && (
              <div className="mb-6">
                {!showReviewForm ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold"
                  >
                    Viết đánh giá
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                        Đánh giá của bạn
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-8 h-8 transition-colors duration-300 ${
                                star <= reviewForm.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                        Nhận xét
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, comment: e.target.value })
                        }
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="flex-1 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold disabled:opacity-50"
                      >
                        {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewForm({ rating: 5, comment: "" });
                        }}
                        className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0 transition-colors duration-300">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors duration-300">
                        {review.user?.avatar_url ? (
                          <img
                            src={review.user.avatar_url}
                            alt={review.user_name || review.user?.username || "User"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails
                              e.target.style.display = "none";
                              const parent = e.target.parentElement;
                              const fallback = parent.querySelector(".avatar-fallback");
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        {/* Fallback: Initials */}
                        <div
                          className={`w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ${
                            review.user?.avatar_url ? "hidden avatar-fallback" : ""
                          } transition-colors duration-300`}
                        >
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg transition-colors duration-300">
                            {review.user_name?.charAt(0)?.toUpperCase() ||
                              review.user?.username?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                              {review.user_name || review.user?.username || "Người dùng"}
                            </h4>
                            {review.user_title && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{review.user_title}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString("en-US", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : ""}
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 transition-colors duration-300 ${i < review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-300">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8 transition-colors duration-300">Chưa có đánh giá nào</p>
            )}
            {reviews.length > 2 && (
              <button className="mt-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center transition-colors duration-300">
                Show All
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Recent and Recommendation Cars */}
        <div className="space-y-8">
          {/* Recent Car */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Recent Car</h3>
              <Link to="/category" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors duration-300">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentCars.length > 0 ? (
                recentCars.map((car) => (
                  <CarCard key={car.ma_xe || car.id} car={car} />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 transition-colors duration-300">Không có xe gần đây</p>
              )}
            </div>
          </div>

          {/* Recommendation Car */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Recomendation Car</h3>
              <Link to="/category" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors duration-300">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recommendationCars.length > 0 ? (
                recommendationCars.map((car) => (
                  <CarCard key={car.ma_xe || car.id} car={car} />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 transition-colors duration-300">Không có xe đề xuất</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
