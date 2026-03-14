import axios from "axios";

// const BASE_URL = "http://localhost:5000/api";

const BASE_URL = "https://be-pasta.onrender.com/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động thêm Token vào mỗi request
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý dữ liệu trả về
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data; // Trả về cục data sạch
    }
    return response;
  },
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw error;
  },
);

export default axiosClient;
