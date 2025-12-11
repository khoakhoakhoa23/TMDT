import axiosClient from "./axiosClient";

const userApi = {
  getAll() {
    // Lấy danh sách tài khoản User (Django auth User)
    return axiosClient.get("accounts/");
  },
  getById(id) {
    return axiosClient.get(`accounts/${id}/`);
  },
  create(data) {
    return axiosClient.post("accounts/", data);
  },
  update(id, data) {
    return axiosClient.put(`accounts/${id}/`, data);
  },
  delete(id) {
    return axiosClient.delete(`accounts/${id}/`);
  },
  getKhachHang() {
    // Lấy danh sách khách hàng (nếu cần)
    return axiosClient.get("khachhang/");
  },
};

export default userApi;



