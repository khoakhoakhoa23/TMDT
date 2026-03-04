import { Link, useParams } from "react-router-dom";
import { useTenant } from "../../../contexts/TenantContext";

const HotelTemplate = () => {
  const { tenant } = useTenant();
  const { tenantId } = useParams<{ tenantId: string }>();

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tenant?.name || "Hotel"}
            </h2>
            <p className="mt-2 text-gray-600">
              Đặt phòng tiện lợi, trải nghiệm lưu trú chất lượng.
            </p>
          </div>
          <Link
            to={`/tenant/${tenantId}/products`}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Xem phòng
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Phòng đa dạng</h3>
          <p className="text-sm text-gray-600 mt-1">
            Nhiều hạng phòng phù hợp mọi nhu cầu.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Ưu đãi</h3>
          <p className="text-sm text-gray-600 mt-1">
            Giá tốt theo mùa và chương trình khuyến mãi.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Dịch vụ</h3>
          <p className="text-sm text-gray-600 mt-1">
            Hỗ trợ 24/7 và tiện ích kèm theo.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HotelTemplate;

