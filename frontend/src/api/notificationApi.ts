import axiosClient from "./axiosClient";

const notificationApi = {
  /**
   * Lấy tất cả thông báo
   * GET /api/notifications/
   * 
   * Response: {
   *   results: [
   *     {
   *       id: 1,
   *       type: "rental_expiry" | "payment_success" | "order_status" | "system",
   *       title: "Tiêu đề thông báo",
   *       message: "Nội dung thông báo",
   *       read: false,
   *       created_at: "2025-12-15T10:00:00Z",
   *       order_id: 123 (optional)
   *     }
   *   ]
   * }
   */
  getAll() {
    // Kết nối với API thật
    return axiosClient.get("notifications/");
  },

  /**
   * Đánh dấu thông báo đã đọc
   * PATCH /api/notifications/{id}/read/
   */
  markAsRead(id) {
    // Kết nối với API thật
    return axiosClient.patch(`notifications/${id}/read/`);
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * POST /api/notifications/mark-all-read/
   */
  markAllAsRead() {
    // Kết nối với API thật
    return axiosClient.post("notifications/mark-all-read/");
  },

  /**
   * Xóa thông báo
   * DELETE /api/notifications/{id}/
   */
  delete(id) {
    // TODO: Thay thế bằng API thật
    // return axiosClient.delete(`notifications/${id}/`);
    
    return Promise.resolve({ data: { success: true } });
  },
};

export default notificationApi;

