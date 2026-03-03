import axiosClient from "./axiosClient";

const userApi = {
  getAll() {
    return axiosClient.get("accounts/");
  },
  getById(id: number | string) {
    return axiosClient.get(`accounts/${id}/`);
  },
  create(data: any) {
    return axiosClient.post("accounts/", data);
  },
  update(id: number | string, data: any) {
    return axiosClient.put(`accounts/${id}/`, data);
  },
  delete(id: number | string) {
    return axiosClient.delete(`accounts/${id}/`);
  },
  getKhachHang() {
    return axiosClient.get("khachhang/");
  },

  getProfile() {
    return axiosClient.get("users/update-profile/");
  },

  updateProfile(data: any) {
    return axiosClient.put("users/update-profile/", data);
  },

  changePassword(data: any) {
    return axiosClient.post("users/change-password/", data);
  },

  uploadAvatar(formData: FormData) {
    return axiosClient.post("users/upload-avatar/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Tạo tài khoản tenant_admin (Super Admin only)
  createTenantAdmin(data: {
    tenant_id: number;
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }) {
    return axiosClient.post("users/create-tenant-admin/", data);
  },
};

export default userApi;

