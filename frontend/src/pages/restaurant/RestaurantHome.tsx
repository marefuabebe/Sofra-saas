import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, UtensilsCrossed, DollarSign, Clock, ShieldCheck,
  ArrowRight, ExternalLink, Sparkles, TrendingUp, Store,
  CheckCircle2, AlertCircle, ChefHat, RefreshCw, Eye
} from "lucide-react";
import { Loading } from "../../components/ui";
import { getRestaurantStats } from "../../services/restaurantService";
import { formatCurrency, formatDateTime } from "../../utils/helpers";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import VerificationCenter from "./VerificationCenter";

const RestaurantHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [authRes, statsData, ordersRes] = await Promise.all([
        api.get("/auth/me"),
        getRestaurantStats("any"),
        api.get("/orders").catch(() => ({ data: { data: [] } })),
      ]);
      
      const rest = authRes.data.data;
      setRestaurant(rest);
      setStats(statsData);
      setRecentOrders((ordersRes.data?.data || []).slice(0, 5));

      if (rest.verificationStatus !== "APPROVED") {
        const docsRes = await api.get("/verification/documents");
        setDocuments(docsRes.data.data);
      }
    } catch (e) {
      console.error("Failed to load restaurant dashboard data:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for realtime orders & updates
    const handleOrderUpdate = () => {
      loadData(true);
    };

    socket.on("order:new", handleOrderUpdate);
    socket.on("order:updated", handleOrderUpdate);
    socket.on("verification:approved", handleOrderUpdate);

    return () => {
      socket.off("order:new", handleOrderUpdate);
      socket.off("order:updated", handleOrderUpdate);
      socket.off("verification:approved", handleOrderUpdate);
    };
  }, []);

  if (loading) {
    return <Loading text="Loading restaurant dashboard..." />;
  }

  const isApproved = restaurant?.verificationStatus === "APPROVED" && restaurant?.status === "active";

  if (!isApproved && restaurant) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="mb-8">
          <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-2">
            Welcome to SOFRA, {(restaurant.restaurantName || "Restaurant").toUpperCase()}!
          </h2>
          <p className="text-sm text-gray-500">
            Your restaurant profile is not verified yet. Complete the steps below to unlock all features and start receiving orders.
          </p>
        </div>

        <VerificationCenter isHomeMode={true} />
      </div>
    );
  }

  const pendingCount = stats?.pendingOrders || 0;
  const todayOrdersCount = stats?.todayOrders || 0;
  const todayRevenue = stats?.revenueToday || 0;
  const menuItemsCount = stats?.totalMenuItems || 0;

  const statCards = [
    {
      title: "Pending Orders",
      value: pendingCount,
      isCurrency: false,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      pillBg: pendingCount > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600",
      subtitle: pendingCount > 0 ? "Needs kitchen action" : "All orders processed",
      actionText: "Open Order Feed",
      actionLink: "/dashboard/orders"
    },
    {
      title: "Today's Orders",
      value: todayOrdersCount,
      isCurrency: false,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      pillBg: "bg-blue-50 text-blue-700",
      subtitle: `${todayOrdersCount} order${todayOrdersCount === 1 ? "" : "s"} logged today`,
      actionText: "View All Orders",
      actionLink: "/dashboard/orders"
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      isCurrency: true,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      pillBg: "bg-emerald-50 text-emerald-700",
      subtitle: "Gross receipts today",
      actionText: "Financial Breakdown",
      actionLink: "/dashboard/reports"
    },
    {
      title: "Active Menu Items",
      value: menuItemsCount,
      isCurrency: false,
      icon: UtensilsCrossed,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      pillBg: "bg-purple-50 text-purple-700",
      subtitle: `${menuItemsCount} item${menuItemsCount === 1 ? "" : "s"} active in catalog`,
      actionText: "Manage Menu",
      actionLink: "/dashboard/menu"
    },
  ];

  const statusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>;
      case "preparing":
      case "accepted":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Preparing</span>;
      case "ready":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">Ready</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Completed</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Premium Executive Welcome Header */}
      <div className="relative overflow-hidden bg-white p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100/60 to-amber-100/40 rounded-full blur-3xl -mr-24 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-50/50 to-transparent rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {restaurant?.restaurantName || "Restaurant Overview"}
            </h1>
            {isApproved && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/20 text-[11px] font-bold uppercase tracking-wider rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified & Live</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2 font-medium">
            <span>Welcome back! Here is your operational summary for today.</span>
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {restaurant?.restaurantSlug && (
            <a
              href={`/r/${restaurant.restaurantSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 rounded-xl text-xs font-bold transition-all shadow-2xs group"
              title="Open Public Customer Menu"
            >
              <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500" />
              <span>Public Storefront</span>
              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-orange-500" />
            </a>
          )}

          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50/90 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 4 Modern Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group`}
          >
            <div>
              {/* Header: Title + Icon */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>

              {/* Value display: single-line with whitespace-nowrap */}
              <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap mb-2">
                {stat.value}
              </div>
            </div>

            {/* Footer status pill */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${stat.pillBg}`}>
                {stat.subtitle}
              </span>
              <Link
                to={stat.actionLink}
                className="text-[11px] font-bold text-gray-400 hover:text-orange-600 transition-colors flex items-center gap-0.5"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Core Management</h2>
          <span className="text-xs text-gray-400 font-medium">Frequently accessed modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/dashboard/orders"
            className="bg-white border border-gray-100 hover:border-orange-300 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group shadow-2xs"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                  Live Order Feed
                </p>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-orange-100 text-orange-600 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">Manage & dispatch incoming orders</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
          
          <Link
            to="/dashboard/menu"
            className="bg-white border border-gray-100 hover:border-orange-300 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group shadow-2xs"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">
                Menu & Catalog
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">Update dishes, sizes & pricing</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/dashboard/reports"
            className="bg-white border border-gray-100 hover:border-orange-300 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group shadow-2xs"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                Sales & Analytics
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">Financial trends & performance</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>
      </div>

      {/* Real Recent Orders Activity */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Customer Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest live orders received through your digital menu</p>
          </div>
          <Link
            to="/dashboard/orders"
            className="text-xs font-bold text-[#F97316] hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>View all orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mb-3 shadow-2xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No orders received yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Your digital menu is published. Share your storefront link or QR codes with customers to begin receiving live orders.
            </p>
            {restaurant?.restaurantSlug && (
              <a
                href={`/r/${restaurant.restaurantSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test Customer Menu</span>
              </a>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-gray-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {order.orderNumber ? `#${order.orderNumber}` : "Order"}
                      </p>
                      {statusBadge(order.status)}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {order.customerName || order.userId?.name || "Guest Customer"}
                      {order.items?.length ? ` · ${order.items.length} item${order.items.length > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900 whitespace-nowrap">
                    {formatCurrency(order.total || 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {order.createdAt ? formatDateTime(order.createdAt) : "Recently"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantHome;
