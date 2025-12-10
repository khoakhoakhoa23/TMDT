import axiosClient from "./axiosClient";

const reviewApi = {
  getAll(params) {
    return axiosClient.get("review/", { params });
  },

  getById(id) {
    return axiosClient.get(`review/${id}/`);
  },

  getByCarId(carId) {
    return axiosClient.get("review/", { params: { xe_id: carId } });
  },

  create(data) {
    return axiosClient.post("review/", data);
  },

  update(id, data) {
    return axiosClient.put(`review/${id}/`, data);
  },

  delete(id) {
    return axiosClient.delete(`review/${id}/`);
  },
};

export default reviewApi;

