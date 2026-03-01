import { useState } from "react";
import locationApi from "../api/locationApi";

const AddLocationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    ten_dia_diem: "",
    dia_chi_chi_tiet: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error khi user nhập
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.ten_dia_diem.trim()) {
      setError("Vui lòng nhập tên địa điểm");
      return;
    }

    setLoading(true);
    try {
      await locationApi.create({
        ten_dia_diem: formData.ten_dia_diem.trim(),
        dia_chi_chi_tiet: formData.dia_chi_chi_tiet.trim(),
        trang_thai: true,
      });

      setSuccess("Thêm địa điểm thành công!");
      
      // Reset form
      setFormData({
        ten_dia_diem: "",
        dia_chi_chi_tiet: "",
      });

      // Callback để refresh danh sách
      if (onSuccess) {
        onSuccess();
      }

      // Đóng modal sau 1.5 giây
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Error adding location:", err);
      const errorMessage =
        err?.response?.data?.ten_dia_diem?.[0] ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Không thể thêm địa điểm. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        ten_dia_diem: "",
        dia_chi_chi_tiet: "",
      });
      setError("");
      setSuccess("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
            Thêm địa điểm đón nhận - trả xe
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Tên địa điểm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ten_dia_diem"
                value={formData.ten_dia_diem}
                onChange={handleChange}
                placeholder="Ví dụ: Hà Nội, Hồ Chí Minh, Đà Nẵng..."
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Địa chỉ chi tiết
              </label>
              <textarea
                name="dia_chi_chi_tiet"
                value={formData.dia_chi_chi_tiet}
                onChange={handleChange}
                placeholder="Nhập địa chỉ chi tiết (tùy chọn)"
                rows={3}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.ten_dia_diem.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang thêm...
                </>
              ) : (
                "Thêm địa điểm"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;

