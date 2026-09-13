import { Request, Response } from "express";
import Restaurant from "../models/Restaurant";
import MenuCategory from "../models/MenuCategory";
import MenuItem from "../models/MenuItem";
import RegistrationRequest from "../models/RegistrationRequest";
import User from "../models/User";
import Subscription from "../models/Subscription";
import { canRestaurantOperate } from "../middleware/operationalAccess";
import { NotificationService } from "../services/notificationService";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// For Public Customer: Get restaurant by slug
export const getRestaurantBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ 
      slug: slug as string
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const subscription = await Subscription.findOne({ restaurantId: restaurant._id });
    if (!canRestaurantOperate(restaurant, subscription)) {
      return res.status(404).json({ success: false, message: "Restaurant Unavailable" });
    }

    return res.json({ success: true, data: restaurant });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// For Public Customer: Get public menu by slug
export const getPublicMenu = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ 
      slug: slug as string
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const subscription = await Subscription.findOne({ restaurantId: restaurant._id });
    if (!canRestaurantOperate(restaurant, subscription)) {
      return res.status(404).json({ success: false, message: "Restaurant Unavailable" });
    }

    // Calculate open/closed status
    let isOpen = false;
    if (restaurant.isActive && restaurant.status === "active" && restaurant.verificationStatus === "APPROVED") {
      // Default to open if active, unless strict business hours explicitly say closed
      isOpen = true; 
      
      if (restaurant.businessHours && Object.keys(restaurant.businessHours).length > 0) {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()] as keyof typeof restaurant.businessHours;
        
        const todayHours = restaurant.businessHours[currentDay];
        if (todayHours) {
          if (!todayHours.isOpen) {
            isOpen = false;
          } else if (todayHours.openTime && todayHours.closeTime) {
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMinutes = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;
            
            if (currentTime < todayHours.openTime || currentTime > todayHours.closeTime) {
              isOpen = false;
            }
          }
        }
      }
    }

    // Fetch active categories
    const categories = await MenuCategory.find({ restaurantId: restaurant._id, isActive: true }).sort({ displayOrder: 1 });
    
    // Fetch active menu items
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true }).sort({ displayOrder: 1 });

    // Group items by category
    const groupedCategories = categories.map(cat => {
      return {
        id: cat._id,
        name: cat.name,
        displayOrder: cat.displayOrder,
        items: menuItems.filter(item => item.categoryId?.toString() === cat._id.toString())
      };
    });

    return res.json({
      success: true,
      data: {
        categories: groupedCategories,
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          logoUrl: restaurant.logoUrl,
          coverUrl: restaurant.coverUrl,
          description: restaurant.description,
          phone: restaurant.phone,
          email: restaurant.email,
          address: restaurant.address,
          businessHours: restaurant.businessHours,
          socialLinks: restaurant.socialLinks,
          restaurantType: restaurant.restaurantType,
          status: restaurant.status,
          verificationStatus: restaurant.verificationStatus,
          aboutUs: restaurant.aboutUs,
          culinaryTeam: restaurant.culinaryTeam,
          theme: restaurant.theme,
          isOpen
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// For Public Customer: Register a new restaurant request
export const registerRestaurant = async (req: Request, res: Response) => {
  const useTransactions = process.env.MONGODB_TRANSACTIONS === "true";
  let session = null;
  
  if (useTransactions) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  
  try {
    const requestData = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: requestData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Hash password (generate random if not provided, for Google signups)
    const passwordToHash = requestData.password || Array(32).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    // Create RegistrationRequest (for audit purposes)
    const newRequest = new RegistrationRequest({
      restaurantName: requestData.restaurantName,
      ownerName: requestData.ownerName,
      phone: requestData.phone,
      email: requestData.email,
      city: requestData.city,
      address: requestData.address,
      restaurantType: requestData.restaurantType,
      heardFrom: requestData.heardFrom,
      notes: requestData.notes,
      status: "verified", // Automatically considered verified for provisioning
    });
    
    if (session) {
      await newRequest.save({ session });
    } else {
      await newRequest.save();
    }

    // Generate Slug for Restaurant
    let slug = requestData.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let slugExists = session 
      ? await Restaurant.findOne({ slug }).session(session)
      : await Restaurant.findOne({ slug });
      
    let counter = 1;
    while (slugExists) {
      slug = `${requestData.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${counter}`;
      slugExists = session
        ? await Restaurant.findOne({ slug }).session(session)
        : await Restaurant.findOne({ slug });
      counter++;
    }

    // Create Restaurant
    const newRestaurant = new Restaurant({
      registrationRequestId: newRequest._id,
      name: requestData.restaurantName,
      slug,
      ownerName: requestData.ownerName,
      phone: requestData.phone,
      email: requestData.email,
      city: requestData.city,
      address: requestData.address,
      restaurantType: requestData.restaurantType,
      status: "active", // Allows them to login to dashboard
      verificationStatus: "DOCUMENTS_REQUIRED",
      isActive: true, // Allows them to login
    });
    
    if (session) {
      await newRestaurant.save({ session });
    } else {
      await newRestaurant.save();
    }

    // Create Owner User
    const newUser = new User({
      email: requestData.email,
      password_hash: hashedPassword,
      role: "owner",
      restaurantId: newRestaurant._id,
    });
    
    if (session) {
      await newUser.save({ session });
      await session.commitTransaction();
      session.endSession();
    } else {
      await newUser.save();
    }

    await NotificationService.createForAdmin(
      "NEW_REGISTRATION",
      "New Registration",
      `${requestData.restaurantName} wants to join SOFRA.`,
      "RESTAURANT",
      newRestaurant._id.toString()
    );

    // Emit socket event for audit
    try {
      const { getIO } = require("../sockets/socketHandler");
      const io = getIO();
      io.to("admin_room").emit("request:new", newRequest);
    } catch (err) {
      console.error("Failed to emit request:new socket event", err);
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: newUser._id, 
        role: newUser.role, 
        restaurantId: newRestaurant._id 
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const userData = {
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      restaurantId: newRestaurant._id,
      restaurantSlug: newRestaurant.slug,
      verificationStatus: newRestaurant.verificationStatus
    };

    return res.status(201).json({ success: true, data: userData });
  } catch (error: any) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

// For Authenticated Restaurant: Update settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId || (req as any).user?.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { name, phone, address, description, logoUrl, coverUrl, businessHours, email, restaurantType, socialLinks, aboutUs, culinaryTeam, theme, taxRate, acceptedPaymentMethods } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (name) restaurant.name = name;
    if (phone) restaurant.phone = phone;
    if (address !== undefined) restaurant.address = address;
    if (description !== undefined) restaurant.description = description;
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl;
    if (coverUrl !== undefined) restaurant.coverUrl = coverUrl;
    if (businessHours !== undefined) restaurant.businessHours = businessHours;
    if (email) restaurant.email = email;
    if (restaurantType) restaurant.restaurantType = restaurantType;
    if (socialLinks) { restaurant.socialLinks = socialLinks; restaurant.markModified('socialLinks'); }
    if (aboutUs) { restaurant.aboutUs = aboutUs; restaurant.markModified('aboutUs'); }
    if (culinaryTeam) { restaurant.culinaryTeam = culinaryTeam; restaurant.markModified('culinaryTeam'); }
    
    if (theme) {
      const Subscription = (await import("../models/Subscription")).default;
      const { EntitlementService } = await import("../services/EntitlementService");
      const subscription = await Subscription.findOne({ restaurantId });
      
      if (!EntitlementService.hasEntitlement(subscription?.plan, "CUSTOM_THEME")) {
        return res.status(403).json({ success: false, message: "PLAN_FEATURE_REQUIRED: Your current subscription plan does not include Custom Theme Colors." });
      }
      restaurant.theme = theme; 
      restaurant.markModified('theme'); 
    }

    if (businessHours) { restaurant.businessHours = businessHours; restaurant.markModified('businessHours'); }
    if (taxRate !== undefined) restaurant.taxRate = taxRate;
    if (acceptedPaymentMethods) { restaurant.acceptedPaymentMethods = acceptedPaymentMethods; restaurant.markModified('acceptedPaymentMethods'); }

    await restaurant.save();

    const responseData = {
      id: restaurant._id,
      name: restaurant.name,
      phone: restaurant.phone,
      email: restaurant.email,
      address: restaurant.address,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
      coverUrl: restaurant.coverUrl,
      businessHours: restaurant.businessHours,
      restaurantType: restaurant.restaurantType,
      socialLinks: restaurant.socialLinks,
      aboutUs: restaurant.aboutUs,
      culinaryTeam: restaurant.culinaryTeam,
      theme: restaurant.theme,
      taxRate: restaurant.taxRate,
      acceptedPaymentMethods: restaurant.acceptedPaymentMethods,
      verificationStatus: restaurant.verificationStatus,
    };

    // Emit real-time update to public customers viewing this menu
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`public_restaurant_${restaurant._id}`).emit("restaurant:updated", responseData);
      }
    } catch (err) {
      console.error("Failed to emit restaurant update socket event:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: responseData
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

import { uploadImage } from "../services/imageService";

// For Authenticated Restaurant: Upload Image (Logo or Cover)
export const uploadRestaurantImage = async (req: Request, res: Response) => {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId || (req as any).user?.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Upload to Cloudinary via memory buffer
    const imageUrl = await uploadImage(req.file.buffer, `sofra/restaurants/${restaurantId}`);

    return res.status(200).json({
      success: true,
      data: { url: imageUrl }
    });
  } catch (error: any) {
    console.error("Upload image error:", error);
    return res.status(500).json({ success: false, message: "Image upload failed" });
  }
};

// For Authenticated Restaurant: List email templates & SMTP status
export const getEmailTemplatesCatalog = async (req: Request, res: Response) => {
  try {
    const EmailService = (await import("../services/emailService")).default;
    const catalog = EmailService.getCatalog();
    const isConfigured = EmailService.isConfigured();
    const deliveryMethod = EmailService.getDeliveryMethod();
    
    return res.status(200).json({
      success: true,
      data: {
        templates: catalog,
        smtpConfigured: isConfigured, // Backward compatibility with UI status indicator
        emailConfigured: isConfigured,
        deliveryMethod,
        senderEmail: process.env.SMTP_USER || "noreply@sofra.et",
      }
    });
  } catch (error: any) {
    console.error("Get email templates error:", error);
    return res.status(500).json({ success: false, message: "Failed to load email templates" });
  }
};

// For Authenticated Restaurant: Preview an email template as HTML
export const previewEmailTemplate = async (req: Request, res: Response) => {
  try {
    const typeParam = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
    const type = typeParam || "NEW_ORDER";
    const restaurantId = (req as any).user?.restaurantId;
    const restaurant = restaurantId ? await Restaurant.findById(restaurantId) : null;

    const EmailService = (await import("../services/emailService")).default;
    const { getSampleDataForTemplate } = await import("../services/emailTemplates");
    const catalog = EmailService.getCatalog();
    const item = catalog.find((c: any) => c.type === type) || catalog[0];

    const sampleData = getSampleDataForTemplate(item.type, restaurant?.name || "Bole Bistro Addis");
    const html = EmailService.getPreviewHtml(item.type, sampleData);

    // If query ?raw=true or Accept text/html, send raw HTML for iframe
    if (req.query.raw === "true" || req.headers.accept?.includes("text/html")) {
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }

    return res.status(200).json({
      success: true,
      data: {
        type: item.type,
        title: item.title,
        subject: item.subject,
        category: item.category,
        description: item.description,
        html,
      }
    });
  } catch (error: any) {
    console.error("Preview email error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate preview" });
  }
};

// For Authenticated Restaurant: Send test email of a template
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { type, recipientEmail } = req.body;
    const restaurantId = (req as any).user?.restaurantId;
    const restaurant = restaurantId ? await Restaurant.findById(restaurantId) : null;
    const targetEmail = recipientEmail || restaurant?.email || (req as any).user?.email;

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: "Recipient email is required" });
    }

    const EmailService = (await import("../services/emailService")).default;
    const { getSampleDataForTemplate } = await import("../services/emailTemplates");
    const catalog = EmailService.getCatalog();
    const item = catalog.find((c: any) => c.type === type) || catalog[0];

    const testData = getSampleDataForTemplate(item.type, restaurant?.name || "Bole Bistro Addis");

    const result = await EmailService.sendEmail(
      targetEmail,
      `[Test] ${item.subject.replace("{orderId}", "SOF-9412")}`,
      testData.message || "This is a test notification from SOFRA.",
      {
        ...testData,
        notificationType: item.type,
      }
    );

    return res.status(200).json({
      success: true,
      message: result?.success
        ? `Test email for "${item.title}" sent to ${targetEmail}!`
        : `Email rendered and logged successfully for ${targetEmail} (Preview ready)`,
      data: result,
    });
  } catch (error: any) {
    console.error("Send test email error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to send test email" });
  }
};
