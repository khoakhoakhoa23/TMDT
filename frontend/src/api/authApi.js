import axiosClient from "./axiosClient";

const authApi = {
  register(data) {
    return axiosClient.post("register/", data);
  },

  login(data) {
    return axiosClient.post("login/", data);
  },

  getUserRole() {
    return axiosClient.get("me/");
  },

  refreshToken(refreshToken) {
    return axiosClient.post("refresh/", {
      refresh: refreshToken,
    });
  }
};

export default authApi;
