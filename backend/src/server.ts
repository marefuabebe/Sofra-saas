import dotenv from "dotenv";
dotenv.config(); // MUST be first — before any other imports that read process.env

import http from "http";
import mongoose from "mongoose";
import app from "./app";
import { initSockets } from "./sockets/socketHandler";
import { runSubscriptionLifecycleJob } from "./cron/subscriptionCron";

// ─── Environment Variable Validation ─────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error("[FATAL] Missing required environment variable: MONGODB_URI");
  process.exit(1);
}

if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = "https://sofra-saas.vercel.app";
  console.log("[CONFIG] FRONTEND_URL defaulted to https://sofra-saas.vercel.app");
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "sofra-production-secret-fallback-key-2026";
  console.log("[CONFIG] JWT_SECRET defaulted to fallback secret");
}

const PORT = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI = process.env.MONGODB_URI;

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSockets(server);
app.set("io", io); // Make io accessible in controllers via req.app.get("io")

// ─── Database Connection ──────────────────────────────────────────────────────
const connectDB = async () => {
  console.log("[DB] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log("[DB] Successfully connected to MongoDB");
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`[SHUTDOWN] Received ${signal}, closing gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("[SHUTDOWN] MongoDB connection closed");
    } catch (err) {
      console.error("[SHUTDOWN] Error closing MongoDB:", err);
    }
    process.exit(0);
  });

  // Force shutdown after 10s if requests don't drain
  setTimeout(() => {
    console.error("[SHUTDOWN] Forcing exit after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions — log and exit; let process manager restart
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
  process.exit(1);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"})`);
      
      // Run immediately on startup, then every hour
      runSubscriptionLifecycleJob();
      setInterval(() => {
        runSubscriptionLifecycleJob();
      }, 1000 * 60 * 60); // Every hour
    });
  } catch (error) {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
