import { io } from "socket.io-client";

const DEFAULT_PROD_URL = "https://sofra-backend-hvhu.onrender.com";

let rawSocketUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_URL : "http://localhost:5000");

if (rawSocketUrl === "https://sofra-backend.onrender.com") {
  rawSocketUrl = DEFAULT_PROD_URL;
}

const SOCKET_URL = rawSocketUrl;

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});
