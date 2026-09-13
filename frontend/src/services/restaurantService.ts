import { api, getErrorMessage } from "./api";
import { socket } from "../config/socket";
import type { Order, MenuItem } from "../types";

export const subscribeToOrders = (
  _restaurantId: string,
  callback: (orders: Order[]) => void
) => {
  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      callback(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  fetchOrders();

  socket.on("order:new", fetchOrders);
  socket.on("order:updated", fetchOrders);

  return {
    unsubscribe: () => {
      socket.off("order:new", fetchOrders);
      socket.off("order:updated", fetchOrders);
    }
  };
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  paymentData?: { paymentMethod?: string; transactionId?: string; }
) => {
  try {
    await api.put(`/orders/${orderId}/status`, { status, paymentData });
    return true;
  } catch (e) {
    return false;
  }
};

export const subscribeToMenuItems = (
  _restaurantId: string,
  callback: (items: MenuItem[]) => void
) => {
  const fetchItems = async () => {
    try {
      const { data } = await api.get("/menu");
      callback(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  fetchItems();

  socket.on("menu:updated", fetchItems);

  return {
    unsubscribe: () => {
      socket.off("menu:updated", fetchItems);
    }
  };
};

export const createMenuItem = async (item: Partial<MenuItem>) => {
  try {
    await api.post("/menu", item);
    return true;
  } catch (e) {
    return false;
  }
};

export const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
  try {
    await api.put(`/menu/${itemId}`, updates);
    return true;
  } catch (e: any) {
    console.error("Update error:", e.response?.data || e);
    return false;
  }
};

export const toggleMenuItemAvailability = async (itemId: string, isAvailable: boolean) => {
  try {
    await api.put(`/menu/${itemId}/availability`, { isAvailable });
    return true;
  } catch (e) {
    return false;
  }
};

export const toggleMenuItemFeatured = async (itemId: string, isFeatured: boolean) => {
  try {
    await api.put(`/menu/${itemId}/featured`, { isFeatured });
    return true;
  } catch (e) {
    return false;
  }
};

export const duplicateMenuItem = async (itemId: string) => {
  try {
    const { data } = await api.post(`/menu/${itemId}/duplicate`);
    return data.data;
  } catch (e) {
    return null;
  }
};

export const bulkToggleMenuItemAvailability = async (itemIds: string[], isAvailable: boolean) => {
  try {
    await api.patch("/menu/bulk/availability", { itemIds, isAvailable });
    return true;
  } catch (e) {
    return false;
  }
};

export const bulkDeleteMenuItems = async (itemIds: string[]) => {
  try {
    await api.post("/menu/bulk/delete", { itemIds });
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteMenuItem = async (itemId: string) => {
  try {
    await api.delete(`/menu/${itemId}`);
    return true;
  } catch (e) {
    return false;
  }
};

export const createOrder = async (order: Partial<Order>) => {
  try {
    const { data } = await api.post("/orders/public", order);
    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: getErrorMessage(error, "Failed to place order. Please try again.") };
  }
};

export const getRestaurantStats = async (_restaurantId: string) => {
  try {
    const { data } = await api.get("/orders/stats");
    return data.data;
  } catch (error) {
    return {
      pendingOrders: 0,
      completedToday: 0,
      revenueToday: 0,
      totalOrders: 0,
    };
  }
};

// --- Category API Methods ---

export const getCategories = async () => {
  try {
    const { data } = await api.get("/categories");
    return data.data;
  } catch (error) {
    return [];
  }
};

export const createCategory = async (category: any) => {
  try {
    await api.post("/categories", category);
    return true;
  } catch (e) {
    return false;
  }
};

export const updateCategory = async (categoryId: string, updates: any) => {
  try {
    await api.put(`/categories/${categoryId}`, updates);
    return true;
  } catch (e) {
    return false;
  }
};

export const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
  try {
    await api.patch(`/categories/${categoryId}/status`, { isActive });
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const response = await api.delete(`/categories/${categoryId}`);
    return { success: true, message: response.data.message };
  } catch (e: any) {
    return { success: false, message: getErrorMessage(e, "Failed to delete category") };
  }
};

export const reorderCategories = async (orders: { id: string; displayOrder: number }[]) => {
  try {
    const { data } = await api.patch("/categories/reorder", { orders });
    return { success: true, message: data.message };
  } catch (e: any) {
    return { success: false, message: getErrorMessage(e, "Failed to reorder categories") };
  }
};

export const bulkToggleCategoryStatus = async (ids: string[], isActive: boolean) => {
  try {
    const { data } = await api.patch("/categories/bulk-status", { ids, isActive });
    return { success: true, message: data.message };
  } catch (e: any) {
    return { success: false, message: getErrorMessage(e, "Failed to update categories") };
  }
};

