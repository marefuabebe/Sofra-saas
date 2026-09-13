import Notification from "../models/Notification";
import { getIO } from "../sockets/socketHandler";

export const NotificationService = {
  async createForAdmin(
    type: string,
    title: string,
    message: string,
    entityType?: "ORDER" | "VERIFICATION" | "RESTAURANT" | "GENERAL",
    entityId?: string
  ) {
    const notification = await Notification.create({
      recipientType: "ADMIN",
      recipientId: "ALL_ADMINS",
      type,
      title,
      message,
      entityType,
      entityId,
    });

    const io = getIO();
    io.to("admin_room").emit("notification:new", notification);
    
    return notification;
  },

  async createForRestaurant(
    restaurantId: string,
    type: string,
    title: string,
    message: string,
    entityType?: "ORDER" | "VERIFICATION" | "RESTAURANT" | "GENERAL",
    entityId?: string
  ) {
    const notification = await Notification.create({
      recipientType: "RESTAURANT",
      recipientId: restaurantId,
      restaurantId,
      type,
      title,
      message,
      entityType,
      entityId,
    });

    try {
      const io = getIO();
      io.to(`tenant_${restaurantId}`).emit("notification:new", notification);
    } catch (e) {
      console.warn(`[NotificationService] Socket.io not initialized, skipping real-time emit for restaurant ${restaurantId}`);
    }

    // Send Real Email Notification
    try {
      const Restaurant = (await import("../models/Restaurant")).default;
      const EmailService = (await import("./emailService")).default;
      const restaurant = await Restaurant.findById(restaurantId);
      
      if (restaurant && restaurant.email) {
        let options: any = {
          type,
          notificationType: type,
          entityType,
          restaurantName: restaurant.name,
          message,
          reason: message,
        };
        
        if (entityType === "ORDER" && entityId) {
          const Order = (await import("../models/Order")).default;
          const order = await Order.findById(entityId);
          if (order) {
            options.order = order;
          }
        }
        
        // Fire and forget email (don't await so it doesn't block the API)
        EmailService.sendEmail(restaurant.email, title, message, options).catch(err => {
          console.error("[NotificationService] Email delivery failed:", err);
        });
      }
    } catch (error) {
      console.error("[NotificationService] Failed to load email dependencies:", error);
    }

    return notification;
  },

  async createForCustomer(
    orderId: string,
    type: string,
    title: string,
    message: string,
    entityType?: "ORDER" | "VERIFICATION" | "RESTAURANT" | "GENERAL",
    entityId?: string
  ) {
    const notification = await Notification.create({
      recipientType: "CUSTOMER",
      recipientId: orderId, // Customers receive based on order tracking
      type,
      title,
      message,
      entityType,
      entityId,
    });

    const io = getIO();
    io.to(`order_${orderId}`).emit("notification:new", notification);

    return notification;
  },

  async markAsRead(notificationId: string, recipientId: string) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  },

  async markAllAsRead(recipientId: string) {
    return await Notification.updateMany(
      { recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
};
