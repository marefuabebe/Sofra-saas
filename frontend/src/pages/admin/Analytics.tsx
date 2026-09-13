import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  ChevronDown,
  Store,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { getAnalyticsData, getPlatformStats } from "../../services/adminService";
import { formatCurrency } from "../../utils/helpers";
import { socket } from "../../config/socket";

/* ─── Shared helpers ────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  subUp?: boolean;
  icon: React.ReactNode;
  iconBg: string;
}> = ({ label, value, sub, subUp = true, icon, iconBg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-0.5 ${subUp ? "text-green-500" : "text-gray-500"}`}>
        {sub}
      </p>
    </div>
  </div>
);

/* ─── Revenue Line Chart (pure SVG) ────────────────────── */
const RevenueChart: React.FC<{ data: any }> = ({ data }) => {
  const days = data?.labels && data.labels.length > 0 ? data.labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const vals: number[] = data?.revenue && data.revenue.length > 0 ? data.revenue : [0, 0, 0, 0, 0, 0, 0];
  const W = 480, H = 140, PL = 50, PB = 28;
  const rawMax = Math.max(...vals, 0);
  const max = rawMax === 0 ? 100 : rawMax * 1.25;
  const xOf = (i: number) => PL + (i / Math.max(days.length - 1, 1)) * (W - PL - 10);
  const yOf = (v: number) => H - PB - (v / max) * (H - PB - 16);
  const pts = vals.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  // Area path
  const area = `M${xOf(0)},${yOf(vals[0])} ` + vals.map((v, i) => `L${xOf(i)},${yOf(v)}`).join(" ") + ` L${xOf(vals.length - 1)},${H - PB} L${xOf(0)},${H - PB} Z`;

  // Dynamic Y ticks
  const tickStep = rawMax === 0 ? 25 : Math.ceil(rawMax / 3 / 10) * 10 || 10;
  const yTicks = [0, tickStep, tickStep * 2, Math.round(max)];

  const formatTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  };

  const totalRevenue = vals.reduce((sum, v) => sum + v, 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PL} x2={W} y1={yOf(v)} y2={yOf(v)} stroke="#F3F4F6" strokeWidth="1" />
            <text x={PL - 6} y={yOf(v) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">
              {formatTick(v)}
            </text>
          </g>
        ))}
        {days.map((d: string, i: number) => (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">
            {d}
          </text>
        ))}
        {totalRevenue > 0 && <path d={area} fill="url(#revGrad)" />}
        <polyline
          fill="none"
          stroke="#F97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
        {vals.map((v, i) => (
          <circle
            key={i}
            cx={xOf(i)}
            cy={yOf(v)}
            r="3.5"
            fill="#F97316"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      {totalRevenue === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-gray-400 border border-gray-100">
            No revenue recorded for this period
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Donut Chart (Real Order Statuses) ──────────────────── */
const OrdersDonut: React.FC<{ orderStatus: any }> = ({ orderStatus }) => {
  const total = orderStatus?.total || 0;
  const completed = orderStatus?.completed || 0;
  const cancelled = orderStatus?.cancelled || 0;
  const pending = orderStatus?.pending || 0;

  const completedPct = orderStatus?.completedPct ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
  const cancelledPct = orderStatus?.cancelledPct ?? (total > 0 ? Math.round((cancelled / total) * 100) : 0);
  const pendingPct = orderStatus?.pendingPct ?? (total > 0 ? Math.max(0, 100 - completedPct - cancelledPct) : 0);

  const slices =
    total > 0
      ? [
          { label: "Completed", count: `${completed.toLocaleString()} (${completedPct}%)`, pct: completedPct, color: "#10B981" },
          { label: "Pending / Active", count: `${pending.toLocaleString()} (${pendingPct}%)`, pct: pendingPct, color: "#F97316" },
          { label: "Cancelled", count: `${cancelled.toLocaleString()} (${cancelledPct}%)`, pct: cancelledPct, color: "#EF4444" },
        ]
      : [{ label: "No Orders Yet", count: "0 (0%)", pct: 100, color: "#E5E7EB" }];

  const r = 50, cx = 60, cy = 60, stroke = 20;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {slices.map((s, i) => {
            if (s.pct === 0) return null;
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
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#111827">
            {total.toLocaleString()}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#9CA3AF">
            Total Orders
          </text>
        </svg>
      </div>
      <div className="mt-4 space-y-2 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 font-medium">{s.label}</span>
            <span className="ml-auto text-gray-500 text-[11px] font-semibold">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Bar Chart (Orders Over Time) ───────────────────────── */
const OrdersBarChart: React.FC<{ data: any }> = ({ data }) => {
  const days = data?.labels && data.labels.length > 0 ? data.labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const vals: number[] = data?.orders && data.orders.length > 0 ? data.orders : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...vals, 1);
  const W = 280, H = 120, PB = 24, gap = 6;
  const bw = Math.max(6, (W - gap * (days.length + 1)) / days.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {days.map((d: string, i: number) => {
        const val = vals[i] || 0;
        const bh = Math.max(val > 0 ? 4 : 2, (val / max) * (H - PB - 12));
        const x = gap + i * (bw + gap);
        const y = H - PB - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={bh}
              rx="3"
              fill="#F97316"
              fillOpacity={val > 0 ? (i === days.length - 1 ? 1 : 0.75) : 0.15}
            />
            <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#9CA3AF">
              {d.length > 6 ? d.slice(0, 3) : d}
            </text>
            {val > 0 && (
              <text x={x + bw / 2} y={Math.max(10, y - 3)} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#6B7280">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Main Analytics Page ───────────────────────────────── */
const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchData = async (selectedPeriod = period, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        getAnalyticsData(selectedPeriod),
        getPlatformStats(),
      ]);
      setData(res);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);

    const handleRealtimeUpdate = () => {
      fetchData(period, true);
    };

    socket.on("order:new", handleRealtimeUpdate);
    socket.on("order:updated", handleRealtimeUpdate);
    socket.on("restaurant:updated", handleRealtimeUpdate);

    return () => {
      socket.off("order:new", handleRealtimeUpdate);
      socket.off("order:updated", handleRealtimeUpdate);
      socket.off("restaurant:updated", handleRealtimeUpdate);
    };
  }, [period]);

  const topRestaurants = data?.topRestaurants || [];
  const topCategories = data?.topCategories || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time insights and performance metrics across the SOFRA platform.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {/* Refresh Button */}
          <button
            onClick={() => fetchData(period)}
            title="Refresh analytics data"
            className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-accent" : ""}`} />
          </button>

          {/* Date Range Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDateDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{data?.dateRangeLabel || (period === "daily" ? "Last 7 Days" : period === "weekly" ? "Last 8 Weeks" : "Last 6 Months")}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5 animate-in fade-in zoom-in-95">
                <p className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Select Timeframe</p>
                <button
                  onClick={() => {
                    setPeriod("daily");
                    setDateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    period === "daily" ? "text-orange-600 font-semibold bg-orange-50/50" : "text-gray-700"
                  }`}
                >
                  <span>Daily (Last 7 Days)</span>
                  {period === "daily" && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>
                <button
                  onClick={() => {
                    setPeriod("weekly");
                    setDateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    period === "weekly" ? "text-orange-600 font-semibold bg-orange-50/50" : "text-gray-700"
                  }`}
                >
                  <span>Weekly (Last 8 Weeks)</span>
                  {period === "weekly" && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>
                <button
                  onClick={() => {
                    setPeriod("monthly");
                    setDateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    period === "monthly" ? "text-orange-600 font-semibold bg-orange-50/50" : "text-gray-700"
                  }`}
                >
                  <span>Monthly (Last 6 Months)</span>
                  {period === "monthly" && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue || 0)}
          sub="from today's orders"
          subUp={true}
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
          iconBg="bg-green-50"
        />
        <StatCard
          label="Total Orders"
          value={(stats?.totalOrders || 0).toLocaleString()}
          sub="all-time orders"
          subUp={true}
          icon={<ShoppingBag className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-50"
        />
        <StatCard
          label="Active Restaurants"
          value={(stats?.activeRestaurants || 0).toLocaleString()}
          sub="active & verified"
          subUp={true}
          icon={<Store className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Pending Requests"
          value={(stats?.pendingRequests || 0).toLocaleString()}
          sub="needs admin review"
          subUp={false}
          icon={<UserPlus className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {period === "daily" ? "Daily revenue for the past 7 days" : period === "weekly" ? "Weekly revenue for the past 8 weeks" : "Monthly revenue for the past 6 months"}
              </p>
            </div>

            {/* Daily / Weekly / Monthly Switcher */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden text-xs p-0.5 bg-gray-50/50 self-start">
              {(["daily", "weekly", "monthly"] as const).map((p) => {
                const label = p.charAt(0).toUpperCase() + p.slice(1);
                const isActive = period === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                      isActive
                        ? "bg-[#F97316] text-white shadow-sm font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <RevenueChart data={data} />
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Orders Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">Breakdown by order status</p>
          </div>
          <OrdersDonut orderStatus={data?.orderStatus} />
        </div>
      </div>

      {/* Bottom row: Top Restaurants, Orders Over Time, Top Categories */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top Restaurants */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Top Restaurants by Revenue</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Highest grossing partner restaurants</p>
          <div className="space-y-3">
            {topRestaurants.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No restaurant revenue data yet</p>
            ) : (
              topRestaurants.map((r: any, i: number) => (
                <div key={r.id || i} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-xs">{r.name ? r.name[0].toUpperCase() : "R"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{r.name}</p>
                      <p className="text-[11px] text-gray-400">{r.orders} {r.orders === 1 ? "order" : "orders"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900 flex-shrink-0 ml-2">
                    {formatCurrency(r.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Orders Over Time Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-gray-900">Orders Over Time</h3>
            <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">{period}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Order volume distribution</p>
          <OrdersBarChart data={data} />
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Top Categories by Items</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Most ordered menu categories</p>
          <div className="space-y-3.5">
            {topCategories.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No category orders yet</p>
            ) : (
              topCategories.map((c: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {c.count} items ({c.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(c.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
