import React, { useEffect, useState } from "react";
import {
  ShoppingBag, DollarSign, TrendingUp, XCircle, X,
  Search, ChevronLeft, ChevronRight, ChevronDown,
  MoreVertical, Filter, Calendar, Store
} from "lucide-react";
import { getAllOrders } from "../../services/adminService";
import { formatDateTime, formatCurrency } from "../../utils/helpers";
import { socket } from "../../config/socket";

/* ─── Types ──────────────────────────────────────────────── */
interface Order {
  _id: string;
  orderNumber?: string;
  restaurantId: any;
  userId?: any;
  customerName?: string;
  status: string;
  paymentMethod?: string;
  total: number;
  createdAt: string;
  items?: any[];
}

/* ─── Stat Card ──────────────────────────────────────────── */
const StatCard: React.FC<{ label: string; value: string; sub: string; subUp?: boolean; icon: React.ReactNode; iconBg: string; }> = ({ label, value, sub, subUp = true, icon, iconBg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className={`text-[11px] font-medium mt-0.5 ${subUp ? "text-green-500" : "text-red-500"}`}>{sub}</p>
    </div>
  </div>
);

/* ─── Status pill ─────────────────────────────────────────── */
const statusColor: Record<string, string> = {
  pending: "bg-orange-100 text-orange-600 border-orange-200",
  accepted: "bg-blue-100 text-blue-600 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-purple-100 text-purple-600 border-purple-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  "out for delivery": "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const PAGE_SIZE = 6;

const OrdersOverview: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [restFilter, setRestFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrders();

    const handleNewOrder = (newOrder: Order) => {
      setOrders(prev => {
        if (prev.some(o => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const handleUpdatedOrder = (updatedOrder: Order) => {
      setOrders(prev =>
        prev.map(o => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:updated", handleUpdatedOrder);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:updated", handleUpdatedOrder);
    };
  }, []);

  const stats = {
    total: orders.length,
    revenue: orders.filter(o => o.status === "completed").reduce((s, o) => s + o.total, 0),
    avg: orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const tabCounts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    "out for delivery": orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const tabFilters = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "out for delivery", label: "Out for Delivery" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const statusMap: Record<string, string[]> = {
    all: [], pending: ["pending"], preparing: ["preparing", "accepted"],
    "out for delivery": ["ready"], completed: ["completed"], cancelled: ["cancelled"],
  };

  const filtered = orders.filter(o => {
    if (tab !== "all" && !statusMap[tab]?.includes(o.status)) return false;
    if (search) {
      const t = search.toLowerCase();
      const rName = (o as any).restaurantId?.name?.toLowerCase() || "";
      const cName = o.customerName?.toLowerCase() || "";
      const oNum = o.orderNumber?.toLowerCase() || "";
      if (!rName.includes(t) && !cName.includes(t) && !oNum.includes(t)) return false;
    }
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (payFilter !== "all") {
      const isCod = !o.paymentMethod || o.paymentMethod === "cash";
      if (payFilter === "cod" && !isCod) return false;
      if (payFilter === "paid" && isCod) return false;
    }
    if (dateFilter !== "all") {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (dateFilter === "today") {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (orderDate < thirtyDaysAgo) return false;
      } else if (dateFilter === "thisMonth") {
        if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage all orders across the platform.</p>
        </div>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <select 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="appearance-none border border-gray-200 rounded-xl pl-10 py-2 pr-9 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue || 0)} sub="+20.8% vs last week" icon={<DollarSign className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" />
        <StatCard label="Average Order Value" value={formatCurrency(stats.avg || 0)} sub="+8.4% vs last week" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" />
        <StatCard label="Total Orders" value={(stats.total || 0).toLocaleString()} sub="completed this week" icon={<ShoppingBag className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" />
        <StatCard label="Cancelled Orders" value={(stats.cancelled || 0).toLocaleString()} sub="+5.2% vs last week" subUp={false} icon={<XCircle className="w-5 h-5 text-red-400" />} iconBg="bg-red-50" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 overflow-x-auto border-b border-gray-100">
          {tabFilters.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.key ? "bg-orange-100 text-[#F97316]" : "bg-gray-100 text-gray-500"
              }`}>{tabCounts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 bg-gray-50 flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-sm placeholder:text-gray-400 w-full"
              placeholder="Search orders..." />
          </div>
          <div className="relative">
            <select value={restFilter} onChange={e => setRestFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-600 bg-white hover:border-gray-300 outline-none cursor-pointer">
              <option value="all">All Restaurants</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={payFilter} onChange={e => setPayFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-600 bg-white hover:border-gray-300 outline-none cursor-pointer">
              <option value="all">All Payment Methods</option>
              <option value="paid">Paid (Online)</option>
              <option value="cod">COD</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-600 bg-white hover:border-gray-300 outline-none cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 hover:border-gray-300 ml-auto">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["ORDER ID", "RESTAURANT", "CUSTOMER", "PLACED ON", "AMOUNT", "STATUS", "ACTIONS"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="animate-spin w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                paged.map(o => {
                  const date = new Date(o.createdAt);
                  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                  
                  return (
                  <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">#{o._id?.substring(o._id.length - 6).toUpperCase()}</span>
                    </td>
                    
                    {/* Restaurant */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{o.restaurantId?.name || "Unknown"}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{o.customerName || "Guest"}</span>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{dateStr}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeStr}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">${(o.total || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{o.items?.length || 0} items</p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide border ${statusColor[o.status] || statusColor.pending}`}>
                        {o.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs font-semibold text-[#F97316] hover:text-orange-700 transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing 1–{paged.length} of {filtered.length} results</p>
            <div className="flex items-center gap-1">
              <button disabled className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button className="w-7 h-7 rounded-lg text-xs font-semibold bg-[#F97316] text-white border border-[#F97316]">1</button>
              <button disabled className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 hover:border-gray-300"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Order ID</p>
                  <p className="text-base font-bold text-gray-900">#{selectedOrder._id?.substring(selectedOrder._id.length - 6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide border ${statusColor[selectedOrder.status] || statusColor.pending}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Restaurant:</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.restaurantId?.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.customerName || "Guest"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-semibold text-gray-900">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Order Items</h4>
              <div className="space-y-4 mb-6">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {item.selectedSize && <p className="text-xs text-gray-500 mt-0.5">Size: {item.selectedSize.name}</p>}
                        {item.selectedAddons?.map((addon: any, i: number) => (
                          <p key={i} className="text-xs text-gray-500 mt-0.5">+ {addon.name}</p>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">${(item.itemTotal || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-base font-bold pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#F97316]">${(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
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

export default OrdersOverview;
