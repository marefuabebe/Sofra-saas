import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define token payload interfaces
export interface AdminTokenPayload {
  id: string;
  role: "admin";
}

export interface RestaurantTokenPayload {
  id: string;
  restaurantId: string;
  role: "owner" | "staff";
}

export type TokenPayload = AdminTokenPayload | RestaurantTokenPayload;

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: string;
    }
  }
}

// 1. Core Authentication Middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { iat: number };
    
    // Invalidate if token was issued before the password was last changed
    if (decoded.role === "owner" || decoded.role === "staff") {
      const User = (await import("../models/User")).default;
      const user = await User.findById(decoded.id).select("passwordChangedAt isActive");
      
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: "Account disabled or not found" });
      }
      
      // decoded.iat is in seconds, passwordChangedAt is in ms
      if (user.passwordChangedAt) {
        const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedAtSec) {
          return res.status(401).json({ success: false, message: "Session expired due to password change" });
        }
      }
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    // Never log token value — only the error type
    if (process.env.NODE_ENV !== "production") {
      console.error("[Auth] JWT error:", error.message);
    }
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// 2. Require Admin Role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// 3. Require Restaurant User Role
export const requireRestaurantUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "owner" && req.user.role !== "staff")) {
    return res.status(403).json({ success: false, message: "Restaurant access required" });
  }
  next();
};

// 4. Tenant Middleware (CRITICAL for data isolation)
// This extracts the restaurantId from the token and forces it onto the request.
// It explicitly ignores any restaurantId passed in the body or query by the client.
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (req.user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admins cannot perform tenant-level operations" });
  }

  const restaurantUser = req.user as RestaurantTokenPayload;
  
  if (!restaurantUser.restaurantId) {
    return res.status(403).json({ success: false, message: "Tenant context missing" });
  }

  // Force the tenant ID onto the request object
  req.tenantId = restaurantUser.restaurantId;

  // Optional: Sanitize body/query to prevent malicious client overrides
  if (req.body && req.body.restaurantId) {
    delete req.body.restaurantId;
  }
  if (req.query && req.query.restaurantId) {
    delete req.query.restaurantId;
  }

  next();
};
