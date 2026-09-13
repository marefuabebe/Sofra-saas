import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import MenuItem from "../models/MenuItem";
import Restaurant from "../models/Restaurant";
import Payment from "../models/Payment";
import { PaymentService } from "../services/payment/PaymentService";
import { NotificationService } from "../services/notificationService";

// For Tenant Dashboard: Get orders for their specific restaurant
export const getRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId; // Set by tenantMiddleware
    const orders = await Order.find({ restaurantId: restaurantId as string }).sort({ createdAt: -1 });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// For Tenant Dashboard: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const { status, paymentData } = req.body;

    const updates: any = { status };
    if (paymentData) {
      updates.paymentMethod = paymentData.paymentMethod;
      updates.paymentTransactionId = paymentData.transactionId;
      updates.paymentStatus = "paid";
    }
    
    // Set timestamp based on status
    if (status === "accepted") updates.acceptedAt = new Date();
    if (status === "preparing") updates.preparingAt = new Date();
    if (status === "ready") updates.readyAt = new Date();
    if (status === "completed") updates.completedAt = new Date();
    if (status === "cancelled") updates.cancelledAt = new Date();

    const order = await Order.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string }, // Enforce tenant scoping!
      updates,
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update Cash Payment record if applicable
    if (paymentData) {
      await Payment.findOneAndUpdate(
        { orderId: order._id, provider: "CASH", status: "PENDING" },
        { status: "COMPLETED", paidAt: new Date() }
      );
    }

    // Notify customer
    await NotificationService.createForCustomer(
      order._id.toString(),
      `ORDER_${status.toUpperCase()}`,
      "Order Updated",
      `Your order is now ${status}.`,
      "ORDER",
      order._id.toString()
    );

    // Legacy emit for dashboard state update
    req.app.get("io").to(`tenant_${restaurantId}`).emit("order:updated", order);
    req.app.get("io").to("admin_room").emit("order:updated", order);
    
    // Emit to customer tracking room
    req.app.get("io").to(`order_${order._id.toString()}`).emit("order:updated", order);

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// For Tenant Dashboard: Get restaurant stats
export const getRestaurantStats = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;

    const pendingOrders = await Order.countDocuments({ restaurantId: restaurantId as string, status: "pending" });
    const totalOrders = await Order.countDocuments({ restaurantId: restaurantId as string });
    
    const MenuItem = (await import("../models/MenuItem")).default;
    const totalMenuItems = await MenuItem.countDocuments({ restaurantId: restaurantId as string });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrdersList = await Order.find({ restaurantId: restaurantId as string, createdAt: { $gte: today } });
    const todayOrders = todayOrdersList.length;
    const completedToday = todayOrdersList.filter(o => o.status === "completed").length;
    const revenueToday = todayOrdersList
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return res.json({
      success: true,
      data: {
        pendingOrders,
        completedToday,
        revenueToday,
        totalOrders,
        todayOrders,
        totalMenuItems
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// For Public Customer: Create a new order
// CRITICAL: We do NOT trust the subtotal, tax, total, or prices from the client
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { restaurantId, orderType, tableNumber, customerName, customerPhone, items, customerNotes } = req.body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || restaurant.status !== "active" || restaurant.verificationStatus !== "APPROVED") {
      return res.status(400).json({ success: false, message: "Restaurant is not available for ordering" });
    }

    // Check business hours
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()] as keyof typeof restaurant.businessHours;
    let isOpen = false;
    
    const todayHours = (restaurant.businessHours as any)?.[currentDay];
    if (todayHours && todayHours.isOpen) {
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      if (currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime) {
        isOpen = true;
      }
    }

    if (!isOpen) {
      return res.status(400).json({ success: false, message: "Restaurant is currently closed and not accepting orders" });
    }

    // --- Subscription & Entitlement Check (Concurrency Safe without Transactions) ---
    const Subscription = (await import("../models/Subscription")).default;
    const { EntitlementService } = await import("../services/EntitlementService");
    
    const subscription = await Subscription.findOne({ restaurantId });

    if (subscription) {
      const hasUnlimited = EntitlementService.hasEntitlement(subscription.plan, "ORDERS_UNLIMITED");
      if (!hasUnlimited) {
        const has1000Limit = EntitlementService.hasEntitlement(subscription.plan, "ORDERS_1000_LIMIT");
        const has500Limit = EntitlementService.hasEntitlement(subscription.plan, "ORDERS_500_LIMIT");
        const maxOrders = has1000Limit ? 1000 : (has500Limit ? 500 : 0);
        
        if (maxOrders > 0 && subscription.currentPeriodStart) {
          // Atomic increment counter in a separate collection to avoid race conditions without needing replica sets
          const startIso = subscription.currentPeriodStart.toISOString();
          const limitDoc = await mongoose.connection.collection('order_limits').findOneAndUpdate(
            { restaurantId: new mongoose.Types.ObjectId(restaurantId), periodStart: startIso },
            { $inc: { count: 1 } },
            { upsert: true, returnDocument: 'after' }
          );

          const currentCount = limitDoc?.count ?? limitDoc?.value?.count ?? 1;

          if (currentCount > maxOrders) {
            // Revert the increment
            await mongoose.connection.collection('order_limits').updateOne(
              { restaurantId: new mongoose.Types.ObjectId(restaurantId), periodStart: startIso },
              { $inc: { count: -1 } }
            );
            return res.status(403).json({ success: false, message: `PLAN_LIMIT_REACHED: Your restaurant has reached its order limit of ${maxOrders} orders for the current billing period.` });
          }
        }
      }
    }

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Find the actual menu item in DB to verify price and availability
      const dbItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId });
      
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Item ${item.menuItemId} not found` });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Item ${dbItem.name} is currently unavailable` });
      }

      let itemTotal = dbItem.basePrice * item.quantity;
      let selectedSize = undefined;
      let selectedAddons = [];

      // Validate size
      if (item.selectedSize) {
        const dbSize = dbItem.sizes?.find(s => s.name === item.selectedSize.name);
        if (dbSize) {
          selectedSize = { name: dbSize.name, price: dbSize.price };
          itemTotal += dbSize.price * item.quantity;
        }
      }

      // Validate addons
      if (item.selectedAddons && Array.isArray(item.selectedAddons)) {
        for (const addon of item.selectedAddons) {
          const dbAddon = dbItem.addons?.find(a => a.name === addon.name);
          if (dbAddon) {
            selectedAddons.push({ name: dbAddon.name, price: dbAddon.price });
            itemTotal += dbAddon.price * item.quantity;
          }
        }
      }

      processedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity: item.quantity,
        basePrice: dbItem.basePrice,
        selectedSize,
        selectedAddons,
        itemTotal,
        specialInstructions: item.specialInstructions
      });

      subtotal += itemTotal;
    }

    // Server authoritative totals
    const taxRate = 0.05; // 5% default to match frontend
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const newOrder = new Order({
      restaurantId,
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      items: processedItems,
      subtotal,
      tax,
      discount: 0,
      total,
      status: "pending",
      customerNotes
    });

    // The pre-save hook will automatically assign the YYYYMMDD-XXX orderNumber
    await newOrder.save();

    // Create a PENDING cash payment by default for now
    await Payment.create({
      orderId: newOrder._id,
      restaurantId: newOrder.restaurantId,
      amount: newOrder.total,
      currency: "ETB",
      provider: "CASH",
      status: "PENDING",
      transactionReference: PaymentService.generateTransactionReference("CASH"),
    });

    // Emit realtime event to restaurant (Post-transaction)
    try {
      await NotificationService.createForRestaurant(
        restaurantId.toString(),
        "NEW_ORDER",
        "New Order Received",
        `Order #${newOrder.orderNumber} received for ETB ${newOrder.total.toFixed(2)}`,
        "ORDER",
        newOrder._id.toString()
      );

      // Create realtime notification for platform admin
      await NotificationService.createForAdmin(
        "NEW_ORDER",
        "New Platform Order",
        `Order #${newOrder.orderNumber} placed for ETB ${newOrder.total.toFixed(2)}`,
        "ORDER",
        newOrder._id.toString()
      );
      
      // Realtime emit for dashboard state update
      req.app.get("io").to(`tenant_${restaurantId}`).emit("order:new", newOrder);
      req.app.get("io").to("admin_room").emit("order:new", newOrder);
    } catch (err) {
      console.error("Failed to emit socket notification", err);
    }

    return res.status(201).json({ success: true, data: newOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
