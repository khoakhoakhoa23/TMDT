import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import CarCard from "../components/CarCard";
import FilterSidebar from "../components/FilterSidebar";
import PickupDropoffForm from "../components/PickupDropoffForm";

const Category = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, cars]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("xe/");
      const carsData = response.data.results || response.data || [];
      
      // Đảm bảo carsData là array
      if (Array.isArray(carsData)) {
        setCars(carsData);
        setFilteredCars(carsData);
      } else {
        console.error("Invalid response format:", response.data);
        setCars([]);
        setFilteredCars([]);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
      setFilteredCars([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!cars || cars.length === 0) {
      setFilteredCars([]);
      return;
    }
    
    let filtered = [...cars];

    // Filter by TYPE
    if (filters.types) {
      const selectedTypes = Object.keys(filters.types).filter(
        (key) => filters.types[key]
      );
      if (selectedTypes.length > 0 && selectedTypes.length < Object.keys(filters.types).length) {
        filtered = filtered.filter((car) => {
          // Xử lý cả object và nested object
          const carType = (
            car.loai_xe?.ten_loai || 
            car.loai_xe_detail?.ten_loai || 
            (typeof car.loai_xe === 'object' && car.loai_xe?.ten_loai) ||
            ""
          ).toLowerCase();
          return selectedTypes.some((type) => carType.includes(type.toLowerCase()));
        });
      }
    }

    // Filter by CAPACITY
    if (filters.capacity) {
      const selectedCapacities = Object.keys(filters.capacity).filter(
        (key) => filters.capacity[key]
      );
      if (selectedCapacities.length > 0 && selectedCapacities.length < Object.keys(filters.capacity).length) {
        filtered = filtered.filter((car) => {
          const seats = car.so_cho || 2;
          if (selectedCapacities.includes("8+")) {
            return seats >= 8;
          }
          return selectedCapacities.includes(String(seats));
        });
      }
    }

    // Filter by FUEL
    if (filters.fuel) {
      const selectedFuel = Object.keys(filters.fuel).filter(
        (key) => filters.fuel[key]
      );
      if (selectedFuel.length > 0 && selectedFuel.length < Object.keys(filters.fuel).length) {
        filtered = filtered.filter((car) => {
          const fuel = (car.loai_nhien_lieu || "").toLowerCase();
          if (!fuel) return true; // keep if no data
          return selectedFuel.some((item) => fuel.includes(item.toLowerCase()));
        });
      }
    }

    // Filter by TRANSMISSION
    if (filters.transmission) {
      const selectedTrans = Object.keys(filters.transmission).filter(
        (key) => filters.transmission[key]
      );
      if (selectedTrans.length > 0 && selectedTrans.length < Object.keys(filters.transmission).length) {
        filtered = filtered.filter((car) => {
          const trans = (car.hop_so || "").toLowerCase();
          if (!trans) return true; // keep if no data
          return selectedTrans.some((item) => trans.includes(item.toLowerCase()));
        });
      }
    }

    // Filter by PRICE
    if (filters.maxPrice && filters.maxPrice < 200) {
      const maxPriceVND = filters.maxPrice * 23000; // Convert USD to VND
      filtered = filtered.filter((car) => {
        const price = car.gia_thue || car.gia_khuyen_mai || car.gia || 0;
        return price <= maxPriceVND;
      });
    }

    setFilteredCars(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">Đang tải danh sách xe...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pick-Up/Drop-Off Form */}
      <PickupDropoffForm />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar onFilterChange={handleFilterChange} cars={cars} />
        </div>

        {/* Car Grid */}
        <div className="lg:col-span-3">
          {cars.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">Chưa có xe nào trong danh sách</p>
              <p className="text-gray-400 text-sm">Vui lòng thử lại sau</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCars.length > 0 ? (
                  filteredCars.slice(0, visibleCount).map((car) => (
                    <CarCard key={car.ma_xe || car.id} car={car} navigateTo="detail" />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
                    <p className="text-lg mb-2">Không tìm thấy xe nào phù hợp với bộ lọc</p>
                    <p className="text-sm text-gray-400">Vui lòng thử điều chỉnh bộ lọc</p>
                  </div>
                )}
              </div>

              {filteredCars.length > 0 && (
                <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-md p-4">
                  <button
                    onClick={handleShowMore}
                    disabled={visibleCount >= filteredCars.length}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {visibleCount >= filteredCars.length ? "No more cars" : "Show more car"}
                  </button>
                  <span className="text-gray-600">
                    Showing {Math.min(visibleCount, filteredCars.length)} of {filteredCars.length} Cars
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Category;
