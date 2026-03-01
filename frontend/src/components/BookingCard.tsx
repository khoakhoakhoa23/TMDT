import InputSelect from "./InputSelect";
import InputDate from "./InputDate";
import InputTime from "./InputTime";

const BookingCard = ({
  title,
  location,
  date,
  time,
  onLocationChange,
  onDateChange,
  onTimeChange,
  locations,
  timeSlots,
  minDate,
  loadingLocations = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-gray-300">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        <span className="font-bold text-gray-800 text-base">{title}</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Locations</label>
          <InputSelect
            value={location}
            onChange={onLocationChange}
            options={locations}
            placeholder="Select your city"
            disabled={loadingLocations}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <InputDate value={date} onChange={onDateChange} min={minDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
          <InputTime value={time} onChange={onTimeChange} options={timeSlots} placeholder="Select your time" />
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

