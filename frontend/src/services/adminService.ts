import { api } from "./api";
import { socket } from "../config/socket";
import type { RegistrationRequest, Restaurant } from "../config/supabase";

export const subscribeToPendingRequests = (
  callback: (requests: RegistrationRequest[]) => void
) => {
  const fetchPending = async () => {
    try {
      const { data } = await api.get("/admin/requests/pending");
      callback(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  fetchPending();

  socket.on("request:new", fetchPending);
  socket.on("request:updated", fetchPending);

  return {
    unsubscribe: () => {
      socket.off("request:new", fetchPending);
      socket.off("request:updated", fetchPending);
    }
  };
};

export const createRestaurantAccount = async (
  requestId: string,
  data: { email: string; subscriptionPlan: string; internalNotes?: string; }
) => {
  try {
    const response = await api.post(`/admin/requests/${requestId}/approve`, data);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create account",
    };
  }
};

export const rejectRegistrationRequest = async (requestId: string, reason: string) => {
  try {
    await api.put(`/admin/requests/${requestId}/reject`, { reason });
    return true;
  } catch (e) {
    return false;
  }
};

export const subscribeToRestaurants = (callback: (restaurants: Restaurant[]) => void) => {
  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get("/admin/restaurants");
      callback(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  fetchRestaurants();

  socket.on("restaurant:updated", fetchRestaurants);

  return {
    unsubscribe: () => {
      socket.off("restaurant:updated", fetchRestaurants);
    }
  };
};

export const toggleRestaurantStatus = async (
  restaurantId: string,
  isCurrentlyBlocked: boolean,
  blockReason?: string
) => {
  try {
    await api.put(`/admin/restaurants/${restaurantId}/status`, {
      isActive: isCurrentlyBlocked,
      blockReason
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const getPlatformStats = async (period: string = "today") => {
  try {
    const { data } = await api.get("/admin/stats", { params: { period } });
    return data.data;
  } catch (error) {
    return {
      activeRestaurants: 0,
      totalRestaurants: 0,
      pendingRequests: 0,
      totalOrders: 0,
      underVerification: 0,
      todayRevenue: 0,
      periodRevenue: 0,
      periodOrders: 0,
      period: "today",
      periodLabel: "Today",
      sparklines: {
        orders: [0, 0, 0, 0, 0, 0, 0],
        revenue: [0, 0, 0, 0, 0, 0, 0],
        restaurants: [0, 0, 0, 0, 0, 0, 0],
        pending: [0, 0, 0, 0, 0, 0, 0],
        underVerification: [0, 0, 0, 0, 0, 0, 0],
      },
    };
  }
};

export const getAdminNotifications = async () => {
  try {
    const { data } = await api.get("/admin/notifications");
    return data.data;
  } catch (error) {
    return [];
  }
};

export const markAdminNotificationAsRead = async (id: string) => {
  try {
    const { data } = await api.put(`/admin/notifications/${id}/read`);
    return data.data;
  } catch (error) {
    return null;
  }
};

export const markAllAdminNotificationsAsRead = async () => {
  try {
    const { data } = await api.put("/admin/notifications/read-all");
    return data;
  } catch (error) {
    return null;
  }
};

export const deleteAdminNotification = async (id: string) => {
  try {
    const { data } = await api.delete(`/admin/notifications/${id}`);
    return data;
  } catch (error) {
    return null;
  }
};

export const clearAllAdminNotifications = async () => {
  try {
    const { data } = await api.delete("/admin/notifications/clear-all");
    return data;
  } catch (error) {
    return null;
  }
};

export const getAdminActivityLogs = async () => {
  try {
    const { data } = await api.get("/admin/activity");
    return data.data;
  } catch (error) {
    return [];
  }
};

export const getAllOrders = async () => {
  try {
    const { data } = await api.get("/admin/orders");
    return data.data;
  } catch (error) {
    return [];
  }
};

export const getAnalyticsData = async (period: string = "daily") => {
  try {
    const { data } = await api.get("/admin/analytics", {
      params: { period: period.toLowerCase() },
    });
    return data.data;
  } catch (error) {
    return {
      period: "daily",
      dateRangeLabel: "",
      labels: [],
      revenue: [],
      orders: [],
      orderStatus: {
        completed: 0,
        completedPct: 0,
        cancelled: 0,
        cancelledPct: 0,
        pending: 0,
        pendingPct: 0,
        total: 0,
      },
      topRestaurants: [],
      topCategories: [],
    };
  }
};

export const addRestaurant = async (data: any) => {
  try {
    const response = await api.post("/public/register", data);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add restaurant"
    };
  }
};
