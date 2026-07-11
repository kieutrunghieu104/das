import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("das_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const hasServerMessage = Boolean(error.response?.data?.message);
    const isTransientGet =
      config?.method?.toLowerCase() === "get" &&
      !config.__retried &&
      (!error.response || [502, 503, 504].includes(status) || (status === 500 && !hasServerMessage));

    if (isTransientGet) {
      config.__retried = true;
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return api.request(config);
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (Array.isArray(data?.details) && data.details[0]?.message) {
    const field = data.details[0]?.path?.join?.(".");
    return field ? `${field}: ${data.details[0].message}` : data.details[0].message;
  }

  if (error.code === "ECONNABORTED") return "Máy chủ phản hồi quá chậm. Vui lòng thử lại.";
  if (error.message === "Network Error") return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra API và MongoDB.";
  if (status >= 500 && !data?.message) return "Hệ thống đang tạm gián đoạn. Vui lòng thử lại sau vài giây.";

  return data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
