import { Router } from "express";
import { adminLogin, restaurantLogin, googleAuth, logout, me, updateAdminPassword } from "../controllers/authController";
import { forgotPassword, resetPassword } from "../controllers/passwordResetController";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { authenticate, requireAdmin } from "../middleware/auth";
import { loginSchema } from "../validators/schemas";

const router = Router();

router.post("/admin/login", authLimiter, validate(loginSchema), adminLogin);
router.post("/restaurant/login", authLimiter, validate(loginSchema), restaurantLogin);
router.post("/google", authLimiter, googleAuth);
router.post("/logout", logout);
router.get("/me", me);

// Password Management
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.put("/admin/password", authenticate, requireAdmin, updateAdminPassword);

export default router;
