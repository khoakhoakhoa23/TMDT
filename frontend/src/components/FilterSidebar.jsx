import { useState } from "react";

const FilterSidebar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    types: {
      sport: true,
      suv: true,
      mpv: false,
      sedan: false,
      coupe: false,
      hatchback: false,
    },
    capacity: {
      "2": true,
      "4": false,
      "6": false,
      "8+": true,
    },
    fuel: {
      gasoline: true,
      electric: true,
      hybrid: true,
    },
    transmission: {
      manual: true,
      automatic: true,
    },
    maxPrice: 100,
  });

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
          {[
            { key: "sport", label: "Sport", count: 10 },
            { key: "suv", label: "SUV", count: 12 },
            { key: "mpv", label: "MPV", count: 16 },
            { key: "sedan", label: "Sedan", count: 20 },
            { key: "coupe", label: "Coupe", count: 14 },
            { key: "hatchback", label: "Hatchback", count: 14 },
          ].map((item) => (
            <label key={item.key} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.types[item.key]}
                onChange={() => handleTypeChange(item.key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                {item.label} ({item.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* CAPACITY */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">CAPACITY</h3>
        <div className="space-y-2">
          {[
            { key: "2", label: "2 Person", count: 10 },
            { key: "4", label: "4 Person", count: 14 },
            { key: "6", label: "6 Person", count: 12 },
            { key: "8+", label: "8 or More", count: 16 },
          ].map((item) => (
            <label key={item.key} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.capacity[item.key]}
                onChange={() => handleCapacityChange(item.key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                {item.label} ({item.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* FUEL */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">FUEL</h3>
        <div className="space-y-2">
          {[
            { key: "gasoline", label: "Gasoline" },
            { key: "electric", label: "Electric" },
            { key: "hybrid", label: "Hybrid" },
          ].map((item) => (
            <label key={item.key} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fuel[item.key]}
                onChange={() => handleFuelChange(item.key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* TRANSMISSION */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">TRANSMISSION</h3>
        <div className="space-y-2">
          {[
            { key: "manual", label: "Manual" },
            { key: "automatic", label: "Automatic" },
          ].map((item) => (
            <label key={item.key} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.transmission[item.key]}
                onChange={() => handleTransmissionChange(item.key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{item.label}</span>
            </label>
          ))}
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

