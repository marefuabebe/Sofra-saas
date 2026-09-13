import { Router } from "express";
import { authenticate, requireRestaurantUser, tenantMiddleware } from "../middleware/auth";
import { requireOperationalAccess } from "../middleware/operationalAccess";
import {
  getRestaurantOrders,
  updateOrderStatus,
  createOrder,
  getRestaurantStats
} from "../controllers/orderController";
import { orderLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/schemas";

const router = Router();

// --------------------------------------------------
// PUBLIC ROUTES
// --------------------------------------------------
// Create an order (public customer flow)
router.post("/public", orderLimiter, validate(createOrderSchema), createOrder);

// --------------------------------------------------
// TENANT ROUTES
// --------------------------------------------------
router.use(authenticate, requireRestaurantUser, tenantMiddleware, requireOperationalAccess);

// Get tenant orders
router.get("/", getRestaurantOrders);

// Update order status
router.put("/:id/status", validate(updateOrderStatusSchema), updateOrderStatus);

// Get tenant stats
router.get("/stats", getRestaurantStats);

export default router;
