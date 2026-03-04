import { Link, useParams } from "react-router-dom";
import { useTenant } from "../../../contexts/TenantContext";

const CarRentalTemplate = () => {
  const { tenant } = useTenant();
  const { tenantId } = useParams<{ tenantId: string }>();

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tenant?.name || "Car Rental"}
            </h2>
            <p className="mt-2 text-gray-600">
              Thuê xe nhanh chóng, linh hoạt theo nhu cầu của bạn.
            </p>
          </div>
          <Link
            to={`/tenant/${tenantId}/products`}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Danh sách xe
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Đặt xe</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tìm xe theo loại, địa điểm và thời gian.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Giá minh bạch</h3>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị giá theo giờ/ngày và phụ phí rõ ràng.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Hỗ trợ</h3>
          <p className="text-sm text-gray-600 mt-1">
            Liên hệ nhanh để được tư vấn và xử lý sự cố.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CarRentalTemplate;

