import { useTenant } from "../../contexts/TenantContext";

const TenantProductsPage = () => {
  const { tenant } = useTenant();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900">Sản phẩm</h2>
      <p className="mt-2 text-gray-600">
        Trang sản phẩm public của <b>{tenant?.name}</b>.
      </p>
      <p className="mt-3 text-sm text-gray-500">
        (Placeholder) Bạn có thể map sang catalog riêng theo tenant sau.
      </p>
    </div>
  );
};

export default TenantProductsPage;

