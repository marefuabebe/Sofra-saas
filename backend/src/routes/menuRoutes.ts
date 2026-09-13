import { Router } from "express";
import { authenticate, requireRestaurantUser, tenantMiddleware } from "../middleware/auth";
import { requireOperationalAccess } from "../middleware/operationalAccess";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemFeatured,
  duplicateMenuItem,
  bulkToggleMenuItemAvailability,
  bulkDeleteMenuItems,
  deleteMenuItem
} from "../controllers/menuController";
import { validate } from "../middleware/validate";
import { menuItemSchema } from "../validators/schemas";

const router = Router();

// Strict RBAC, Tenant Isolation, and Verification Enforcement for all menu routes
router.use(authenticate, requireRestaurantUser, tenantMiddleware, requireOperationalAccess);

router.get("/", getMenuItems);
router.post("/", validate(menuItemSchema), createMenuItem);

// Bulk actions (must precede /:id)
router.patch("/bulk/availability", bulkToggleMenuItemAvailability);
router.post("/bulk/delete", bulkDeleteMenuItems);

// Item specific actions
router.post("/:id/duplicate", duplicateMenuItem);
router.put("/:id", validate(menuItemSchema), updateMenuItem);
router.put("/:id/availability", toggleMenuItemAvailability);
router.put("/:id/featured", toggleMenuItemFeatured);
router.delete("/:id", deleteMenuItem);

export default router;
