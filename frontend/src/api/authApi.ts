import axiosClient from "./axiosClient";

const authApi = {
  register(data: any) {
    return axiosClient.post("register/", data);
  },

  login(data: any) {
    return axiosClient.post("login/", data);
  },

  getUserRole() {
    return axiosClient.get("me/");
  },

  getMe() {
    return axiosClient.get("users/me/");
  },

  refreshToken(refreshToken: string) {
    return axiosClient.post("refresh/", {
      refresh: refreshToken,
    });
  },

  googleLogin(token: string) {
    return axiosClient.post("google-login/", {
      token,
    });
  },

  facebookLogin(token: string) {
    return axiosClient.post("facebook-login/", {
      token,
    });
  },

  requestPasswordReset(email: string) {
    return axiosClient.post("users/request-password-reset/", {
      email,
    });
  },

  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    return axiosClient.post("users/reset-password/", {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },
};

export default authApi;

