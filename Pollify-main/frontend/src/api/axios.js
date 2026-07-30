import axios from "axios";

// VITE_API_URL may be either the API host (https://api.example.com) or the
// complete API path (https://api.example.com/api). Supporting both prevents
// accidental requests to /api/api after deployment.
const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";
const API_URL = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pollhub_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pollhub_token");
      localStorage.removeItem("pollhub_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
