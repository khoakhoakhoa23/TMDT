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
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // return axiosClient.get("wishlist/");
    
    // Tạm thời lấy từ localStorage
    try {
      const wishlistData = localStorage.getItem("wishlist");
      if (wishlistData) {
        const items = JSON.parse(wishlistData);
        return Promise.resolve({
          data: {
            results: items,
          },
        });
      }
    } catch (error) {
      console.error("Error reading wishlist from localStorage:", error);
    }
    
    // Nếu không có trong localStorage, trả về mảng rỗng
    return Promise.resolve({
      data: {
        results: [],
      },
    });
  },

  /**
   * Thêm sản phẩm vào wishlist
   * POST /api/wishlist/
   * Body: { car_id: "X001" }
   */
  add(car) {
    // TODO: Thay thế bằng API thật
    // return axiosClient.post("wishlist/", { car_id: car.ma_xe || car.id });
    
    // Tạm thời lưu vào localStorage
    try {
      const wishlistData = localStorage.getItem("wishlist");
      let items = wishlistData ? JSON.parse(wishlistData) : [];
      
      // Kiểm tra xem xe đã có trong wishlist chưa
      const carId = car.ma_xe || car.id;
      const exists = items.some(item => {
        const itemCarId = item.car?.ma_xe || item.car?.id || item.ma_xe || item.id;
        return itemCarId === carId;
      });
      
      if (!exists) {
        const newItem = {
          id: Date.now(),
          car: car,
          added_at: new Date().toISOString(),
        };
        items.push(newItem);
        localStorage.setItem("wishlist", JSON.stringify(items));
        // Dispatch custom event để các component khác biết wishlist đã thay đổi
        window.dispatchEvent(new Event("wishlistUpdated"));
        return Promise.resolve({
          data: newItem,
        });
      } else {
        return Promise.resolve({
          data: { message: "Đã có trong wishlist" },
        });
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return Promise.reject(error);
    }
  },

  /**
   * Xóa sản phẩm khỏi wishlist
   * DELETE /api/wishlist/{id}/
   */
  remove(id) {
    // TODO: Thay thế bằng API thật
    // return axiosClient.delete(`wishlist/${id}/`);
    
    // Tạm thời xóa từ localStorage
    try {
      const wishlistData = localStorage.getItem("wishlist");
      if (wishlistData) {
        let items = JSON.parse(wishlistData);
        items = items.filter(item => item.id !== id);
        localStorage.setItem("wishlist", JSON.stringify(items));
        // Dispatch custom event để các component khác biết wishlist đã thay đổi
        window.dispatchEvent(new Event("wishlistUpdated"));
      }
      return Promise.resolve({ data: { success: true } });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return Promise.reject(error);
    }
  },

  /**
   * Kiểm tra sản phẩm có trong wishlist không
   * GET /api/wishlist/check/?car_id=X001
   */
  check(carId) {
    // TODO: Thay thế bằng API thật
    // return axiosClient.get("wishlist/check/", { params: { car_id: carId } });
    
    // Tạm thời kiểm tra từ localStorage
    try {
      const wishlistData = localStorage.getItem("wishlist");
      if (wishlistData) {
        const items = JSON.parse(wishlistData);
        const exists = items.some(item => {
          const itemCarId = item.car?.ma_xe || item.car?.id || item.ma_xe || item.id;
          return itemCarId === carId;
        });
        return Promise.resolve({
          data: {
            in_wishlist: exists,
          },
        });
      }
      return Promise.resolve({
        data: {
          in_wishlist: false,
        },
      });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      return Promise.resolve({
        data: {
          in_wishlist: false,
        },
      });
    }
  },
};

export default wishlistApi;

