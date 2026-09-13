import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, ExternalLink,
  ShieldCheck, Shield, CheckCircle2, AlertTriangle, Clock,
  Search, Filter, Download, Eye, Check, X, Copy, RefreshCw,
  Store, User, Mail, Phone, MapPin, Radio, FileText, FileCheck,
  LayoutGrid, List, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import { api } from "../../services/api";
import { formatDateTime, copyToClipboard } from "../../utils/helpers";
import { socket } from "../../config/socket";
import toast from "react-hot-toast";

interface Restaurant {
  _id: string;
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  ownerName?: string;
  city?: string;
  address?: string;
  restaurantType?: string;
  verificationStatus: string;
  status?: string;
  internalNotes?: string;
  updatedAt: string;
  createdAt: string;
  logoUrl?: string;
}

/* ─── Restaurant Colored Avatar ──────────────────────── */
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
        className={`${sizeClasses[size]} object-cover border border-gray-100 shadow-xs flex-shrink-0 bg-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 shadow-xs text-white font-black`}
    >
      <span>{name?.[0]?.toUpperCase() || "R"}</span>
    </div>
  );
};

/* ─── Verification Status Badge ──────────────────────── */
const VBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    PENDING_VERIFICATION: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      label: "Pending Review",
      icon: Clock
    },
    UNDER_REVIEW: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      label: "Under Review",
      icon: Shield
    },
    APPROVED: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      label: "Certified & Approved",
      icon: CheckCircle2
    },
    REJECTED: {
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      label: "Disqualified",
      icon: AlertCircle
    },
    CHANGES_REQUESTED: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      label: "Changes Requested",
      icon: AlertTriangle
    },
    DOCUMENTS_REQUIRED: {
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-600",
      label: "Docs Needed",
      icon: FileText
    },
  };
  const config = map[status] || {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-600",
    label: status?.replace(/_/g, " ") || "Unknown",
    icon: FileText
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md border tracking-wide uppercase ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

const PAGE_SIZE = 8;

const VerificationRequests: React.FC = () => {
  const [all, setAll] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Inspection Drawer
  const [inspectRestaurant, setInspectRestaurant] = useState<Restaurant | null>(null);

  // Fast-Track Decision Modal
  const [decisionModalRestaurant, setDecisionModalRestaurant] = useState<Restaurant | null>(null);
  const [decisionAction, setDecisionAction] = useState<"approve" | "changes_requested" | "reject">("approve");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/restaurants");
      // Restaurants that have progressed into the verification lifecycle
      const withVerif = (data.data || []).filter((r: any) =>
        ["PENDING_VERIFICATION", "UNDER_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED", "DOCUMENTS_REQUIRED"].includes(r.verificationStatus)
      );
      setAll(withVerif);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();

    socket.on("verification:updated", fetchAll);
    socket.on("restaurant:updated", fetchAll);
    return () => {
      socket.off("verification:updated", fetchAll);
      socket.off("restaurant:updated", fetchAll);
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  /* ── Cities for filter ── */
  const cities = useMemo(() => {
    const raw = all.map(r => r.city || r.address).filter(Boolean);
    return ["all", ...Array.from(new Set(raw))];
  }, [all]);

  /* ── KPI Metric Counts ── */
  const counts = useMemo(() => {
    return {
      all: all.length,
      pending: all.filter(r => r.verificationStatus === "PENDING_VERIFICATION").length,
      review: all.filter(r => r.verificationStatus === "UNDER_REVIEW").length,
      approved: all.filter(r => r.verificationStatus === "APPROVED").length,
      rejected: all.filter(r => ["REJECTED", "CHANGES_REQUESTED", "DOCUMENTS_REQUIRED"].includes(r.verificationStatus)).length,
    };
  }, [all]);

  const tabStatusMap: Record<string, string[]> = {
    all: ["PENDING_VERIFICATION", "UNDER_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED", "DOCUMENTS_REQUIRED"],
    pending: ["PENDING_VERIFICATION"],
    review: ["UNDER_REVIEW"],
    approved: ["APPROVED"],
    rejected: ["REJECTED", "CHANGES_REQUESTED", "DOCUMENTS_REQUIRED"],
  };

  /* ── Filtered + Sorted Records ── */
  const filtered = useMemo(() => {
    return all.filter(r => {
      // Tab filter
      const matchesTab = tabStatusMap[tab]?.includes(r.verificationStatus);
      if (!matchesTab) return false;

      // City filter
      if (cityFilter !== "all" && r.city !== cityFilter && r.address !== cityFilter) return false;

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesOwner = r.ownerName?.toLowerCase().includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        const matchesPhone = r.phone?.toLowerCase().includes(q);
        const matchesCity = r.city?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesEmail && !matchesPhone && !matchesCity) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sort === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return sort === "oldest" ? timeA - timeB : timeB - timeA;
    });
  }, [all, tab, cityFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  /* ── Multi-select ── */
  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length && paged.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paged.map(r => r._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /* ── Copy to Clipboard ── */
  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Export CSV Audit ── */
  const handleExport = (onlySelected: boolean = false) => {
    const exportData = onlySelected
      ? all.filter(r => selectedIds.includes(r._id))
      : filtered;

    if (exportData.length === 0) {
      toast.error("No verification records to export.");
      return;
    }
    toast.success(`Exporting ${exportData.length} records to CSV.`);
    const headers = ["Restaurant ID", "Name", "Owner", "Email", "Phone", "City", "Verification Status", "Submitted On", "Internal Notes"];
    const rows = exportData.map(r => [
      r._id,
      `"${r.name || ""}"`,
      `"${r.ownerName || ""}"`,
      r.email || "",
      r.phone || "",
      `"${r.city || r.address || ""}"`,
      r.verificationStatus,
      `"${r.updatedAt ? formatDateTime(r.updatedAt) : ""}"`,
      `"${r.internalNotes || ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sofra_compliance_audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Fast-Track Decision Submit ── */
  const handleFastTrackSubmit = async () => {
    if (!decisionModalRestaurant) return;
    setDecisionLoading(true);
    try {
      await api.put(`/verification/restaurant/${decisionModalRestaurant._id}/verification`, {
        action: decisionAction,
        reason: decisionReason
      });
      setDecisionModalRestaurant(null);
      setDecisionReason("");
      toast.success("Verification decision submitted successfully!");
      await fetchAll();
    } catch {
      toast.error("Failed to submit verification status update.");
    } finally {
      setDecisionLoading(false);
    }
  };

  /* ── Tab Definitions ── */
  const tabs = [
    { key: "all",      label: "All Dossiers",         count: counts.all      },
    { key: "pending",  label: "Pending Verification", count: counts.pending, alert: counts.pending > 0 },
    { key: "review",   label: "Under Review",         count: counts.review   },
    { key: "approved", label: "Approved & Live",      count: counts.approved },
    { key: "rejected", label: "Changes / Flagged",    count: counts.rejected },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ── TOP FUTURISTIC COMPLIANCE TELEMETRY RIBBON ── */}
      <div className="bg-gradient-to-r from-gray-900 via-zinc-900 to-black text-white rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#F97316]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Compliance & KYC Vault</h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Identity Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Review government business licenses, food safety certifications, and owner credentials for regulatory compliance.
            </p>
          </div>
        </div>

        {/* Telemetry pill & Top Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Doc Engine: Active</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Cloudinary Vault Encrypted</span>
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all ${
              refreshing ? "animate-spin" : ""
            }`}
            title="Refresh Verification Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleExport(false)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F97316] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* ── 4 COMPLIANCE EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Dossiers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Dossiers</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{counts.all}</span>
            <span className="text-[11px] font-semibold text-gray-400">profiles</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Compliance verification records</p>
        </div>

        {/* Action Required: Pending Verification */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-shadow ${
          counts.pending > 0 ? "border-amber-200 ring-1 ring-amber-400/20" : "border-gray-100"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{counts.pending}</span>
            {counts.pending > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Action Needed
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Initial document review queue</p>
        </div>

        {/* Certified & Live */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Certified & Approved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{counts.approved}</span>
            <span className="text-[11px] font-bold text-emerald-600/80">fully compliant</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">KYC & regulatory validated</p>
        </div>

        {/* Flagged / Changes Requested */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Flagged / Changes</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{counts.rejected}</span>
            <span className="text-[11px] font-bold text-rose-600/80">attention</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Re-upload or correction requested</p>
        </div>
      </div>

      {/* ── SEARCH & MULTI-FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Omni Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by restaurant name, owner, email, phone, or city..."
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

          {/* Right Controls: View Toggle & Sort */}
          <div className="flex items-center gap-2.5 self-end lg:self-center">
            {/* View Mode */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
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

        {/* Tab Pills & City Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                  }`}
                >
                  {t.alert && !active && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* City selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={cityFilter}
                onChange={e => { setCityFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 outline-none cursor-pointer"
              >
                <option value="all">All Jurisdictions / Cities</option>
                {cities.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(search || cityFilter !== "all" || tab !== "all") && (
              <button
                onClick={() => { setSearch(""); setCityFilter("all"); setTab("all"); setPage(1); }}
                className="text-xs font-bold text-[#F97316] hover:text-orange-700 px-2 py-1"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLE OR CARD GRID CONTENT ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#F97316] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500 mt-4">Querying compliance registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No restaurants in this category</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Adjust your status tab filter or search query to view other compliance verification dossiers.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ── ENTERPRISE COMPLIANCE TABLE ── */
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
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Establishment</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">License Holder / Owner</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Jurisdiction</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Submission Telemetry</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">Compliance Status</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((r, idx) => {
                  const isSelected = selectedIds.includes(r._id);
                  const dateVal = r.updatedAt || r.createdAt;
                  const dt = dateVal ? formatDateTime(dateVal) : "—";
                  const [dateStr, timeStr] = dt.includes(" at ") ? dt.split(" at ") : [dt, ""];

                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-gray-50/75 transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(r._id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                        />
                      </td>

                      {/* Establishment */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <RestaurantAvatar name={r.name} index={(page - 1) * PAGE_SIZE + idx} logoUrl={r.logoUrl} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">{r.name}</span>
                              {r.slug && (
                                <a
                                  href={`/${r.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open Public Menu"
                                  className="text-gray-400 hover:text-[#F97316]"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {r.restaurantType || "Restaurant Tenant"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-gray-800">{r.ownerName || "—"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.phone && <span className="text-[11px] text-gray-500">{r.phone}</span>}
                          {r.email && (
                            <button
                              onClick={() => handleCopy(r._id, r.email!)}
                              title="Copy Email"
                              className="text-gray-400 hover:text-gray-700"
                            >
                              {copiedId === r._id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Jurisdiction / City */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-gray-800">{r.city || r.address || "Addis Ababa"}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {r._id.slice(-6)}</p>
                      </td>

                      {/* Submission Telemetry */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-700">{dateStr}</p>
                        {timeStr && <p className="text-[10px] text-gray-400 mt-0.5">{timeStr}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <VBadge status={r.verificationStatus} />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Inspect */}
                          <button
                            onClick={() => setInspectRestaurant(r)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Quick Compliance Overview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Fast Decision Dialog */}
                          <button
                            onClick={() => {
                              setDecisionModalRestaurant(r);
                              setDecisionAction(r.verificationStatus === "APPROVED" ? "changes_requested" : "approve");
                            }}
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Fast-Track Status Decision"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Primary Review Button */}
                          <Link
                            to={`/admin/verification/${r._id}`}
                            className="inline-flex items-center gap-1.5 bg-orange-50 text-[#F97316] hover:bg-[#F97316] hover:text-white border border-[#F97316]/30 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                          >
                            <span>Review Dossier</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
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
        /* ── CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {paged.map((r, idx) => {
            const isSelected = selectedIds.includes(r._id);
            const dateVal = r.updatedAt || r.createdAt;
            const dt = dateVal ? formatDateTime(dateVal) : "—";

            return (
              <div
                key={r._id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
                  isSelected ? "border-[#F97316] ring-2 ring-[#F97316]/20" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Card Banner */}
                <div className="relative h-20 bg-gradient-to-r from-gray-900 via-zinc-800 to-black p-3 flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectRow(r._id)}
                    className="w-4 h-4 rounded border-gray-400 text-[#F97316] focus:ring-[#F97316] bg-black/40 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-1 text-[10px] text-white/80 font-mono bg-white/10 px-2 py-0.5 rounded">
                    ID: {r._id.slice(-6)}
                  </div>
                </div>

                {/* Floating Avatar & Details */}
                <div className="px-5 pb-5 pt-0 relative flex-1 flex flex-col justify-between">
                  <div className="-mt-8 mb-3 flex items-end justify-between">
                    <RestaurantAvatar name={r.name} index={(page - 1) * PAGE_SIZE + idx} logoUrl={r.logoUrl} size="lg" />
                    <VBadge status={r.verificationStatus} />
                  </div>

                  <div>
                    <h3 className="font-black text-gray-900 text-base leading-tight truncate">{r.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {r.restaurantType || "Restaurant"}
                    </p>

                    <div className="mt-3.5 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium">{r.ownerName || "No Owner Stated"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{r.city || r.address || "Addis Ababa"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-[11px] text-gray-500">Updated: {dt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => setInspectRestaurant(r)}
                      className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                      title="Quick Inspect"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/admin/verification/${r._id}`}
                      className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-orange-50 text-[#F97316] hover:bg-[#F97316] hover:text-white border border-[#F97316]/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Review Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
            <span className="font-bold text-gray-800">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
            <span className="font-bold text-gray-800">{filtered.length}</span> compliance records
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
            <span className="text-xs font-bold">{selectedIds.length} compliance files selected</span>
          </div>

          <div className="h-4 w-px bg-white/20"></div>

          <button
            onClick={() => handleExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV ({selectedIds.length})
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-gray-400 hover:text-white font-medium ml-1"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ── QUICK INSPECTION DRAWER / MODAL ── */}
      {inspectRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <RestaurantAvatar name={inspectRestaurant.name} index={0} logoUrl={inspectRestaurant.logoUrl} size="md" />
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{inspectRestaurant.name}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {inspectRestaurant._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectRestaurant(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Current KYC Status</span>
                <VBadge status={inspectRestaurant.verificationStatus} />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Owner / Licensee</span>
                  <span className="font-bold text-gray-900">{inspectRestaurant.ownerName || "Not Provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Email</span>
                  <span className="font-mono text-gray-800">{inspectRestaurant.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Phone</span>
                  <span className="font-medium text-gray-800">{inspectRestaurant.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-gray-800 text-right">
                    {inspectRestaurant.address ? `${inspectRestaurant.address}, ${inspectRestaurant.city || ""}` : inspectRestaurant.city || "—"}
                  </span>
                </div>
              </div>

              {/* Compliance Checklist Summary */}
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">Required Compliance Dossier</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Business License</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Food Service Permit</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Owner National ID</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Tax Certification</span>
                  </div>
                </div>
              </div>

              {inspectRestaurant.internalNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold block mb-0.5">Admin Compliance Note:</span>
                  <p>{inspectRestaurant.internalNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <Link
                to={`/admin/verification/${inspectRestaurant._id}`}
                className="flex-1 py-2.5 px-4 bg-[#F97316] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors text-center shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Open Full Documents Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── FAST-TRACK DECISION MODAL ── */}
      {decisionModalRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Compliance Decision: {decisionModalRestaurant.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Record an official KYC compliance decision for this restaurant tenant.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Select Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "approve", label: "Approve", icon: CheckCircle2, color: "text-emerald-600 border-emerald-300 bg-emerald-50" },
                      { id: "changes_requested", label: "Request Changes", icon: AlertTriangle, color: "text-amber-600 border-amber-300 bg-amber-50" },
                      { id: "reject", label: "Disqualify", icon: AlertCircle, color: "text-rose-600 border-rose-300 bg-rose-50" },
                    ].map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setDecisionAction(btn.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          decisionAction === btn.id
                            ? btn.color + " ring-2 ring-offset-1 ring-orange-400"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <btn.icon className="w-4 h-4" />
                        <span className="text-[10px]">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Compliance Reason / Feedback Notes</label>
                  <textarea
                    rows={3}
                    placeholder={
                      decisionAction === "approve"
                        ? "Optional internal verification sign-off notes..."
                        : "Describe required document re-uploads or compliance issue..."
                    }
                    value={decisionReason}
                    onChange={e => setDecisionReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#F97316] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDecisionModalRestaurant(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={decisionLoading}
                onClick={handleFastTrackSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-[#F97316] hover:bg-orange-600 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {decisionLoading ? "Submitting..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;
