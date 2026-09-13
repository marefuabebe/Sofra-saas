import { Request, Response, NextFunction } from "express";
import Subscription from "../models/Subscription";
import { EntitlementService, Capability } from "../services/EntitlementService";
import { canRestaurantOperate } from "./operationalAccess";
import Restaurant from "../models/Restaurant";

export const requireEntitlement = (capability: Capability) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).tenantId; // Set by tenantMiddleware
      if (!restaurantId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Missing tenant ID" });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      const subscription = await Subscription.findOne({ restaurantId });

      // First check if the restaurant is allowed to operate at all
      if (!canRestaurantOperate(restaurant, subscription)) {
        return res.status(403).json({ success: false, message: "Restaurant is not authorized to operate. Please check verification and billing status." });
      }

      // Then check if the subscription plan has the specific entitlement
      const hasAccess = EntitlementService.hasEntitlement(subscription?.plan, capability);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "PLAN_FEATURE_REQUIRED: Your current subscription plan does not include this feature." });
      }

      next();
    } catch (error) {
      console.error("Entitlement check error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};
