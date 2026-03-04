import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import carApi from "../../api/carApi";

interface CarType {
  ma_loai: string;
  ten_loai: string;
}

const CarTypesPage = () => {
  const { isTenantAdmin, isAdmin, isSuperAdmin } = useAuth();
  
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCarType, setEditingCarType] = useState<CarType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CarType | null>(null);
  const [formData, setFormData] = useState({
    ma_loai: "",
    ten_loai: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCarTypes();
  }, []);

  const fetchCarTypes = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await carApi.getAllCarTypes();
      if (res && res.data) {
        setCarTypes(res.data.results || res.data || []);
      }
    } catch (err: any) {
      console.error("Fetch car types error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách loại xe";
      setError(errorMessage);
      setCarTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (carType: CarType | null = null) => {
    if (carType) {
      setEditingCarType(carType);
      setFormData({
        ma_loai: carType.ma_loai || "",
        ten_loai: carType.ten_loai || "",
      });
    } else {
      setEditingCarType(null);
      setFormData({
        ma_loai: "",
        ten_loai: "",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.ma_loai.trim()) {
      errors.ma_loai = "Mã loại xe là bắt buộc";
    } else if (!/^[A-Z0-9_]+$/.test(formData.ma_loai)) {
      errors.ma_loai = "Mã loại xe chỉ được chứa chữ hoa, số và dấu gạch dưới";
    }
    
    if (!formData.ten_loai.trim()) {
      errors.ten_loai = "Tên loại xe là bắt buộc";
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
      
      const data = {
        ma_loai: formData.ma_loai.toUpperCase(),
        ten_loai: formData.ten_loai,
      };
      
      if (editingCarType) {
        await carApi.updateCarType(editingCarType.ma_loai, data);
        setSuccess("Cập nhật loại xe thành công!");
      } else {
        await carApi.createCarType(data);
        setSuccess("Thêm loại xe thành công!");
      }
      
      setShowModal(false);
      fetchCarTypes();
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
      
      await carApi.deleteCarType(deleteConfirm.ma_loai);
      setSuccess("Xóa loại xe thành công!");
      setDeleteConfirm(null);
      fetchCarTypes();
    } catch (err: any) {
      console.error("Delete error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Xóa thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
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
              Quản lý loại xe
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Quản lý các loại xe trong hệ thống
            </p>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm loại xe
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
          ) : carTypes.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Chưa có loại xe nào</p>
              <button
                onClick={() => handleOpenModal(null)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Thêm loại xe đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mã loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tên loại xe
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {carTypes.map((carType) => (
                    <tr key={carType.ma_loai} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                              {carType.ma_loai}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {carType.ten_loai}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(carType)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Sửa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(carType)}
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
                {editingCarType ? "Sửa loại xe" : "Thêm loại xe mới"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã loại xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ma_loai}
                    onChange={(e) => setFormData({ ...formData, ma_loai: e.target.value.toUpperCase() })}
                    disabled={!!editingCarType}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      editingCarType ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed" : ""
                    } ${formErrors.ma_loai ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Ví dụ: SEDAN, SUV, PICKUP"
                  />
                  {formErrors.ma_loai && <p className="text-red-500 text-sm mt-1">{formErrors.ma_loai}</p>}
                  {!editingCarType && (
                    <p className="text-xs text-gray-500 mt-1">Mã loại xe duy nhất, viết hoa, không dấu</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên loại xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ten_loai}
                    onChange={(e) => setFormData({ ...formData, ten_loai: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.ten_loai ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ví dụ: Xe Sedan, Xe SUV, Xe bán tải"
                  />
                  {formErrors.ten_loai && <p className="text-red-500 text-sm mt-1">{formErrors.ten_loai}</p>}
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
                  {editingCarType ? "Lưu" : "Thêm"}
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
                Bạn có chắc chắn muốn xóa loại xe <strong>{deleteConfirm.ten_loai}</strong>?
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

export default CarTypesPage;
