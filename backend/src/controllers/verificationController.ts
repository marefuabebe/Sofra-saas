import { Request, Response } from "express";
import VerificationDocument from "../models/VerificationDocument";
import Restaurant from "../models/Restaurant";
import { VerificationFileService } from "../services/verificationFileService";
import { NotificationService } from "../services/notificationService";
import { getIO } from "../sockets/socketHandler";

// Restaurant Owner: Upload Document
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const file = req.file;
    const { documentType } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!documentType) {
      return res.status(400).json({ success: false, message: "documentType is required" });
    }

    const fileUrl = VerificationFileService.getInternalFileUrl(file);

    const doc = new VerificationDocument({
      restaurantId,
      documentType,
      fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      status: "UPLOADED"
    });

    await doc.save();
    
    getIO().to("admin_room").emit("verification:updated");

    return res.status(201).json({ success: true, data: doc });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Restaurant Owner: Get My Documents
export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const documents = await VerificationDocument.find({ restaurantId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: documents });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Restaurant Owner: Submit for Verification
export const submitForVerification = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    
    // In a real app we'd verify that all required document types are uploaded.
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    restaurant.verificationStatus = "PENDING_VERIFICATION";
    await restaurant.save();

    getIO().to("admin_room").emit("verification:updated");

    // Also notify admin
    await NotificationService.createForAdmin(
      "NEW_VERIFICATION",
      "Verification Submitted",
      `${restaurant.name} has submitted documents for verification.`,
      "VERIFICATION",
      restaurant._id.toString()
    );
    
    // Create notification for Restaurant Owner
    await NotificationService.createForRestaurant(
      restaurant._id.toString(),
      "VERIFICATION_SUBMITTED",
      "Documents Submitted",
      "Your verification documents have been submitted and are under review. We will notify you once they are approved.",
      "VERIFICATION",
      restaurant._id.toString()
    );

    return res.json({ success: true, message: "Submitted for verification successfully", data: restaurant });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Secure File Retrieval (Admin or Owner) is no longer needed via proxy, as we use secure Cloudinary URLs directly in the UI.

// Admin: Get Verification Queue
export const getVerificationQueue = async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find({
      verificationStatus: { $in: ["PENDING_VERIFICATION", "UNDER_REVIEW"] }
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: restaurants });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get Documents for a specific restaurant
export const getRestaurantDocuments = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const documents = await VerificationDocument.find({ restaurantId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: documents });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Document Status
export const updateDocumentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    const doc = await VerificationDocument.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    doc.status = status;
    doc.adminComment = adminComment;
    doc.reviewedBy = req.user?.id as any;
    doc.reviewedAt = new Date();

    await doc.save();

    // Optionally update restaurant status to UNDER_REVIEW automatically
    const restaurant = await Restaurant.findById(doc.restaurantId);
    if (restaurant && restaurant.verificationStatus === "PENDING_VERIFICATION") {
      restaurant.verificationStatus = "UNDER_REVIEW";
      await restaurant.save();
    }

    if (status === "REJECTED") {
      await NotificationService.createForRestaurant(
        doc.restaurantId.toString(),
        "DOCUMENT_REJECTED",
        "Document Rejected",
        `Your document (${(doc as any).type || (doc as any).documentType}) was rejected. Reason: ${adminComment || "Please review and resubmit."}`,
        "VERIFICATION",
        doc._id.toString()
      );
    }

    return res.json({ success: true, data: doc });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve or Reject Restaurant
export const updateRestaurantVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject' | 'changes_requested'

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    if (action === "approve") {
      restaurant.verificationStatus = "APPROVED";
      restaurant.status = "active";
      restaurant.isActive = true;

      // Ensure a subscription record exists
      const Subscription = (await import("../models/Subscription")).default;
      const existingSub = await Subscription.findOne({ restaurantId: restaurant._id });
      if (!existingSub) {
        await Subscription.create({
          restaurantId: restaurant._id,
          plan: "starter", // Default to starter
          status: "EXPIRED", // EXPIRED forces them to pay immediately to unlock
          billingCycle: "MONTHLY",
        });
      }
    } else if (action === "reject") {
      restaurant.verificationStatus = "REJECTED";
      restaurant.internalNotes = reason;
    } else if (action === "changes_requested") {
      restaurant.verificationStatus = "CHANGES_REQUESTED";
      restaurant.internalNotes = reason;
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await restaurant.save();

    if (action === "approve") {
      await NotificationService.createForRestaurant(
        restaurant._id.toString(),
        "VERIFICATION_APPROVED",
        "Account Approved 🎉",
        "Your restaurant has been fully verified and is now live on SOFRA!",
        "VERIFICATION",
        restaurant._id.toString()
      );

      const io = req.app.get("io");
      if (io) {
        // Emit realtime unlock event to the restaurant owner's dashboard
        io.to(`tenant_${id}`).emit("verification:approved", restaurant);
      }
    } else if (action === "reject") {
      await NotificationService.createForRestaurant(
        restaurant._id.toString(),
        "DOCUMENT_REJECTED",
        "Verification Rejected",
        "Your restaurant verification was rejected. Please contact support.",
        "VERIFICATION",
        restaurant._id.toString()
      );
    } else if (action === "changes_requested") {
      await NotificationService.createForRestaurant(
        restaurant._id.toString(),
        "VERIFICATION_CHANGES_REQUESTED",
        "Changes Requested",
        "We need a few more details to approve your restaurant.",
        "VERIFICATION",
        restaurant._id.toString()
      );
    }

    return res.json({ success: true, data: restaurant });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
