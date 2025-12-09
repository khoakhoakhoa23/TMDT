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
      const response = await axiosClient.get("xe/");
      setCars(response.data.results || response.data);
      setFilteredCars(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cars];

    if (filters.types) {
      const selectedTypes = Object.keys(filters.types).filter(
        (key) => filters.types[key]
      );
      if (selectedTypes.length > 0) {
        filtered = filtered.filter((car) => {
          const carType = car.loai_xe?.ten_loai?.toLowerCase() || "";
          return selectedTypes.some((type) => carType.includes(type));
        });
      }
    }

    if (filters.capacity) {
      const selectedCapacities = Object.keys(filters.capacity).filter(
        (key) => filters.capacity[key]
      );
      if (selectedCapacities.length > 0) {
        filtered = filtered.filter((car) => {
          const seats = car.capacity || car.seats || car.so_cho;
          if (!seats) return true; // keep if no data
          if (seats >= 8 && selectedCapacities.includes("8+")) return true;
          return selectedCapacities.includes(String(seats));
        });
      }
    }

    if (filters.fuel) {
      const selectedFuel = Object.keys(filters.fuel).filter(
        (key) => filters.fuel[key]
      );
      if (selectedFuel.length > 0) {
        filtered = filtered.filter((car) => {
          const fuel =
            (car.nhien_lieu || car.fuel || car.loai_nhien_lieu || "").toLowerCase();
          if (!fuel) return true;
          return selectedFuel.some((item) => fuel.includes(item));
        });
      }
    }

    if (filters.transmission) {
      const selectedTrans = Object.keys(filters.transmission).filter(
        (key) => filters.transmission[key]
      );
      if (selectedTrans.length > 0) {
        filtered = filtered.filter((car) => {
          const trans = (car.transmission || car.hop_so || "").toLowerCase();
          if (!trans) return true;
          return selectedTrans.some((item) => trans.includes(item));
        });
      }
    }

    if (filters.maxPrice) {
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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Pick-Up/Drop-Off Form */}
      <PickupDropoffForm />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar onFilterChange={handleFilterChange} />
        </div>

        {/* Car Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCars.length > 0 ? (
              filteredCars.slice(0, visibleCount).map((car) => (
                <CarCard key={car.ma_xe || car.id} car={car} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                Không tìm thấy xe nào
              </div>
            )}
          </div>

          {filteredCars.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
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
        </div>
      </div>
    </div>
  );
};

export default Category;
