import { useTenant } from "../contexts/TenantContext";

/**
 * TenantHome - Trang chủ của tenant public.
 *
 * Render template tương ứng với tenant.theme.
 * Nếu chưa có theme → dùng DefaultTemplate.
 */
const TenantHome = () => {
  const { tenant } = useTenant();

  if (!tenant) {
    return null;
  }

  // Render template dựa trên theme
  switch (tenant.theme) {
    case "car-rental":
      return <CarRentalTemplate tenant={tenant} />;
    case "hotel":
      return <HotelTemplate tenant={tenant} />;
    case "ecommerce":
      return <EcommerceTemplate tenant={tenant} />;
    default:
      return <DefaultTemplate tenant={tenant} />;
  }
};

/**
 * Default Template - Giao diện mặc định
 */
const DefaultTemplate = ({ tenant }: { tenant: any }) => {
  const primaryColor = tenant.primary_color || "#3B82F6";

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        {tenant.logo && (
          <img
            src={tenant.logo}
            alt={tenant.name}
            className="h-20 mx-auto mb-4 object-contain"
          />
        )}
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: primaryColor }}
        >
          {tenant.name}
        </h1>
        {tenant.description && (
          <p className="text-gray-600 max-w-2xl mx-auto">{tenant.description}</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <a
          href={`/tenant/${tenant.id}/products`}
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <div className="text-4xl mb-2">🚗</div>
          <h3 className="font-semibold text-gray-900">Sản phẩm</h3>
          <p className="text-sm text-gray-500">Xem danh sách sản phẩm</p>
        </a>
        <a
          href={`/tenant/${tenant.id}/about`}
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <div className="text-4xl mb-2">ℹ️</div>
          <h3 className="font-semibold text-gray-900">Giới thiệu</h3>
          <p className="text-sm text-gray-500">Tìm hiểu về chúng tôi</p>
        </a>
        <a
          href={`/tenant/${tenant.id}/contact`}
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <div className="text-4xl mb-2">📞</div>
          <h3 className="font-semibold text-gray-900">Liên hệ</h3>
          <p className="text-sm text-gray-500">Kết nối với chúng tôi</p>
        </a>
      </div>

      {/* Contact Info */}
      {(tenant.phone || tenant.email || tenant.address) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin liên hệ</h2>
          <div className="space-y-2">
            {tenant.address && (
              <p className="flex items-center gap-2">
                <span className="text-gray-400">📍</span>
                {tenant.address}
              </p>
            )}
            {tenant.phone && (
              <p className="flex items-center gap-2">
                <span className="text-gray-400">📞</span>
                <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:underline">
                  {tenant.phone}
                </a>
              </p>
            )}
            {tenant.email && (
              <p className="flex items-center gap-2">
                <span className="text-gray-400">✉️</span>
                <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:underline">
                  {tenant.email}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Car Rental Template - Giao diện thuê xe
 */
const CarRentalTemplate = ({ tenant }: { tenant: any }) => {
  const primaryColor = tenant.primary_color || "#3B82F6";

  return (
    <div className="space-y-8">
      {/* Hero with Search */}
      <div
        className="rounded-2xl p-8 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-3xl font-bold mb-2">
          Thuê xe {tenant.name}
        </h1>
        <p className="opacity-90 mb-6">
          Dịch vụ cho thuê xe chuyên nghiệp, giá rẻ nhất
        </p>
        <a
          href={`/tenant/${tenant.id}/products`}
          className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Xem danh sách xe →
        </a>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🚙</div>
          <h3 className="font-semibold mb-2">Đa dạng xe</h3>
          <p className="text-sm text-gray-500">Nhiều dòng xe từ economy đến luxury</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-3">💰</div>
          <h3 className="font-semibold mb-2">Giá cạnh tranh</h3>
          <p className="text-sm text-gray-500">Luôn có mức giá tốt nhất</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-3">⏰</div>
          <h3 className="font-semibold mbỗ tr-2">Hợ 24/7</h3>
          <p className="text-sm text-gray-500">Luôn sẵn sàng hỗ trợ bạn</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href={`/tenant/${tenant.id}/products`}
          className="inline-block px-8 py-4 text-white font-semibold rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          Đặt xe ngay
        </a>
      </div>
    </div>
  );
};

/**
 * Hotel Template - Giao diện khách sạn
 */
const HotelTemplate = ({ tenant }: { tenant: any }) => {
  const primaryColor = tenant.primary_color || "#3B82F6";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        {tenant.banner_image ? (
          <img
            src={tenant.banner_image}
            alt={tenant.name}
            className="w-full h-80 object-cover"
          />
        ) : (
          <div
            className="w-full h-80 flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-6xl">🏨</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">{tenant.name}</h1>
            <p className="text-xl">Khách sạn & Khu nghỉ dưỡng</p>
          </div>
        </div>
      </div>

      {/* Rooms CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Đặt phòng ngay</h2>
        <a
          href={`/tenant/${tenant.id}/products`}
          className="inline-block px-8 py-4 text-white font-semibold rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          Xem các phòng có sẵn
        </a>
      </div>
    </div>
  );
};

/**
 * Ecommerce Template - Giao diện thương mại điện tử
 */
const EcommerceTemplate = ({ tenant }: { tenant: any }) => {
  const primaryColor = tenant.primary_color || "#3B82F6";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="rounded-2xl p-8 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-3xl font-bold mb-2">Chào mừng đến với {tenant.name}</h1>
        <p className="opacity-90 mb-6">Sản phẩm chất lượng, giá tốt</p>
        <a
          href={`/tenant/${tenant.id}/products`}
          className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Mua sắm ngay →
        </a>
      </div>

      {/* Categories would go here */}
      <div className="text-center">
        <a
          href={`/tenant/${tenant.id}/products`}
          className="inline-block px-8 py-4 text-white font-semibold rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          Xem sản phẩm
        </a>
      </div>
    </div>
  );
};

export default TenantHome;
