import axiosClient from "./axiosClient";

const paymentApi = {
  createPayment(orderId, paymentMethod, returnUrl) {
    return axiosClient.post("payment/create/", {
      order_id: orderId,
      payment_method: paymentMethod,
      return_url: returnUrl,
    });
  },

  getPaymentById(id) {
    return axiosClient.get(`payment/${id}/`);
  },

  checkStatus(id) {
    return axiosClient.get(`payment/${id}/status/`);
  },

  getAll() {
    return axiosClient.get("payment/");
  },
};

export default paymentApi;

