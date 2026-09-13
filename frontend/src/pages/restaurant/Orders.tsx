import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Clock, CheckCircle, XCircle, Package, Phone, User,
  Bell, Filter, Eye, Download, RefreshCw,
  Search, ChevronRight, Printer, AlertTriangle,
  ArrowRight, Copy, Check, Sparkles, ChefHat, Flame, ShoppingBag,
  ExternalLink, Calendar, MapPin, Store
} from "lucide-react";
import { Card, Button, Badge, Loading } from "../../components/ui";
import {
  subscribeToOrders,
  updateOrderStatus,
} from "../../services/restaurantService";
import type { Order } from "../../types";
import { formatDateTime, formatCurrency, playSound, copyToClipboard } from "../../utils/helpers";
import { useConfirm } from "../../context/ConfirmContext";
import toast from "react-hot-toast";

type ViewMode = "table" | "kanban";

const Orders: React.FC = () => {
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_price">("newest");
  const [viewMode] = useState<ViewMode>("table");
  const [soundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const prevOrderCountRef = useRef(0);
  const prevOrdersRef = useRef<Order[]>([]);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const fetchOrdersDirect = async () => {
    setIsRefreshing(true);
    try {
      const { api } = await import("../../services/api");
      const { data } = await api.get("/orders");
      if (data?.data) {
        setOrders(data.data);
      }
      toast.success("Order stream synced");
    } catch (e) {
      console.error(e);
      toast.error("Failed to sync orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const subscription = subscribeToOrders("any", (data) => {
      // Play sound if new order arrived
      if (data && data.length > prevOrderCountRef.current && soundEnabledRef.current) {
        const newPending = data.filter(
          (order) =>
            order.status === "pending" && !prevOrdersRef.current.find((o) => o._id === order._id)
        );
        if (newPending.length > 0) {
          playSound("notification");
          toast(`New order #${newPending[0].orderNumber || "received"}!`, {
            icon: "🔔",
            duration: 4000,
          });
        }
      }
      prevOrderCountRef.current = data?.length || 0;
      prevOrdersRef.current = data || [];
      setOrders(data || []);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle status update with instant local reflect & toast
  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      const label =
        newStatus === "accepted" ? "Order Accepted" :
        newStatus === "preparing" ? "Kitchen Cooking Started" :
        newStatus === "ready" ? "Order Ready for Dispatch" :
        newStatus === "completed" ? "Order Completed & Delivered" :
        `Order ${newStatus}`;
      toast.success(label);
    } else {
      toast.error("Failed to update order status");
    }
  };

  // Reject / Cancel Order confirmation
  const handleRejectOrder = async (order: Order) => {
    const confirmed = await confirm({
      title: `Cancel Order #${order.orderNumber}?`,
      message: `Are you sure you want to cancel this order for ${order.customerName || "Customer"}? This cannot be undone.`,
      confirmText: "Yes, Cancel Order",
      cancelText: "Keep Order",
      type: "danger",
    });

    if (confirmed) {
      await handleStatusUpdate(order._id!, "cancelled");
      setShowDetailsModal(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Metric computations
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => ["accepted", "preparing"].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const cancelledCount = orders.filter((o) => ["cancelled", "rejected"].includes(o.status)).length;
  
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // Filtering & Sorting
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter === "pending" && order.status !== "pending") return false;
        if (statusFilter === "active" && !["accepted", "preparing"].includes(order.status)) return false;
        if (statusFilter === "ready" && order.status !== "ready") return false;
        if (statusFilter === "completed" && order.status !== "completed") return false;
        if (statusFilter === "cancelled" && !["cancelled", "rejected"].includes(order.status)) return false;

        // Order Type filter
        if (orderTypeFilter === "dine_in" && !(order.orderType === "qr" || order.orderType === "table" || order.tableNumber)) return false;
        if (orderTypeFilter === "takeaway" && order.orderType !== "counter" && (order.orderType as string) !== "takeaway") return false;
        if (orderTypeFilter === "delivery" && (order.orderType as string) !== "delivery") return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = order.orderNumber?.toLowerCase().includes(q);
          const matchCustomer = order.customerName?.toLowerCase().includes(q);
          const matchPhone = order.customerPhone?.toLowerCase().includes(q);
          const matchTable = String(order.tableNumber || "").toLowerCase().includes(q);
          const matchItems = order.items?.some((i) => i.name?.toLowerCase().includes(q));
          if (!matchNumber && !matchCustomer && !matchPhone && !matchTable && !matchItems) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "highest_price") {
          return (b.total || 0) - (a.total || 0);
        }
        // newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, statusFilter, orderTypeFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order ID", "Customer", "Phone", "Table", "Type", "Status", "Items Count", "Total (ETB)", "Date Time"];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || o._id}"`,
      `"${o.customerName || "Guest"}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.tableNumber || ""}"`,
      `"${o.orderType || "standard"}"`,
      `"${o.status}"`,
      o.items?.length || 0,
      (o.total || 0).toFixed(2),
      `"${formatDateTime(o.createdAt)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restaurant_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
            <span>Pending</span>
          </span>
        );
      case "accepted":
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Flame className="w-3 h-3 text-blue-500" />
            <span>Cooking</span>
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Package className="w-3 h-3 text-purple-500" />
            <span>Ready</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Completed</span>
          </span>
        );
      case "cancelled":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <Loading text="Initializing live kitchen stream..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Top Live Kitchen Command & Telemetry Ribbon ─── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Kitchen Command Link: Active</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              FIFO Kitchen Queue · Real-time Socket
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Orders & Dispatch
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                {pendingCount} Pending Action
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Accept, prepare, and track customer dine-in, takeaway, and delivery orders with instant kitchen sync.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs"
            title="Export filtered orders to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchOrdersDirect}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            title="Force refresh order stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Executive Order Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Card 1: Pending */}
        <div className={`bg-white rounded-2xl p-5 border shadow-2xs transition-all ${
          pendingCount > 0 ? "border-amber-300 bg-amber-50/20 shadow-amber-500/5" : "border-gray-100"
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pending Action
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              pendingCount > 0 ? "bg-amber-100 text-amber-600 animate-bounce" : "bg-gray-100 text-gray-500"
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap mb-1">
            {pendingCount}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? "bg-amber-500" : "bg-gray-300"}`} />
            <span>{pendingCount > 0 ? "Requires kitchen accept" : "All orders accepted"}</span>
          </p>
        </div>

        {/* Card 2: Preparing */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active in Kitchen
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap mb-1">
            {preparingCount}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Cooking & preparation</span>
          </p>
        </div>

        {/* Card 3: Ready for Pickup */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ready for Dispatch
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap mb-1">
            {readyCount}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Awaiting server or customer</span>
          </p>
        </div>

        {/* Card 4: Fulfilled Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Fulfilled Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap mb-1">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{completedCount} orders successfully served</span>
          </p>
        </div>
      </div>

      {/* ─── Search & Smart Filter Control Center ─── */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
        {/* Status Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          {[
            { id: "all", label: "All Orders", count: orders.length },
            { id: "pending", label: "Pending", count: pendingCount, highlight: pendingCount > 0 },
            { id: "active", label: "Cooking", count: preparingCount },
            { id: "ready", label: "Ready", count: readyCount },
            { id: "completed", label: "Completed", count: completedCount },
            { id: "cancelled", label: "Cancelled", count: cancelledCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.highlight
                    ? "bg-orange-500 text-white animate-pulse"
                    : "bg-gray-200/80 text-gray-700"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Omni-search & Selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order #, Customer, Phone, Table, or Dish name..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dining Type Selector */}
          <select
            value={orderTypeFilter}
            onChange={(e) => {
              setOrderTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
          >
            <option value="all">All Service Types</option>
            <option value="dine_in">Dine-in (Table)</option>
            <option value="takeaway">Takeaway (Counter)</option>
            <option value="delivery">Delivery</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: FIFO (Oldest First)</option>
            <option value="highest_price">Sort: Highest Total</option>
          </select>
        </div>
      </div>

      {/* ─── DUAL VIEW RENDERER ─── */}
      {viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No Orders Match Your Filters</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Try switching the status tab or clearing your search term to see other kitchen orders.
              </p>
              {(searchQuery || statusFilter !== "all" || orderTypeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setOrderTypeFilter("all");
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                      <th className="py-3.5 px-5">Order ID</th>
                      <th className="py-3.5 px-5">Customer & Service</th>
                      <th className="py-3.5 px-5">Dishes Ordered</th>
                      <th className="py-3.5 px-5">Total</th>
                      <th className="py-3.5 px-5">Kitchen Status</th>
                      <th className="py-3.5 px-5">Time</th>
                      <th className="py-3.5 px-5 text-right">Kitchen Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {paginatedOrders.map((order) => {
                      const isPending = order.status === "pending";
                      const isCooking = ["accepted", "preparing"].includes(order.status);
                      const isReady = order.status === "ready";
                      const isCompleted = order.status === "completed";

                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-orange-50/20 transition-colors group"
                        >
                          {/* Order ID */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-gray-900">
                                #{order.orderNumber || (order._id ? order._id.slice(-6) : "------")}
                              </span>
                              <button
                                onClick={() => handleCopy(order.orderNumber || order._id || "", order._id || "")}
                                className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                title="Copy Order Number"
                              >
                                {copiedId === order._id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="mt-1">
                              {order.tableNumber ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black">
                                  Table {order.tableNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold capitalize">
                                  {order.orderType || "Takeaway"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-5">
                            <p className="font-bold text-gray-900 truncate max-w-[160px]">
                              {order.customerName || "Guest Customer"}
                            </p>
                            {order.customerPhone && (
                              <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-gray-400" />
                                <span>{order.customerPhone}</span>
                              </p>
                            )}
                          </td>

                          {/* Items Summary */}
                          <td className="py-4 px-5">
                            <div className="font-bold text-gray-900">
                              {order.items?.length || 0} dish{(order.items?.length || 0) === 1 ? "" : "es"}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate max-w-[220px] mt-0.5">
                              {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "Custom item"}
                            </div>
                          </td>

                          {/* Total Price */}
                          <td className="py-4 px-5">
                            <span className="font-black text-gray-900 whitespace-nowrap text-sm">
                              {formatCurrency(order.total || 0)}
                            </span>
                            <div className="text-[10px] text-gray-400 capitalize">
                              {order.paymentMethod || "Cash on Delivery"}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-5">
                            {getStatusBadge(order.status)}
                          </td>

                          {/* Time */}
                          <td className="py-4 px-5">
                            <p className="font-bold text-gray-800">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Now"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : ""}
                            </p>
                          </td>

                          {/* Kitchen Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* 1-Click Status Progression */}
                              {isPending && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id!, "accepted")}
                                  className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/20"
                                >
                                  Accept & Cook
                                </button>
                              )}

                              {isCooking && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id!, "ready")}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20"
                                >
                                  Mark Ready
                                </button>
                              )}

                              {isReady && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id!, "completed")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                                >
                                  Complete
                                </button>
                              )}

                              {/* Details Modal */}
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors border border-gray-200"
                                title="View Ticket & Print Receipt"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-gray-500 font-medium">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of{" "}
                  {filteredOrders.length} total orders
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 font-black text-gray-900 shadow-2xs">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ─── KITCHEN KANBAN PIPELINE VIEW ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Column 1: Pending */}
          <div className="bg-white rounded-3xl p-4 border border-amber-200/80 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Incoming Orders
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                {orders.filter((o) => o.status === "pending").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {orders.filter((o) => o.status === "pending").length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No incoming orders
                </div>
              ) : (
                orders
                  .filter((o) => o.status === "pending")
                  .map((order) => (
                    <div
                      key={order._id}
                      className="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-black text-gray-900 text-sm">
                            #{order.orderNumber}
                          </span>
                          {order.tableNumber ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                              Table {order.tableNumber}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold capitalize">
                              {order.orderType || "Takeaway"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {order.customerName || "Customer"}
                        </p>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold">{item.quantity}x {item.name}</span>
                              <span className="text-gray-400">{formatCurrency(item.itemTotal || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between">
                        <span className="font-black text-gray-900 text-sm">
                          {formatCurrency(order.total || 0)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 bg-white"
                            title="Inspect ticket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id!, "accepted")}
                            className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-2xs"
                          >
                            Accept ➔
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="bg-white rounded-3xl p-4 border border-blue-200/80 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Cooking / Preparing
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                {orders.filter((o) => ["accepted", "preparing"].includes(o.status)).length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {orders.filter((o) => ["accepted", "preparing"].includes(o.status)).length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No orders cooking
                </div>
              ) : (
                orders
                  .filter((o) => ["accepted", "preparing"].includes(o.status))
                  .map((order) => (
                    <div
                      key={order._id}
                      className="bg-blue-50/30 border border-blue-200/60 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-black text-gray-900 text-sm">
                            #{order.orderNumber}
                          </span>
                          {order.tableNumber ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black">
                              Table {order.tableNumber}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold capitalize">
                              {order.orderType || "Takeaway"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {order.customerName || "Customer"}
                        </p>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold">{item.quantity}x {item.name}</span>
                              <span className="text-gray-400">{formatCurrency(item.itemTotal || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-200/40 flex items-center justify-between">
                        <span className="font-black text-gray-900 text-sm">
                          {formatCurrency(order.total || 0)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 bg-white"
                            title="Inspect ticket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id!, "ready")}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                          >
                            Mark Ready ➔
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Column 3: Ready */}
          <div className="bg-white rounded-3xl p-4 border border-purple-200/80 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Ready for Dispatch
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                {orders.filter((o) => o.status === "ready").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {orders.filter((o) => o.status === "ready").length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No orders ready
                </div>
              ) : (
                orders
                  .filter((o) => o.status === "ready")
                  .map((order) => (
                    <div
                      key={order._id}
                      className="bg-purple-50/30 border border-purple-200/60 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-black text-gray-900 text-sm">
                            #{order.orderNumber}
                          </span>
                          {order.tableNumber ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">
                              Table {order.tableNumber}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold capitalize">
                              {order.orderType || "Takeaway"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {order.customerName || "Customer"}
                        </p>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold">{item.quantity}x {item.name}</span>
                              <span className="text-gray-400">{formatCurrency(item.itemTotal || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-200/40 flex items-center justify-between">
                        <span className="font-black text-gray-900 text-sm">
                          {formatCurrency(order.total || 0)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 bg-white"
                            title="Inspect ticket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id!, "completed")}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                          >
                            Delivered ✔️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="bg-white rounded-3xl p-4 border border-emerald-200/80 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Completed / Served
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                {orders.filter((o) => o.status === "completed").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {orders.filter((o) => o.status === "completed").length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No completed orders yet
                </div>
              ) : (
                orders
                  .filter((o) => o.status === "completed")
                  .slice(0, 15)
                  .map((order) => (
                    <div
                      key={order._id}
                      className="bg-emerald-50/20 border border-emerald-200/60 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gray-900 text-xs">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {order.customerName || "Customer"} · {order.items?.length || 0} items
                      </p>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">
                          {formatCurrency(order.total || 0)}
                        </span>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        >
                          <span>Receipt</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Interactive Kitchen Receipt & Order Details Drawer/Modal ─── */}
      {showDetailsModal && selectedOrder && (
        <div 
          onClick={() => setShowDetailsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                    Kitchen Ticket
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Quick Status Stepper */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Workflow Status
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder._id!, "pending")}
                    className={`py-2 px-1 text-center rounded-xl font-bold text-[10px] transition-all ${
                      selectedOrder.status === "pending"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    1. Pending
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder._id!, "preparing")}
                    className={`py-2 px-1 text-center rounded-xl font-bold text-[10px] transition-all ${
                      ["accepted", "preparing"].includes(selectedOrder.status)
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    2. Cooking
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder._id!, "ready")}
                    className={`py-2 px-1 text-center rounded-xl font-bold text-[10px] transition-all ${
                      selectedOrder.status === "ready"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    3. Ready
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder._id!, "completed")}
                    className={`py-2 px-1 text-center rounded-xl font-bold text-[10px] transition-all ${
                      selectedOrder.status === "completed"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    4. Completed
                  </button>
                </div>
              </div>

              {/* Customer & Service Card */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
                  Customer & Service Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Customer Name</span>
                    <span className="font-bold text-gray-900">{selectedOrder.customerName || "Guest"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Service Mode</span>
                    <span className="font-bold text-gray-900 capitalize">{selectedOrder.orderType || "Dine In"}</span>
                  </div>
                  {selectedOrder.customerPhone && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Phone Number</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-gray-900">{selectedOrder.customerPhone}</span>
                        <button
                          onClick={() => handleCopy(selectedOrder.customerPhone!, "phone")}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedOrder.tableNumber && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Assigned Table</span>
                      <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        Table {selectedOrder.tableNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Kitchen Ticket */}
              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
                  Itemized Order Items
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                        </div>
                        {item.selectedSize && (
                          <p className="text-[11px] text-gray-500 mt-1 pl-7">
                            Size: <span className="font-medium text-gray-700">{item.selectedSize.name}</span>
                          </p>
                        )}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-[11px] text-gray-500 pl-7">
                            Add-ons: <span className="font-medium text-gray-700">{item.selectedAddons.map((a: any) => a.name).join(", ")}</span>
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1.5 font-medium pl-7">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 text-xs whitespace-nowrap">
                        {formatCurrency(item.itemTotal || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                {selectedOrder.tax ? (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax & VAT</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                ) : null}
                {selectedOrder.discount ? (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-base text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => handleRejectOrder(selectedOrder)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel Order
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toast.success("Printing Kitchen Receipt ticket...");
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
