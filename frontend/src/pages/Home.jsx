import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import CarCard from "../components/CarCard";
import HeroCard from "../components/HeroCard";
import PickupDropoffForm from "../components/PickupDropoffForm";

const Home = () => {
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

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <HeroCard
            title="The Best Platform for Car Rental"
            subtitle="Ease of doing a car rental safely and reliably. Of course at a low price."
            buttonText="Rental Car"
            backgroundColor="#3563E9"
            patternType="radial"
            carImage="/images/img_image_8.png"
            showEllipse={true}
            carConfig={{
              position: "right",
              size: "w-72",
              bottom: "bottom-4",
              offsetY: "translate-y-0",
            }}
          />
          <HeroCard
            title="Easy way to rent a car at a low price"
            subtitle="Providing cheap car rental services and safe and comfortable facilities."
            buttonText="Rental Car"
            backgroundColor="#3563E9"
            patternType="diagonal"
            carImage="/images/img_car_112x288.png"
            carConfig={{
              position: "right",
              size: "w-73",
              bottom: "bottom-3",
              offsetY: "translate-y-2",
            }}
          />
        </div>

        {/* Booking Section */}
        <PickupDropoffForm />

        {/* Popular Car Section */}
        <section className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Popular Car</h2>
            <Link
              to="/category"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-sm sm:text-base transition-colors duration-200"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularCars.map((car) => (
                <CarCard key={car.ma_xe || car.id} car={car} />
              ))}
            </div>
          )}
        </section>

        {/* Recommendation Car Section */}
        <section className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Recommendation Car</h2>
            <Link
              to="/category"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-sm sm:text-base transition-colors duration-200"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300">Đang tải...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommendationCars.map((car) => (
                <CarCard key={car.ma_xe || car.id} car={car} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
