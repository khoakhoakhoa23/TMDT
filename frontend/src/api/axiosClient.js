import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn token vào request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý token refresh khi nhận 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/api/refresh/",
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token hết hạn, xóa tokens và redirect về login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
