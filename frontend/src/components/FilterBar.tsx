import { useState } from "react";

const FilterBar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    year: "",
    fuel: "",
  });

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại xe
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="coupe">Coupe</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng giá
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleChange("priceRange", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="0-500000">Dưới 500k</option>
            <option value="500000-1000000">500k - 1 triệu</option>
            <option value="1000000-2000000">1 - 2 triệu</option>
            <option value="2000000+">Trên 2 triệu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Năm sản xuất
          </label>
          <select
            value={filters.year}
            onChange={(e) => handleChange("year", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="2020+">2020 trở lên</option>
            <option value="2015-2019">2015 - 2019</option>
            <option value="2010-2014">2010 - 2014</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhiên liệu
          </label>
          <select
            value={filters.fuel}
            onChange={(e) => handleChange("fuel", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="xang">Xăng</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Điện</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => {
          const resetFilters = { category: "", priceRange: "", year: "", fuel: "" };
          setFilters(resetFilters);
          onFilterChange(resetFilters);
        }}
        className="mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
};

export default FilterBar;

