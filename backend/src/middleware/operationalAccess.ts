import { Request, Response, NextFunction } from "express";
import Restaurant from "../models/Restaurant";
import Subscription from "../models/Subscription";
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from "../config/constants";

export const canRestaurantOperate = (
  restaurant: any, 
  subscription: any
): boolean => {
  if (restaurant.status !== "active") return false;
  if (restaurant.verificationStatus !== "APPROVED") return false;
  if (!subscription) return false;

  const now = new Date();

  // If ACTIVE, it's operational as long as period is valid.
  // "ACTIVE + period expired -> false" (per user instructions)
  if (subscription.status === "ACTIVE") {
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now) {
      return false; // Explicitly deny. Relies on Cron to transition to PAST_DUE to allow grace period access.
    }
    return true;
  }

  // If TRIAL, it's operational if trial is valid.
  if (subscription.status === "TRIAL") {
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now) {
      return false;
    }
    return true;
  }

  // If PAST_DUE, it's operational if grace period is active.
  if (subscription.status === "PAST_DUE") {
    if (subscription.gracePeriodEnd && new Date(subscription.gracePeriodEnd) > now) {
      return true;
    }
    return false;
  }

  // EXPIRED, CANCELLED, etc.
  return false;
};

export const requireOperationalAccess = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const tenantId = req.tenantId; // Set by tenantMiddleware
    if (!tenantId) {
      return res.status(403).json({ success: false, message: "Tenant context missing" });
    }

    const restaurant = await Restaurant.findById(tenantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const subscription = await Subscription.findOne({ restaurantId: tenantId });

    if (!canRestaurantOperate(restaurant, subscription)) {
      return res.status(403).json({ 
        success: false, 
        message: "Restaurant operational access required" 
      });
    }

    next();
  } catch (error) {
    console.error("[OperationalAccess] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
