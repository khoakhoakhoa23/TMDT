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

  getMe() {
    // API mới trả về đầy đủ user + avatar
    return axiosClient.get("users/me/");
  },

  refreshToken(refreshToken) {
    return axiosClient.post("refresh/", {
      refresh: refreshToken,
    });
  },

  googleLogin(token) {
    return axiosClient.post("google-login/", {
      token: token,
    });
  },

  facebookLogin(token) {
    return axiosClient.post("facebook-login/", {
      token: token,
    });
  },

  requestPasswordReset(email) {
    return axiosClient.post("users/request-password-reset/", {
      email: email,
    });
  },

  resetPassword(token, newPassword, confirmPassword) {
    return axiosClient.post("users/reset-password/", {
      token: token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },
};

export default authApi;
