import axiosClient from "./axiosClient";

const invoiceApi = {
  // ==================== HÓA ĐƠN NHẬP ====================

  /**
   * Lấy danh sách hóa đơn nhập
   * GET /api/hoadonnhap/
   */
  getImportInvoices() {
    return axiosClient.get("hoadonnhap/");
  },

  /**
   * Tạo hóa đơn nhập mới
   * POST /api/hoadonnhap/
   * Body: { ma_hdn: "HDN001", ngay_nhap: "2025-01-15", nhan_vien: 1, ncc: 1 }
   */
  createImportInvoice(data) {
    return axiosClient.post("hoadonnhap/", data);
  },

  /**
   * Lấy chi tiết hóa đơn nhập
   * GET /api/hoadonnhap/{ma_hdn}/
   */
  getImportInvoice(ma_hdn) {
    return axiosClient.get(`hoadonnhap/${ma_hdn}/`);
  },

  /**
   * Cập nhật hóa đơn nhập
   * PUT /api/hoadonnhap/{ma_hdn}/
   */
  updateImportInvoice(ma_hdn, data) {
    return axiosClient.put(`hoadonnhap/${ma_hdn}/`, data);
  },

  /**
   * Xóa hóa đơn nhập
   * DELETE /api/hoadonnhap/{ma_hdn}/
   */
  deleteImportInvoice(ma_hdn) {
    return axiosClient.delete(`hoadonnhap/${ma_hdn}/`);
  },

  // ==================== CHI TIẾT HÓA ĐƠN NHẬP ====================

  /**
   * Lấy danh sách chi tiết hóa đơn nhập
   * GET /api/chitiethdn/
   */
  getImportInvoiceDetails() {
    return axiosClient.get("chitiethdn/");
  },

  /**
   * Thêm chi tiết vào hóa đơn nhập (tự động tăng số lượng xe)
   * POST /api/chitiethdn/
   * Body: { hoa_don: "HDN001", xe: "X001", so_luong: 5, don_gia: 1000000 }
   */
  addImportInvoiceDetail(data) {
    return axiosClient.post("chitiethdn/", data);
  },

  /**
   * Cập nhật chi tiết hóa đơn nhập
   * PUT /api/chitiethdn/{id}/
   */
  updateImportInvoiceDetail(id, data) {
    return axiosClient.put(`chitiethdn/${id}/`, data);
  },

  /**
   * Xóa chi tiết hóa đơn nhập
   * DELETE /api/chitiethdn/{id}/
   */
  deleteImportInvoiceDetail(id) {
    return axiosClient.delete(`chitiethdn/${id}/`);
  },

  // ==================== HÓA ĐƠN XUẤT ====================

  /**
   * Lấy danh sách hóa đơn xuất
   * GET /api/hoadonxuat/
   */
  getExportInvoices() {
    return axiosClient.get("hoadonxuat/");
  },

  /**
   * Tạo hóa đơn xuất mới
   * POST /api/hoadonxuat/
   * Body: { ma_hdx: "HDX001", ngay: "2025-01-15", nhan_vien: 1, khach_hang: 1 }
   */
  createExportInvoice(data) {
    return axiosClient.post("hoadonxuat/", data);
  },

  /**
   * Lấy chi tiết hóa đơn xuất
   * GET /api/hoadonxuat/{ma_hdx}/
   */
  getExportInvoice(ma_hdx) {
    return axiosClient.get(`hoadonxuat/${ma_hdx}/`);
  },

  /**
   * Cập nhật hóa đơn xuất
   * PUT /api/hoadonxuat/{ma_hdx}/
   */
  updateExportInvoice(ma_hdx, data) {
    return axiosClient.put(`hoadonxuat/${ma_hdx}/`, data);
  },

  /**
   * Xóa hóa đơn xuất
   * DELETE /api/hoadonxuat/{ma_hdx}/
   */
  deleteExportInvoice(ma_hdx) {
    return axiosClient.delete(`hoadonxuat/${ma_hdx}/`);
  },

  // ==================== CHI TIẾT HÓA ĐƠN XUẤT ====================

  /**
   * Lấy danh sách chi tiết hóa đơn xuất
   * GET /api/chitiethdx/
   */
  getExportInvoiceDetails() {
    return axiosClient.get("chitiethdx/");
  },

  /**
   * Thêm chi tiết vào hóa đơn xuất (tự động giảm số lượng xe)
   * POST /api/chitiethdx/
   * Body: { hoa_don: "HDX001", xe: "X001", so_luong: 2 }
   */
  addExportInvoiceDetail(data) {
    return axiosClient.post("chitiethdx/", data);
  },

  /**
   * Cập nhật chi tiết hóa đơn xuất
   * PUT /api/chitiethdx/{id}/
   */
  updateExportInvoiceDetail(id, data) {
    return axiosClient.put(`chitiethdx/${id}/`, data);
  },

  /**
   * Xóa chi tiết hóa đơn xuất
   * DELETE /api/chitiethdx/{id}/
   */
  deleteExportInvoiceDetail(id) {
    return axiosClient.delete(`chitiethdx/${id}/`);
  },
};

export default invoiceApi;
