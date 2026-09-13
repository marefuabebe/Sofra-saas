import axios from "axios";
import { getErrorMessage } from "../utils/errorHandler";

export { getErrorMessage };

// Default live Render backend if VITE_API_URL is omitted or stale
const DEFAULT_PROD_BACKEND = "https://sofra-backend-hvhu.onrender.com";

let rawBaseUrl = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? DEFAULT_PROD_BACKEND : "")
).trim().replace(/\/+$/, "");

if (rawBaseUrl === "https://sofra-backend.onrender.com") {
  rawBaseUrl = DEFAULT_PROD_BACKEND;
}

const baseURL = rawBaseUrl
  ? (rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`)
  : "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle global errors and format friendly error descriptions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const friendly = getErrorMessage(error);
    if (error && typeof error === "object") {
      error.friendlyMessage = friendly;
    }
    return Promise.reject(error);
  }
);

