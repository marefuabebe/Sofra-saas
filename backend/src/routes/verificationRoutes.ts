import { Router } from "express";
import { authenticate, requireAdmin, requireRestaurantUser, tenantMiddleware } from "../middleware/auth";
import { upload } from "../services/verificationFileService";
import {
  uploadDocument,
  getMyDocuments,
  submitForVerification,
  getVerificationQueue,
  getRestaurantDocuments,
  updateDocumentStatus,
  updateRestaurantVerification
} from "../controllers/verificationController";

const router = Router();

// ---- Restaurant Owner Routes ----
router.post(
  "/upload",
  authenticate,
  requireRestaurantUser,
  tenantMiddleware,
  upload.single("document"),
  uploadDocument
);

router.get(
  "/documents",
  authenticate,
  requireRestaurantUser,
  tenantMiddleware,
  getMyDocuments
);

router.post(
  "/submit",
  authenticate,
  requireRestaurantUser,
  tenantMiddleware,
  submitForVerification
);

// ---- Admin Routes ----
router.get(
  "/queue",
  authenticate,
  requireAdmin,
  getVerificationQueue
);

router.get(
  "/restaurant/:restaurantId/documents",
  authenticate,
  requireAdmin,
  getRestaurantDocuments
);

router.put(
  "/document/:id/status",
  authenticate,
  requireAdmin,
  updateDocumentStatus
);

router.put(
  "/restaurant/:id/verification",
  authenticate,
  requireAdmin,
  updateRestaurantVerification
);

export default router;
