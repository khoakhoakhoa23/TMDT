import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import locationApi from "../../api/locationApi";

interface Location {
  id: number;
  ten_dia_diem: string;
  dia_chi_chi_tiet: string;
  trang_thai: boolean;
  created_at: string;
  updated_at: string;
}

const LocationsPage = () => {
  const { isTenantAdmin, isAdmin, isSuperAdmin } = useAuth();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    ten_dia_diem: "",
    dia_chi_chi_tiet: "",
    trang_thai: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await locationApi.getAll();
      if (res && res.data) {
        setLocations(res.data.results || res.data || []);
      }
    } catch (err: any) {
      console.error("Fetch locations error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách địa điểm";
      setError(errorMessage);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (location: Location | null = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        ten_dia_diem: location.ten_dia_diem || "",
        dia_chi_chi_tiet: location.dia_chi_chi_tiet || "",
        trang_thai: location.trang_thai !== false,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        ten_dia_diem: "",
        dia_chi_chi_tiet: "",
        trang_thai: true,
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.ten_dia_diem.trim()) {
      errors.ten_dia_diem = "Tên địa điểm là bắt buộc";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      if (editingLocation) {
        await locationApi.update(editingLocation.id, formData);
        setSuccess("Cập nhật địa điểm thành công!");
      } else {
        await locationApi.create(formData);
        setSuccess("Thêm địa điểm thành công!");
      }
      
      setShowModal(false);
      fetchLocations();
    } catch (err: any) {
      console.error("Submit error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Thao tác thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      setSubmitting(true);
      setError("");
      
      await locationApi.delete(deleteConfirm.id);
      setSuccess("Xóa địa điểm thành công!");
      setDeleteConfirm(null);
      fetchLocations();
    } catch (err: any) {
      console.error("Delete error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Xóa thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (location: Location) => {
    try {
      setError("");
      await locationApi.update(location.id, { 
        ...location, 
        trang_thai: !location.trang_thai 
      });
      setSuccess(`Đã ${!location.trang_thai ? "kích hoạt" : "vô hiệu hóa"} địa điểm`);
      fetchLocations();
    } catch (err: any) {
      console.error("Toggle status error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Thao tác thất bại";
      setError(errorMessage);
    }
  };

  // Check permissions - cho phép cả admin và staff
  if (!isAdmin && !isSuperAdmin) {
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
            Bạn không có quyền truy cập trang này.
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
              Quản lý địa điểm
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Quản lý các địa điểm nhận/trả xe
            </p>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm địa điểm
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

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Chưa có địa điểm nào</p>
              <button
                onClick={() => handleOpenModal(null)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Thêm địa điểm đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tên địa điểm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Địa chỉ chi tiết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {location.ten_dia_diem}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {location.dia_chi_chi_tiet || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.trang_thai 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {location.trang_thai ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(location)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Sửa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(location)}
                            className={`${location.trang_thai ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"} dark:text-green-400 dark:hover:text-green-300`}
                            title={location.trang_thai ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {location.trang_thai ? (
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
                            onClick={() => setDeleteConfirm(location)}
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingLocation ? "Sửa địa điểm" : "Thêm địa điểm mới"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên địa điểm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ten_dia_diem}
                    onChange={(e) => setFormData({ ...formData, ten_dia_diem: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.ten_dia_diem ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ví dụ: Công ty ABC - Chi nhánh 1"
                  />
                  {formErrors.ten_dia_diem && <p className="text-red-500 text-sm mt-1">{formErrors.ten_dia_diem}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <textarea
                    value={formData.dia_chi_chi_tiet}
                    onChange={(e) => setFormData({ ...formData, dia_chi_chi_tiet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trang_thai"
                    checked={formData.trang_thai}
                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="trang_thai" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Hoạt động
                  </label>
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
                  {editingLocation ? "Lưu" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Bạn có chắc chắn muốn xóa địa điểm <strong>{deleteConfirm.ten_dia_diem}</strong>?
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

export default LocationsPage;
