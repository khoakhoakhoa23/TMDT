import axios, { AxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_PATHS = ["xe/", "loaixe/", "blog/", "location/"];

axiosClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!token) {
      let sessionKey = localStorage.getItem("session_key");
      if (!sessionKey) {
        sessionKey =
          "guest_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substring(2, 15);
        localStorage.setItem("session_key", sessionKey);
      }
      if (!config.headers) config.headers = {};
      (config.headers as Record<string, string>)["X-Session-Key"] =
        sessionKey;
    }

    if (import.meta.env.MODE === "development") {
      console.log("[Axios] Request to:", config.url);
      console.log("[Axios] Has token:", !!token);
      console.log(
        "[Axios] Headers:",
        JSON.stringify(config.headers, null, 2),
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const isPublic = PUBLIC_PATHS.some((p) =>
      (originalRequest?.url || "").startsWith(p),
    );

    if (error.response?.status === 429) {
      const retryAfter =
        error.response?.headers?.["retry-after"] ||
        error.response?.data?.detail?.match(/\d+/)?.[0] ||
        60;
      console.warn(
        `Request throttled. Retry after ${retryAfter} seconds.`,
      );

      if (typeof window !== "undefined" && (window as any).alert) {
        if (!(window as any)._throttleWarningShown) {
          (window as any)._throttleWarningShown = true;
          setTimeout(() => {
            (window as any)._throttleWarningShown = false;
          }, 5000);
          console.warn(
            "API request bị giới hạn. Vui lòng đợi một chút và thử lại.",
          );
        }
      }

      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(
          `${API_BASE_URL}refresh/`,
          { refresh: refreshToken },
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);
        if (!originalRequest.headers)
          originalRequest.headers = {};
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        if (isPublic) {
          if (originalRequest.headers) {
            delete (originalRequest.headers as any).Authorization;
          }
          return axiosClient(originalRequest);
        }

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;

