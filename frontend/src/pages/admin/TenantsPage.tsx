import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import tenantApi, { Tenant } from "../../api/tenantApi";
import userApi from "../../api/userApi";

const TenantsPage = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [adminFormErrors, setAdminFormErrors] = useState<Record<string, string>>({});
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    slug: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: "",
    code: "",
    slug: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    status: "ACTIVE",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await tenantApi.getAll();

      if (!res || !res.data) {
        throw new Error("Invalid response from server");
      }

      setTenants(res.data.results || res.data || []);
    } catch (err: any) {
      console.error("Tenants fetch error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách tenants";
      setError(errorMessage);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tenant: Tenant | null = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name || "",
        code: tenant.code || "",
        slug: tenant.slug || "",
        address: tenant.address || "",
        phone: tenant.phone || "",
        email: tenant.email || "",
        is_active: tenant.is_active !== undefined ? tenant.is_active : true,
        status: tenant.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: "",
        code: "",
        slug: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
        status: "ACTIVE",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTenant(null);
    setFormData({
      name: "",
      code: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
      status: "ACTIVE",
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Tên tenant không được để trống";
    }

    if (!formData.code.trim()) {
      errors.code = "Mã tenant không được để trống";
    } else if (!/^[A-Z0-9]+$/.test(formData.code.toUpperCase())) {
      errors.code = "Mã tenant chỉ chứa chữ in hoa và số";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug không được để trống";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = "Slug chỉ chứa chữ thường, số và dấu gạch ngang";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingTenant) {
        await tenantApi.update(editingTenant.id, formData);
      } else {
        await tenantApi.create(formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      console.error("Save error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Lỗi khi lưu tenant";
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tenantApi.delete(id);
      await fetchData();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error("Delete error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Lỗi khi xóa tenant";
      alert(errorMessage);
    }
  };

  const toggleActive = async (tenant: Tenant) => {
    try {
      await tenantApi.update(tenant.id, { is_active: !tenant.is_active });
      await fetchData();
    } catch (err: any) {
      console.error("Toggle error", err);
      alert(err?.response?.data?.detail || "Lỗi khi cập nhật trạng thái");
    }
  };

  // Navigate to tenant users page
  const handleViewUsers = (tenantId: string) => {
    navigate(`/admin/tenants/${tenantId}/users`);
  };

  // Open admin creation modal
  const handleOpenAdminModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setAdminFormData({
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
    });
    setAdminFormErrors({});
    setShowAdminModal(true);
  };

  // Close admin modal
  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
    setSelectedTenant(null);
    setAdminFormData({
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
    });
    setAdminFormErrors({});
  };

  // Handle admin form input change
  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminFormData({
      ...adminFormData,
      [name]: value,
    });
  };

  // Validate admin form
  const validateAdminForm = () => {
    const errors: Record<string, string> = {};

    if (!adminFormData.username.trim()) {
      errors.username = "Tên đăng nhập không được để trống";
    }
    if (!adminFormData.password.trim()) {
      errors.password = "Mật khẩu không được để trống";
    } else if (adminFormData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit admin creation
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAdminForm() || !selectedTenant) return;

    setAdminSubmitting(true);
    try {
      await userApi.createTenantAdmin({
        tenant_id: Number(selectedTenant.id),
        username: adminFormData.username,
        password: adminFormData.password,
        email: adminFormData.email,
        first_name: adminFormData.first_name,
        last_name: adminFormData.last_name,
      });
      alert(`Tạo tài khoản "${adminFormData.username}" thành công!`);
      handleCloseAdminModal();
    } catch (err: any) {
      console.error("Create admin error", err);
      const errorMessage = err?.response?.data?.detail || "Lỗi khi tạo tài khoản admin";
      alert(errorMessage);
    } finally {
      setAdminSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 dark:text-gray-400">Chỉ Super Admin mới có quyền quản lý tenants.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchData} className="mt-2 text-red-600 hover:underline">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400">Danh sách các công ty/tenant trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Tổng số tenants</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tenants.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600">{tenants.filter(t => t.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Bị vô hiệu</p>
          <p className="text-2xl font-bold text-red-600">{tenants.filter(t => !t.is_active).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Chưa có tenant nào
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{tenant.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">{tenant.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{tenant.slug}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewUsers(tenant.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {tenant.user_count || 0} users
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(tenant)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        tenant.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {tenant.is_active ? "Hoạt động" : "Bị vô hiệu"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewUsers(tenant.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Xem Users
                    </button>
                    <button
                      onClick={() => handleOpenAdminModal(tenant)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                    >
                      Tạo Admin
                    </button>
                    <button
                      onClick={() => handleOpenModal(tenant)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tenant.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingTenant ? "Sửa Tenant" : "Thêm Tenant mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên Tenant *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Công ty ABC"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mã Tenant *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 ${
                    formErrors.code ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="CONGTYABC"
                />
                {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 ${
                    formErrors.slug ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="cong-ty-abc"
                />
                {formErrors.slug && <p className="text-red-500 text-sm mt-1">{formErrors.slug}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="0912 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="contact@congtyabc.com"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Hoạt động
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTenant ? "Lưu" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Xác nhận xóa</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa tenant này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showAdminModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Tạo tài khoản Admin cho "{selectedTenant.name}"
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  name="username"
                  value={adminFormData.username}
                  onChange={handleAdminInputChange}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 ${
                    adminFormErrors.username ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="admin_abc"
                />
                {adminFormErrors.username && <p className="text-red-500 text-sm mt-1">{adminFormErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  value={adminFormData.password}
                  onChange={handleAdminInputChange}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 ${
                    adminFormErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="********"
                />
                {adminFormErrors.password && <p className="text-red-500 text-sm mt-1">{adminFormErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminFormData.email}
                  onChange={handleAdminInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="admin@congtyabc.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Họ
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={adminFormData.first_name}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Nguyễn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={adminFormData.last_name}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Văn A"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Tài khoản này sẽ có quyền <strong>Tenant Admin</strong> và thuộc về tenant "{selectedTenant.name}".
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAdminModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={adminSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  disabled={adminSubmitting}
                >
                  {adminSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
