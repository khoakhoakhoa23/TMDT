import { useEffect, useState } from "react";
import carApi from "../../api/carApi";

const ProductsPage = () => {
  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    ma_xe: "",
    ten_xe: "",
    slug: "",
    gia: "",
    gia_khuyen_mai: "",
    gia_thue: "",
    so_luong: "",
    mau_sac: "",
    loai_xe: "",
    mo_ta_ngan: "",
    mo_ta: "",
    trang_thai: "in_stock",
    image_url: "",
    image_file: null,
    dung_tich_nhien_lieu: 70,
    hop_so: "manual",
    so_cho: 2,
    loai_nhien_lieu: "gasoline",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Loại xe states
  const [showCarTypeModal, setShowCarTypeModal] = useState(false);
  const [editingCarType, setEditingCarType] = useState(null);
  const [carTypes, setCarTypes] = useState([]);
  const [carTypesLoading, setCarTypesLoading] = useState(false);
  const [carTypeFormData, setCarTypeFormData] = useState({
    ma_loai: "",
    ten_loai: "",
  });
  const [carTypeFormErrors, setCarTypeFormErrors] = useState({});
  const [deleteCarTypeConfirm, setDeleteCarTypeConfirm] = useState(null);

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchCarTypes();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await carApi.getAll();
      
      if (!res || !res.data) {
        throw new Error("Invalid response from server");
      }
      
      setCars(res.data.results || res.data || []);
    } catch (err) {
      console.error("Cars fetch error", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Không tải được danh sách xe";
      setError(errorMessage);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await carApi.getCategories();
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error("Categories fetch error", err);
    }
  };

  const fetchCarTypes = async () => {
    try {
      setCarTypesLoading(true);
      const res = await carApi.getAllCarTypes();
      if (res && res.data) {
        setCarTypes(res.data.results || res.data || []);
      } else {
        setCarTypes([]);
      }
    } catch (err) {
      console.error("Car types fetch error", err);
      setCarTypes([]);
      // Không hiển thị lỗi nếu chỉ là lỗi permission (403) hoặc không có quyền
      if (err?.response?.status !== 403 && err?.response?.status !== 401) {
        console.warn("Không thể tải danh sách loại xe:", err?.response?.data?.detail || err?.message);
      }
    } finally {
      setCarTypesLoading(false);
    }
  };

  const handleOpenModal = (car = null) => {
    // Đóng modal loại xe nếu đang mở
    if (showCarTypeModal) {
      setShowCarTypeModal(false);
      setEditingCarType(null);
      setCarTypeFormData({ ma_loai: "", ten_loai: "" });
      setCarTypeFormErrors({});
    }
    
    if (car) {
      setEditingCar(car);
      setFormData({
        ma_xe: car.ma_xe || "",
        ten_xe: car.ten_xe || "",
        slug: car.slug || "",
        gia: car.gia || "",
        gia_khuyen_mai: car.gia_khuyen_mai || "",
        gia_thue: car.gia_thue || "",
        so_luong: car.so_luong || "",
        mau_sac: car.mau_sac || "",
        loai_xe: car.loai_xe || car.loai_xe_detail?.ma_loai || "",
        mo_ta_ngan: car.mo_ta_ngan || "",
        mo_ta: car.mo_ta || "",
        trang_thai: car.trang_thai || "in_stock",
        image_url: car.image_url || "",
        image_file: null,
        dung_tich_nhien_lieu: car.dung_tich_nhien_lieu || 70,
        hop_so: car.hop_so || "manual",
        so_cho: car.so_cho || 2,
        loai_nhien_lieu: car.loai_nhien_lieu || "gasoline",
        seo_title: car.seo_title || "",
        seo_description: car.seo_description || "",
        seo_keywords: car.seo_keywords || "",
      });
      setImagePreview(car.image_url || null);
    } else {
      setEditingCar(null);
      setFormData({
        ma_xe: "",
        ten_xe: "",
        slug: "",
        gia: "",
        gia_khuyen_mai: "",
        gia_thue: "",
        so_luong: "",
        mau_sac: "",
        loai_xe: "",
        mo_ta_ngan: "",
        mo_ta: "",
        trang_thai: "in_stock",
        image_url: "",
        image_file: null,
        dung_tich_nhien_lieu: 70,
        hop_so: "manual",
        so_cho: 2,
        loai_nhien_lieu: "gasoline",
        seo_title: "",
        seo_description: "",
        seo_keywords: "",
      });
      setImagePreview(null);
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCar(null);
    setFormData({
      ma_xe: "",
      ten_xe: "",
      slug: "",
      gia: "",
      gia_khuyen_mai: "",
      gia_thue: "",
      so_luong: "",
      mau_sac: "",
      loai_xe: "",
      mo_ta_ngan: "",
      mo_ta: "",
      trang_thai: "in_stock",
      image_url: "",
      image_file: null,
      dung_tich_nhien_lieu: 70,
      hop_so: "manual",
      so_cho: 2,
      loai_nhien_lieu: "gasoline",
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
    });
    setFormErrors({});
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const generateSlug = (text) => {
    if (!text) return "";
    let slug = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Đảm bảo slug không rỗng
    if (!slug) {
      slug = `car-${Date.now()}`;
    }
    
    return slug;
  };

  const handleTenXeChange = (e) => {
    const tenXe = e.target.value;
    setFormData({
      ...formData,
      ten_xe: tenXe,
      slug: !editingCar ? generateSlug(tenXe) : formData.slug,
    });
    handleInputChange(e);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.ma_xe || !formData.ma_xe.trim()) {
      errors.ma_xe = "Mã xe là bắt buộc";
    }
    if (!formData.ten_xe || !formData.ten_xe.trim()) {
      errors.ten_xe = "Tên xe là bắt buộc";
    }
    if (!formData.gia || formData.gia === "" || parseInt(formData.gia) <= 0) {
      errors.gia = "Giá phải lớn hơn 0";
    }
    if (!formData.gia_thue || formData.gia_thue === "" || parseInt(formData.gia_thue) <= 0) {
      errors.gia_thue = "Giá thuê phải lớn hơn 0";
    }
    if (formData.so_luong === "" || formData.so_luong === null || formData.so_luong === undefined || parseInt(formData.so_luong) < 0) {
      errors.so_luong = "Số lượng phải >= 0";
    }
    if (!formData.loai_xe || formData.loai_xe === "") {
      errors.loai_xe = "Loại xe là bắt buộc";
    }
    if (!formData.mau_sac || !formData.mau_sac.trim()) {
      errors.mau_sac = "Màu sắc là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = { ...formData };
      
      // Đảm bảo slug được tạo nếu chưa có
      if (!submitData.slug || submitData.slug.trim() === "") {
        if (submitData.ten_xe) {
          submitData.slug = generateSlug(submitData.ten_xe);
          // Thêm timestamp để đảm bảo unique
          if (!editingCar) {
            submitData.slug = `${submitData.slug}-${Date.now()}`;
          }
        } else {
          throw new Error("Tên xe là bắt buộc để tạo slug");
        }
      } else {
        // Đảm bảo slug hợp lệ
        submitData.slug = generateSlug(submitData.slug) || generateSlug(submitData.ten_xe);
        if (!editingCar && submitData.slug) {
          submitData.slug = `${submitData.slug}-${Date.now()}`;
        }
      }
      
      // Đảm bảo các field có default value được set
      if (!submitData.trang_thai) {
        submitData.trang_thai = "in_stock";
      }
      if (!submitData.hop_so) {
        submitData.hop_so = "manual";
      }
      if (!submitData.loai_nhien_lieu) {
        submitData.loai_nhien_lieu = "gasoline";
      }
      
      // Chuyển đổi số - đảm bảo không phải NaN
      submitData.gia = parseInt(submitData.gia);
      submitData.gia_thue = parseInt(submitData.gia_thue);
      submitData.so_luong = parseInt(submitData.so_luong);
      submitData.so_cho = parseInt(submitData.so_cho) || 2;
      submitData.dung_tich_nhien_lieu = parseInt(submitData.dung_tich_nhien_lieu) || 70;
      
      // Validate các số không được NaN hoặc <= 0
      if (isNaN(submitData.gia) || submitData.gia <= 0) {
        throw new Error("Giá phải là số lớn hơn 0");
      }
      if (isNaN(submitData.gia_thue) || submitData.gia_thue <= 0) {
        throw new Error("Giá thuê phải là số lớn hơn 0");
      }
      if (isNaN(submitData.so_luong) || submitData.so_luong < 0) {
        throw new Error("Số lượng phải là số >= 0");
      }
      
      if (submitData.gia_khuyen_mai && submitData.gia_khuyen_mai !== "") {
        submitData.gia_khuyen_mai = parseInt(submitData.gia_khuyen_mai);
        if (isNaN(submitData.gia_khuyen_mai)) {
          delete submitData.gia_khuyen_mai;
        }
      } else {
        delete submitData.gia_khuyen_mai;
      }

      // Xóa các field rỗng hoặc null, nhưng giữ lại các field bắt buộc
      const requiredFields = ['ma_xe', 'ten_xe', 'slug', 'gia', 'gia_thue', 'so_luong', 'mau_sac', 'loai_xe', 'trang_thai', 'dung_tich_nhien_lieu', 'hop_so', 'so_cho', 'loai_nhien_lieu'];
      Object.keys(submitData).forEach((key) => {
        // Không xóa field bắt buộc
        if (requiredFields.includes(key)) {
          return;
        }
        // Xóa field rỗng hoặc null
        if (submitData[key] === "" || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });
      
      // Xóa image_file nếu không có file được chọn
      if (!submitData.image_file || !(submitData.image_file instanceof File)) {
        delete submitData.image_file;
      }
      
      // Xóa image_url nếu không có giá trị
      if (!submitData.image_url || submitData.image_url.trim() === "") {
        delete submitData.image_url;
      }

      console.log("Submitting data:", submitData); // Debug log

      if (editingCar) {
        await carApi.update(editingCar.ma_xe, submitData);
      } else {
        await carApi.create(submitData);
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error("Save car error", err);
      console.error("Error response:", err?.response?.data); // Debug log
      const errorData = err?.response?.data || {};
      const errors = {};
      
      Object.keys(errorData).forEach((key) => {
        if (Array.isArray(errorData[key])) {
          errors[key] = errorData[key][0];
        } else if (typeof errorData[key] === "string") {
          errors[key] = errorData[key];
        } else if (typeof errorData[key] === "object") {
          // Xử lý nested errors
          errors[key] = JSON.stringify(errorData[key]);
        }
      });
      
      if (errorData.detail) {
        errors.general = errorData.detail;
      }
      
      // Nếu không có error cụ thể, hiển thị message chung
      if (Object.keys(errors).length === 0) {
        errors.general = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu xe";
      }
      
      setFormErrors(errors);
    }
  };

  const handleDelete = async (car) => {
    try {
      await carApi.delete(car.ma_xe);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error("Delete car error", err);
      alert(err?.response?.data?.detail || "Không thể xóa xe");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải xe...</p>
        </div>
      </div>
    );
  }
  
  if (error && cars.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 font-semibold">Lỗi: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sản phẩm (Xe)</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">{cars.length} xe</span>
          <button
            onClick={async () => {
              // Đóng modal thêm xe nếu đang mở
              if (showModal) {
                handleCloseModal();
              }
              
              setCarTypeFormData({ ma_loai: "", ten_loai: "" });
              setEditingCarType(null);
              setCarTypeFormErrors({});
              setShowCarTypeModal(true);
              // Đảm bảo load lại danh sách khi mở modal
              await fetchCarTypes();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Loại xe</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm xe</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border overflow-x-auto max-w-full">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên xe</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Loại</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Giá thuê (VND)</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Số lượng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Chưa có xe
                </td>
              </tr>
            ) : (
              cars.map((car) => (
                <tr key={car.ma_xe || car.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{car.ten_xe || "N/A"}</div>
                    {car.ma_xe && (
                      <div className="text-xs text-gray-500">ID: {car.ma_xe}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {car.loai_xe?.ten_loai || car.loai_xe_detail?.ten_loai || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    {car.gia_thue || car.gia_khuyen_mai || car.gia
                      ? `${(car.gia_thue || car.gia_khuyen_mai || car.gia).toLocaleString("vi-VN")} VNĐ`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {car.so_luong || 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        car.trang_thai === "in_stock" || car.so_luong > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {car.trang_thai === "in_stock" || car.so_luong > 0 ? "Còn xe" : "Hết xe"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(car)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(car)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa xe */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Đóng modal khi click vào overlay
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingCar ? "Sửa xe" : "Thêm xe mới"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{formErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã xe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ma_xe"
                      value={formData.ma_xe}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.ma_xe ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      disabled={!!editingCar}
                    />
                    {formErrors.ma_xe && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.ma_xe}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên xe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ten_xe"
                      value={formData.ten_xe}
                      onChange={handleTenXeChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.ten_xe ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    {formErrors.ten_xe && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.ten_xe}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="gia"
                      value={formData.gia}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.gia ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      min="0"
                    />
                    {formErrors.gia && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.gia}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá khuyến mãi (VNĐ)
                    </label>
                    <input
                      type="number"
                      name="gia_khuyen_mai"
                      value={formData.gia_khuyen_mai}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá thuê/ngày (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="gia_thue"
                      value={formData.gia_thue}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.gia_thue ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      min="0"
                    />
                    {formErrors.gia_thue && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.gia_thue}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="so_luong"
                      value={formData.so_luong}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.so_luong ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      min="0"
                    />
                    {formErrors.so_luong && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.so_luong}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mau_sac"
                      value={formData.mau_sac}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.mau_sac ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    {formErrors.mau_sac && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.mau_sac}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại xe <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="loai_xe"
                      value={formData.loai_xe}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.loai_xe ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Chọn loại xe</option>
                      {categories.map((cat) => (
                        <option key={cat.ma_loai} value={cat.ma_loai}>
                          {cat.ten_loai}
                        </option>
                      ))}
                    </select>
                    {formErrors.loai_xe && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.loai_xe}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số chỗ ngồi
                    </label>
                    <input
                      type="number"
                      name="so_cho"
                      value={formData.so_cho}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hộp số
                    </label>
                    <select
                      name="hop_so"
                      value={formData.hop_so}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Số sàn</option>
                      <option value="automatic">Số tự động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại nhiên liệu
                    </label>
                    <select
                      name="loai_nhien_lieu"
                      value={formData.loai_nhien_lieu}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gasoline">Xăng</option>
                      <option value="electric">Điện</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dung tích nhiên liệu (L)
                  </label>
                  <input
                    type="number"
                    name="dung_tich_nhien_lieu"
                    value={formData.dung_tich_nhien_lieu}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả ngắn
                  </label>
                  <textarea
                    name="mo_ta_ngan"
                    value={formData.mo_ta_ngan}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    name="mo_ta"
                    value={formData.mo_ta}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL ảnh
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload ảnh
                    </label>
                    <input
                      type="file"
                      name="image_file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xem trước
                    </label>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="trang_thai"
                    value={formData.trang_thai}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in_stock">Còn hàng</option>
                    <option value="out_of_stock">Hết hàng</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCar ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn xóa xe <strong>{deleteConfirm.ten_xe}</strong>? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
        </div>
      )}

      {/* Modal quản lý loại xe */}
      {showCarTypeModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Đóng modal khi click vào overlay
            if (e.target === e.currentTarget) {
              setShowCarTypeModal(false);
              setEditingCarType(null);
              setCarTypeFormData({ ma_loai: "", ten_loai: "" });
              setCarTypeFormErrors({});
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Quản lý Loại xe</h2>
                <button
                  onClick={() => {
                    setShowCarTypeModal(false);
                    setEditingCarType(null);
                    setCarTypeFormData({ ma_loai: "", ten_loai: "" });
                    setCarTypeFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form thêm/sửa loại xe */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {editingCarType ? "Sửa loại xe" : "Thêm loại xe mới"}
                </h3>
                
                {carTypeFormErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-sm">{carTypeFormErrors.general}</p>
                  </div>
                )}
                
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const errors = {};
                    if (!carTypeFormData.ma_loai.trim()) {
                      errors.ma_loai = "Mã loại là bắt buộc";
                    }
                    if (!carTypeFormData.ten_loai.trim()) {
                      errors.ten_loai = "Tên loại là bắt buộc";
                    }
                    setCarTypeFormErrors(errors);
                    if (Object.keys(errors).length > 0) return;

                    try {
                      if (editingCarType) {
                        await carApi.updateCarType(editingCarType.ma_loai, carTypeFormData);
                      } else {
                        await carApi.createCarType(carTypeFormData);
                      }
                      setCarTypeFormData({ ma_loai: "", ten_loai: "" });
                      setEditingCarType(null);
                      setCarTypeFormErrors({});
                      await fetchCarTypes();
                      await fetchCategories(); // Refresh categories cho dropdown
                    } catch (err) {
                      console.error("Save car type error", err);
                      const errorData = err?.response?.data || {};
                      const formErrors = {};
                      
                      // Xử lý lỗi từ backend
                      if (errorData.detail) {
                        formErrors.general = errorData.detail;
                      }
                      
                      Object.keys(errorData).forEach((key) => {
                        if (key !== 'detail') {
                          if (Array.isArray(errorData[key])) {
                            formErrors[key] = errorData[key][0];
                          } else if (typeof errorData[key] === "string") {
                            formErrors[key] = errorData[key];
                          }
                        }
                      });
                      
                      setCarTypeFormErrors(formErrors);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã loại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={carTypeFormData.ma_loai}
                        onChange={(e) => {
                          setCarTypeFormData({ ...carTypeFormData, ma_loai: e.target.value });
                          if (carTypeFormErrors.ma_loai) {
                            setCarTypeFormErrors({ ...carTypeFormErrors, ma_loai: "" });
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          carTypeFormErrors.ma_loai ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={!!editingCarType}
                        required
                      />
                      {carTypeFormErrors.ma_loai && (
                        <p className="text-red-500 text-xs mt-1">{carTypeFormErrors.ma_loai}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên loại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={carTypeFormData.ten_loai}
                        onChange={(e) => {
                          setCarTypeFormData({ ...carTypeFormData, ten_loai: e.target.value });
                          if (carTypeFormErrors.ten_loai) {
                            setCarTypeFormErrors({ ...carTypeFormErrors, ten_loai: "" });
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          carTypeFormErrors.ten_loai ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {carTypeFormErrors.ten_loai && (
                        <p className="text-red-500 text-xs mt-1">{carTypeFormErrors.ten_loai}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    {editingCarType && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCarType(null);
                          setCarTypeFormData({ ma_loai: "", ten_loai: "" });
                          setCarTypeFormErrors({});
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingCarType ? "Cập nhật" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách loại xe */}
              <div className="bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 p-4 border-b">Danh sách loại xe</h3>
                <div className="overflow-x-auto">
                  {carTypesLoading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mb-2"></div>
                      <p className="text-gray-600 text-sm">Đang tải...</p>
                    </div>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã loại</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên loại</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carTypes.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                              Chưa có loại xe
                            </td>
                          </tr>
                        ) : (
                          carTypes.map((carType) => (
                          <tr key={carType.ma_loai} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-800">
                              {carType.ma_loai}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{carType.ten_loai}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingCarType(carType);
                                    setCarTypeFormData({
                                      ma_loai: carType.ma_loai,
                                      ten_loai: carType.ten_loai,
                                    });
                                    setCarTypeFormErrors({});
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Sửa"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteCarTypeConfirm(carType)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Xóa"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa loại xe */}
      {deleteCarTypeConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteCarTypeConfirm(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn xóa loại xe <strong>{deleteCarTypeConfirm.ten_loai}</strong>? 
                Hành động này không thể hoàn tác và có thể ảnh hưởng đến các xe đang sử dụng loại này.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteCarTypeConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    try {
                      await carApi.deleteCarType(deleteCarTypeConfirm.ma_loai);
                      setDeleteCarTypeConfirm(null);
                      await fetchCarTypes();
                      await fetchCategories(); // Refresh categories
                    } catch (err) {
                      console.error("Delete car type error", err);
                      const errorMsg = err?.response?.data?.detail || 
                                     err?.response?.data?.message || 
                                     "Không thể xóa loại xe. Có thể đang có xe sử dụng loại này.";
                      alert(errorMsg);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default ProductsPage;
