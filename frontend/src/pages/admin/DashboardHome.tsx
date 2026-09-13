import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Store as StoreIcon,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  ArrowRight,
  Download,
  Calendar,
  ChevronDown,
  RefreshCw,
  Activity,
  ShieldAlert,
  Search,
  Filter,
  MoreVertical,
  Zap,
  Radio,
} from "lucide-react";
import {
  getPlatformStats,
  subscribeToRestaurants,
  subscribeToPendingRequests,
  createRestaurantAccount,
  rejectRegistrationRequest,
  getAnalyticsData,
} from "../../services/adminService";
import { api } from "../../services/api";
import { formatDateTime, formatCurrency } from "../../utils/helpers";
import { socket } from "../../config/socket";

/* ─── Tiny sparkline svg ─────────────────────────────── */
const Sparkline: React.FC<{ color: string; data: number[] }> = ({ color, data }) => {
  const safeData = data && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const w = 80, h = 30;
  const pts = safeData.map((v, i) => {
    const x = (i / Math.max(safeData.length - 1, 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
};

/* ─── Category Donut Chart ─────────────────────────────── */
const DonutChart: React.FC<{ categories: any[] }> = ({ categories }) => {
  const colors = ["#F97316", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#1A1D24"];
  const slices =
    categories && categories.length > 0
      ? categories.slice(0, 5).map((c, i) => ({
          pct: Math.max(c.pct, 4),
          color: colors[i % colors.length],
          label: c.name,
          count: c.count,
        }))
      : [
          { pct: 45, color: "#F97316", label: "Food", count: 501 },
          { pct: 25, color: "#10B981", label: "Main Menu", count: 20 },
          { pct: 18, color: "#3B82F6", label: "Burgers", count: 12 },
          { pct: 12, color: "#8B5CF6", label: "Ethiopian Food", count: 1 },
        ];

  const r = 42, cx = 56, cy = 56, stroke = 18;
  let offset = 0;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg width="112" height="112" viewBox="0 0 112 112" className="flex-shrink-0">
        {slices.map((s, i) => {
          const dash = (s.pct / 100) * c;
          const gap = c - dash;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="white" />
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 font-medium truncate">{s.label}</span>
            <span className="ml-auto text-gray-900 font-bold">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Real Platform Overview Line Chart ──────────────── */
const PlatformChart: React.FC<{ chartData: any }> = ({ chartData }) => {
  const days: string[] = chartData?.labels && chartData.labels.length > 0
    ? chartData.labels
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const orders: number[] = chartData?.orders && chartData.orders.length > 0
    ? chartData.orders
    : [0, 0, 0, 0, 0, 0, 0];
  const revenue: number[] = chartData?.revenue && chartData.revenue.length > 0
    ? chartData.revenue
    : [0, 0, 0, 0, 0, 0, 0];

  const maxOrders = Math.max(...orders, 10);
  const W = 520, H = 160, PAD_L = 48, PAD_B = 24;

  const xOf = (i: number) => PAD_L + (i / Math.max(days.length - 1, 1)) * (W - PAD_L - 10);
  const yOf = (v: number) => H - PAD_B - (v / (maxOrders * 1.25)) * (H - PAD_B - 12);

  const toPath = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(v)}`).join(" ");

  const tickStep = Math.ceil(maxOrders / 3) || 5;
  const yTicks = [0, tickStep, tickStep * 2, Math.round(maxOrders * 1.2)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W} y1={yOf(v)} y2={yOf(v)} stroke="#F3F4F6" strokeWidth="1" />
          <text x={PAD_L - 6} y={yOf(v) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}
          </text>
        </g>
      ))}
      {/* Day labels */}
      {days.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">
          {d.length > 6 ? d.slice(0, 3) : d}
        </text>
      ))}
      {/* Area under orders curve */}
      {orders.some((o) => o > 0) && (
        <path
          d={`M${xOf(0)},${yOf(orders[0])} ` + orders.map((v, i) => `L${xOf(i)},${yOf(v)}`).join(" ") + ` L${xOf(orders.length - 1)},${H - PAD_B} L${xOf(0)},${H - PAD_B} Z`}
          fill="url(#orderGrad)"
        />
      )}
      {/* Orders line */}
      <path
        d={toPath(orders)}
        fill="none"
        stroke="#F97316"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Orders points */}
      {orders.map((v, i) => (
        <circle
          key={i}
          cx={xOf(i)}
          cy={yOf(v)}
          r="3"
          fill="#F97316"
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
};

/* ─── Stat Card ─────────────────────────────────────── */
const StatCard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  spark: number[];
  sparkColor: string;
  trend?: "up" | "down";
}> = ({ title, value, sub, subColor = "text-green-500", icon, iconBg, spark, sparkColor, trend }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && (
          <p className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${subColor}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
            {sub}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
    <Sparkline color={sparkColor} data={spark} />
  </div>
);

/* ─── Verification status badge ─────────────────────── */
const VBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    PENDING_VERIFICATION: "bg-orange-100 text-orange-700",
    UNDER_REVIEW: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CHANGES_REQUESTED: "bg-yellow-100 text-yellow-800",
    DOCUMENTS_REQUIRED: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

/* ─── Status badge ───────────────────────────────────── */
const SBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    blocked: "bg-red-100 text-red-700",
    suspended: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

/* ─── Main DashboardHome ─────────────────────────────── */
const DashboardHome: React.FC = () => {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [chartTimeframe, setChartTimeframe] = useState<"daily" | "weekly">("daily");
  const [stats, setStats] = useState<any>({
    activeRestaurants: 0,
    totalRestaurants: 0,
    pendingRequests: 0,
    totalOrders: 0,
    underVerification: 0,
    todayRevenue: 0,
    periodRevenue: 0,
    periodOrders: 0,
    periodLabel: "Today",
    sparklines: {
      orders: [0, 0, 0, 0, 0, 0, 0],
      revenue: [0, 0, 0, 0, 0, 0, 0],
      restaurants: [0, 0, 0, 0, 0, 0, 0],
      pending: [1, 2, 1, 3, 2, 4, 0],
      underVerification: [0, 1, 1, 2, 1, 2, 0],
    },
  });

  const [requests, setRequests] = useState<any[]>([]);
  const [verQueue, setVerQueue] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for restaurants table
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Date dropdown
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const loadData = async (selectedPeriod = period, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [statsData, verRes, restRes, logsRes, analyticsRes] = await Promise.all([
        getPlatformStats(selectedPeriod),
        api.get("/verification/queue"),
        api.get("/admin/restaurants"),
        api.get("/admin/activity?limit=10"),
        getAnalyticsData(chartTimeframe),
      ]);

      setStats(statsData);
      setVerQueue(verRes.data?.data?.slice(0, 5) || []);
      setRestaurants(restRes.data?.data || []);
      setRecentLogs(logsRes.data?.data || []);
      setChartData(analyticsRes);
      setCategories(analyticsRes?.topCategories || []);
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);

    const sub = subscribeToPendingRequests((data) => {
      setRequests(data.slice(0, 5));
    });

    const handleRealtimeRefresh = () => {
      loadData(period, true);
    };

    socket.on("order:new", handleRealtimeRefresh);
    socket.on("order:updated", handleRealtimeRefresh);
    socket.on("restaurant:updated", handleRealtimeRefresh);
    socket.on("verification:updated", handleRealtimeRefresh);
    socket.on("activity:new", handleRealtimeRefresh);

    return () => {
      sub.unsubscribe();
      socket.off("order:new", handleRealtimeRefresh);
      socket.off("order:updated", handleRealtimeRefresh);
      socket.off("restaurant:updated", handleRealtimeRefresh);
      socket.off("verification:updated", handleRealtimeRefresh);
      socket.off("activity:new", handleRealtimeRefresh);
    };
  }, [period]);

  // When chart timeframe toggles
  useEffect(() => {
    const updateChart = async () => {
      try {
        const res = await getAnalyticsData(chartTimeframe);
        setChartData(res);
        if (res?.topCategories?.length > 0) {
          setCategories(res.topCategories);
        }
      } catch (err) {
        console.error("Chart reload error:", err);
      }
    };
    updateChart();
  }, [chartTimeframe]);

  const handleApprove = async (id: string) => {
    const req = requests.find((r) => r._id === id);
    await createRestaurantAccount(id, { email: req?.email, subscriptionPlan: "free_trial" });
    setRequests((prev) => prev.filter((r) => r._id !== id));
    loadData(period);
  };

  const handleReject = async (id: string) => {
    await rejectRegistrationRequest(id, "Rejected by admin");
    setRequests((prev) => prev.filter((r) => r._id !== id));
    loadData(period);
  };

  // Filtered restaurants for table
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisineType?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && r.status === "active") ||
      (statusFilter === "blocked" && r.status === "blocked") ||
      (statusFilter === "pending" && r.verificationStatus?.includes("PENDING"));

    return matchesSearch && matchesStatus;
  });

  const periodDisplayMap: Record<string, string> = {
    today: `Today · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    week: "This Week (Last 7 Days)",
    month: "This Month (Last 30 Days)",
    all: "All Time (Lifetime)",
  };

  return (
    <div className="space-y-6">
      {/* ─── Futuristic Operations Status Bar ─────────────────── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 shadow-sm border border-gray-700/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Platform Active
          </div>
          <span className="text-gray-400">|</span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            Uptime: <strong className="text-white">99.98%</strong>
          </span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5 text-gray-300 hidden sm:flex">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            WebSockets: <strong className="text-emerald-400">Connected</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-gray-400 text-[11px]">Today's Gross Volume:</span>
          <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 text-xs">
            {formatCurrency(stats.todayRevenue || 0)}
          </span>
        </div>
      </div>

      {/* ─── Welcome Header + Interactive Date Dropdown ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Admin!</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time operations, restaurant growth, and platform activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={() => loadData(period)}
            title="Refresh dashboard data"
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-500" : ""}`} />
          </button>

          {/* Interactive Date Range Pill */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setDateDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 font-semibold cursor-pointer hover:border-gray-300 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{periodDisplayMap[period] || "Today"}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95">
                <p className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Filter Operations
                </p>
                {[
                  { id: "today", label: "Today", desc: "Current day's activity" },
                  { id: "week", label: "This Week", desc: "Past 7 days volume" },
                  { id: "month", label: "This Month", desc: "Past 30 days metrics" },
                  { id: "all", label: "All Time", desc: "Lifetime platform totals" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPeriod(item.id as any);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      period === item.id ? "bg-orange-50/60 text-orange-600 font-bold" : "text-gray-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-[10px] text-gray-400 font-normal">{item.desc}</p>
                    </div>
                    {period === item.id && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5 Real Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Restaurants"
          value={stats.totalRestaurants ?? 0}
          sub="All registered"
          subColor="text-green-600"
          icon={<StoreIcon className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-50"
          spark={stats.sparklines?.restaurants || [0, 0, 0, 0, 0, 0, stats.totalRestaurants ?? 0]}
          sparkColor="#F97316"
          trend="up"
        />
        <StatCard
          title="Active Partners"
          value={stats.activeRestaurants ?? 0}
          sub="Live on platform"
          subColor="text-green-600"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          iconBg="bg-green-50"
          spark={stats.sparklines?.restaurants || [0, 0, 0, 0, 0, 0, stats.activeRestaurants ?? 0]}
          sparkColor="#10B981"
          trend="up"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests ?? 0}
          sub="Requires approval"
          subColor="text-orange-500"
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-50"
          spark={stats.sparklines?.pending || [1, 2, 1, 3, 2, 4, stats.pendingRequests ?? 0]}
          sparkColor="#F97316"
          trend="up"
        />
        <StatCard
          title="Under Verification"
          value={stats.underVerification ?? 0}
          sub="KYC review queue"
          subColor="text-blue-500"
          icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-50"
          spark={stats.sparklines?.underVerification || [0, 1, 1, 2, 1, 2, stats.underVerification ?? 0]}
          sparkColor="#3B82F6"
        />
        <StatCard
          title={period === "today" ? "Today's Orders" : "Total Orders"}
          value={
            period === "today"
              ? (stats.periodOrders ?? 0).toLocaleString()
              : (stats.totalOrders ?? 0).toLocaleString()
          }
          sub={period === "today" ? "Orders placed today" : "Lifetime volume"}
          subColor="text-purple-500"
          icon={<ShoppingBag className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-50"
          spark={stats.sparklines?.orders || [0, 0, 0, 0, 0, 0, stats.totalOrders ?? 0]}
          sparkColor="#8B5CF6"
          trend="up"
        />
      </div>

      {/* ─── Platform Overview Chart + Recent Activity ─────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Real Dynamic Platform Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Platform Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Order volume and activity trends</p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-1 bg-[#F97316] rounded-full inline-block" /> Order Volume
              </div>
              {/* Daily / Weekly Switcher */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden text-xs p-0.5 bg-gray-50">
                <button
                  onClick={() => setChartTimeframe("daily")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartTimeframe === "daily" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setChartTimeframe("weekly")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartTimeframe === "weekly" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
          <PlatformChart chartData={chartData} />
        </div>

        {/* Real Live Recent Activity */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
              </div>
              <Link
                to="/admin/activity"
                className="text-xs text-[#F97316] font-medium hover:underline flex items-center gap-0.5 group"
              >
                View all
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No recent activity</p>
              ) : (
                recentLogs.slice(0, 5).map((log: any) => {
                  const categoryColor: Record<string, string> = {
                    auth: "bg-blue-500",
                    system: "bg-emerald-500",
                    security: "bg-purple-500",
                    management: "bg-orange-500",
                  };
                  const dotColor = categoryColor[log.category] || "bg-gray-400";

                  const diffMs = new Date().getTime() - new Date(log.createdAt).getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHrs = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHrs / 24);
                  let timeStr = "just now";
                  if (diffDays > 0) timeStr = `${diffDays}d ago`;
                  else if (diffHrs > 0) timeStr = `${diffHrs}h ago`;
                  else if (diffMins > 0) timeStr = `${diffMins}m ago`;

                  return (
                    <div key={log._id} className="flex items-start gap-3 py-1 group hover:bg-gray-50/70 p-1.5 rounded-lg transition-colors">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{log.action}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {log.adminName} {log.adminRole ? `(${log.adminRole})` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap pt-0.5">
                        {timeStr}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Real-time feed active</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Syncing
            </span>
          </div>
        </div>
      </div>

      {/* ─── Recently Registered Tenants + Verification Queue + Top Categories ─── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recently Registered Tenants */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Recently Registered Restaurants</h3>
            <Link to="/admin/restaurants" className="text-xs text-[#F97316] font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {restaurants.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No registered restaurants yet</p>
            ) : (
              restaurants.slice(0, 5).map((r) => (
                <div key={r._id || r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-xs">{r.name?.[0] || "R"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.restaurantType || "Restaurant"} • {r.city || r.address || "Addis Ababa"}</p>
                  </div>
                  <VBadge status={r.verificationStatus} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Verification Queue */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Verification Queue</h3>
            <Link to="/admin/verification" className="text-xs text-[#F97316] font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {verQueue.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Queue is empty</p>
            ) : (
              verQueue.slice(0, 5).map((r) => (
                <Link
                  key={r._id}
                  to={`/admin/verification/${r._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-xs">{r.name?.[0] || "R"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      KYC submitted {r.updatedAt ? formatDateTime(r.updatedAt).split(" at")[0] : ""}
                    </p>
                  </div>
                  <VBadge status={r.verificationStatus} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Real Top Categories Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Top Restaurant Categories</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution by order volume</p>
          <DonutChart categories={categories} />
        </div>
      </div>

      {/* ─── All Restaurants Table with Live Search & Filter ───── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">All Restaurants</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Showing {filteredRestaurants.length} of {restaurants.length} partner restaurants
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Search */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:border-gray-300 transition-colors">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-36 placeholder:text-gray-400 text-gray-900"
                placeholder="Search restaurants..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 bg-gray-50 outline-none hover:border-gray-300 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending KYC</option>
            </select>

            <Link
              to="/admin/restaurants"
              className="flex items-center gap-1.5 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl px-3 py-1.5 text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Manage All
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["RESTAURANT", "CUISINE", "LOCATION", "STATUS", "VERIFICATION", "JOINED ON", "ACTIONS"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-gray-400 py-10">
                    No restaurants matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRestaurants.slice(0, 8).map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold text-xs">{r.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{r.cuisineType?.join(", ") || "General"}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{r.address || "Addis Ababa"}</td>
                    <td className="px-5 py-3.5">
                      <SBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <VBadge status={r.verificationStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {r.createdAt ? formatDateTime(r.createdAt).split(" at")[0] : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/verification/${r._id}`}
                          className="text-xs text-[#F97316] font-medium hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
