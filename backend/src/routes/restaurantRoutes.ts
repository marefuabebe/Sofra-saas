import { Router } from "express";
import multer from "multer";
import { 
  updateSettings, 
  uploadRestaurantImage,
  getEmailTemplatesCatalog,
  previewEmailTemplate,
  sendTestEmail
} from "../controllers/restaurantController";
import { authenticate } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protect all restaurant routes
router.use(authenticate);

router.put("/settings", updateSettings);
router.post("/upload", upload.single("image"), uploadRestaurantImage);

// Email Template Engine endpoints
router.get("/email-templates", getEmailTemplatesCatalog);
router.get("/email-templates/preview/:type", previewEmailTemplate);
router.post("/email-templates/send-test", sendTestEmail);

export default router;
