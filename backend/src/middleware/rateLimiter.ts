import rateLimit from "express-rate-limit";

// Rate limiting consistent error response
const limitMessage = { success: false, message: "Too many requests, please try again later." };

// Check if running in development mode
const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 30, // Relaxed in development so developers/tests aren't locked out
  message: limitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 5, // strict limit for password resets to prevent abuse in production
  message: limitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50000 : 1000, // higher limit for general API
  message: limitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 50, // limit each IP to 50 order creations per 15 minutes in production
  message: limitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});
