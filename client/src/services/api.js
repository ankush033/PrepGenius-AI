import axios from "axios";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "https://prepgenius-ai-9146.onrender.com")
  .trim().replace(/\/+$/, "").replace(/(?:\/api)+$/i, "");

const api = axios.create({
  baseURL: `${configuredApiUrl}/api`,
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && localStorage.getItem("token")) {
    window.dispatchEvent(new Event("auth:unauthorized"));
  }
  return Promise.reject(error);
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
