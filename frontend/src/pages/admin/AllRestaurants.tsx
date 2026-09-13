import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, ChevronDown,
  Filter, MoreVertical, Eye, Download, Plus, Ban, CheckCircle, CheckCircle2,
  X, MapPin, Mail, Phone, Info, Store, User, Building, Shield, Utensils, Lock,
  ExternalLink, Copy, Check, LayoutGrid, List, Sparkles, Radio, Layers,
  FileSpreadsheet, AlertTriangle, Clock, CreditCard, Globe, RefreshCw
} from "lucide-react";
import { subscribeToRestaurants, toggleRestaurantStatus, addRestaurant } from "../../services/adminService";
import { formatDateTime, copyToClipboard } from "../../utils/helpers";
import toast from "react-hot-toast";

interface Restaurant {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  cuisineType?: string[];
  restaurantType?: string;
  status: string;
  verificationStatus: string;
  subscriptionPlan?: string;
  isActive?: boolean;
  businessHours?: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
  taxRate?: number;
  acceptedPaymentMethods?: string[];
  createdAt: string;
  updatedAt?: string;
  ownerName?: string;
  logoUrl?: string;
  coverUrl?: string;
}

/* ─── Restaurant Avatar ──────────────────────────────── */
const RestaurantAvatar: React.FC<{ name: string; index: number; logoUrl?: string; size?: "sm" | "md" | "lg" }> = ({
  name, index, logoUrl, size = "md"
}) => {
  const colors = [
    "from-orange-500 to-amber-600",
    "from-emerald-500 to-teal-600",
    "from-blue-600 to-indigo-600",
    "from-purple-600 to-pink-600",
    "from-rose-500 to-red-600",
    "from-cyan-500 to-blue-600"
  ];
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg text-xs",
    md: "w-10 h-10 rounded-xl text-sm",
    lg: "w-14 h-14 rounded-2xl text-xl"
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${sizeClasses[size]} object-cover border border-gray-100 shadow-sm flex-shrink-0 bg-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 shadow-sm text-white font-black`}
    >
      <span>{name?.[0]?.toUpperCase() || "R"}</span>
    </div>
  );
};

/* ─── Status Badge ────────────────────────────────────── */
const StatusBadge: React.FC<{ s: string; isActive?: boolean }> = ({ s, isActive }) => {
  const active = isActive ?? (s === "active");
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        ACTIVE
      </span>
    );
  }
  if (s === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        SUSPENDED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
      {s?.toUpperCase() || "INACTIVE"}
    </span>
  );
};

/* ─── Verification Status Pill ────────────────────────── */
const VPill: React.FC<{ s: string }> = ({ s }) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    APPROVED:             { bg: "bg-emerald-50 border-emerald-200",   text: "text-emerald-700", label: "KYC Verified" },
    PENDING_VERIFICATION: { bg: "bg-amber-50 border-amber-200",       text: "text-amber-700",   label: "Pending KYC" },
    UNDER_REVIEW:         { bg: "bg-blue-50 border-blue-200",         text: "text-blue-700",    label: "Under Review" },
    REJECTED:             { bg: "bg-rose-50 border-rose-200",         text: "text-rose-700",    label: "Rejected" },
    CHANGES_REQUESTED:    { bg: "bg-yellow-50 border-yellow-200",     text: "text-yellow-700",  label: "Changes Req." },
    DOCUMENTS_REQUIRED:   { bg: "bg-gray-50 border-gray-200",         text: "text-gray-600",    label: "Docs Needed" },
  };
  const style = map[s] || { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", label: s || "Unverified" };
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md border tracking-wide uppercase ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

/* ─── Plan Tier Badge ─────────────────────────────────── */
const PlanBadge: React.FC<{ plan?: string }> = ({ plan }) => {
  const p = (plan || "free_trial").toLowerCase();
  const styles: Record<string, string> = {
    starter: "bg-blue-50 text-blue-700 border-blue-200",
    pro: "bg-purple-50 text-purple-700 border-purple-200 font-extrabold",
    enterprise: "bg-amber-50 text-amber-800 border-amber-300 font-black",
    free_trial: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    starter: "Starter",
    pro: "Pro Tier",
    enterprise: "Enterprise",
    free_trial: "Trial",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-tight uppercase ${styles[p] || styles.free_trial}`}>
      {labels[p] || p}
    </span>
  );
};

const PAGE_SIZE = 8;

const AllRestaurants: React.FC = () => {
  const [all, setAll] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeTabDrawer, setActiveTabDrawer] = useState<"overview" | "hours" | "system">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status toggle confirmation modal
  const [statusModalRestaurant, setStatusModalRestaurant] = useState<Restaurant | null>(null);
  const [suspendReason, setSuspendReason] = useState("Policy Violation");
  const [customReason, setCustomReason] = useState("");
  const [toggling, setToggling] = useState(false);

  // Add Restaurant form state
  const [addForm, setAddForm] = useState({
    restaurantName: "", ownerName: "", email: "", phone: "",
    city: "", address: "", restaurantType: "Restaurant", password: ""
  });

  useEffect(() => {
    const sub = subscribeToRestaurants((data: any[]) => {
      setAll(data || []);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  /* ── Filter Options ── */
  const cities = useMemo(() => {
    const raw = all.map(r => r.city || r.address).filter(Boolean);
    return ["all", ...Array.from(new Set(raw))];
  }, [all]);

  const types = useMemo(() => {
    const raw = all.flatMap(r => r.cuisineType || [r.restaurantType || "Restaurant"]).filter(Boolean);
    return ["all", ...Array.from(new Set(raw))];
  }, [all]);

  /* ── Aggregated KPIs ── */
  const kpis = useMemo(() => {
    const total = all.length;
    const active = all.filter(r => r.isActive !== false && r.status === "active").length;
    const pendingKyc = all.filter(r =>
      ["PENDING_VERIFICATION", "UNDER_REVIEW", "DOCUMENTS_REQUIRED"].includes(r.verificationStatus)
    ).length;
    const suspended = all.filter(r => r.status === "blocked" || r.isActive === false).length;
    return { total, active, pendingKyc, suspended };
  }, [all]);

  /* ── Filtered & Sorted Records ── */
  const filtered = useMemo(() => {
    return all.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        const matchesOwner = r.ownerName?.toLowerCase().includes(q);
        const matchesCity = r.city?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q);
        const matchesSlug = r.slug?.toLowerCase().includes(q);
        const matchesPhone = r.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesOwner && !matchesCity && !matchesSlug && !matchesPhone) {
          return false;
        }
      }
      if (statusFilter !== "all") {
        if (statusFilter === "active" && (r.status !== "active" || r.isActive === false)) return false;
        if (statusFilter === "blocked" && r.status !== "blocked" && r.isActive !== false) return false;
        if (statusFilter === "inactive" && r.status !== "inactive") return false;
        if (statusFilter === "verified" && r.verificationStatus !== "APPROVED") return false;
      }
      if (cityFilter !== "all" && r.city !== cityFilter && r.address !== cityFilter) return false;
      if (typeFilter !== "all") {
        const hasCuisine = r.cuisineType?.includes(typeFilter);
        const hasType = r.restaurantType === typeFilter;
        if (!hasCuisine && !hasType) return false;
      }
      if (planFilter !== "all" && (r.subscriptionPlan || "free_trial") !== planFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });
  }, [all, search, statusFilter, cityFilter, typeFilter, planFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  /* ── Multi-select Handlers ── */
  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length && paged.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paged.map(r => r._id || r.id!));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /* ── Toggle Restaurant Status Execution ── */
  const handleExecuteStatusToggle = async () => {
    if (!statusModalRestaurant) return;
    setToggling(true);
    const targetId = statusModalRestaurant._id || statusModalRestaurant.id!;
    const isCurrentlyActive = statusModalRestaurant.isActive !== false && statusModalRestaurant.status === "active";
    const reason = suspendReason === "Custom" ? customReason : suspendReason;

    await toggleRestaurantStatus(targetId, !isCurrentlyActive, isCurrentlyActive ? reason : undefined);
    setToggling(false);
    setStatusModalRestaurant(null);
    setCustomReason("");
  };

  /* ── Onboard Form Submission ── */
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await addRestaurant(addForm);
      if (res.success || res.message === "Registration successful" || !res.message) {
        setShowAddModal(false);
        setAddForm({
          restaurantName: "", ownerName: "", email: "", phone: "",
          city: "", address: "", restaurantType: "Restaurant", password: ""
        });
        toast.success("Restaurant registered successfully!");
      } else {
        toast.error(res.message || "Failed to onboard restaurant");
      }
    } catch {
      toast.error("Failed to onboard restaurant");
    } finally {
      setAdding(false);
    }
  };

  /* ── Copy Helper with Toast Feedback ── */
  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Export Functionality (CSV) ── */
  const handleExport = (onlySelected: boolean = false) => {
    const exportData = onlySelected
      ? all.filter(r => selectedIds.includes(r._id || r.id!))
      : filtered;

    if (exportData.length === 0) {
      toast.error("No restaurants to export.");
      return;
    }
    toast.success(`Exporting ${exportData.length} restaurants to CSV.`);
    const headers = ["ID", "Name", "Slug", "Owner", "Email", "Phone", "City", "Address", "Type", "Status", "Plan", "Verification", "Registered At"];
    const rows = exportData.map(r => [
      r._id || r.id || "",
      `"${r.name || ""}"`,
      r.slug || "",
      `"${r.ownerName || ""}"`,
      r.email || "",
      r.phone || "",
      `"${r.city || ""}"`,
      `"${r.address || ""}"`,
      `"${r.restaurantType || r.cuisineType?.join(", ") || "Restaurant"}"`,
      r.status || "",
      r.subscriptionPlan || "free_trial",
      r.verificationStatus || "",
      `"${r.createdAt ? formatDateTime(r.createdAt) : ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sofra_tenants_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ── TOP FUTURISTIC TELEMETRY & NETWORK STATUS RIBBON ── */}
      <div className="bg-gradient-to-r from-gray-900 via-zinc-900 to-black text-white rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow backdrop accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6 text-[#F97316]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Tenant Fleet & Restaurants</h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Fleet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Enterprise management portal for all restaurant establishments, digital menus, and tenant accounts.
            </p>
          </div>
        </div>

        {/* Telemetry pill & Top Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Multi-City Sync</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{cities.length - 1} Operating Zones</span>
            </div>
          </div>

          <button
            onClick={() => handleExport(false)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all backdrop-blur-sm shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F97316] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Onboard Restaurant
          </button>
        </div>
      </div>

      {/* ── 4 EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tenants</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.total}</span>
            <span className="text-[11px] font-semibold text-gray-400">establishments</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Full registered platform network</p>
        </div>

        {/* Active & Live */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live & Serving</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{kpis.active}</span>
            <span className="text-[11px] font-bold text-emerald-600/80">taking orders</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Online with active digital menus</p>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{kpis.pendingKyc}</span>
            <span className="text-[11px] font-bold text-amber-600/80">KYC In Review</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Awaiting compliance verification</p>
        </div>

        {/* Suspended / Blocked */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Suspended</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{kpis.suspended}</span>
            <span className="text-[11px] font-bold text-rose-600/80">paused</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Deactivated or flagged accounts</p>
        </div>
      </div>

      {/* ── SEARCH, MULTI-FILTER & VIEW TOGGLE CONTROL CENTER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top search & View Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by restaurant name, owner, email, phone, city, or slug..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right controls: View toggle & Sort dropdown */}
          <div className="flex items-center gap-2.5 self-end lg:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="appearance-none bg-white border border-gray-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-gray-700 hover:border-gray-300 outline-none cursor-pointer shadow-xs"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Secondary Filter Badges & Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Tenants", count: all.length },
              { id: "active", label: "Active", count: kpis.active },
              { id: "blocked", label: "Suspended", count: kpis.suspended },
              { id: "verified", label: "KYC Approved", count: all.filter(r => r.verificationStatus === "APPROVED").length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* City, Type & Plan filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* City */}
            <div className="relative">
              <select
                value={cityFilter}
                onChange={e => { setCityFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 outline-none cursor-pointer"
              >
                <option value="all">All Cities</option>
                {cities.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Type / Cuisine */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 outline-none cursor-pointer"
              >
                <option value="all">All Cuisines</option>
                {types.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Subscription Plan */}
            <div className="relative">
              <select
                value={planFilter}
                onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 outline-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="free_trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(search || statusFilter !== "all" || cityFilter !== "all" || typeFilter !== "all" || planFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCityFilter("all");
                  setTypeFilter("all");
                  setPlanFilter("all");
                  setPage(1);
                }}
                className="text-xs font-bold text-[#F97316] hover:text-orange-700 px-2 py-1"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA (TABLE OR CARD GRID) ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#F97316] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500 mt-4">Loading restaurant tenants...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No restaurants match your filters</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query, status tabs, or city criteria to locate tenant accounts.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ── ENTERPRISE DATA TABLE ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75">
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selectedIds.length === paged.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Tenant / Restaurant</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Owner & Contact</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Location & Type</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Tier</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Status</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">KYC Compliance</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((r, idx) => {
                  const targetId = r._id || r.id!;
                  const isSelected = selectedIds.includes(targetId);
                  const isCurrentlyActive = r.isActive !== false && r.status === "active";
                  const dt = r.createdAt ? formatDateTime(r.createdAt) : "—";

                  return (
                    <tr
                      key={targetId}
                      className={`hover:bg-gray-50/75 transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(targetId)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                        />
                      </td>

                      {/* Restaurant Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <RestaurantAvatar name={r.name} index={(page - 1) * PAGE_SIZE + idx} logoUrl={r.logoUrl} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{r.name}</span>
                              {r.slug && (
                                <a
                                  href={`/${r.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View Public Storefront"
                                  className="text-gray-400 hover:text-[#F97316] transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {r.slug ? `/${r.slug}` : `ID: ${targetId.slice(-6)}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-gray-800">{r.ownerName || "—"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.phone && (
                            <span className="text-[11px] text-gray-500 font-medium">{r.phone}</span>
                          )}
                          {r.email && (
                            <button
                              onClick={() => handleCopy(targetId, r.email!)}
                              title="Copy Email"
                              className="text-gray-400 hover:text-gray-700"
                            >
                              {copiedId === targetId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Location & Type */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-gray-800">{r.city || r.address || "Addis Ababa"}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {r.restaurantType || r.cuisineType?.slice(0, 2).join(", ") || "Restaurant"}
                        </p>
                      </td>

                      {/* Subscription Plan */}
                      <td className="px-5 py-4">
                        <PlanBadge plan={r.subscriptionPlan} />
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <StatusBadge s={r.status} isActive={r.isActive} />
                      </td>

                      {/* Verification Status */}
                      <td className="px-5 py-4">
                        <VPill s={r.verificationStatus} />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Launch storefront */}
                          {r.slug && (
                            <a
                              href={`/${r.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open Customer Storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Quick Inspect */}
                          <button
                            onClick={() => { setSelectedRestaurant(r); setActiveTabDrawer("overview"); }}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Inspect Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Suspend/Unblock switch */}
                          <button
                            onClick={() => setStatusModalRestaurant(r)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              isCurrentlyActive
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {isCurrentlyActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── HIGH-TECH CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {paged.map((r, idx) => {
            const targetId = r._id || r.id!;
            const isSelected = selectedIds.includes(targetId);
            const isCurrentlyActive = r.isActive !== false && r.status === "active";

            return (
              <div
                key={targetId}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
                  isSelected ? "border-[#F97316] ring-2 ring-[#F97316]/20" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Banner / Card Header */}
                <div className="relative h-20 bg-gradient-to-r from-gray-900 to-zinc-800 p-3 flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectRow(targetId)}
                    className="w-4 h-4 rounded border-gray-400 text-[#F97316] focus:ring-[#F97316] bg-black/40 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-1.5">
                    <PlanBadge plan={r.subscriptionPlan} />
                  </div>
                </div>

                {/* Floating Avatar & Details */}
                <div className="px-5 pb-5 pt-0 relative flex-1 flex flex-col justify-between">
                  <div className="-mt-8 mb-3 flex items-end justify-between">
                    <RestaurantAvatar name={r.name} index={(page - 1) * PAGE_SIZE + idx} logoUrl={r.logoUrl} size="lg" />
                    <StatusBadge s={r.status} isActive={r.isActive} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate">{r.name}</h3>
                      {r.slug && (
                        <a
                          href={`/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview Storefront"
                          className="text-gray-400 hover:text-[#F97316] flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                      {r.slug ? `/${r.slug}` : `ID: ${targetId.slice(-6)}`}
                    </p>

                    <div className="mt-3.5 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium">{r.ownerName || "No Owner Listed"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{r.city || r.address || "Addis Ababa"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-mono text-[11px]">{r.email || "No email"}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <VPill s={r.verificationStatus} />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {r.restaurantType || "Restaurant"}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedRestaurant(r); setActiveTabDrawer("overview"); }}
                      className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400" /> Details
                    </button>
                    <button
                      onClick={() => setStatusModalRestaurant(r)}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                        isCurrentlyActive
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {isCurrentlyActive ? <><Ban className="w-3.5 h-3.5" /> Suspend</> : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
            <span className="font-bold text-gray-800">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
            <span className="font-bold text-gray-800">{filtered.length}</span> restaurants
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  page === p
                    ? "bg-[#F97316] text-white shadow-xs"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 5 && <span className="text-gray-300 text-xs px-1">…</span>}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING BATCH ACTION DOCK ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping"></span>
            <span className="text-xs font-bold">{selectedIds.length} restaurants selected</span>
          </div>

          <div className="h-4 w-px bg-white/20"></div>

          <button
            onClick={() => handleExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export ({selectedIds.length})
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-gray-400 hover:text-white font-medium ml-1"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ── STATUS TOGGLE / SUSPEND CONFIRMATION MODAL ── */}
      {statusModalRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {statusModalRestaurant.isActive !== false && statusModalRestaurant.status === "active"
                  ? "Suspend Restaurant Account?"
                  : "Reactivate Restaurant Account?"}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {statusModalRestaurant.isActive !== false && statusModalRestaurant.status === "active"
                  ? `Suspending "${statusModalRestaurant.name}" will temporarily hide their public menu storefront and pause online orders.`
                  : `Reactivating "${statusModalRestaurant.name}" will restore their live menu storefront and resume ordering operations.`}
              </p>

              {statusModalRestaurant.isActive !== false && statusModalRestaurant.status === "active" && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-gray-700">Reason for Suspension</label>
                  <select
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#F97316]"
                  >
                    <option value="Policy Violation">Policy Violation</option>
                    <option value="Incomplete KYC Documents">Incomplete KYC Documents</option>
                    <option value="Overdue Billing / Subscription">Overdue Billing / Subscription</option>
                    <option value="Temporary Operational Maintenance">Temporary Operational Maintenance</option>
                    <option value="Custom">Other Custom Reason</option>
                  </select>

                  {suspendReason === "Custom" && (
                    <textarea
                      rows={2}
                      placeholder="Specify the reason for suspension..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:border-[#F97316]"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStatusModalRestaurant(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={toggling}
                onClick={handleExecuteStatusToggle}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm ${
                  statusModalRestaurant.isActive !== false && statusModalRestaurant.status === "active"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggling ? "Updating..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARD RESTAURANT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tight">Onboard Restaurant</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Provision a new restaurant establishment and owner credentials.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-7">
                {/* Section 1: Business Details */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#F97316]" /> Business Identity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Restaurant Name *</label>
                      <div className="relative">
                        <Utensils className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="e.g. Lucy Traditional Lounge"
                          value={addForm.restaurantName}
                          onChange={e => setAddForm({ ...addForm, restaurantName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Business Type *</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          required
                          value={addForm.restaurantType}
                          onChange={e => setAddForm({ ...addForm, restaurantType: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none appearance-none cursor-pointer"
                        >
                          <option value="Restaurant">Restaurant</option>
                          <option value="Cafe">Cafe</option>
                          <option value="Lounge & Bar">Lounge & Bar</option>
                          <option value="Food Truck">Food Truck</option>
                          <option value="Cloud Kitchen">Cloud Kitchen</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Section 2: Owner & Contact */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#F97316]" /> Primary Contact & Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Owner Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="e.g. Almaz Bekele"
                          value={addForm.ownerName}
                          onChange={e => setAddForm({ ...addForm, ownerName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="email"
                          placeholder="owner@restaurant.com"
                          value={addForm.email}
                          onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="+251 91 123 4567"
                          value={addForm.phone}
                          onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Initial Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="Minimum 8 characters"
                          value={addForm.password}
                          onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Section 3: Location */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F97316]" /> Physical Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">City *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Addis Ababa"
                        value={addForm.city}
                        onChange={e => setAddForm({ ...addForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Physical Address *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Bole Medhanialem, Camrose Bldg"
                        value={addForm.address}
                        onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#F97316] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#F97316] hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? "Provisioning..." : "Onboard Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESTAURANT 360 PROFILE INSPECTION DRAWER / MODAL ── */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <RestaurantAvatar name={selectedRestaurant.name} index={0} logoUrl={selectedRestaurant.logoUrl} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{selectedRestaurant.name}</h3>
                    <StatusBadge s={selectedRestaurant.status} isActive={selectedRestaurant.isActive} />
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {selectedRestaurant.slug ? `/${selectedRestaurant.slug}` : `ID: ${(selectedRestaurant._id || selectedRestaurant.id)?.slice(-8)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="flex border-b border-gray-100 px-6 bg-white gap-4">
              {[
                { id: "overview", label: "Business Overview" },
                { id: "hours", label: "Operating Hours" },
                { id: "system", label: "Subscription & System" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTabDrawer(t.id as any)}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    activeTabDrawer === t.id
                      ? "border-[#F97316] text-[#F97316]"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {activeTabDrawer === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">KYC Compliance</span>
                      <div className="mt-1">
                        <VPill s={selectedRestaurant.verificationStatus} />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subscription Tier</span>
                      <div className="mt-1">
                        <PlanBadge plan={selectedRestaurant.subscriptionPlan} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> Owner / Manager
                      </span>
                      <span className="font-bold text-gray-900">{selectedRestaurant.ownerName || "Not specified"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" /> Email
                      </span>
                      <span className="font-mono text-gray-800">{selectedRestaurant.email || "Not specified"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> Phone
                      </span>
                      <span className="font-medium text-gray-800">{selectedRestaurant.phone || "Not specified"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" /> Physical Address
                      </span>
                      <span className="font-medium text-gray-800 text-right">
                        {selectedRestaurant.address ? `${selectedRestaurant.address}, ${selectedRestaurant.city || ""}` : selectedRestaurant.city || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {selectedRestaurant.slug && (
                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Digital Menu Storefront</p>
                        <p className="text-[11px] text-gray-500">Live ordering menu accessible to customers.</p>
                      </div>
                      <a
                        href={`/${selectedRestaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Visit Menu
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activeTabDrawer === "hours" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Weekly schedule configured by restaurant:</p>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 divide-y divide-gray-100">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
                      const h = selectedRestaurant.businessHours?.[day];
                      return (
                        <div key={day} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                          <span className="font-bold text-gray-800 capitalize">{day}</span>
                          {h?.isOpen ? (
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                              {h.openTime} - {h.closeTime}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTabDrawer === "system" && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Internal MongoDB ID</span>
                      <span className="font-mono text-[11px] text-gray-700">{selectedRestaurant._id || selectedRestaurant.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Onboarding Date</span>
                      <span className="font-medium text-gray-800">{formatDateTime(selectedRestaurant.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Telemetry Update</span>
                      <span className="font-medium text-gray-800">{formatDateTime(selectedRestaurant.updatedAt || selectedRestaurant.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = selectedRestaurant;
                  setSelectedRestaurant(null);
                  setStatusModalRestaurant(target);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  selectedRestaurant.isActive !== false && selectedRestaurant.status === "active"
                    ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {selectedRestaurant.isActive !== false && selectedRestaurant.status === "active"
                  ? "Suspend Account"
                  : "Activate Account"}
              </button>

              <button
                onClick={() => setSelectedRestaurant(null)}
                className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRestaurants;
