import { Request, Response } from "express";
import MenuItem from "../models/MenuItem";
import MenuCategory from "../models/MenuCategory";

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const items = await MenuItem.find({ restaurantId: restaurantId as string })
      .populate("categoryId")
      .sort({ displayOrder: 1, createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const itemData = req.body;

    // Strict validation: Verify category exists and belongs to this tenant
    const category = await MenuCategory.findOne({ _id: itemData.categoryId, restaurantId });
    if (!category) {
      return res.status(403).json({ success: false, message: "Invalid category or category belongs to another restaurant" });
    }

    const newItem = new MenuItem({
      ...itemData,
      restaurantId, // Force restaurantId from authenticated token
    });

    await newItem.save();
    
    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.status(201).json({ success: true, data: newItem });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const updates = req.body;
    
    // Delete potential malicious overrides
    delete updates.restaurantId;

    // Strict validation: if category is being changed, verify it belongs to this tenant
    if (updates.categoryId) {
      const category = await MenuCategory.findOne({ _id: updates.categoryId, restaurantId });
      if (!category) {
        return res.status(403).json({ success: false, message: "Invalid category or category belongs to another restaurant" });
      }
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string }, // Enforce tenant scoping in query
      updates,
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    return res.json({ success: true, data: item });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleMenuItemAvailability = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const { isAvailable } = req.body;

    const item = await MenuItem.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string },
      { isAvailable },
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;

    const item = await MenuItem.findOneAndDelete({ _id: id as string, restaurantId: restaurantId as string });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    return res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleMenuItemFeatured = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const { isFeatured } = req.body;

    const item = await MenuItem.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string },
      { isFeatured },
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Emit socket events
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const duplicateMenuItem = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;

    const original = await MenuItem.findOne({ _id: id as string, restaurantId: restaurantId as string });
    if (!original) return res.status(404).json({ success: false, message: "Original item not found" });

    const originalData = original.toObject() as any;
    delete originalData._id;
    delete originalData.createdAt;
    delete originalData.updatedAt;
    originalData.name = `${original.name} (Copy)`;

    const duplicatedItem = new MenuItem({
      ...originalData,
      restaurantId,
    });

    await duplicatedItem.save();

    // Emit socket events
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.status(201).json({ success: true, data: duplicatedItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to duplicate item" });
  }
};

export const bulkToggleMenuItemAvailability = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { itemIds, isAvailable } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: "itemIds array is required" });
    }

    await MenuItem.updateMany(
      { _id: { $in: itemIds }, restaurantId: restaurantId as string },
      { $set: { isAvailable: Boolean(isAvailable) } }
    );

    // Emit socket events
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.json({ success: true, message: `Updated availability for ${itemIds.length} items` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to bulk update items" });
  }
};

export const bulkDeleteMenuItems = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: "itemIds array is required" });
    }

    await MenuItem.deleteMany({
      _id: { $in: itemIds },
      restaurantId: restaurantId as string,
    });

    // Emit socket events
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.json({ success: true, message: `Deleted ${itemIds.length} items` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to bulk delete items" });
  }
};
