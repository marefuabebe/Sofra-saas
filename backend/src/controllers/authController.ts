import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser";
import User from "../models/User";
import Restaurant from "../models/Restaurant";
import Notification from "../models/Notification";
import Subscription from "../models/Subscription";
import SubscriptionPayment from "../models/SubscriptionPayment";
import AdminActivityLog from "../models/AdminActivityLog";
import { canRestaurantOperate } from "../middleware/operationalAccess";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import { getCookieOptions } from "../utils/cookieOptions";

const getJwtSecret = () => process.env.JWT_SECRET || "default_secret";

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id, role: "admin" }, getJwtSecret(), {
      expiresIn: "24h",
    });

    admin.lastLoginAt = new Date();
    await admin.save();

    await AdminActivityLog.create({
      action: "Admin Logged In",
      category: "auth",
      adminId: admin._id,
      adminName: admin.name || "Super Admin",
      adminRole: admin.isSuperAdmin ? "Super Admin" : "Admin",
      ip: req.ip || "127.0.0.1",
      status: "success",
      details: { email: admin.email }
    }).catch(() => {});

    res.cookie("token", token, getCookieOptions());
    return res.json({
      success: true,
      data: {
        token,
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: "admin",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[adminLogin]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const restaurantLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("restaurantId");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const restaurant: any = user.restaurantId;
    if (!restaurant || !restaurant.isActive || restaurant.status === "blocked") {
      const blockMsg = restaurant?.blockReason 
        ? `Your account has been suspended: ${restaurant.blockReason}`
        : "Restaurant account is inactive or suspended.";
      return res.status(403).json({ success: false, message: blockMsg });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, restaurantId: restaurant._id, role: user.role },
      getJwtSecret(),
      { expiresIn: "24h" }
    );

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("token", token, getCookieOptions());
    return res.json({
      success: true,
      data: {
        token,
        id: user._id,
        email: user.email,
        role: user.role,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
        verificationStatus: restaurant.verificationStatus,
        tempPassword: user.tempPassword,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[restaurantLogin]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; // This is the access_token from React OAuth
    
    // Fetch user profile from Google using the access token
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }
    
    const payload: any = await response.json();
    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, message: "Invalid Google payload" });
    }

    const email = payload.email;
    const name = payload.name;

    // Check if user exists
    const user = await User.findOne({ email }).populate("restaurantId");
    
    if (!user) {
      // Progressive Profiling: Redirect to register
      return res.json({ 
        success: true, 
        data: { 
          action: "register", 
          googleData: { name, email } 
        } 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "User account is inactive" });
    }

    const restaurant: any = user.restaurantId;
    if (!restaurant || !restaurant.isActive || restaurant.status === "blocked") {
      const blockMsg = restaurant?.blockReason 
        ? `Your account has been suspended: ${restaurant.blockReason}`
        : "Restaurant account is inactive or suspended.";
      return res.status(403).json({ success: false, message: blockMsg });
    }

    // Login successful
    const jwtToken = jwt.sign(
      { id: user._id, restaurantId: restaurant._id, role: user.role },
      getJwtSecret(),
      { expiresIn: "24h" }
    );

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("token", jwtToken, getCookieOptions());
    return res.json({
      success: true,
      data: {
        action: "login",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          verificationStatus: restaurant.verificationStatus,
          tempPassword: user.tempPassword,
        },
        token: jwtToken
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[googleAuth]", error);
    return res.status(401).json({ success: false, message: "Google authentication failed" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", getCookieOptions());
  return res.json({ success: true, message: "Logged out successfully" });
};

export const me = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded: any = jwt.verify(token, getJwtSecret());
    
    if (decoded.role === "admin") {
      const admin = await AdminUser.findById(decoded.id).select("-password_hash");
      if (!admin) return res.status(401).json({ success: false, message: "User not found" });
      return res.json({ success: true, data: { ...admin.toObject(), role: "admin" } });
    } else {
      const user = await User.findById(decoded.id).select("-password_hash").populate("restaurantId");
      if (!user) return res.status(401).json({ success: false, message: "User not found" });
      
      const restaurant: any = user.restaurantId;

      const restaurantData = { 
          id: user._id,
          email: user.email,
          role: user.role,
          tempPassword: user.tempPassword,
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          phone: restaurant.phone,
          address: restaurant.address,
          description: restaurant.description,
          logoUrl: restaurant?.logoUrl,
          coverUrl: restaurant?.coverUrl,
          businessHours: restaurant?.businessHours,
          restaurantType: restaurant?.restaurantType,
          socialLinks: restaurant?.socialLinks,
          aboutUs: restaurant?.aboutUs,
          culinaryTeam: restaurant?.culinaryTeam,
          theme: restaurant?.theme,
          taxRate: restaurant?.taxRate,
          acceptedPaymentMethods: restaurant?.acceptedPaymentMethods,
          status: restaurant?.status,
          isActive: restaurant.isActive,
          verificationStatus: restaurant.verificationStatus,
        };

        let subscriptionSummary = null;
        let pendingPaymentSummary = null;
        let canOperate = false;
        let entitlements = null;

        if (restaurant) {
          let subscription = await Subscription.findOne({ restaurantId: restaurant._id });
          
          if (!subscription && restaurant.verificationStatus === "APPROVED") {
            // Self-heal: If restaurant is approved but lacks a subscription, create an EXPIRED starter plan
            subscription = await Subscription.create({
              restaurantId: restaurant._id,
              plan: "starter",
              status: "EXPIRED",
              billingCycle: "MONTHLY",
            });
          }

          canOperate = canRestaurantOperate(restaurant, subscription);
          
          if (subscription) {
            const { EntitlementService } = await import("../services/EntitlementService");
            entitlements = EntitlementService.getFrontendEntitlements(subscription.plan);

            subscriptionSummary = {
              _id: subscription._id,
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              currentPeriodStart: subscription.currentPeriodStart,
              billingCycle: subscription.billingCycle,
              gracePeriodEnd: subscription.gracePeriodEnd,
            };

            const latestPayment = await SubscriptionPayment.findOne({ 
              subscriptionId: subscription._id
            }).sort({ createdAt: -1 });

            if (latestPayment && latestPayment.status === "PENDING") {
              const ageMinutes = (Date.now() - new Date(latestPayment.createdAt).getTime()) / (1000 * 60);
              if (ageMinutes > 30) {
                // Auto-expire abandoned checkout attempts older than 30 minutes
                latestPayment.status = "EXPIRED";
                latestPayment.failureReason = "Checkout session expired after 30 minutes";
                await latestPayment.save();
              } else {
                pendingPaymentSummary = {
                  status: latestPayment.status,
                  transactionReference: latestPayment.transactionReference,
                  amount: latestPayment.amount,
                  currency: latestPayment.currency,
                  targetPlan: latestPayment.targetPlan,
                  createdAt: latestPayment.createdAt,
                };
              }
            } else if (latestPayment && latestPayment.status === "FAILED") {
              pendingPaymentSummary = {
                status: latestPayment.status,
                transactionReference: latestPayment.transactionReference,
                amount: latestPayment.amount,
                currency: latestPayment.currency,
                targetPlan: latestPayment.targetPlan,
                createdAt: latestPayment.createdAt,
              };
            }
          }
        }

        return res.json({ 
          success: true, 
          data: {
            ...restaurantData,
            subscription: subscriptionSummary,
            pendingPayment: pendingPaymentSummary,
            access: { canOperate },
            entitlements,
          } 
        });
    }
  } catch (error: any) {
    console.error("Auth/Me crashed:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token", error: error?.message });
  }
};

export const updateAdminPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = (req as any).user?.id; // Set by authenticate middleware

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Save
    admin.password_hash = newHash;
    await admin.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("[updateAdminPassword]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
