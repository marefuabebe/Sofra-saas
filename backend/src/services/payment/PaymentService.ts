import { Types } from "mongoose";
import crypto from "crypto";
import { IPaymentProvider } from "./IPaymentProvider";
import Payment from "../../models/Payment";
import Order from "../../models/Order";
import Subscription from "../../models/Subscription";
import SubscriptionPayment from "../../models/SubscriptionPayment";
import { getSubscriptionPrice } from "../../utils/pricing";

export class PaymentService {
  private provider: IPaymentProvider;

  constructor(provider: IPaymentProvider) {
    this.provider = provider;
  }

  /**
   * Generates a secure, random string for transaction referencing
   */
  public static generateTransactionReference(prefix: string = "TX"): string {
    return `${prefix}-${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Domain 1: Initialize Food Order Payment
   */
  public async initializeOrderPayment(orderId: string, restaurantId: string, returnUrl: string) {
    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) throw new Error("Order not found or unauthorized");

    if (order.paymentStatus === "paid") {
      throw new Error("Order is already paid");
    }

    const txRef = PaymentService.generateTransactionReference("ORD");

    // 1. Create PENDING internal payment record
    const payment = await Payment.create({
      orderId: order._id,
      restaurantId: order.restaurantId,
      amount: order.total,
      currency: "ETB",
      provider: "CHAPA", // Hardcoded for now as per requirement, but ideally dynamic
      status: "PENDING",
      transactionReference: txRef,
    });

    // 2. Initialize with Provider
    const initResponse = await this.provider.initializePayment({
      transactionReference: txRef,
      amount: order.total,
      currency: "ETB",
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      returnUrl,
    });

    if (!initResponse.success) {
      payment.status = "FAILED";
      payment.failureReason = initResponse.message;
      await payment.save();
      throw new Error(`Payment initialization failed: ${initResponse.message}`);
    }

    return {
      checkoutUrl: initResponse.checkoutUrl,
      transactionReference: txRef,
    };
  }

  /**
   * Domain 2: Initialize Subscription Payment
   */
  public async initializeSubscriptionPayment(
    subscriptionId: string, 
    restaurantId: string, 
    returnUrl: string,
    targetPlan?: string,
    targetBillingCycle?: "MONTHLY" | "ANNUALLY"
  ) {
    const subscription = await Subscription.findOne({ _id: subscriptionId, restaurantId });
    if (!subscription) throw new Error("Subscription not found or unauthorized");

    // If they are on a free trial and didn't select a plan, reject it.
    if (subscription.plan === "free_trial" && !targetPlan) {
      throw new Error("You must select a paid plan to upgrade from a free trial.");
    }

    // RESTRICTION: Without finished current plan, the restaurant cannot switch plan.
    const now = new Date();
    const isCurrentPlanActive = (subscription.status === "ACTIVE" || subscription.status === "TRIAL") &&
      Boolean(subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now);

    if (isCurrentPlanActive && targetPlan && targetPlan.toLowerCase() !== subscription.plan.toLowerCase()) {
      const formattedDate = new Date(subscription.currentPeriodEnd!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      throw new Error(
        `Plan switch restricted: Your current ${subscription.plan.toUpperCase()} plan is still active until ${formattedDate}. You cannot switch plans until your current plan finishes.`
      );
    }

    // Determine the plan and billing cycle to charge for
    const planToCharge = targetPlan || subscription.plan;
    const cycleToCharge = targetBillingCycle || subscription.billingCycle;

    if (planToCharge === "free_trial") {
      throw new Error("Cannot pay for a free trial");
    }

    const amount = getSubscriptionPrice(planToCharge, cycleToCharge);
    const txRef = PaymentService.generateTransactionReference("SUB");

    // 1. Create PENDING internal subscription payment record
    const payment = await SubscriptionPayment.create({
      subscriptionId: subscription._id,
      restaurantId: subscription.restaurantId,
      amount: amount,
      currency: "ETB",
      provider: "CHAPA", // Hardcoded for now
      status: "PENDING",
      transactionReference: txRef,
      targetPlan,
      targetBillingCycle,
    });

    // 2. Initialize with Provider
    const initResponse = await this.provider.initializePayment({
      transactionReference: txRef,
      amount: amount,
      currency: "ETB",
      customerName: `Restaurant ${restaurantId}`, // We could fetch restaurant name if needed
      customerPhone: "", // Usually the restaurant owner's phone, leaving blank if not strictly required
      returnUrl,
    });

    if (!initResponse.success) {
      payment.status = "FAILED";
      payment.failureReason = initResponse.message;
      await payment.save();
      throw new Error(`Payment initialization failed: ${initResponse.message}`);
    }

    return {
      checkoutUrl: initResponse.checkoutUrl,
      transactionReference: txRef,
    };
  }

  /**
   * Domain 1: Verify Order Payment (Pull mechanism, e.g. if webhook failed or polling)
   */
  public async verifyOrderPayment(transactionReference: string) {
    const payment = await Payment.findOne({ transactionReference });
    if (!payment) throw new Error("Payment record not found");

    if (payment.status === "COMPLETED") return payment;

    const verification = await this.provider.verifyTransaction(transactionReference);

    if (verification.success && verification.status === "COMPLETED") {
      // Validate amount to prevent price tampering
      if (verification.amount !== payment.amount || verification.currency !== payment.currency) {
        payment.status = "FAILED";
        payment.failureReason = "Amount or currency mismatch during verification";
        await payment.save();
        throw new Error(payment.failureReason);
      }

      payment.status = "COMPLETED";
      payment.paidAt = new Date();
      payment.providerTransactionReference = verification.providerTransactionReference;
      await payment.save();

      // Update Order
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: "paid" });
    }

    return payment;
  }

  /**
   * Domain 2: Verify Subscription Payment (Pull mechanism)
   */
  public async verifySubscriptionPayment(transactionReference: string) {
    const payment = await SubscriptionPayment.findOne({ transactionReference });
    if (!payment) throw new Error("Subscription payment record not found");

    if (payment.status === "COMPLETED") return payment;

    const verification = await this.provider.verifyTransaction(transactionReference);

    if (verification.success && verification.status === "COMPLETED") {
      // Validate amount
      if (verification.amount !== payment.amount || verification.currency !== payment.currency) {
        payment.status = "FAILED";
        payment.failureReason = "Amount or currency mismatch during verification";
        await payment.save();
        throw new Error(payment.failureReason);
      }

      payment.status = "COMPLETED";
      payment.paidAt = new Date();
      payment.providerTransactionReference = verification.providerTransactionReference;
      await payment.save();

      // Update Subscription
      const subscription = await Subscription.findById(payment.subscriptionId);
      if (subscription) {
        subscription.status = "ACTIVE";
        
        if (payment.targetPlan) {
          subscription.plan = payment.targetPlan as any;
        }
        if (payment.targetBillingCycle) {
          subscription.billingCycle = payment.targetBillingCycle as any;
        }
        
        const now = new Date();
        const start = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
        const end = new Date(start);
        
        if (subscription.billingCycle === "ANNUALLY") {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }
        
        subscription.currentPeriodStart = start;
        subscription.currentPeriodEnd = end;
        subscription.gracePeriodEnd = null as any;
        
        await subscription.save();
      }
    } else if (verification.status === "FAILED") {
       payment.status = "FAILED";
       payment.failureReason = "Payment failed on provider";
       await payment.save();
    }

    return payment;
  }
}
