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

  // Simulate payment trong development mode (KHÔNG TỐN PHÍ)
  simulatePayment(id) {
    return axiosClient.post(`payment/${id}/simulate/`);
  },
};

export default paymentApi;

