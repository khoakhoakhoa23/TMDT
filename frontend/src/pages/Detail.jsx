import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarDetails();
    fetchRelatedCars();
    fetchReviews();
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
      setRecentCars(cars.slice(0, 3));
      setRecommendationCars(cars.slice(3, 6));
    } catch (error) {
      console.error("Error fetching related cars:", error);
    }
  };

  const fetchReviews = async () => {
    // TODO: Implement when review API is available
    setReviews([]);
  };

  const handleRentNow = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate("/payment", { state: { car } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy xe</p>
      </div>
    );
  }

  const price = car.gia_thue || car.gia_khuyen_mai || car.gia || 0;
  const originalPrice = car.gia_khuyen_mai ? car.gia : null;

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 mb-8 rounded-lg relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Sports car with the best design and acceleration
              </h1>
              <p className="text-lg text-blue-100">
                Safety and comfort while driving a futuristic and elegant sports car
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src={car.image_url || "/images/img_car.png"}
                alt={car.ten_xe}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Car Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{car.ten_xe}</h1>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < 4 ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600">440+ Reviewer</span>
                </div>
              </div>
            </div>

            {car.mo_ta && (
              <p className="text-gray-600 mb-6">{car.mo_ta}</p>
            )}

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-600">Type Car</span>
                <p className="font-semibold">{car.loai_xe?.ten_loai || "N/A"}</p>
              </div>
              <div>
                <span className="text-gray-600">Capacity</span>
                <p className="font-semibold">2 Person</p>
              </div>
              <div>
                <span className="text-gray-600">Steering</span>
                <p className="font-semibold">Manual</p>
              </div>
              <div>
                <span className="text-gray-600">Gasoline</span>
                <p className="font-semibold">70L</p>
              </div>
            </div>

            {/* Price and Rent Button */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                <div className="text-3xl font-bold text-gray-800">
                  ${(price / 23000).toFixed(2)}/days
                </div>
                {originalPrice && (
                  <div className="text-lg text-gray-400 line-through">
                    ${(originalPrice / 23000).toFixed(2)}
                  </div>
                )}
              </div>
              <button
                onClick={handleRentNow}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Rent Now
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Reviews</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                13
              </span>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Chưa có đánh giá nào</p>
            )}
            <button className="mt-4 text-blue-600 hover:text-blue-700 font-semibold flex items-center">
              Show All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar - Recent and Recommendation */}
        <div className="space-y-6">
          {/* Recent Car */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recent Car</h3>
              <Link to="/category" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentCars.map((car) => (
                <CarCard key={car.ma_xe || car.id} car={car} />
              ))}
            </div>
          </div>

          {/* Recommendation Car */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recommendation Car</h3>
              <Link to="/category" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recommendationCars.map((car) => (
                <CarCard key={car.ma_xe || car.id} car={car} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
