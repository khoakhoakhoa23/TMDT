import axiosClient from "./axiosClient";

const wishlistApi = {
  /**
   * Lấy tất cả sản phẩm trong wishlist
   * GET /api/wishlist/
   * 
   * Response: {
   *   results: [
   *     {
   *       id: 1,
   *       car: {
   *         ma_xe: "X001",
   *         ten_xe: "Koenigsegg",
   *         loai_xe: { ten_loai: "Sport" },
   *         gia_thue: 800000,
   *         image_url: "..."
   *       },
   *       added_at: "2025-12-15T10:00:00Z"
   *     }
   *   ]
   * }
   */
  getAll() {
    return axiosClient.get("wishlist/");
  },

  /**
   * Thêm sản phẩm vào wishlist
   * POST /api/wishlist/
   * Body: { car_id: "X001" }
   */
  async add(car) {
    const carId = car.ma_xe || car.id;
    const response = await axiosClient.post("wishlist/", { car_id: carId });
    // Dispatch event để các component khác biết wishlist đã thay đổi
    window.dispatchEvent(new Event("wishlistUpdated"));
    return response;
  },

  /**
   * Xóa sản phẩm khỏi wishlist
   * DELETE /api/wishlist/{id}/
   */
  async remove(id) {
    const response = await axiosClient.delete(`wishlist/${id}/`);
    // Dispatch event để các component khác biết wishlist đã thay đổi
    window.dispatchEvent(new Event("wishlistUpdated"));
    return response;
  },

  /**
   * Kiểm tra sản phẩm có trong wishlist không
   * GET /api/wishlist/check/?car_id=X001
   */
  check(carId) {
    return axiosClient.get("wishlist/check/", { params: { car_id: carId } });
  },
  
  /**
   * Xóa sản phẩm khỏi wishlist bằng car_id
   * POST /api/wishlist/remove-by-car/
   * Body: { car_id: "X001" }
   */
  async removeByCarId(carId) {
    const response = await axiosClient.post("wishlist/remove-by-car/", { car_id: carId });
    // Dispatch event để các component khác biết wishlist đã thay đổi
    window.dispatchEvent(new Event("wishlistUpdated"));
    return response;
  },
};

export default wishlistApi;

