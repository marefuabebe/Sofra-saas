import { Router } from "express";
import { authenticate, requireRestaurantUser, tenantMiddleware } from "../middleware/auth";
import { requireOperationalAccess } from "../middleware/operationalAccess";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  reorderCategories,
  bulkToggleStatus
} from "../controllers/menuCategoryController";

const router = Router();

// Strict RBAC, Tenant Isolation, and Verification Enforcement for all category routes
router.use(authenticate, requireRestaurantUser, tenantMiddleware, requireOperationalAccess);

router.get("/", getCategories);
router.post("/", createCategory);
router.patch("/reorder", reorderCategories);
router.patch("/bulk-status", bulkToggleStatus);
router.put("/:id", updateCategory);
router.patch("/:id/status", toggleCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;
