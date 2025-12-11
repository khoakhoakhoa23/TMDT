import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import CarCard from "../components/CarCard";
import PickupDropoffForm from "../components/PickupDropoffForm";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [popularCars, setPopularCars] = useState([]);
  const [recommendationCars, setRecommendationCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await axiosClient.get("xe/");
      const cars = response.data.results || response.data;
      // Lấy 3 xe đầu làm popular, 5 xe tiếp theo làm recommendation
      setPopularCars(cars.slice(0, 3));
      setRecommendationCars(cars.slice(3, 8));
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroRentNow = () => {
    // Điều hướng đến Category theo luồng: Home → Category → Detail
    navigate("/category");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 mb-8 rounded-lg relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                The Best Platform for Car Rental
              </h1>
              <p className="text-lg md:text-xl mb-6 text-blue-100">
                Ease of doing a car rental safely and reliably. Of course at a low price.
              </p>
              <button
                onClick={handleHeroRentNow}
                className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Rental Now
              </button>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/img_car.png"
                alt="Car"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pick-Up/Drop-Off Form */}
      <PickupDropoffForm />

      {/* Popular Car Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Popular Car</h2>
          <Link
            to="/category"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Đang tải...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCars.map((car) => (
              <CarCard key={car.ma_xe || car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* Recommendation Car Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Recommendation Car</h2>
          <Link
            to="/category"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Đang tải...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendationCars.map((car) => (
              <CarCard key={car.ma_xe || car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
