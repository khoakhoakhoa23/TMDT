import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import invoiceApi from "../../api/invoiceApi";
import { toast } from "react-toastify";

const ImportInvoiceForm = () => {
  const { ma_hdn } = useParams();
  const navigate = useNavigate();
  const isEditing = !!ma_hdn;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      ma_hdn: "",
      ngay_nhap: new Date().toISOString().split('T')[0],
      nhan_vien: "",
      ncc: "",
      details: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details"
  });

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

      reset({
        ma_hdn: invoice.ma_hdn,
        ngay_nhap: invoice.ngay_nhap,
        nhan_vien: invoice.nhan_vien,
        ncc: invoice.ncc,
        details: []
      });

      const detailsResponse = await invoiceApi.getImportInvoiceDetails();
      const detailsData = detailsResponse.data;
      const detailsList = Array.isArray(detailsData) ? detailsData : (detailsData?.results ?? []);
      const invoiceDetails = detailsList.filter(
        (detail: { hoa_don?: string }) => detail.hoa_don === ma_hdn
      );

      invoiceDetails.forEach(detail => {
        const xeObj = detail.xe_detail || detail.xe;
        append({
          id: detail.id,
          xe: xeObj?.ma_xe || xeObj,
          so_luong: detail.so_luong,
          don_gia: detail.don_gia
        });
      });
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Không thể tải hóa đơn");
      navigate("/dashboard/import-invoices");
    } finally {
      setLoading(false);
    }
  };

  const addDetail = () => {
    append({
      xe: "",
      so_luong: 1,
      don_gia: 0
    });
  };

  const onSubmit = async (data) => {
    if (!data.ma_hdn.trim()) {
      toast.error("Vui lòng nhập mã hóa đơn");
      return;
    }

    if (data.details.length === 0) {
      toast.error("Vui lòng thêm ít nhất một chi tiết xe");
      return;
    }

    try {
      setSaving(true);

      const invoiceData = {
        ma_hdn: data.ma_hdn,
        ngay_nhap: data.ngay_nhap,
        nhan_vien: data.nhan_vien || null,
        ncc: data.ncc || null
      };

      if (isEditing) {
        await invoiceApi.updateImportInvoice(ma_hdn, invoiceData);
      } else {
        await invoiceApi.createImportInvoice(invoiceData);
      }

      for (const detail of data.details) {
        if (!detail.xe || detail.so_luong <= 0 || detail.don_gia < 0) {
          toast.error("Vui lòng điền đầy đủ thông tin chi tiết");
          setSaving(false);
          return;
        }

        const detailData = {
          hoa_don: data.ma_hdn,
          xe: detail.xe,
          so_luong: parseInt(detail.so_luong),
          don_gia: parseFloat(detail.don_gia)
        };

        if (detail.id) {
          await invoiceApi.updateImportInvoiceDetail(detail.id, detailData);
        } else {
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã Hóa Đơn *
            </label>
            <input
              type="text"
              {...register("ma_hdn", { required: "Mã hóa đơn là bắt buộc" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isEditing}
            />
            {errors.ma_hdn && <p className="text-red-500 text-xs mt-1">{errors.ma_hdn.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày Nhập *
            </label>
            <input
              type="date"
              {...register("ngay_nhap", { required: "Ngày nhập là bắt buộc" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhân Viên
            </label>
            <input
              type="text"
              {...register("nhan_vien")}
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
              {...register("ncc")}
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
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        {...register(`details.${index}.xe`)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder="VD: X001"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        {...register(`details.${index}.so_luong`)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        {...register(`details.${index}.don_gia`)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        (field.don_gia || 0) * (field.so_luong || 0)
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
