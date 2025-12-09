import { useState } from "react";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addDaysISO = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const PickupDropoffForm = ({ onSearch }) => {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  const [pickup, setPickup] = useState({
    location: "Semarang",
    date: today,
    time: "07:00",
  });

  const [dropoff, setDropoff] = useState({
    location: "Semarang",
    date: tomorrow,
    time: "01:00",
  });

  const handleSwap = () => {
    const temp = { ...pickup };
    setPickup(dropoff);
    setDropoff(temp);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Pick-Up */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="font-semibold text-gray-700">Pick-Up</span>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Locations</label>
            <select
              value={pickup.location}
              onChange={(e) => setPickup({ ...pickup, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Semarang</option>
              <option>Jakarta</option>
              <option>Surabaya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={pickup.date}
              onChange={(e) => setPickup({ ...pickup, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Time</label>
            <select
              value={pickup.time}
              onChange={(e) => setPickup({ ...pickup, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="07:00">07:00</option>
              <option value="08:00">08:00</option>
              <option value="09:00">09:00</option>
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Drop-Off */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="font-semibold text-gray-700">Drop-Off</span>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Locations</label>
            <select
              value={dropoff.location}
              onChange={(e) => setDropoff({ ...dropoff, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Semarang</option>
              <option>Jakarta</option>
              <option>Surabaya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={dropoff.date}
              min={pickup.date}
              onChange={(e) => setDropoff({ ...dropoff, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Time</label>
            <select
              value={dropoff.time}
              onChange={(e) => setDropoff({ ...dropoff, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="01:00">01:00</option>
              <option value="02:00">02:00</option>
              <option value="03:00">03:00</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupDropoffForm;

