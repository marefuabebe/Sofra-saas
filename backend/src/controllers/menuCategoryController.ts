import { Request, Response } from "express";
import mongoose from "mongoose";
import MenuCategory from "../models/MenuCategory";
import MenuItem from "../models/MenuItem";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId; // Set by tenantMiddleware
    const categories = await MenuCategory.find({ restaurantId: restaurantId as string })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // Attach itemCount for each category
    const categoryIds = categories.map((c) => c._id);
    const itemCounts = await MenuItem.aggregate([
      { 
        $match: { 
          categoryId: { $in: categoryIds }, 
          restaurantId: new mongoose.Types.ObjectId(restaurantId as string) 
        } 
      },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } }
    ]);

    const countMap: Record<string, number> = {};
    itemCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const categoriesWithCount = categories.map((c) => ({
      ...c,
      itemCount: countMap[c._id.toString()] || 0
    }));

    return res.json({ success: true, data: categoriesWithCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { name, description, icon, displayOrder, isActive } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const newCategory = new MenuCategory({
      restaurantId,
      name,
      description,
      icon: icon || "🍽️",
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await newCategory.save();
    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.status(201).json({ success: true, data: newCategory });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Category with this name already exists" });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const { name, description, icon, displayOrder, isActive } = req.body;
    
    const updateData: any = { name, description, displayOrder, isActive };
    if (icon !== undefined) updateData.icon = icon;

    const category = await MenuCategory.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string }, // Tenant isolation
      updateData,
      { new: true }
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    
    return res.json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Category with this name already exists" });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await MenuCategory.findOneAndUpdate(
      { _id: id as string, restaurantId: restaurantId as string },
      { isActive },
      { new: true }
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    
    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { orders } = req.body; // array of { id, displayOrder }
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: "Invalid orders array" });
    }

    const bulkOps = orders.map((item: { id: string; displayOrder: number }) => ({
      updateOne: {
        filter: { _id: item.id, restaurantId: restaurantId as string },
        update: { $set: { displayOrder: item.displayOrder } }
      }
    }));

    if (bulkOps.length > 0) {
      await MenuCategory.bulkWrite(bulkOps);
      req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
      req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    }

    return res.json({ success: true, message: "Categories reordered successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const bulkToggleStatus = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    await MenuCategory.updateMany(
      { _id: { $in: ids }, restaurantId: restaurantId as string },
      { $set: { isActive } }
    );

    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");

    return res.json({ success: true, message: "Categories updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.tenantId;
    const { id } = req.params;

    // Check for dependent items
    const dependentItems = await MenuItem.countDocuments({ 
      categoryId: id as string,
      restaurantId: restaurantId as string 
    });

    if (dependentItems > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category because it is used by ${dependentItems} menu item(s). Reassign them first.` 
      });
    }

    const category = await MenuCategory.findOneAndDelete({ 
      _id: id as string, 
      restaurantId: restaurantId as string 
    });
    
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    // Emit socket event to tenant room and public room
    req.app.get("io").to(`tenant_${restaurantId}`).emit("menu:updated");
    req.app.get("io").to(`public_restaurant_${restaurantId}`).emit("menu:updated");
    
    return res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

