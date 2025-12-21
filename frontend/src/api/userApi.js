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
  
  // Profile APIs
  getProfile() {
    // Lấy thông tin profile của user hiện tại
    return axiosClient.get("users/update-profile/");
  },
  
  updateProfile(data) {
    // Cập nhật thông tin profile
    return axiosClient.put("users/update-profile/", data);
  },
  
  changePassword(data) {
    // Đổi mật khẩu
    return axiosClient.post("users/change-password/", data);
  },
  
  uploadAvatar(formData) {
    // Upload avatar
    return axiosClient.post("users/upload-avatar/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default userApi;



