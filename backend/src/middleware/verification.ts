import { Request, Response, NextFunction } from "express";
import Restaurant from "../models/Restaurant";

/**
 * Middleware to strictly enforce that a restaurant is verified.
 * Must be used AFTER the standard authenticate middleware.
 */
export const requireVerifiedRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ success: false, message: "Tenant ID missing in request" });
    }

    const restaurant = await Restaurant.findById(req.tenantId);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (restaurant.status !== "active" || restaurant.verificationStatus !== "APPROVED") {
      return res.status(403).json({ 
        success: false, 
        message: "Restaurant verification required" 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error validating verification status" });
  }
};
