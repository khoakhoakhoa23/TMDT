import axiosClient from "./axiosClient";

const locationApi = {
  getAll() {
    return axiosClient.get("location/");
  },

  getById(id) {
    return axiosClient.get(`location/${id}/`);
  },

  create(data) {
    return axiosClient.post("location/", data);
  },

  update(id, data) {
    return axiosClient.put(`location/${id}/`, data);
  },

  delete(id) {
    return axiosClient.delete(`location/${id}/`);
  },
};

export default locationApi;

