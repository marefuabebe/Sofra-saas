import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Search,
  FileText,
  BarChart3,
  Layers,
  CreditCard,
  Smartphone,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, Loading } from "../../components/ui";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import { formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";

type DateRangeOption = "1" | "7" | "30" | "90" | "365" | "all";
type ActiveTab = "overview" | "menu" | "channels" | "rush";

interface TopDish {
  name: string;
  count: number;
  revenue: number;
  avgPrice: number;
  revenueShare: number;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Controls & Filters
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [revenueGrouping, setRevenueGrouping] = useState<"daily" | "weekly" | "monthly">("daily");
  const [ordersGrouping, setOrdersGrouping] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dishSearch, setDishSearch] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("pro");
  const [showEnterpriseExportModal, setShowEnterpriseExportModal] = useState(false);
  const navigate = useNavigate();

  const isEnterprise = subscriptionPlan === "enterprise" || subscriptionPlan === "free_trial";

  // Fetch orders from API
  const fetchOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: response } = await api.get("/orders");
      if (response.success && Array.isArray(response.data)) {
        setRawOrders(response.data);
        setLastRefreshed(new Date());
        if (isManualRefresh) {
          toast.success("Analytics data updated with latest orders");
        }
      } else {
        throw new Error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching report orders:", error);
      toast.error("Could not refresh orders telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const fetchSubscription = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.data?.subscription?.plan) {
          setSubscriptionPlan(data.data.subscription.plan.toLowerCase());
        }
      } catch (err) {
        console.error("Failed to check subscription for reports:", err);
      }
    };
    fetchSubscription();

    const handleRealtimeUpdate = () => {
      fetchOrders(false);
    };

    socket.on("order:new", handleRealtimeUpdate);
    socket.on("order:updated", handleRealtimeUpdate);

    return () => {
      socket.off("order:new", handleRealtimeUpdate);
      socket.off("order:updated", handleRealtimeUpdate);
    };
  }, []);

  // ─── Filter Orders into Current & Previous Comparison Periods ───
  const { currentOrders, previousOrders, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let label = "Last 30 Days";

    if (dateRange === "1") {
      label = "Today";
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (dateRange === "7") {
      label = "Last 7 Days";
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30") {
      label = "Last 30 Days";
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90") {
      label = "Last 90 Days";
      currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "365") {
      label = "Past Year";
      currentStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      previousStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
    } else {
      label = "All Time";
      currentStart = new Date(0);
      previousStart = new Date(0);
    }

    const validStatuses = ["completed", "ready", "preparing", "accepted"];

    const curr = rawOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= currentStart && validStatuses.includes(o.status);
    });

    const prev = rawOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (dateRange === "1") {
        return (
          orderDate >= previousStart &&
          orderDate < currentStart &&
          validStatuses.includes(o.status)
        );
      }
      return (
        orderDate >= previousStart &&
        orderDate < currentStart &&
        validStatuses.includes(o.status)
      );
    });

    return { currentOrders: curr, previousOrders: prev, dateRangeLabel: label };
  }, [rawOrders, dateRange]);

  // ─── Mathematical Executive Metrics & Comparative Deltas ───
  const metrics = useMemo(() => {
    // Current period metrics
    const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = currentOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Unique diners
    const customerIds = new Set<string>();
    currentOrders.forEach((o) => {
      const id = o.customerPhone || o.customerName || (o.tableNumber ? `Table ${o.tableNumber}` : null);
      if (id) customerIds.add(id);
    });
    const uniqueCustomers = customerIds.size || Math.max(1, Math.round(totalOrders * 0.75));

    // Previous period metrics for real delta calculation
    const prevRevenue = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const prevOrders = previousOrders.length;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    const prevCustomerIds = new Set<string>();
    previousOrders.forEach((o) => {
      const id = o.customerPhone || o.customerName || (o.tableNumber ? `Table ${o.tableNumber}` : null);
      if (id) prevCustomerIds.add(id);
    });
    const prevCustomers = prevCustomerIds.size || Math.max(1, Math.round(prevOrders * 0.75));

    // Calculate percentage growths
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const revenueGrowth = calcGrowth(totalRevenue, prevRevenue);
    const ordersGrowth = calcGrowth(totalOrders, prevOrders);
    const aovGrowth = calcGrowth(avgOrderValue, prevAov);
    const customersGrowth = calcGrowth(uniqueCustomers, prevCustomers);

    // Turnaround speed (average minutes from created to completed)
    const completedWithTimes = currentOrders.filter((o) => o.status === "completed" && o.completedAt);
    let avgPrepMinutes = 16;
    if (completedWithTimes.length > 0) {
      const totalMins = completedWithTimes.reduce((acc, o) => {
        const start = new Date(o.createdAt).getTime();
        const end = new Date(o.completedAt).getTime();
        const mins = Math.max(1, Math.round((end - start) / (1000 * 60)));
        return acc + (mins < 180 ? mins : 20);
      }, 0);
      avgPrepMinutes = Math.round(totalMins / completedWithTimes.length);
    }

    // Completion rate
    const totalAllStatuses = rawOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= (dateRange === "1" ? new Date(new Date().setHours(0,0,0,0)) : new Date(Date.now() - parseInt(dateRange || "30")*86400000));
    }).length;
    const fulfillmentRate = totalAllStatuses > 0 ? Math.round((totalOrders / totalAllStatuses) * 100) : 100;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      uniqueCustomers,
      revenueGrowth,
      ordersGrowth,
      aovGrowth,
      customersGrowth,
      avgPrepMinutes,
      fulfillmentRate,
    };
  }, [currentOrders, previousOrders, rawOrders, dateRange]);

  // ─── Dish Performance Matrix ───
  const topDishes = useMemo<TopDish[]>(() => {
    const itemMap: Record<string, { count: number; revenue: number; priceAcc: number }> = {};
    const totalRev = metrics.totalRevenue || 1;

    currentOrders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const name = item.name || "Unknown Dish";
        if (!itemMap[name]) {
          itemMap[name] = { count: 0, revenue: 0, priceAcc: 0 };
        }
        itemMap[name].count += item.quantity || 1;
        const itemTot = item.itemTotal || (item.basePrice || 0) * (item.quantity || 1);
        itemMap[name].revenue += itemTot;
        itemMap[name].priceAcc += item.basePrice || 0;
      });
    });

    return Object.entries(itemMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
        avgPrice: data.count > 0 ? data.revenue / data.count : 0,
        revenueShare: Number(((data.revenue / totalRev) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [currentOrders, metrics.totalRevenue]);

  // Filtered dishes for search
  const filteredDishes = useMemo(() => {
    if (!dishSearch.trim()) return topDishes;
    return topDishes.filter((d) => d.name.toLowerCase().includes(dishSearch.toLowerCase()));
  }, [topDishes, dishSearch]);

  // ─── Time Series Chart Data (Daily, Weekly, Monthly) ───
  const chartSeries = useMemo(() => {
    const getGroupKey = (date: Date, type: "daily" | "weekly" | "monthly") => {
      if (type === "daily") {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      if (type === "weekly") {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `Wk ${weekNumber}`;
      }
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    const buildSeries = (type: "daily" | "weekly" | "monthly") => {
      const map: Record<string, { revenue: number; orders: number }> = {};
      const sorted = [...currentOrders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      sorted.forEach((order) => {
        const date = new Date(order.createdAt);
        const key = getGroupKey(date, type);
        if (!map[key]) {
          map[key] = { revenue: 0, orders: 0 };
        }
        map[key].revenue += order.total || 0;
        map[key].orders += 1;
      });

      let arr = Object.entries(map).map(([date, d]) => ({
        date,
        revenue: Math.round(d.revenue * 100) / 100,
        orders: d.orders,
      }));

      if (type === "daily") arr = arr.slice(-14);
      if (type === "weekly") arr = arr.slice(-10);
      if (type === "monthly") arr = arr.slice(-12);
      return arr;
    };

    return {
      daily: buildSeries("daily"),
      weekly: buildSeries("weekly"),
      monthly: buildSeries("monthly"),
    };
  }, [currentOrders]);

  // ─── Order Channels Distribution ───
  const channelDistribution = useMemo(() => {
    const counts: Record<string, number> = { qr: 0, table: 0, counter: 0, phone: 0 };
    const revenues: Record<string, number> = { qr: 0, table: 0, counter: 0, phone: 0 };

    currentOrders.forEach((o) => {
      const type = (o.orderType || "table").toLowerCase();
      if (counts[type] !== undefined) {
        counts[type] += 1;
        revenues[type] += o.total || 0;
      } else {
        counts.table = (counts.table || 0) + 1;
        revenues.table = (revenues.table || 0) + (o.total || 0);
      }
    });

    const channelMeta = [
      { key: "qr", label: "QR Diner Mobile", icon: "📱", color: "#f97316" },
      { key: "table", label: "Table Dine-in", icon: "🍽️", color: "#3b82f6" },
      { key: "counter", label: "Counter POS / Walk-in", icon: "🛎️", color: "#10b981" },
      { key: "phone", label: "Phone & Takeaway", icon: "📞", color: "#8b5cf6" },
    ];

    const total = currentOrders.length || 1;

    return channelMeta.map((ch) => ({
      name: ch.label,
      key: ch.key,
      icon: ch.icon,
      count: counts[ch.key] || 0,
      revenue: revenues[ch.key] || 0,
      percentage: Number((((counts[ch.key] || 0) / total) * 100).toFixed(1)),
      color: ch.color,
    }));
  }, [currentOrders]);

  // ─── Payment Methods Breakdown ───
  const paymentDistribution = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    currentOrders.forEach((o) => {
      const method = (o.paymentMethod || "Cash").toUpperCase();
      if (!map[method]) map[method] = { count: 0, revenue: 0 };
      map[method].count += 1;
      map[method].revenue += o.total || 0;
    });

    const total = currentOrders.length || 1;
    const colors = ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

    return Object.entries(map).map(([name, data], idx) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      percentage: Number(((data.count / total) * 100).toFixed(1)),
      color: colors[idx % colors.length],
    }));
  }, [currentOrders]);

  // ─── Hourly Peak Kitchen Rush Data ───
  const hourlyRushData = useMemo(() => {
    const hours: { hour: string; orders: number; revenue: number }[] = [];
    for (let h = 8; h <= 22; h++) {
      const label = `${h === 12 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`;
      hours.push({ hour: label, orders: 0, revenue: 0 });
    }

    currentOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      if (h >= 8 && h <= 22) {
        const slot = hours[h - 8];
        if (slot) {
          slot.orders += 1;
          slot.revenue += o.total || 0;
        }
      }
    });

    return hours;
  }, [currentOrders]);

  // Peak hour identifier
  const peakHour = useMemo(() => {
    if (hourlyRushData.length === 0) return "1:00 PM";
    const sorted = [...hourlyRushData].sort((a, b) => b.orders - a.orders);
    return sorted[0]?.orders > 0 ? sorted[0].hour : "1:00 PM";
  }, [hourlyRushData]);

  // Multi-format export builders
  const exportSummaryCSV = () => {
    if (!isEnterprise) {
      setShowEnterpriseExportModal(true);
      setShowExportMenu(false);
      return;
    }
    const rows = [
      ["SOFRA RESTAURANT ANALYTICS SUMMARY"],
      ["Date Range", dateRangeLabel],
      ["Generated At", new Date().toLocaleString()],
      [""],
      ["EXECUTIVE METRICS", "VALUE"],
      ["Total Gross Revenue", formatCurrency(metrics.totalRevenue)],
      ["Total Orders", metrics.totalOrders.toString()],
      ["Average Order Value", formatCurrency(metrics.avgOrderValue)],
      ["Unique Diners", metrics.uniqueCustomers.toString()],
      ["Average Kitchen Turnaround", `${metrics.avgPrepMinutes} minutes`],
      ["Order Fulfillment Rate", `${metrics.fulfillmentRate}%`],
      [""],
      ["TOP DISHES BY REVENUE", "UNITS SOLD", "TOTAL REVENUE", "REVENUE SHARE"],
      ...topDishes.map((d) => [d.name, d.count.toString(), formatCurrency(d.revenue), `${d.revenueShare}%`]),
      [""],
      ["ORDER CHANNELS", "ORDERS", "REVENUE", "SHARE"],
      ...channelDistribution.map((ch) => [ch.name, ch.count.toString(), formatCurrency(ch.revenue), `${ch.percentage}%`]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sofra-analytics-summary-${dateRange}-days.csv`;
    link.click();
    setShowExportMenu(false);
    toast.success("Executive summary report exported");
  };

  const exportOrdersLogCSV = () => {
    if (!isEnterprise) {
      setShowEnterpriseExportModal(true);
      setShowExportMenu(false);
      return;
    }
    const rows = [
      [
        "Order #",
        "Date",
        "Time",
        "Channel",
        "Customer Name",
        "Phone",
        "Table",
        "Items Count",
        "Status",
        "Payment Method",
        "Total Amount",
      ],
      ...currentOrders.map((o) => {
        const d = new Date(o.createdAt);
        return [
          o.orderNumber || o._id?.slice(-6) || "N/A",
          d.toLocaleDateString(),
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          (o.orderType || "table").toUpperCase(),
          o.customerName || "Walk-in Diner",
          o.customerPhone || "N/A",
          o.tableNumber ? `Table ${o.tableNumber}` : "N/A",
          o.items?.length?.toString() || "0",
          o.status?.toUpperCase() || "PENDING",
          o.paymentMethod?.toUpperCase() || "CASH",
          formatCurrency(o.total || 0),
        ];
      }),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sofra-detailed-orders-log-${dateRange}-days.csv`;
    link.click();
    setShowExportMenu(false);
    toast.success("Detailed orders log exported");
  };

  const printReport = () => {
    setShowExportMenu(false);
    if (!isEnterprise) {
      setShowEnterpriseExportModal(true);
      return;
    }
    window.print();
  };

  if (loading) {
    return <Loading text="Assembling restaurant analytics and financial telemetry..." />;
  }

  return (
    <div className="space-y-6 pb-20 print:p-0 print:m-0 print:space-y-4">
      {/* ─── Executive Header & Controls ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Reports & Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>Live Intelligence</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time financial telemetry, menu sales velocity, dining channels, and peak hour insights.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
          {/* Refresh Button */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
              className="appearance-none pl-8 pr-8 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-xs focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Past Year</option>
              <option value="all">All Time</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Multi-Format Export Hub */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isEnterprise) {
                  setShowEnterpriseExportModal(true);
                } else {
                  setShowExportMenu(!showExportMenu);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                !isEnterprise
                  ? "bg-slate-900 hover:bg-black text-white border border-slate-700"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
              }`}
            >
              {!isEnterprise ? <Lock className="w-3.5 h-3.5 text-orange-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export</span>
              {!isEnterprise ? (
                <span className="text-[9px] px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded font-black uppercase">
                  ENTERPRISE
                </span>
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={exportSummaryCSV}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    <FileText className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-extrabold">Executive Summary</div>
                      <div className="text-[10px] text-gray-400 font-normal">KPIs & category breakdown (.csv)</div>
                    </div>
                  </button>

                  <button
                    onClick={exportOrdersLogCSV}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-extrabold">Detailed Orders Log</div>
                      <div className="text-[10px] text-gray-400 font-normal">All line items & check details (.csv)</div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={printReport}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <Printer className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-extrabold">Print / PDF Briefing</div>
                      <div className="text-[10px] text-gray-400 font-normal">Clean executive print sheet</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5 Executive Telemetry & KPI Cards (With Genuine Mathematical Deltas) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Gross Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {metrics.revenueGrowth >= 0 ? (
              <span className="inline-flex items-center font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />+{metrics.revenueGrowth}%
              </span>
            ) : (
              <span className="inline-flex items-center font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />{metrics.revenueGrowth}%
              </span>
            )}
            <span className="text-[11px] text-gray-400">vs prev {dateRangeLabel}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {metrics.totalOrders}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {metrics.ordersGrowth >= 0 ? (
              <span className="inline-flex items-center font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />+{metrics.ordersGrowth}%
              </span>
            ) : (
              <span className="inline-flex items-center font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />{metrics.ordersGrowth}%
              </span>
            )}
            <span className="text-[11px] text-gray-400 font-medium">
              {metrics.fulfillmentRate}% fulfilled
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(metrics.avgOrderValue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {metrics.aovGrowth >= 0 ? (
              <span className="inline-flex items-center font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />+{metrics.aovGrowth}%
              </span>
            ) : (
              <span className="inline-flex items-center font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />{metrics.aovGrowth}%
              </span>
            )}
            <span className="text-[11px] text-gray-400">ticket size</span>
          </div>
        </div>

        {/* Total Diners / Customers */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unique Diners</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {metrics.uniqueCustomers}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {metrics.customersGrowth >= 0 ? (
              <span className="inline-flex items-center font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />+{metrics.customersGrowth}%
              </span>
            ) : (
              <span className="inline-flex items-center font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />{metrics.customersGrowth}%
              </span>
            )}
            <span className="text-[11px] text-gray-400">patron reach</span>
          </div>
        </div>

        {/* Kitchen Turnaround Velocity */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kitchen Prep</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {metrics.avgPrepMinutes} <span className="text-sm font-bold text-gray-400">min</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-black text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md">
              ⚡ Speedy Prep
            </span>
            <span className="text-[11px] text-gray-400">order to ready</span>
          </div>
        </div>
      </div>

      {/* ─── Executive Smart Insights Callout Ribbon ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Star Performer */}
        <div className="bg-linear-to-r from-orange-50/80 to-amber-50/50 border border-orange-200/70 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              Top Revenue Driver
            </div>
            <div className="text-xs font-extrabold text-gray-900 truncate">
              {topDishes[0]?.name || "Catalog dish"}
            </div>
            <div className="text-[11px] text-gray-500">
              {topDishes[0]
                ? `${formatCurrency(topDishes[0].revenue)} (${topDishes[0].revenueShare}% of period sales)`
                : "Awaiting order activity"}
            </div>
          </div>
        </div>

        {/* Peak Rush Hour */}
        <div className="bg-linear-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/70 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Peak Kitchen Rush
            </div>
            <div className="text-xs font-extrabold text-gray-900">
              Around {peakHour}
            </div>
            <div className="text-[11px] text-gray-500">
              Highest order frequency recorded during dining service
            </div>
          </div>
        </div>

        {/* Digital Channel Adoption */}
        <div className="bg-linear-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/70 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-600/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Digital Mobile Ordering
            </div>
            <div className="text-xs font-extrabold text-gray-900">
              {channelDistribution.find((c) => c.key === "qr")?.percentage || 0}% Table QR Adoption
            </div>
            <div className="text-[11px] text-gray-500">
              Diners self-ordering directly from digital table menus
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Multi-Tab Navigation ─── */}
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-2 print:hidden">
        <div className="inline-flex rounded-2xl bg-gray-100/90 p-1 border border-gray-200/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sales & Volume</span>
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "menu"
                ? "bg-white text-orange-600 shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Top Dishes ({topDishes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "channels"
                ? "bg-white text-blue-600 shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Channels & Payments</span>
          </button>
          <button
            onClick={() => setActiveTab("rush")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "rush"
                ? "bg-white text-purple-600 shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kitchen Rush Hours</span>
            {!isEnterprise && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Lock className="w-2.5 h-2.5" />
                <span>Enterprise</span>
              </span>
            )}
          </button>
        </div>

        <span className="text-[11px] font-bold text-gray-400 hidden sm:inline">
          Reporting Window: <span className="text-gray-700">{dateRangeLabel}</span>
        </span>
      </div>

      {/* ─── TAB 1: Financial Sales & Orders Volume Overview ─── */}
      {(activeTab === "overview" || window.matchMedia?.("print").matches) && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Revenue Trajectory</h3>
                  <p className="text-xs text-gray-400">Total gross income over time</p>
                </div>
                <div className="relative print:hidden">
                  <select
                    value={revenueGrouping}
                    onChange={(e: any) => setRevenueGrouping(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {chartSeries[revenueGrouping].length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                  <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
                  <span>No completed orders recorded in this date range</span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSeries[revenueGrouping]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderRadius: "12px",
                          border: "none",
                          color: "#fff",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                        labelStyle={{ color: "#9ca3af", fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f97316"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Orders Volume Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Order Volume</h3>
                  <p className="text-xs text-gray-400">Total dining tickets fulfilled</p>
                </div>
                <div className="relative print:hidden">
                  <select
                    value={ordersGrouping}
                    onChange={(e: any) => setOrdersGrouping(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {chartSeries[ordersGrouping].length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                  <ShoppingBag className="w-8 h-8 text-gray-300 mb-2" />
                  <span>No completed orders recorded in this date range</span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartSeries[ordersGrouping]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderRadius: "12px",
                          border: "none",
                          color: "#fff",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                        }}
                        formatter={(val: any) => [`${val} orders`, "Fulfilled"]}
                        labelStyle={{ color: "#9ca3af", fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}
                      />
                      <Bar dataKey="orders" fill="#fb923c" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Menu Dishes Sales Velocity & Profit Matrix ─── */}
      {(activeTab === "menu" || window.matchMedia?.("print").matches) && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Menu Item Profitability & Velocity Leaderboard
              </h3>
              <p className="text-xs text-gray-400">
                Detailed breakdown of units sold, gross earnings, and share of total restaurant revenue.
              </p>
            </div>

            {/* Quick Dish Search */}
            <div className="relative w-full sm:w-64 print:hidden">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Search dish in report..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {filteredDishes.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <span>No dish sales match your criteria</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Dish Name</th>
                    <th className="py-3 px-3 text-center">Units Sold</th>
                    <th className="py-3 px-3 text-right">Avg Unit Price</th>
                    <th className="py-3 px-3 text-right">Gross Revenue</th>
                    <th className="py-3 px-3">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {filteredDishes.map((dish, idx) => {
                    const rankMedals = ["🥇", "🥈", "🥉"];
                    const medal = rankMedals[idx] || `#${idx + 1}`;

                    return (
                      <tr key={dish.name} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-3 text-sm">{medal}</td>
                        <td className="py-3 px-3 font-black text-gray-900">{dish.name}</td>
                        <td className="py-3 px-3 text-center text-gray-700">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                            {dish.count}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500">
                          {formatCurrency(dish.avgPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">
                          {formatCurrency(dish.revenue)}
                        </td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-orange-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, dish.revenueShare)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 w-10 text-right">
                              {dish.revenueShare}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Channels & Payment Mix ─── */}
      {(activeTab === "channels" || window.matchMedia?.("print").matches) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Channel Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Order Channel Distribution</h3>
              <p className="text-xs text-gray-400">Where diners and staff place orders</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                      stroke="none"
                    >
                      {channelDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderRadius: "10px",
                        border: "none",
                        color: "#fff",
                      }}
                      formatter={(val: any, _name: any, item: any) => [
                        `${val} orders (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 w-full">
                {channelDistribution.map((ch) => (
                  <div key={ch.key} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ch.icon}</span>
                      <span className="text-gray-800">{ch.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium">{ch.count} orders</span>
                      <span className="font-black text-gray-900 w-12 text-right">
                        {ch.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Payment Collection Methods</h3>
              <p className="text-xs text-gray-400">Cash on Delivery vs Digital Settlement</p>
            </div>

            {paymentDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-xs">
                No payment transactions recorded
              </div>
            ) : (
              <div className="space-y-3.5 pt-2">
                {paymentDistribution.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-800">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-medium">{formatCurrency(p.revenue)}</span>
                        <span className="font-black text-gray-900 w-10 text-right">{p.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Kitchen Rush & Peak Hours Telemetry (Gated to Enterprise) ─── */}
      {activeTab === "rush" && !isEnterprise && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-gray-900 rounded-3xl p-8 sm:p-14 text-center text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 text-indigo-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise Telemetry Suite</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kitchen Rush Hours & Peak-Hour Telemetry
            </h3>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Unlock hourly order frequency distributions, cook station bottleneck heatmaps, and peak dining rush staff optimization metrics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 pb-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-indigo-400 font-extrabold text-xs">24h Order Heatmap</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Visualize order surges across every operating hour.</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-purple-400 font-extrabold text-xs">Peak Window Detection</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Automatically identify highest-grossing dining hours.</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-amber-400 font-extrabold text-xs">Kitchen Shift Prep</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Optimize line cooks and prep staff ahead of rush hours.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate("/dashboard/billing")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Upgrade to Enterprise Plan</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
              >
                Return to Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {((activeTab === "rush" && isEnterprise) || (window.matchMedia?.("print").matches && isEnterprise)) && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Peak Hours & Kitchen Rush Heatmap
              </h3>
              <p className="text-xs text-gray-400">Order ticket concentration across the 24-hour day</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
              <span>Busiest Window: <strong className="text-purple-600">{peakHour}</strong></span>
              <span className="text-gray-300">•</span>
              <span>Off-Peak: <strong className="text-emerald-600">Morning (Before 11:00 AM)</strong></span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRushData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                  formatter={(val: any, _n: any, item: any) => [
                    `${val} orders (${formatCurrency(item.payload.revenue)})`,
                    "Rush Traffic",
                  ]}
                  labelStyle={{ color: "#9ca3af", fontWeight: 700, fontSize: "11px" }}
                />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-[11px] font-bold text-gray-400 uppercase">Breakfast Rush</div>
              <div className="text-xs font-black text-gray-800 mt-0.5">8:00 AM – 11:00 AM</div>
              <div className="text-[11px] text-gray-500 mt-1">Light coffee & quick bite traffic</div>
            </div>
            <div className="p-3 bg-orange-50/60 border border-orange-200/40 rounded-xl">
              <div className="text-[11px] font-bold text-orange-600 uppercase">Lunch Rush</div>
              <div className="text-xs font-black text-gray-900 mt-0.5">12:00 PM – 2:00 PM</div>
              <div className="text-[11px] text-gray-500 mt-1">High table turnover & QR diner peak</div>
            </div>
            <div className="p-3 bg-indigo-50/60 border border-indigo-200/40 rounded-xl">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">Dinner Service</div>
              <div className="text-xs font-black text-gray-900 mt-0.5">6:00 PM – 9:00 PM</div>
              <div className="text-[11px] text-gray-500 mt-1">Largest ticket sizes & combo orders</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Enterprise Export Upgrade Modal ─── */}
      {showEnterpriseExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 text-center relative animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                Enterprise Plan Required
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                Automated Data Ledger Exports
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Exporting raw accounting CSVs, detailed order line-item ledgers, and printable PDF briefings is exclusive to the <strong>Enterprise Plan</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 text-left text-xs space-y-2 border border-gray-100">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full Line-Item Order Audits (.CSV)</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Accountant-Ready Revenue Ledgers</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Printable Executive PDF Briefings</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEnterpriseExportModal(false);
                  navigate("/dashboard/billing");
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Upgrade to Enterprise (2,500 ETB)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowEnterpriseExportModal(false)}
                className="w-full py-2.5 rounded-xl text-gray-500 hover:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
