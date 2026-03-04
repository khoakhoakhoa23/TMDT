import { Link, useParams } from "react-router-dom";
import { useTenant } from "../../../contexts/TenantContext";

const DefaultTemplate = () => {
  const { tenant } = useTenant();
  const { tenantId } = useParams<{ tenantId: string }>();

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {tenant?.name || "Tenant"}
        </h2>
        <p className="mt-2 text-gray-600">
          Chào mừng bạn đến với website của tenant.
        </p>
        {tenant?.description && (
          <p className="mt-4 text-gray-700">{tenant.description}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/tenant/${tenantId}/products`}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Xem sản phẩm
          </Link>
          <Link
            to={`/tenant/${tenantId}/about`}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200"
          >
            Giới thiệu
          </Link>
          <Link
            to={`/tenant/${tenantId}/contact`}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200"
          >
            Liên hệ
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Theme</h3>
          <p className="text-sm text-gray-600 mt-1">{tenant?.theme || "default"}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Trạng thái</h3>
          <p className="text-sm text-gray-600 mt-1">{tenant?.status || "-"}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Tenant ID</h3>
          <p className="text-sm text-gray-600 mt-1">{tenantId}</p>
        </div>
      </section>
    </div>
  );
};

export default DefaultTemplate;

