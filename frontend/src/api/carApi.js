import axiosClient from "./axiosClient";

const carApi = {
  getAll(params) {
    return axiosClient.get("xe/", { params });
  },

  getById(id) {
    return axiosClient.get(`xe/${id}/`);
  },

  getCategories() {
    return axiosClient.get("loaixe/");
  },

  search(query) {
    return axiosClient.get("xe/", { params: { search: query } });
  },
};

export default carApi;

