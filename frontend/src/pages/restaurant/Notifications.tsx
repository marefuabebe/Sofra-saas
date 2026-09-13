import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Volume2,
  VolumeX,
  ArrowRight,
  CheckCheck,
  CreditCard,
  Utensils,
  Info,
  RefreshCw,
  Search,
  X,
  Clock,
  Check
} from "lucide-react";
import { Loading } from "../../components/ui";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

type FilterTab = "all" | "unread" | "order" | "verification" | "billing";

interface NotificationItem {
  id: string;
  type: string;
  category: "order" | "verification" | "billing" | "menu" | "system";
  title: string;
  message: string;
  time: string;
  relativeTime: string;
  unread: boolean;
  rawDate: Date;
  entityId?: string;
  entityType?: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("sofra_notifications_sound") !== "false";
  });

  // Pleasant Web Audio harmonic chime
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Browser autoplay restriction
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("sofra_notifications_sound", String(next));
    if (next) {
      playAudioChime();
      toast.success("Sound alerts enabled");
    } else {
      toast("Sound alerts muted", { icon: "🔇" });
    }
  };

  const formatRelativeTime = (date: Date) => {
    const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 172800) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const resolveCategory = (n: any): "order" | "verification" | "billing" | "menu" | "system" => {
    const t = `${n.type || ""} ${n.title || ""} ${n.message || ""}`.toLowerCase();
    if (t.includes("order")) return "order";
    if (t.includes("verification") || t.includes("verified") || t.includes("approved")) return "verification";
    if (t.includes("billing") || t.includes("subscription")) return "billing";
    if (t.includes("menu") || t.includes("dish")) return "menu";
    return "system";
  };

  const fetchNotifications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get("/notifications");
      if (data?.success && Array.isArray(data.data)) {
        const mapped: NotificationItem[] = data.data.map((n: any) => {
          const rawDate = new Date(n.createdAt);
          return {
            id: n._id,
            type: n.type || "info",
            category: resolveCategory(n),
            title: n.title,
            message: n.message,
            time: rawDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            relativeTime: formatRelativeTime(rawDate),
            unread: !n.isRead,
            rawDate,
            entityId: n.entityId,
            entityType: n.entityType,
          };
        });
        setNotifications(mapped);
        if (isManual) toast.success("Refreshed");
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (data: any) => {
      if (soundEnabled) playAudioChime();
      fetchNotifications();
      toast(data?.title || "New notification", { icon: "🔔" });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [soundEnabled]);

  // Always visible & usable Mark All As Read
  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      toast("All notifications are already read", { icon: "✅" });
      return;
    }
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all read", error);
      toast.error("Failed to mark notifications");
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const toggleReadStatus = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.unread) {
      await markAsRead(item.id);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: true } : n))
      );
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch (error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch {
      setNotifications([]);
    }
  };

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case "order":
        return {
          icon: ShoppingBag,
          color: "text-blue-600",
          bg: "bg-blue-50 border-blue-100",
          actionLabel: "View Order",
          actionRoute: "/dashboard/orders",
        };
      case "verification":
        return {
          icon: ShieldCheck,
          color: "text-emerald-600",
          bg: "bg-emerald-50 border-emerald-100",
          actionLabel: "Verification",
          actionRoute: "/dashboard/verification",
        };
      case "billing":
        return {
          icon: CreditCard,
          color: "text-indigo-600",
          bg: "bg-indigo-50 border-indigo-100",
          actionLabel: "Billing",
          actionRoute: "/dashboard/billing",
        };
      case "menu":
        return {
          icon: Utensils,
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-100",
          actionLabel: "Menu",
          actionRoute: "/dashboard/menu",
        };
      default:
        return {
          icon: Info,
          color: "text-purple-600",
          bg: "bg-purple-50 border-purple-100",
          actionLabel: "Dashboard",
          actionRoute: "/dashboard",
        };
    }
  };

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: unreadCount,
      order: notifications.filter((n) => n.category === "order").length,
      verification: notifications.filter((n) => n.category === "verification").length,
      billing: notifications.filter((n) => n.category === "billing").length,
    };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread" && !n.unread) return false;
      if (activeTab === "order" && n.category !== "order") return false;
      if (activeTab === "verification" && n.category !== "verification") return false;
      if (activeTab === "billing" && n.category !== "billing") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        return matchTitle || matchMsg;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  if (loading) {
    return <Loading text="Loading notifications..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20 animate-in fade-in duration-200">
      {/* ── Modern Sleek Header ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  {unreadCount} unread
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  All caught up
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live notifications for customer orders, verification status, and restaurant alerts.
            </p>
          </div>
        </div>

        {/* Action buttons with Always-Visible Mark All Read */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* Always Visible Modern "Mark All Read" Button */}
          <button
            onClick={markAllAsRead}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              unreadCount > 0
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-95"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
            title="Mark all notifications as read"
          >
            <CheckCheck className={`w-4 h-4 ${unreadCount > 0 ? "text-white" : "text-gray-400"}`} />
            <span>Mark all read</span>
          </button>

          {/* Sound alert chime toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              soundEnabled
                ? "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100/70"
                : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title={soundEnabled ? "Mute sound chime" : "Enable sound chime"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh button */}
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>

          {/* Clear all trash button */}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-gray-400 transition-colors"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Modern Controls Strip: Tabs & Search ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Minimal Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "unread"
                ? "bg-orange-500 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>Unread</span>
            {counts.unread > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  activeTab === "unread" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                }`}
              >
                {counts.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("order")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "order"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>🛍️ Orders</span>
            {counts.order > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === "order" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                }`}
              >
                {counts.order}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("verification")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "verification"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>🛡️ Verification</span>
            {counts.verification > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === "verification" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {counts.verification}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "billing"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>💳 Billing</span>
            {counts.billing > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === "billing" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {counts.billing}
              </span>
            )}
          </button>
        </div>

        {/* Compact Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Modern Notification Cards Stream ── */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {searchQuery ? "No matching alerts" : "You're all caught up!"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No notifications found matching "${searchQuery}".`
                : activeTab === "unread"
                ? "You have zero unread notifications in your queue."
                : "New incoming customer orders, verification milestones, and account updates will appear here."}
            </p>
            {(searchQuery || activeTab !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const meta = getCategoryMeta(n.category);
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                onClick={() => n.unread && markAsRead(n.id)}
                className={`group p-4 sm:p-4.5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer relative overflow-hidden ${
                  n.unread
                    ? "bg-gradient-to-r from-orange-50/40 via-amber-50/20 to-white border-orange-200 shadow-2xs hover:border-orange-300 hover:shadow-xs"
                    : "bg-white border-gray-200/70 hover:border-gray-300 shadow-2xs"
                }`}
              >
                {/* Left accent bar for unread */}
                {n.unread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                )}

                {/* Left: Icon + Text Body */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm leading-snug ${
                          n.unread ? "font-black text-gray-900" : "font-bold text-gray-700"
                        }`}
                      >
                        {n.title}
                      </h3>
                      {n.unread && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-100/80 px-2 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.relativeTime} &bull; {n.time}
                      </span>
                      {n.entityType && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                            {n.entityType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Action Button & Controls */}
                <div
                  className="flex items-center gap-2 shrink-0 self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Direct Jump Button */}
                  {meta.actionRoute && (
                    <button
                      onClick={() => {
                        if (n.unread) markAsRead(n.id);
                        navigate(meta.actionRoute);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-orange-500 hover:text-white border border-gray-200 hover:border-orange-500 text-gray-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>{meta.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Toggle Read/Unread Icon */}
                  <button
                    onClick={(e) => toggleReadStatus(n, e)}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      n.unread
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 border-gray-200"
                    }`}
                    title={n.unread ? "Mark as read" : "Mark as unread"}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* Dismiss / Delete Icon */}
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="p-1.5 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-300 hover:text-rose-600 border border-gray-200 hover:border-rose-200 transition-colors"
                    title="Dismiss alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
