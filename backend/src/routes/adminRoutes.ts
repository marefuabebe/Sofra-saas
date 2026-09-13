import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getPendingRequests,
  approveRestaurant,
  rejectRequest,
  getRestaurants,
  toggleRestaurantStatus,
  getPlatformStats,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
  getAdminActivityLogs,
  getAllOrders,
  getAnalyticsData,
} from "../controllers/adminController";
import { validate } from "../middleware/validate";
import { approveRequestSchema } from "../validators/schemas";
import { getSystemSettings, updateSystemSettings } from "../controllers/adminSettingsController";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get("/requests/pending", getPendingRequests);
router.post("/requests/:id/approve", validate(approveRequestSchema), approveRestaurant);
router.put("/requests/:id/reject", rejectRequest);

router.get("/restaurants", getRestaurants);
router.put("/restaurants/:id/status", toggleRestaurantStatus);

router.get("/stats", getPlatformStats);
router.get("/notifications", getAdminNotifications);
router.put("/notifications/:id/read", markAdminNotificationAsRead);
router.put("/notifications/read-all", markAllAdminNotificationsAsRead);
router.delete("/notifications/:id", deleteAdminNotification);
router.delete("/notifications/clear-all", clearAllAdminNotifications);
router.get("/activity", getAdminActivityLogs);
router.get("/orders", getAllOrders);
router.get("/analytics", getAnalyticsData);

// System Settings Routes
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);

export default router;
