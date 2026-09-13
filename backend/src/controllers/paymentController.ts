import { Request, Response } from "express";
import { PaymentService } from "../services/payment/PaymentService";
import { ChapaProvider } from "../services/payment/providers/ChapaProvider";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Subscription from "../models/Subscription";
import SubscriptionPayment from "../models/SubscriptionPayment";

// Instantiate the service with the Chapa provider for now.
const chapaProvider = new ChapaProvider();
const paymentService = new PaymentService(chapaProvider);

/**
 * Customer initiates an online payment for their order
 */
export const initializeOrderPayment = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const restaurantId = req.body.restaurantId as string;
    const returnUrl = req.body.returnUrl as string;

    if (!orderId || !restaurantId || !returnUrl) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    // TODO: Verify ownership if token is passed, or rely on trackingToken logic

    const result = await paymentService.initializeOrderPayment(orderId, restaurantId, returnUrl);
    
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Customer initiates an online payment for their subscription
 */
export const initializeSubscriptionPayment = async (req: Request, res: Response) => {
  try {
    const subscriptionId = req.params.subscriptionId as string;
    const returnUrl = req.body.returnUrl as string;
    const plan = req.body.plan as string | undefined;
    const billingCycle = req.body.billingCycle as "MONTHLY" | "ANNUALLY" | undefined;
    const restaurantId = (req as any).tenantId as string; // From tenantMiddleware

    if (!subscriptionId || !restaurantId || !returnUrl) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const result = await paymentService.initializeSubscriptionPayment(subscriptionId, restaurantId, returnUrl, plan, billingCycle);
    
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Check payment status securely
 */
export const getOrderPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    // In a real app, verify the customer's tracking token here to ensure they own the order
    let payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status === "PENDING") {
      try {
        payment = await paymentService.verifyOrderPayment(payment.transactionReference);
        if (payment.status === "COMPLETED") {
          const order = await Order.findById(payment.orderId);
          if (order) {
            req.app.get("io")?.to(`tenant_${order.restaurantId}`).emit("order:updated", order);
            req.app.get("io")?.to(`order_${order._id}`).emit("order:updated", order);
          }
        }
      } catch (err) {
        console.error("Manual order payment verification error:", err);
      }
    }

    return res.json({ success: true, data: { status: payment.status, provider: payment.provider } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Handle incoming webhooks from payment providers
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    if (provider !== "chapa") {
      return res.status(400).json({ success: false, message: "Unsupported provider webhook" });
    }

    // 1. Validate signature & parse webhook payload securely
    const parsedData = await chapaProvider.handleWebhook(req);

    const txRef = parsedData.transactionReference;

    if (txRef.startsWith("ORD-")) {
      // --- ORDER PAYMENT LOGIC ---
      const payment = await Payment.findOne({ transactionReference: txRef });
      if (!payment) {
        console.warn(`Webhook received for unknown order transaction: ${txRef}`);
        return res.status(200).send("OK");
      }

      if (payment.status === "COMPLETED") return res.status(200).send("OK");

      if (parsedData.status === "COMPLETED") {
        if (parsedData.amount !== payment.amount || parsedData.currency !== payment.currency) {
          payment.status = "FAILED";
          payment.failureReason = "Amount or currency mismatch in webhook";
          await payment.save();
          return res.status(200).send("OK");
        }

        payment.status = "COMPLETED";
        payment.paidAt = new Date();
        payment.providerMetadata = parsedData.rawEvent;
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order) {
          order.paymentStatus = "paid";
          await order.save();
          req.app.get("io")?.to(`tenant_${order.restaurantId}`).emit("order:updated", order);
          req.app.get("io")?.to(`order_${order._id}`).emit("order:updated", order);
        }
      } else if (parsedData.status === "FAILED") {
        payment.status = "FAILED";
        payment.failureReason = "Webhook reported failure";
        payment.providerMetadata = parsedData.rawEvent;
        await payment.save();
      }
    } else if (txRef.startsWith("SUB-")) {
      // --- SUBSCRIPTION PAYMENT LOGIC ---
      const payment = await SubscriptionPayment.findOne({ transactionReference: txRef });
      if (!payment) {
        console.warn(`Webhook received for unknown subscription transaction: ${txRef}`);
        return res.status(200).send("OK");
      }

      if (payment.status === "COMPLETED") return res.status(200).send("OK");

      if (parsedData.status === "COMPLETED") {
        if (parsedData.amount !== payment.amount || parsedData.currency !== payment.currency) {
          payment.status = "FAILED";
          payment.failureReason = "Amount or currency mismatch in webhook";
          await payment.save();
          return res.status(200).send("OK");
        }

        payment.status = "COMPLETED";
        payment.paidAt = new Date();
        payment.providerMetadata = parsedData.rawEvent;
        await payment.save();

        const subscription = await Subscription.findById(payment.subscriptionId);
        if (subscription) {
          if (payment.targetPlan) {
            subscription.plan = payment.targetPlan as any;
          }
          if (payment.targetBillingCycle) {
            subscription.billingCycle = payment.targetBillingCycle as "MONTHLY" | "ANNUALLY";
          }
          subscription.status = "ACTIVE";
          
          const now = new Date();
          let baseDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : now;
          let newEnd = new Date(baseDate);
          
          if (subscription.billingCycle === "ANNUALLY") {
            newEnd.setFullYear(newEnd.getFullYear() + 1);
          } else {
            newEnd.setMonth(newEnd.getMonth() + 1);
          }

          if (newEnd < now) {
            baseDate = now;
            newEnd = new Date(baseDate);
            if (subscription.billingCycle === "ANNUALLY") {
              newEnd.setFullYear(newEnd.getFullYear() + 1);
            } else {
              newEnd.setMonth(newEnd.getMonth() + 1);
            }
          }

          subscription.currentPeriodStart = baseDate;
          subscription.currentPeriodEnd = newEnd;
          subscription.gracePeriodEnd = undefined;
          await subscription.save();

          req.app.get("io")?.to(`tenant_${subscription.restaurantId}`).emit("subscription:updated", subscription);
        }
      } else if (parsedData.status === "FAILED") {
        payment.status = "FAILED";
        payment.failureReason = "Webhook reported failure";
        payment.providerMetadata = parsedData.rawEvent;
        await payment.save();
      }
    } else {
      console.warn(`Webhook received for unknown transaction prefix: ${txRef}`);
    }

    // Always return 200 OK after successful processing
    return res.status(200).send("OK");
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    // Only return 400 if validation actually failed (e.g., bad signature)
    return res.status(400).send("Webhook Error");
  }
};

/**
 * Verify a pending subscription payment securely for the logged-in restaurant
 */
export const verifyPendingSubscriptionPayment = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    
    // Find the absolute latest payment for this restaurant
    const latestPayment = await SubscriptionPayment.findOne({ 
      restaurantId 
    }).sort({ createdAt: -1 });

    if (!latestPayment || !["PENDING", "FAILED"].includes(latestPayment.status)) {
      return res.status(404).json({ success: false, message: "No pending payment found" });
    }

    if (latestPayment.status === "FAILED") {
      return res.json({ success: true, data: { status: "FAILED" } });
    }

    const updatedPayment = await paymentService.verifySubscriptionPayment(latestPayment.transactionReference);
    
    if (updatedPayment.status === "COMPLETED") {
      const io = req.app.get("io");
      if (io) {
        io.to(`tenant_${restaurantId}`).emit("subscription:renewed");
      }
    }

    return res.json({ 
      success: true, 
      data: { status: updatedPayment.status }
    });
  } catch (error: any) {
    console.error("Subscription payment verification error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to verify payment" });
  }
};

/**
 * Fetch all subscription billing invoices / payment history for this tenant
 */
export const getSubscriptionInvoices = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const payments = await SubscriptionPayment.find({ restaurantId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("Fetch subscription invoices error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch billing invoices" });
  }
};

/**
 * Cancel an abandoned or incomplete pending subscription checkout
 */
export const cancelPendingSubscriptionPayment = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;

    const latestPayment = await SubscriptionPayment.findOne({
      restaurantId,
      status: "PENDING",
    }).sort({ createdAt: -1 });

    if (!latestPayment) {
      return res.status(404).json({ success: false, message: "No active pending checkout found to cancel" });
    }

    latestPayment.status = "CANCELLED";
    latestPayment.failureReason = "Checkout cancelled by user";
    await latestPayment.save();

    return res.json({
      success: true,
      message: "Pending checkout cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel pending payment error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to cancel checkout" });
  }
};

