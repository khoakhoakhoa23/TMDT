import axiosClient from "./axiosClient";

const cartApi = {
  getCart() {
    return axiosClient.get("cart/");
  },

  addItem(carId, quantity = 1) {
    return axiosClient.post("cart-item/", {
      xe: carId,
      quantity,
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

