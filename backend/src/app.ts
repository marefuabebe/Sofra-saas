import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// Route imports
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import menuRoutes from "./routes/menuRoutes";
import menuCategoryRoutes from "./routes/menuCategoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import publicRoutes from "./routes/publicRoutes";
import verificationRoutes from "./routes/verificationRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import paymentRoutes from "./routes/paymentRoutes";

// Rate limiting
import { apiLimiter } from "./middleware/rateLimiter";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Trust proxy (for deployments behind nginx/load balancer)
app.set("trust proxy", 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://sofra-saas.vercel.app",
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""))
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) || 
        allowedOrigins.includes(origin) ||
        /https:\/\/sofra-saas.*\.vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(apiLimiter);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// ─── Parsing Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));           // Prevent huge payloads
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", menuCategoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Must be LAST middleware, with four parameters (err, req, res, next)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Log error server-side (never expose to client)
  console.error("[ERROR]", err.message);
  if (!isProduction) console.error(err.stack);

  // Handle known CORS errors
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ success: false, message: "CORS policy violation" });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message || "Internal server error",
    // Never expose stack traces in production
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

export default app;
