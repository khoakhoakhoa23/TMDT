import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_PATHS = [
  "xe/",
  "loaixe/",
  "blog/",
  "location/",
];

// Tự động gắn token vào request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug: Log token để kiểm tra
    if (process.env.NODE_ENV === "development") {
      console.log("[Axios] Request to:", config.url);
      console.log("[Axios] Has token:", !!token);
      if (token) {
        console.log("[Axios] Token (first 20 chars):", token.substring(0, 20) + "...");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý token refresh khi nhận 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublic = PUBLIC_PATHS.some((p) =>
      (originalRequest?.url || "").startsWith(p)
    );

    // Xử lý lỗi 429 (Throttled)
    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.["retry-after"] || error.response?.data?.detail?.match(/\d+/)?.[0] || 60;
      console.warn(`Request throttled. Retry after ${retryAfter} seconds.`);
      
      // Hiển thị thông báo cho user (nếu có thể)
      if (typeof window !== "undefined" && window.alert) {
        // Chỉ hiển thị một lần để tránh spam
        if (!window._throttleWarningShown) {
          window._throttleWarningShown = true;
          setTimeout(() => {
            window._throttleWarningShown = false;
          }, 5000);
          console.warn("API request bị giới hạn. Vui lòng đợi một chút và thử lại.");
        }
      }
      
      // Không retry tự động, để component tự xử lý
      return Promise.reject(error);
    }

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(
          `${API_BASE_URL}refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token hết hạn hoặc lỗi. Nếu là request public, thử lại không token.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        if (isPublic) {
          delete originalRequest.headers?.Authorization;
          return axiosClient(originalRequest);
        }

        // Với request cần bảo vệ, redirect về login
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
