import { Router } from "express";
import { getRestaurantBySlug, getPublicMenu, registerRestaurant } from "../controllers/restaurantController";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { registerSchema } from "../validators/schemas";

import { getPublicConfig } from "../controllers/adminSettingsController";

const router = Router();

// Public Configuration Route
router.get("/config", getPublicConfig);

// Public routes for customer ordering flow
router.get("/:slug", getRestaurantBySlug);
router.get("/:slug/menu", getPublicMenu);
router.post("/register", authLimiter, validate(registerSchema), registerRestaurant);

export default router;
