import axiosClient from "./axiosClient";

const cartApi = {
  getCart() {
    return axiosClient.get("cart/");
  },

  addItem(carId, quantity = 1) {
    console.log("[cartApi.addItem] Calling API with:", { carId, quantity });
    return axiosClient.post("cart-item/", {
      xe_id: carId,
      quantity,
    }).then(response => {
      console.log("[cartApi.addItem] Success:", response.data);
      return response;
    }).catch(error => {
      console.error("[cartApi.addItem] Error:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });
      throw error;
    });
  },

  updateItem(itemId, quantity) {
    return axiosClient.patch(`cart-item/${itemId}/`, { quantity });
  },

  removeItem(itemId) {
    return axiosClient.delete(`cart-item/${itemId}/`);
  },

  clearCart() {
    return axiosClient.delete("cart/");
  },
};

export default cartApi;

