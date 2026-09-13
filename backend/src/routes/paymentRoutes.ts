import { Router } from "express";
import {
  handleWebhook,
  initializeOrderPayment,
  getOrderPaymentStatus,
  initializeSubscriptionPayment,
  verifyPendingSubscriptionPayment,
  getSubscriptionInvoices,
  cancelPendingSubscriptionPayment,
} from "../controllers/paymentController";
import { authenticate, tenantMiddleware } from "../middleware/auth";

const router = Router();

// Public webhook endpoint for payment providers (e.g. Chapa, Telebirr)
router.post("/webhooks/:provider", handleWebhook);

// Order payment initialization
router.post("/orders/:orderId/pay", initializeOrderPayment);

// Poll for order payment status
router.get("/orders/:orderId/status", getOrderPaymentStatus);

// Subscription payment invoices history (Tenant Protected)
router.get(
  "/subscriptions/invoices",
  authenticate,
  tenantMiddleware,
  getSubscriptionInvoices
);

// Subscription payment initialization (Tenant Protected)
router.post(
  "/subscriptions/:subscriptionId/pay",
  authenticate,
  tenantMiddleware,
  initializeSubscriptionPayment
);

// Verify pending subscription payment manually (Poll mechanism)
router.post(
  "/subscriptions/verify-pending",
  authenticate,
  tenantMiddleware,
  verifyPendingSubscriptionPayment
);

// Cancel pending subscription payment manually (Tenant Protected)
router.post(
  "/subscriptions/cancel-pending",
  authenticate,
  tenantMiddleware,
  cancelPendingSubscriptionPayment
);

export default router;
