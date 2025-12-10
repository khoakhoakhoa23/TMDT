import axiosClient from "./axiosClient";

const userApi = {
  getAll() {
    return axiosClient.get("khachhang/");
  },
};

export default userApi;



