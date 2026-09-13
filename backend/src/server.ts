import dotenv from "dotenv";
dotenv.config(); // MUST be first — before any other imports that read process.env

import http from "http";
import mongoose from "mongoose";
import app from "./app";
import { initSockets } from "./sockets/socketHandler";
import { runSubscriptionLifecycleJob } from "./cron/subscriptionCron";

// ─── Environment Variable Validation ─────────────────────────────────────────
const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "FRONTEND_URL"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI = process.env.MONGODB_URI!;

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSockets(server);
app.set("io", io); // Make io accessible in controllers via req.app.get("io")

// ─── Database Connection ──────────────────────────────────────────────────────
const connectDB = async () => {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log("[DB] Connected to MongoDB");
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
    server.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
      
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
