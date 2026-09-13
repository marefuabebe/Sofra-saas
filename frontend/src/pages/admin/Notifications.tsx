import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, BellRing, ShieldCheck, ClipboardList, FileText,
  AlertTriangle, TrendingUp, CheckCircle, Info, Radio,
  RefreshCw, Check, CheckCheck, Trash2, X, Search, Filter,
  ChevronDown, Clock, ExternalLink, Eye, Copy, Volume2, VolumeX,
  Sparkles, LayoutGrid, List, Layers, ShieldAlert, Cpu,
  ArrowRight, Inbox, CornerDownRight
} from "lucide-react";
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications
} from "../../services/adminService";
import { formatDateTime, copyToClipboard } from "../../utils/helpers";
import { socket } from "../../config/socket";
import { useConfirm } from "../../context/ConfirmContext";
import toast from "react-hot-toast";

interface AdminNotif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  entityType?: "ORDER" | "VERIFICATION" | "RESTAURANT" | "GENERAL" | string;
  entityId?: string;
  createdAt: string;
  time?: string;
}

/* ─── Type Visual Config ─── */
const typeConfig: Record<string, {
  icon: any;
  label: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
  glow: string;
}> = {
  verification: {
    icon: ShieldCheck,
    label: "Compliance & KYC",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    glow: "shadow-emerald-500/10"
  },
  request: {
    icon: ShieldCheck,
    label: "KYC & Verification",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    glow: "shadow-emerald-500/10"
  },
  order: {
    icon: TrendingUp,
    label: "POS Order Activity",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-800",
    glow: "shadow-orange-500/10"
  },
  payment: {
    icon: AlertTriangle,
    label: "Payment & Finance",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-800",
    glow: "shadow-rose-500/10"
  },
  security: {
    icon: ShieldAlert,
    label: "Security Alert",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    glow: "shadow-red-500/10"
  },
  system: {
    icon: Cpu,
    label: "System Telemetry",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
    glow: "shadow-blue-500/10"
  },
};

/* ─── Web Audio Modern Chime Synthesizer ─── */
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second note (harmonic harmony)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore audio errors if browser blocks autoplay
  }
};

/* ─── Human Friendly Relative Time ─── */
const getRelativeTime = (dateStr: string) => {
  try {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    if (isNaN(past)) return "Just now";
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [notifs, setNotifs] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Interactive Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<AdminNotif | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("sofra_admin_sound_notif") !== "false";
  });

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem("sofra_admin_sound_notif", String(next));
      if (next) playNotificationSound();
      return next;
    });
  };

  /* ─── Fetch Notifications ─── */
  const fetchNotifs = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await getAdminNotifications();
      if (Array.isArray(data)) {
        const mapped: AdminNotif[] = data.map((n: any) => ({
          id: n._id,
          type: n.type || "system",
          title: n.title || "Notification",
          body: n.message || "",
          read: Boolean(n.isRead),
          entityType: n.entityType || "GENERAL",
          entityId: n.entityId,
          createdAt: n.createdAt || new Date().toISOString(),
          time: new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }));
        setNotifs(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();

    const handleNewNotif = (newNotif: any) => {
      if (soundEnabled) {
        playNotificationSound();
      }
      fetchNotifs(true);
    };

    socket.on("notification:new", handleNewNotif);
    socket.on("verification:updated", () => fetchNotifs(true));
    socket.on("request:new", () => fetchNotifs(true));

    return () => {
      socket.off("notification:new", handleNewNotif);
      socket.off("verification:updated");
      socket.off("request:new");
    };
  }, [soundEnabled]);

  /* ─── Counts & KPI Metrics ─── */
  const counts = useMemo(() => {
    const total = notifs.length;
    const unread = notifs.filter(n => !n.read).length;
    const verification = notifs.filter(n => n.type === "verification" || n.entityType === "VERIFICATION" || n.type === "request" || n.type === "registration").length;
    const orders = notifs.filter(n => n.type === "order" || n.entityType === "ORDER").length;
    const system = notifs.filter(n => n.type === "system" || n.type === "security").length;

    return { total, unread, verification, orders, system };
  }, [notifs]);

  /* ─── Filtered & Sorted Notifications ─── */
  const filtered = useMemo(() => {
    return notifs
      .filter(n => {
        // Tab filter
        if (activeTab === "unread" && n.read) return false;
        if (activeTab === "verification" && !(n.type === "verification" || n.entityType === "VERIFICATION" || n.type === "request" || n.type === "registration")) return false;
        if (activeTab === "order" && !(n.type === "order" || n.entityType === "ORDER")) return false;
        if (activeTab === "system" && !(n.type === "system" || n.type === "security")) return false;

        // Read/Unread dropdown
        if (readFilter === "unread" && n.read) return false;
        if (readFilter === "read" && !n.read) return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchBody = n.body?.toLowerCase().includes(q);
          const matchType = n.type?.toLowerCase().includes(q);
          const matchEntity = n.entityType?.toLowerCase().includes(q) || n.entityId?.toLowerCase().includes(q);
          return matchTitle || matchBody || matchType || matchEntity;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [notifs, activeTab, readFilter, search, sortOrder]);

  /* ─── Handlers ─── */
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic UI update
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await markAdminNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await markAllAdminNotificationsAsRead();
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifs(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
    await deleteAdminNotification(id);
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: "Clear All Admin Notifications?",
      message: "Are you sure you want to permanently clear all administrator alerts? This action cannot be undone.",
      confirmText: "Clear All",
      cancelText: "Keep Alerts",
      type: "danger",
    });
    if (!confirmed) return;
    setNotifs([]);
    setSelectedIds([]);
    await clearAllAdminNotifications();
    toast.success("All alerts cleared.");
  };

  /* ─── Batch Selection Handlers ─── */
  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(n => n.id));
    }
  };

  const toggleSelect = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchMarkRead = async () => {
    const count = selectedIds.length;
    setNotifs(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
    for (const id of selectedIds) {
      await markAdminNotificationAsRead(id);
    }
    setSelectedIds([]);
    toast.success(`${count} notification${count > 1 ? "s" : ""} marked as read.`);
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.length;
    const confirmed = await confirm({
      title: `Delete ${count} Selected Alert${count > 1 ? "s" : ""}?`,
      message: "Are you sure you want to permanently remove these notifications?",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    setNotifs(prev => prev.filter(n => !selectedIds.includes(n.id)));
    for (const id of selectedIds) {
      await deleteAdminNotification(id);
    }
    setSelectedIds([]);
    toast.success(`${count} notification${count > 1 ? "s" : ""} deleted.`);
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ─── Direct Navigation from Notification ─── */
  const handleDirectAction = (n: AdminNotif, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleMarkAsRead(n.id);

    if (n.type === "order" || n.entityType === "ORDER") {
      navigate("/admin/orders");
    } else if (n.type === "verification" || n.type === "request" || n.type === "registration" || n.entityType === "VERIFICATION") {
      navigate("/admin/verification");
    } else {
      navigate("/admin/activity");
    }
  };

  /* ─── Tab definitions ─── */
  const tabs = [
    { key: "all", label: "All Alerts", count: counts.total },
    { key: "unread", label: "Unread", count: counts.unread, alert: counts.unread > 0 },
    { key: "verification", label: "KYC & Verification", count: counts.verification },
    { key: "order", label: "POS Orders", count: counts.orders },
    { key: "system", label: "System Alerts", count: counts.system },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ── TOP FUTURISTIC DISPATCH & COMMAND RIBBON ── */}
      <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-black text-white rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <BellRing className="w-6 h-6 text-[#F97316] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Alert & Dispatch Command Center
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Stream Connected
              </span>
              {counts.unread > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> {counts.unread} Actionable
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Real-time broadcast stream, restaurant KYC compliance notifications, order events, and system alerts.
            </p>
          </div>
        </div>

        {/* Controls & Quick Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
            }`}
            title={soundEnabled ? "Sound Alerts: ON (click to mute)" : "Sound Alerts: OFF (click to unmute)"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="hidden sm:inline">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Sync Refresh */}
          <button
            onClick={() => fetchNotifs()}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:border-white/20 disabled:opacity-50"
            title="Force refresh alerts from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#F97316]" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Mark all as read */}
          {counts.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {/* Clear All */}
          {notifs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-white/10 text-gray-400 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4 EXECUTIVE ALERT KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Ingested Alerts */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Ingested</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{counts.total}</span>
            <span className="text-[11px] font-semibold text-gray-400">broadcasts</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${counts.total > 0 ? ((counts.total - counts.unread) / counts.total) * 100 : 100}%` }}
                className="bg-emerald-500"
                title="Read"
              />
              <div
                style={{ width: `${counts.total > 0 ? (counts.unread / counts.total) * 100 : 0}%` }}
                className="bg-amber-500"
                title="Unread"
              />
            </div>
            <span className="text-[10px] font-bold text-gray-400">
              {counts.total > 0 ? Math.round(((counts.total - counts.unread) / counts.total) * 100) : 100}% Read
            </span>
          </div>
        </div>

        {/* Actionable / Unread */}
        <div
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-shadow ${
            counts.unread > 0 ? "border-amber-200 ring-1 ring-amber-400/20" : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Actionable / Unread</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{counts.unread}</span>
            {counts.unread > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Attention
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Pending acknowledgment</p>
        </div>

        {/* KYC & Compliance */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">KYC Compliance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{counts.verification}</span>
            <span className="text-[11px] font-semibold text-emerald-600/80">submissions</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Licensing & verification events</p>
        </div>

        {/* Platform & System */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Ops & System</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600">
              {counts.orders + counts.system}
            </span>
            <span className="text-[11px] font-semibold text-purple-600/80">events</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Orders & infrastructure alerts</p>
        </div>
      </div>

      {/* ── CATEGORY TABS BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm ring-1 ring-black"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.alert
                    ? "bg-amber-100 text-amber-700 font-extrabold"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Omni-search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts: Title, Message, Restaurant name, Entity ID..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Read/Unread selector */}
          <div className="relative">
            <select
              value={readFilter}
              onChange={e => setReadFilter(e.target.value as any)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100/80 cursor-pointer outline-none focus:border-[#F97316]"
            >
              <option value="all">All States</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Chronological sort toggle */}
          <button
            onClick={() => setSortOrder(prev => (prev === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors"
            title={`Sort order: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`}
          >
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>

          {/* Reset button */}
          {(search || activeTab !== "all" || readFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setReadFilter("all");
              }}
              className="text-xs text-rose-600 font-bold px-2 py-1 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── NOTIFICATIONS STREAM CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Table/List Subheader */}
        <div className="px-6 py-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.length === filtered.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
            />
            <span className="uppercase tracking-wider text-[11px]">Select All Visible</span>
          </div>
          <span>Showing {filtered.length} Alert{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="text-center py-24">
            <div className="animate-spin w-8 h-8 border-3 border-[#F97316] border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-semibold text-gray-500 mt-3">Listening to notification stream...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Notifications in this Filter</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              All caught up! There are no alerts matching your selected category and search keywords.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setReadFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Stream List */
          <div className="divide-y divide-gray-100">
            {filtered.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.system;
              const IconComponent = cfg.icon;
              const isSelected = selectedIds.includes(n.id);

              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotif(n)}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4 transition-colors cursor-pointer group ${
                    !n.read
                      ? "bg-orange-50/20 hover:bg-orange-50/30"
                      : "hover:bg-gray-50/80"
                  } ${isSelected ? "bg-orange-100/30 ring-1 ring-inset ring-[#F97316]/30" : ""}`}
                >
                  {/* Left Side: Checkbox + Icon + Content */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Checkbox */}
                    <div className="mt-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => toggleSelect(n.id, e)}
                        className="rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                      />
                    </div>

                    {/* Category Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.glow} mt-0.5 shadow-2xs`}
                    >
                      <IconComponent className={`w-5 h-5 ${cfg.text}`} />
                    </div>

                    {/* Message & Title */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.border} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>

                        {!n.read && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F97316] bg-orange-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-ping" /> NEW
                          </span>
                        )}

                        {n.entityType && (
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                            {n.entityType}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm mt-1 leading-snug group-hover:text-[#F97316] transition-colors ${
                          !n.read ? "font-black text-gray-900" : "font-bold text-gray-700"
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(n.createdAt)} ({n.time})
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quick Action Buttons */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-center flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Direct Action Link */}
                    {(n.type === "verification" || n.type === "request" || n.type === "registration" || n.type === "order" || n.entityType === "VERIFICATION" || n.entityType === "ORDER") && (
                      <button
                        onClick={e => handleDirectAction(n, e)}
                        className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        <span>
                          {n.type === "order" || n.entityType === "ORDER" ? "View Order" : "Review KYC"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Mark as read button */}
                    {!n.read ? (
                      <button
                        onClick={e => handleMarkAsRead(n.id, e)}
                        className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x));
                        }}
                        className="p-1.5 rounded-xl border border-transparent text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Mark as unread"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                      </button>
                    )}

                    {/* Inspect Payload */}
                    <button
                      onClick={() => setSelectedNotif(n)}
                      className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                      title="Inspect Alert Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={e => handleDelete(n.id, e)}
                      className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* End of Stream marker */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 font-medium justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>End of Real-time Alert Dispatch Stream</span>
          </div>
        )}
      </div>

      {/* ── FLOATING MULTI-SELECT BATCH ACTION DOCK ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
            <span className="text-xs font-black">
              {selectedIds.length} Alert{selectedIds.length > 1 ? "s" : ""} Selected
            </span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={handleBatchMarkRead}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-400 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark Read
          </button>
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ── ENHANCED ALERT INSPECTOR & PAYLOAD MODAL ── */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-gray-950 via-zinc-900 to-black text-white border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    typeConfig[selectedNotif.type]?.bg || "bg-orange-50"
                  } ${typeConfig[selectedNotif.type]?.border || "border-orange-200"}`}
                >
                  {React.createElement(typeConfig[selectedNotif.type]?.icon || Bell, {
                    className: `w-6 h-6 ${typeConfig[selectedNotif.type]?.text || "text-orange-600"}`
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-lg tracking-tight">
                      {selectedNotif.title}
                    </h3>
                    {!selectedNotif.read ? (
                      <span className="bg-[#F97316] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        UNREAD
                      </span>
                    ) : (
                      <span className="bg-white/10 text-gray-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        READ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Dispatch Channel: <span className="text-zinc-200 font-semibold">{typeConfig[selectedNotif.type]?.label || selectedNotif.type}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-gray-50/50">
              {/* Message Banner */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Dispatch Message Body
                </span>
                <p className="text-base font-semibold text-gray-900 leading-relaxed">
                  {selectedNotif.body}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Timestamp Registered
                  </span>
                  <p className="text-sm font-bold text-gray-900">{formatDateTime(selectedNotif.createdAt)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getRelativeTime(selectedNotif.createdAt)}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Entity Target & Reference
                  </span>
                  <p className="text-sm font-mono font-bold text-gray-900">
                    {selectedNotif.entityType || "PLATFORM_BROADCAST"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    ID: {selectedNotif.entityId || selectedNotif.id}
                  </p>
                </div>
              </div>

              {/* Raw JSON Payload Inspector */}
              <div className="bg-[#0D1117] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-zinc-800">
                  <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Raw Notification Object (JSON)
                  </span>
                  <button
                    onClick={() => handleCopy(`notif-json-${selectedNotif.id}`, JSON.stringify(selectedNotif, null, 2))}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedId === `notif-json-${selectedNotif.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-h-56">
                  <pre className="text-xs font-mono leading-relaxed text-[#E6EDF3]">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify(selectedNotif, null, 2)
                          .replace(/"([^"]+)":/g, '<span class="text-[#7EE787]">"$1"</span>:')
                          .replace(/: "(.*?)"/g, ': <span class="text-[#A5D6FF]">"$1"</span>')
                          .replace(/: ([0-9]+)/g, ': <span class="text-[#79C0FF]">$1</span>')
                          .replace(/: (true|false|null)/g, ': <span class="text-[#FF7B72]">$1</span>')
                      }}
                    />
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
              {(selectedNotif.type === "verification" || selectedNotif.type === "request" || selectedNotif.type === "order") ? (
                <button
                  onClick={() => {
                    const target = selectedNotif;
                    setSelectedNotif(null);
                    handleDirectAction(target);
                  }}
                  className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Open Target Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-xs text-gray-400">Standard system broadcast</span>
              )}

              <button
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
