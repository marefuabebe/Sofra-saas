import axios from "axios";
import { getErrorMessage } from "../utils/errorHandler";

export { getErrorMessage };

// Using the same base URL configured in Vite proxy or absolute if in prod
const rawBaseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
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

