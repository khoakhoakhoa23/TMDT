import axiosClient from "./axiosClient";

const orderApi = {
  getAll() {
    return axiosClient.get("order/");
  },

  getById(id) {
    return axiosClient.get(`order/${id}/`);
  },

  create(data) {
    return axiosClient.post("order/", data);
  },

  checkout(orderId, paymentData) {
    return axiosClient.post("checkout/", {
      order_id: orderId,
      ...paymentData,
    });
  },

  getMyOrders() {
    return axiosClient.get("order/");
  },

  updateStatus(id, status) {
    return axiosClient.patch(`order/${id}/`, { status });
  },

  update(id, data) {
    return axiosClient.put(`order/${id}/`, data);
  },

  patch(id, data) {
    return axiosClient.patch(`order/${id}/`, data);
  },
};

export default orderApi;

