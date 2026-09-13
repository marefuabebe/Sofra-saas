import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle,
  Package,
  ShieldCheck,
  X,
  Store,
  ArrowRight,
  Clock,
  CheckCheck,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Utensils,
  Info
} from "lucide-react";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  role: "admin" | "owner";
}

const NotificationBell: React.FC<NotificationBellProps> = ({ role }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      if (data?.success && data?.data) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications?limit=25");
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getCategoryMeta = (type: string = "", entityType: string = "") => {
    const t = (type + " " + entityType).toLowerCase();
    if (t.includes("order")) {
      return {
        icon: ShoppingBag,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100",
        label: "Order",
      };
    }
    if (t.includes("verification") || t.includes("registration") || t.includes("kyc")) {
      return {
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
        label: "KYC",
      };
    }
    if (t.includes("menu") || t.includes("dish")) {
      return {
        icon: Utensils,
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-100",
        label: "Menu",
      };
    }
    if (t.includes("billing") || t.includes("subscription")) {
      return {
        icon: CreditCard,
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
        label: "Billing",
      };
    }
    return {
      icon: Info,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
      label: "System",
    };
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id);
    }
    setIsOpen(false);

    if (role === "admin") {
      if (n.entityType === "VERIFICATION" || n.type.includes("REGISTRATION")) {
        navigate("/admin/verification");
      } else if (n.entityType === "RESTAURANT") {
        navigate("/admin/restaurants");
      } else {
        navigate("/admin/notifications");
      }
    } else {
      if (n.entityType === "ORDER" || n.type.includes("ORDER")) {
        navigate("/dashboard/orders");
      } else if (n.entityType === "VERIFICATION" || n.type.includes("VERIFICATION")) {
        navigate("/dashboard/verification");
      } else if (n.entityType === "BILLING" || n.type.includes("BILLING") || n.type.includes("SUBSCRIPTION")) {
        navigate("/dashboard/billing");
      } else {
        navigate("/dashboard/notifications");
      }
    }
  };

  const filteredList = notifications.filter((n) => (filterTab === "unread" ? !n.isRead : true));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 focus:outline-none transition-all rounded-2xl hover:bg-gray-100 active:scale-95 group"
        title="View Notifications"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 border-2 border-white rounded-full shadow-sm animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-80 sm:w-[410px] mt-3 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 pb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black tracking-tight">Notifications</h3>
                <span className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All alerts acknowledged"}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Subheader Filter Tabs */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTab === "all"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTab === "unread"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate(role === "admin" ? "/admin/notifications" : "/dashboard/notifications");
              }}
              className="text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors"
            >
              Full Center &rarr;
            </button>
          </div>

          {/* Scrollable Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
            {filteredList.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-700 mt-1">You're completely caught up!</p>
                <p className="text-[11px] text-gray-400 max-w-xs">
                  {filterTab === "unread" ? "No unread alerts left in queue." : "No recent operational notifications logged."}
                </p>
              </div>
            ) : (
              filteredList.map((notification) => {
                const meta = getCategoryMeta(notification.type, notification.entityType);
                const IconComp = meta.icon;

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50/80 transition-all flex items-start gap-3 relative group ${
                      !notification.isRead ? "bg-orange-50/30" : ""
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg}`}
                    >
                      <IconComp className={`w-4 h-4 ${meta.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p
                            className={`text-xs truncate ${
                              !notification.isRead
                                ? "font-black text-gray-900"
                                : "font-bold text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Mark read button on hover */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-emerald-600 transition-opacity"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(role === "admin" ? "/admin/notifications" : "/dashboard/notifications");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition-colors"
            >
              <span>Open Notification Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
