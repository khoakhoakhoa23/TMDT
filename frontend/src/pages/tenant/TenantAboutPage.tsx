import { useTenant } from "../../contexts/TenantContext";

const TenantAboutPage = () => {
  const { tenant } = useTenant();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900">Giới thiệu</h2>
      <p className="mt-2 text-gray-600">
        Thông tin về <b>{tenant?.name}</b>.
      </p>
      {tenant?.description && (
        <p className="mt-4 text-gray-700">{tenant.description}</p>
      )}
    </div>
  );
};

export default TenantAboutPage;

