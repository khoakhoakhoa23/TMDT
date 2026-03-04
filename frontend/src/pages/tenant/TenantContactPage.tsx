import { useTenant } from "../../contexts/TenantContext";

const TenantContactPage = () => {
  const { tenant } = useTenant();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900">Liên hệ</h2>
      <div className="mt-4 space-y-2 text-gray-700">
        {tenant?.address && (
          <div>
            <b>Địa chỉ:</b> {tenant.address}
          </div>
        )}
        {tenant?.phone && (
          <div>
            <b>Điện thoại:</b> {tenant.phone}
          </div>
        )}
        {tenant?.email && (
          <div>
            <b>Email:</b> {tenant.email}
          </div>
        )}
        {!tenant?.address && !tenant?.phone && !tenant?.email && (
          <p className="text-gray-600">(Chưa có thông tin liên hệ)</p>
        )}
      </div>
    </div>
  );
};

export default TenantContactPage;

