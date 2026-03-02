import { useForm } from "react-hook-form";

const RentalForm = ({ car, onSubmit }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      startDate: "",
      endDate: "",
      pickupLocation: "",
      returnLocation: "",
      additionalServices: [],
    }
  });

  const formValues = watch();
  const startDate = formValues.startDate;
  const endDate = formValues.endDate;
  const additionalServices = formValues.additionalServices || [];

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 0;
    }
    return 0;
  };

  const days = calculateDays();
  const price = car?.gia_thue || car?.gia_khuyen_mai || car?.gia || 0;
  const totalPrice = days * price;

  const onSubmitForm = (data) => {
    onSubmit(data);
  };

  const handleCheckboxChange = (service) => {
    const currentServices = additionalServices || [];
    const services = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service];
    return services;
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Thông tin thuê xe</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu *
          </label>
          <input
            type="date"
            {...register("startDate", { required: "Ngày bắt đầu là bắt buộc" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày kết thúc *
          </label>
          <input
            type="date"
            {...register("endDate", { required: "Ngày kết thúc là bắt buộc" })}
            min={startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Điểm nhận xe *
          </label>
          <input
            type="text"
            {...register("pickupLocation", { required: "Điểm nhận xe là bắt buộc" })}
            placeholder="Nhập địa chỉ nhận xe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.pickupLocation && <p className="text-red-500 text-xs mt-1">{errors.pickupLocation.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Điểm trả xe *
          </label>
          <input
            type="text"
            {...register("returnLocation", { required: "Điểm trả xe là bắt buộc" })}
            placeholder="Nhập địa chỉ trả xe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.returnLocation && <p className="text-red-500 text-xs mt-1">{errors.returnLocation.message}</p>}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dịch vụ bổ sung
        </label>
        <div className="space-y-2">
          {["Bảo hiểm", "GPS", "Trẻ em", "Tài xế"].map((service) => (
            <label key={service} className="flex items-center">
              <input
                type="checkbox"
                value={service}
                {...register("additionalServices")}
                className="mr-2"
              />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <span>Số ngày thuê:</span>
          <span className="font-semibold">{days} ngày</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Giá/ngày:</span>
          <span>{(car?.gia_thue || car?.gia_khuyen_mai || car?.gia || 0).toLocaleString()}đ</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-semibold">Tổng cộng:</span>
          <span className="text-xl font-bold text-blue-600">
            {totalPrice.toLocaleString()}đ
          </span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Tiếp tục thanh toán
      </button>
    </form>
  );
};

export default RentalForm;

