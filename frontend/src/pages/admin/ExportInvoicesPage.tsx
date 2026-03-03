import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaEye, FaFileExport } from "react-icons/fa";
import invoiceApi from "../../api/invoiceApi";
import { toast } from "react-toastify";

const ExportInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [details, setDetails] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoiceApi.getExportInvoices();
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setInvoices(list);
    } catch (error: unknown) {
      console.error("Error loading export invoices:", error);
      const msg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Không thể tải danh sách hóa đơn xuất. Vui lòng đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    try {
      // Lấy chi tiết hóa đơn
      const detailsResponse = await invoiceApi.getExportInvoiceDetails();
      const detailsData = detailsResponse.data;
      const detailsList = Array.isArray(detailsData) ? detailsData : (detailsData?.results ?? []);
      const invoiceDetails = detailsList.filter(
        (detail: { hoa_don?: string }) => detail.hoa_don === invoice.ma_hdx
      );
      setDetails(invoiceDetails);
    } catch (error) {
      console.error("Error loading invoice details:", error);
      toast.error("Không thể tải chi tiết hóa đơn");
    }
    setShowModal(true);
  };

  const handleDelete = async (ma_hdx) => {
    if (!window.confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;

    try {
      await invoiceApi.deleteExportInvoice(ma_hdx);
      toast.success("Xóa hóa đơn thành công");
      loadInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Không thể xóa hóa đơn");
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
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaFileExport className="mr-3 text-green-600" />
          Quản lý Hóa Đơn Xuất
        </h1>
        <Link
          to="/dashboard/export-invoices/create"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" />
          Tạo Hóa Đơn Xuất
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã HĐ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày Xuất
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhân Viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách Hàng
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Chưa có hóa đơn xuất nào
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.ma_hdx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.ma_hdx}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.ngay).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.nhan_vien_name || invoice.nhan_vien || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.khach_hang_name || invoice.khach_hang || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(invoice)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Xem chi tiết"
                    >
                      <FaEye />
                    </button>
                    <Link
                      to={`/dashboard/export-invoices/edit/${invoice.ma_hdx}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      onClick={() => handleDelete(invoice.ma_hdx)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết hóa đơn */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Chi Tiết Hóa Đơn Xuất: {selectedInvoice.ma_hdx}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p><strong>Ngày xuất:</strong> {new Date(selectedInvoice.ngay).toLocaleDateString('vi-VN')}</p>
                <p><strong>Nhân viên:</strong> {selectedInvoice.nhan_vien_name || selectedInvoice.nhan_vien || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Khách hàng:</strong> {selectedInvoice.khach_hang_name || selectedInvoice.khach_hang || 'N/A'}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3">Danh sách xe xuất:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Tên xe</th>
                    <th className="px-4 py-2 text-center">Số lượng</th>
                    <th className="px-4 py-2 text-center">Đơn vị tính</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{detail.xe_detail?.ten_xe || detail.xe?.ten_xe || 'N/A'}</td>
                      <td className="px-4 py-2 text-center">{detail.so_luong}</td>
                      <td className="px-4 py-2 text-center">chiếc</td>
                    </tr>
                  ))}
                  {details.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                        Chưa có chi tiết nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportInvoicesPage;
