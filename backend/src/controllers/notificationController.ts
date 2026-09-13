import { Request, Response } from "express";
import Notification from "../models/Notification";
import { NotificationService } from "../services/notificationService";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Determine recipientId query based on role
    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: recipientQuery })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipientId: recipientQuery });

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    const count = await Notification.countDocuments({ recipientId: recipientQuery, isRead: false });

    return res.json({ success: true, data: { count } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: recipientQuery },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    await Notification.updateMany(
      { recipientId: recipientQuery, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({ success: true, message: "All marked as read" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    await Notification.findOneAndDelete({ _id: id, recipientId: recipientQuery });
    return res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let recipientQuery: any = user.id;
    if (user.role === "owner" && user.restaurantId) {
      recipientQuery = user.restaurantId;
    } else if (user.role === "admin") {
      recipientQuery = { $in: [user.id, "ALL_ADMINS"] };
    }

    await Notification.deleteMany({ recipientId: recipientQuery });
    return res.json({ success: true, message: "All notifications cleared" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
