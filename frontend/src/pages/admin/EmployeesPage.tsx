import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import tenantApi from "../../api/tenantApi";

interface Employee {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  status: string;
  status_display: string;
  avatar_url: string | null;
  date_joined: string;
}

const EmployeesPage = () => {
  const { isTenantOwner, isTenantAdmin, isEmployee, isSuperAdmin, tenantId } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchEmployees();
    }
  }, [tenantId, pagination.page, search, roleFilter]);

  const fetchEmployees = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError("");
      
      const res = await tenantApi.getUsers(tenantId, {
        page: pagination.page,
        page_size: pagination.page_size,
        role: roleFilter || undefined,
        search: search || undefined,
      });
      
      if (res && res.data) {
        // Lọc chỉ lấy EMPLOYEE và TENANT_ADMIN (không lấy CUSTOMER)
        const users = (res.data.results || []).filter(
          (u: Employee) => u.role === "EMPLOYEE" || u.role === "TENANT_ADMIN"
        );
        setEmployees(users);
        setPagination(prev => ({
          ...prev,
          total: res.data.count || 0,
        }));
      }
    } catch (err: any) {
      console.error("Fetch employees error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách nhân viên";
      setError(errorMessage);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee: Employee | null = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        username: employee.username,
        email: employee.email || "",
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        password: "",
        role: employee.role,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "EMPLOYEE",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = "Tên đăng nhập là bắt buộc";
    }
    
    if (!editingEmployee && !formData.password) {
      errors.password = "Mật khẩu là bắt buộc";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !tenantId) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      if (editingEmployee) {
        // Update existing employee
        const updateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await tenantApi.updateUser(tenantId, editingEmployee.id, updateData);
        setSuccess("Cập nhật nhân viên thành công!");
      } else {
        // Create new employee
        await tenantApi.createUser(tenantId, {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password,
          role: formData.role,
        });
        setSuccess("Thêm nhân viên thành công!");
      }
      
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      console.error("Submit error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Thao tác thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !tenantId) return;
    
    try {
      setSubmitting(true);
      setError("");
      
      await tenantApi.deleteUser(tenantId, deleteConfirm.id);
      setSuccess("Xóa nhân viên thành công!");
      setDeleteConfirm(null);
      fetchEmployees();
    } catch (err: any) {
      console.error("Delete error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Xóa thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    if (!tenantId) return;
    
    try {
      setError("");
      const newStatus = employee.is_active ? "inactive" : "active";
      await tenantApi.updateUser(tenantId, employee.id, { status: newStatus });
      setSuccess(`Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} nhân viên`);
      fetchEmployees();
    } catch (err: any) {
      console.error("Toggle status error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Thao tác thất bại";
      setError(errorMessage);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "TENANT_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "EMPLOYEE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "TENANT_ADMIN":
        return "Quản trị viên";
      case "EMPLOYEE":
        return "Nhân viên";
      default:
        return role;
    }
  };

  // Check permissions
  if (!isTenantOwner && !isTenantAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Truy cập bị từ chối</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn không có quyền truy cập trang này. Chỉ có TENANT_ADMIN mới có thể quản lý nhân viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
              Quản lý nhân viên
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Quản lý tài khoản nhân viên và quản trị viên trong công ty
            </p>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm nhân viên
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, email..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            <option value="">Tất cả vai trò</option>
            <option value="TENANT_ADMIN">Quản trị viên</option>
            <option value="EMPLOYEE">Nhân viên</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Chưa có nhân viên nào</p>
              <button
                onClick={() => handleOpenModal(null)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Thêm nhân viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {member.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={member.avatar_url} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-300 font-medium">
                                  {(member.first_name || member.username || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.first_name || member.last_name 
                                ? `${member.first_name} ${member.last_name}`.trim() 
                                : member.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{member.username} • {member.email || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {member.is_active ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.date_joined ? new Date(member.date_joined).toLocaleDateString("vi-VN") : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(member)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Sửa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`${member.is_active ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"} dark:text-green-400 dark:hover:text-green-300`}
                            title={member.is_active ? "Khóa" : "Kích hoạt"}
                          >
                            {member.is_active ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(member)}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Xóa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.total > pagination.page_size && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {(pagination.page - 1) * pagination.page_size + 1} - {Math.min(pagination.page * pagination.page_size, pagination.total)} của {pagination.total}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.page_size >= pagination.total}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingEmployee ? "Sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.username ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formErrors.username && <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Họ
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="EMPLOYEE">Nhân viên</option>
                    <option value="TENANT_ADMIN">Quản trị viên</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu {editingEmployee && "(để trống nếu không đổi)"}
                    {!editingEmployee && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {submitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingEmployee ? "Lưu" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
                Xác nhận xóa
              </h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Bạn có chắc chắn muốn xóa nhân viên <strong>@{deleteConfirm.username}</strong>? Hành động này không thể hoàn tác.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
