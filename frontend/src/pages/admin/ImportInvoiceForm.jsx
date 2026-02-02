import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import invoiceApi from "../../api/invoiceApi";
import { toast } from "react-toastify";

const ImportInvoiceForm = () => {
  const { ma_hdn } = useParams();
  const navigate = useNavigate();
  const isEditing = !!ma_hdn;

  const [formData, setFormData] = useState({
    ma_hdn: "",
    ngay_nhap: new Date().toISOString().split('T')[0],
    nhan_vien: "",
    ncc: ""
  });

  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadInvoice();
    }
  }, [ma_hdn]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getImportInvoice(ma_hdn);
      const invoice = response.data;

      setFormData({
        ma_hdn: invoice.ma_hdn,
        ngay_nhap: invoice.ngay_nhap,
        nhan_vien: invoice.nhan_vien,
        ncc: invoice.ncc
      });

      // Load chi tiết
      const detailsResponse = await invoiceApi.getImportInvoiceDetails();
      const invoiceDetails = detailsResponse.data.results?.filter(
        detail => detail.hoa_don === ma_hdn
      ) || detailsResponse.data.filter(
        detail => detail.hoa_don === ma_hdn
      );
      setDetails(invoiceDetails.map(detail => ({
        id: detail.id,
        xe: detail.xe?.ma_xe || detail.xe,
        so_luong: detail.so_luong,
        don_gia: detail.don_gia
      })));
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Không thể tải hóa đơn");
      navigate("/dashboard/import-invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDetail = () => {
    setDetails(prev => [...prev, {
      xe: "",
      so_luong: 1,
      don_gia: 0
    }]);
  };

  const updateDetail = (index, field, value) => {
    setDetails(prev => prev.map((detail, i) =>
      i === index ? { ...detail, [field]: value } : detail
    ));
  };

  const removeDetail = (index) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ma_hdn.trim()) {
      toast.error("Vui lòng nhập mã hóa đơn");
      return;
    }

    if (details.length === 0) {
      toast.error("Vui lòng thêm ít nhất một chi tiết xe");
      return;
    }

    try {
      setSaving(true);

      // Tạo/cập nhật hóa đơn
      const invoiceData = {
        ma_hdn: formData.ma_hdn,
        ngay_nhap: formData.ngay_nhap,
        nhan_vien: formData.nhan_vien || null,
        ncc: formData.ncc || null
      };

      if (isEditing) {
        await invoiceApi.updateImportInvoice(ma_hdn, invoiceData);
      } else {
        await invoiceApi.createImportInvoice(invoiceData);
      }

      // Xử lý chi tiết
      for (const detail of details) {
        if (!detail.xe || detail.so_luong <= 0 || detail.don_gia < 0) {
          toast.error("Vui lòng điền đầy đủ thông tin chi tiết");
          return;
        }

        const detailData = {
          hoa_don: formData.ma_hdn,
          xe: detail.xe,
          so_luong: parseInt(detail.so_luong),
          don_gia: parseFloat(detail.don_gia)
        };

        if (detail.id) {
          // Update existing detail
          await invoiceApi.updateImportInvoiceDetail(detail.id, detailData);
        } else {
          // Create new detail (this will auto-increase inventory)
          await invoiceApi.addImportInvoiceDetail(detailData);
        }
      }

      toast.success(isEditing ? "Cập nhật hóa đơn thành công" : "Tạo hóa đơn thành công");
      navigate("/dashboard/import-invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Không thể lưu hóa đơn");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditing ? "Chỉnh sửa" : "Tạo"} Hóa Đơn Nhập
        </h1>
        <button
        onClick={() => navigate("/dashboard/import-invoices")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaTimes className="mr-2" />
          Hủy
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã Hóa Đơn *
            </label>
            <input
              type="text"
              name="ma_hdn"
              value={formData.ma_hdn}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày Nhập *
            </label>
            <input
              type="date"
              name="ngay_nhap"
              value={formData.ngay_nhap}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhân Viên
            </label>
            <input
              type="text"
              name="nhan_vien"
              value={formData.nhan_vien}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ID nhân viên"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhà Cung Cấp
            </label>
            <input
              type="text"
              name="ncc"
              value={formData.ncc}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ID nhà cung cấp"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chi Tiết Xe Nhập</h2>
            <button
              type="button"
              onClick={addDetail}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <FaPlus className="mr-2" />
              Thêm Xe
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Mã Xe</th>
                  <th className="px-4 py-2 text-center">Số Lượng</th>
                  <th className="px-4 py-2 text-right">Đơn Giá (VNĐ)</th>
                  <th className="px-4 py-2 text-right">Thành Tiền</th>
                  <th className="px-4 py-2 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={detail.xe}
                        onChange={(e) => updateDetail(index, 'xe', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder="VD: X001"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={detail.so_luong}
                        onChange={(e) => updateDetail(index, 'so_luong', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={detail.don_gia}
                        onChange={(e) => updateDetail(index, 'don_gia', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        required
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        (detail.don_gia || 0) * (detail.so_luong || 0)
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeDetail(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Chưa có xe nào. Nhấn "Thêm Xe" để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/admin/import-invoices")}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <FaSave className="mr-2" />
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportInvoiceForm;
