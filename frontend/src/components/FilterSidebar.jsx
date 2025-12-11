import { useState, useEffect } from "react";

const FilterSidebar = ({ onFilterChange, cars = [] }) => {
  const [filters, setFilters] = useState({
    types: {},
    capacity: {},
    fuel: {},
    transmission: {},
    maxPrice: 200,
  });

  // Tính toán các filter options từ data thực tế
  useEffect(() => {
    if (cars.length === 0) return;

    // Tính TYPE options
    const typeCounts = {};
    cars.forEach((car) => {
      // Xử lý cả object và nested object
      const type = (
        car.loai_xe?.ten_loai || 
        car.loai_xe_detail?.ten_loai || 
        (typeof car.loai_xe === 'object' && car.loai_xe?.ten_loai) ||
        ""
      ).toLowerCase();
      if (type) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    // Tính CAPACITY options
    const capacityCounts = {};
    cars.forEach((car) => {
      const seats = car.so_cho || 2;
      let capacityKey = String(seats);
      if (seats >= 8) capacityKey = "8+";
      capacityCounts[capacityKey] = (capacityCounts[capacityKey] || 0) + 1;
    });

    // Tính FUEL options
    const fuelCounts = {};
    cars.forEach((car) => {
      const fuel = (car.loai_nhien_lieu || "").toLowerCase();
      if (fuel) {
        fuelCounts[fuel] = (fuelCounts[fuel] || 0) + 1;
      }
    });

    // Tính TRANSMISSION options
    const transmissionCounts = {};
    cars.forEach((car) => {
      const trans = (car.hop_so || "").toLowerCase();
      if (trans) {
        transmissionCounts[trans] = (transmissionCounts[trans] || 0) + 1;
      }
    });

    // Khởi tạo filters với tất cả giá trị = false
    const newTypes = {};
    Object.keys(typeCounts).forEach((key) => {
      newTypes[key] = false;
    });

    const newCapacity = {};
    Object.keys(capacityCounts).forEach((key) => {
      newCapacity[key] = false;
    });

    const newFuel = {};
    Object.keys(fuelCounts).forEach((key) => {
      newFuel[key] = false;
    });

    const newTransmission = {};
    Object.keys(transmissionCounts).forEach((key) => {
      newTransmission[key] = false;
    });

    setFilters({
      types: newTypes,
      capacity: newCapacity,
      fuel: newFuel,
      transmission: newTransmission,
      maxPrice: 200,
    });

    // Lưu counts để hiển thị
    setTypeCounts(typeCounts);
    setCapacityCounts(capacityCounts);
    setFuelCounts(fuelCounts);
    setTransmissionCounts(transmissionCounts);
  }, [cars]);

  const [typeCounts, setTypeCounts] = useState({});
  const [capacityCounts, setCapacityCounts] = useState({});
  const [fuelCounts, setFuelCounts] = useState({});
  const [transmissionCounts, setTransmissionCounts] = useState({});

  const handleTypeChange = (type) => {
    const newFilters = {
      ...filters,
      types: { ...filters.types, [type]: !filters.types[type] },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCapacityChange = (capacity) => {
    const newFilters = {
      ...filters,
      capacity: { ...filters.capacity, [capacity]: !filters.capacity[capacity] },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFuelChange = (fuel) => {
    const newFilters = {
      ...filters,
      fuel: { ...filters.fuel, [fuel]: !filters.fuel[fuel] },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTransmissionChange = (type) => {
    const newFilters = {
      ...filters,
      transmission: {
        ...filters.transmission,
        [type]: !filters.transmission[type],
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (e) => {
    const newFilters = { ...filters, maxPrice: parseInt(e.target.value) };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <h2 className="text-xl font-bold mb-6">Filters</h2>

      {/* TYPE */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">TYPE</h3>
        <div className="space-y-2">
          {Object.keys(filters.types).length > 0 ? (
            Object.keys(filters.types)
              .sort()
              .map((typeKey) => {
                const label = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
                const count = typeCounts[typeKey] || 0;
                return (
                  <label key={typeKey} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.types[typeKey] || false}
                      onChange={() => handleTypeChange(typeKey)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">
                      {label} ({count})
                    </span>
                  </label>
                );
              })
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </div>
      </div>

      {/* CAPACITY */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">CAPACITY</h3>
        <div className="space-y-2">
          {Object.keys(filters.capacity).length > 0 ? (
            Object.keys(filters.capacity)
              .sort((a, b) => {
                if (a === "8+") return 1;
                if (b === "8+") return -1;
                return parseInt(a) - parseInt(b);
              })
              .map((capacityKey) => {
                const label = capacityKey === "8+" ? "8 or More" : `${capacityKey} Person`;
                const count = capacityCounts[capacityKey] || 0;
                return (
                  <label key={capacityKey} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.capacity[capacityKey] || false}
                      onChange={() => handleCapacityChange(capacityKey)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">
                      {label} ({count})
                    </span>
                  </label>
                );
              })
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </div>
      </div>

      {/* FUEL */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">FUEL</h3>
        <div className="space-y-2">
          {Object.keys(filters.fuel).length > 0 ? (
            Object.keys(filters.fuel)
              .sort()
              .map((fuelKey) => {
                const label = fuelKey.charAt(0).toUpperCase() + fuelKey.slice(1);
                const count = fuelCounts[fuelKey] || 0;
                return (
                  <label key={fuelKey} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.fuel[fuelKey] || false}
                      onChange={() => handleFuelChange(fuelKey)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">
                      {label} ({count})
                    </span>
                  </label>
                );
              })
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </div>
      </div>

      {/* TRANSMISSION */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">TRANSMISSION</h3>
        <div className="space-y-2">
          {Object.keys(filters.transmission).length > 0 ? (
            Object.keys(filters.transmission)
              .sort()
              .map((transKey) => {
                const label = transKey === "automatic" ? "Automatic" : transKey === "manual" ? "Manual" : transKey.charAt(0).toUpperCase() + transKey.slice(1);
                const count = transmissionCounts[transKey] || 0;
                return (
                  <label key={transKey} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.transmission[transKey] || false}
                      onChange={() => handleTransmissionChange(transKey)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">
                      {label} ({count})
                    </span>
                  </label>
                );
              })
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </div>
      </div>

      {/* PRICE */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">PRICE</h3>
        <input
          type="range"
          min="0"
          max="200"
          value={filters.maxPrice}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="mt-2 text-sm text-gray-600">
          Max. ${filters.maxPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

