import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",  // ⚡ NÊN thêm /api/ ở đây
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

export default axiosClient;
