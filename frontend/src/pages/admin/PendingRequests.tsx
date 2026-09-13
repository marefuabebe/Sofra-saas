import React, { useEffect, useState } from "react";
import {
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Download,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Radio,
} from "lucide-react";
import {
  subscribeToPendingRequests,
  createRestaurantAccount,
  rejectRegistrationRequest,
} from "../../services/adminService";
import { formatDateTime, copyToClipboard } from "../../utils/helpers";
import { APP_CONFIG } from "../../config/config";
import toast from "react-hot-toast";

interface Req {
  _id: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  restaurantType: string;
  status: "pending" | "contacted" | "verified" | "rejected" | string;
  heardFrom?: string;
  notes?: string;
  rejectionReason?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

/* ─── Restaurant avatar ─────────────────────────────── */
const RestaurantAvatar: React.FC<{ name: string; index: number }> = ({ name, index }) => {
  const colors = [
    "bg-orange-500",
    "bg-emerald-600",
    "bg-blue-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-teal-600",
    "bg-amber-600",
    "bg-indigo-600",
  ];
  const bg = colors[index % colors.length];
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 shadow-sm text-white font-bold text-sm`}>
      {name?.[0]?.toUpperCase() || "R"}
    </div>
  );
};

/* ─── Status badge ────────────────────────────────────── */
const StatusBadge: React.FC<{ s: string }> = ({ s }) => {
  if (s === "verified" || s === "approved") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        Approved
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
        <XCircle className="w-3 h-3 text-rose-500" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pending
    </span>
  );
};

/* ─── Modal Base ─────────────────────────────────────── */
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-gray-100 animate-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 8;

/* ─── Main Component ──────────────────────────────────── */
const PendingRequests: React.FC = () => {
  const [all, setAll] = useState<Req[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [viewReq, setViewReq] = useState<Req | null>(null);
  const [approveReq, setApproveReq] = useState<Req | null>(null);
  const [rejectReq, setRejectReq] = useState<Req | null>(null);
  const [creds, setCreds] = useState<any>(null);

  // Approve form
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free_trial");
  const [internalNotes, setInternalNotes] = useState("");
  const [aErr, setAErr] = useState("");
  const [aLoad, setALoad] = useState(false);

  // Reject form
  const [reason, setReason] = useState("");
  const [presetReason, setPresetReason] = useState("Incomplete documentation or invalid contact information");
  const [rErr, setRErr] = useState("");
  const [rLoad, setRLoad] = useState(false);

  useEffect(() => {
    const sub = subscribeToPendingRequests((data: any[]) => {
      setAll((data || []) as Req[]);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (approveReq) {
      setEmail(approveReq.email || "");
      setInternalNotes("");
    }
  }, [approveReq]);

  useEffect(() => {
    if (rejectReq) {
      setReason(presetReason);
    }
  }, [rejectReq, presetReason]);

  /* ── Counts ── */
  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    approved: all.filter((r) => r.status === "verified" || r.status === "approved").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  const uniqueCities = Array.from(new Set(all.map((r) => r.city).filter(Boolean)));

  /* ── Filtered & Sorted ── */
  const filtered = all
    .filter((r) => {
      // Tab filter
      if (tab === "pending" && r.status !== "pending") return false;
      if (tab === "verified" && r.status !== "verified" && r.status !== "approved") return false;
      if (tab === "rejected" && r.status !== "rejected") return false;

      // City filter
      if (cityFilter !== "all" && r.city !== cityFilter) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = r.restaurantName?.toLowerCase().includes(q);
        const matchOwner = r.ownerName?.toLowerCase().includes(q);
        const matchEmail = r.email?.toLowerCase().includes(q);
        const matchPhone = r.phone?.includes(q);
        const matchCity = r.city?.toLowerCase().includes(q);
        const matchType = r.restaurantType?.toLowerCase().includes(q);
        if (!matchName && !matchOwner && !matchEmail && !matchPhone && !matchCity && !matchType) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === "name") {
        return (a.restaurantName || "").localeCompare(b.restaurantName || "");
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Multi-select helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paged.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /* ── Handlers ── */
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setAErr("");
    if (!email) {
      setAErr("Email is required");
      return;
    }
    if (!approveReq) return;
    setALoad(true);
    const res = await createRestaurantAccount(approveReq._id, {
      email,
      subscriptionPlan: plan,
      internalNotes,
    });
    setALoad(false);
    if (res.success) {
      setApproveReq(null);
      setCreds(res.credentials);
    } else {
      setAErr(res.error || "Failed to create restaurant account");
    }
  };

  const handleReject = async () => {
    const finalReason = reason.trim() || presetReason;
    if (!finalReason) {
      setRErr("Please provide a reason");
      return;
    }
    if (!rejectReq) return;
    setRLoad(true);
    await rejectRegistrationRequest(rejectReq._id, finalReason);
    setRLoad(false);
    setRejectReq(null);
    setReason("");
  };

  const handleExportCSV = (records = filtered) => {
    if (records.length === 0) {
      toast.error("No requests to export.");
      return;
    }
    toast.success(`Exporting ${records.length} requests to CSV.`);
    const headers = [
      "ID",
      "Restaurant Name",
      "Owner Name",
      "Email",
      "Phone",
      "City",
      "Address",
      "Type",
      "Status",
      "Submitted Date",
      "Notes",
    ];
    const rows = records.map((r) => [
      r._id || "",
      `"${r.restaurantName || ""}"`,
      `"${r.ownerName || ""}"`,
      r.email || "",
      `"${r.phone || ""}"`,
      `"${r.city || ""}"`,
      `"${r.address || ""}"`,
      `"${r.restaurantType || ""}"`,
      r.status || "",
      `"${formatDateTime(r.createdAt)}"`,
      `"${r.notes || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `sofra_registration_requests_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickCopyContact = async (r: Req) => {
    const text = `${r.restaurantName} | Owner: ${r.ownerName} | Tel: ${r.phone} | Email: ${r.email || "N/A"} | ${r.city}`;
    await copyToClipboard(text);
    setCopiedId(r._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs: Array<{
    key: "all" | "pending" | "verified" | "rejected";
    label: string;
    count: number;
    alert?: boolean;
  }> = [
    { key: "all", label: "All Requests", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending, alert: counts.pending > 0 },
    { key: "verified", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  const approvalRate =
    counts.approved + counts.rejected > 0
      ? Math.round((counts.approved / (counts.approved + counts.rejected)) * 100)
      : 100;

  return (
    <div className="space-y-5">
      {/* ─── Top Telemetry Banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 shadow-sm border border-gray-700/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Ingestion Pipeline Active
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300">
            Auto-Sync: <strong className="text-white">WebSocket Connected</strong>
          </span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-gray-300 hidden sm:inline">
            Verification Engine: <strong className="text-emerald-400">Online</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-gray-400">Conversion Rate:</span>
          <span className="font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded border border-orange-500/20 text-xs">
            {approvalRate}% Qualified
          </span>
        </div>
      </div>

      {/* ─── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registration Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review partner restaurant applications, qualify operators, and issue platform credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleExportCSV()}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Modern Metric Cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Inquiries</p>
            <p className="text-xl font-bold text-gray-900">{counts.all}</p>
            <p className="text-[11px] text-gray-400">All-time applications</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Awaiting Review</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-gray-900">{counts.pending}</p>
              {counts.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-[11px] text-amber-600 font-medium">Action required</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Approved & Active</p>
            <p className="text-xl font-bold text-gray-900">{counts.approved}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Onboarded partners</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Declined Requests</p>
            <p className="text-xl font-bold text-gray-900">{counts.rejected}</p>
            <p className="text-[11px] text-gray-400">Rejected applications</p>
          </div>
        </div>
      </div>

      {/* ─── Main Card with Search, Tabs, Table ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key as any);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? "bg-[#F97316] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : t.alert
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Search */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:border-gray-300 transition-colors flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent outline-none w-full sm:w-44 placeholder:text-gray-400 text-gray-900"
                  placeholder="Search request or owner..."
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 bg-gray-50 outline-none hover:border-gray-300 transition-colors"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 bg-gray-50 outline-none hover:border-gray-300 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Table with DIRECT ACTIONS ──────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selectedIds.length === paged.length}
                    onChange={handleSelectAll}
                    className="rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  RESTAURANT & CUISINE
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  OWNER & CONTACT
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  LOCATION
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  SUBMITTED
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  STATUS
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-gray-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-600">No requests found</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery
                          ? "Try adjusting your search query or city filter"
                          : `No ${tab !== "all" ? tab : ""} registration inquiries registered yet.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r, idx) => {
                  const isSelected = selectedIds.includes(r._id);
                  const dt = formatDateTime(r.createdAt);
                  const [dateStr, timeStr] = dt.includes(" at ") ? dt.split(" at ") : [dt, ""];

                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? "bg-orange-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r._id)}
                          className="rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                        />
                      </td>

                      {/* Restaurant & Cuisine */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <RestaurantAvatar name={r.restaurantName} index={(page - 1) * PAGE_SIZE + idx} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                              {r.restaurantName}
                            </p>
                            <span className="inline-block mt-0.5 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {r.restaurantType || "Restaurant"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{r.ownerName}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <a
                            href={`tel:${r.phone}`}
                            className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                            title="Call owner"
                          >
                            <Phone className="w-3 h-3 text-gray-400" />
                            {r.phone}
                          </a>
                          {r.email && (
                            <a
                              href={`mailto:${r.email}`}
                              className="flex items-center gap-1 hover:text-orange-600 transition-colors truncate max-w-[140px]"
                              title={r.email}
                            >
                              <Mail className="w-3 h-3 text-gray-400" />
                              {r.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{r.city || "Addis Ababa"}</span>
                        </div>
                        {r.address && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">
                            {r.address}
                          </p>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-gray-800">{dateStr}</p>
                        {timeStr && <p className="text-[10px] text-gray-400">{timeStr}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge s={r.status} />
                      </td>

                      {/* ROW ACTIONS (Approve / Reject / View) */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Inspect */}
                          <button
                            onClick={() => setViewReq(r)}
                            title="Inspect details"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Copy Contact */}
                          <button
                            onClick={() => handleQuickCopyContact(r)}
                            title="Copy contact details"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              copiedId === r._id
                                ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Action Buttons for Pending */}
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => setApproveReq(r)}
                                title="Approve & create account"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setRejectReq(r)}
                                title="Decline request"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Floating Multi-Select Action Bar ────────────────── */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-orange-50 border-t border-orange-100 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-orange-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              <span>{selectedIds.length} requests selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const selectedRecords = all.filter((r) => selectedIds.includes(r._id));
                  handleExportCSV(selectedRecords);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-orange-200 text-orange-700 hover:bg-orange-100/50 font-medium transition-colors"
              >
                Export Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* ─── Pagination ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} requests
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 7)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === p
                      ? "bg-[#F97316] text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            {totalPages > 7 && <span className="text-gray-300 text-xs px-1">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── View Modal (Modern Partner Profile) ─────────────── */}
      <Modal open={!!viewReq} onClose={() => setViewReq(null)} title="Partner Inquiry Profile" maxWidth="max-w-xl">
        {viewReq && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <RestaurantAvatar name={viewReq.restaurantName} index={0} />
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{viewReq.restaurantName}</h4>
                  <p className="text-xs text-gray-500">{viewReq.restaurantType} • {viewReq.city}</p>
                </div>
              </div>
              <StatusBadge s={viewReq.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Owner Name</p>
                <p className="text-gray-900 font-semibold text-sm">{viewReq.ownerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                <a href={`tel:${viewReq.phone}`} className="text-orange-600 font-semibold hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {viewReq.phone}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                {viewReq.email ? (
                  <a href={`mailto:${viewReq.email}`} className="text-orange-600 font-semibold hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {viewReq.email}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Physical Location</p>
                <p className="text-gray-800 font-medium">{viewReq.address || "Addis Ababa"}</p>
              </div>
            </div>

            {viewReq.notes && (
              <div className="bg-amber-50/60 border border-amber-200/50 p-3.5 rounded-xl text-xs">
                <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Applicant Notes:
                </p>
                <p className="text-amber-800">{viewReq.notes}</p>
              </div>
            )}

            {viewReq.rejectionReason && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs">
                <p className="font-bold text-rose-900 mb-1">Rejection Reason:</p>
                <p className="text-rose-700">{viewReq.rejectionReason}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {viewReq.status === "pending" ? (
                <>
                  <button
                    onClick={() => {
                      setViewReq(null);
                      setApproveReq(viewReq);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-semibold transition-colors shadow-sm"
                  >
                    Approve & Issue Credentials
                  </button>
                  <button
                    onClick={() => {
                      setViewReq(null);
                      setRejectReq(viewReq);
                    }}
                    className="flex-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl py-2.5 text-xs font-semibold transition-colors"
                  >
                    Decline Request
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setViewReq(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2.5 text-xs font-semibold transition-colors"
                >
                  Close Profile
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Approve & Create Account Modal ──────────────────── */}
      <Modal
        open={!!approveReq}
        onClose={() => {
          setApproveReq(null);
          setAErr("");
        }}
        title="Approve Partner & Create Account"
      >
        {approveReq && (
          <form onSubmit={handleApprove} className="space-y-4">
            {aErr && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl">
                {aErr}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-xs">
              <p className="font-bold text-gray-900">{approveReq.restaurantName}</p>
              <p className="text-gray-500 mt-0.5">
                Owner: {approveReq.ownerName} • {approveReq.phone} • {approveReq.city}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Official Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="owner@restaurant.com"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-colors"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Login credentials will be generated and associated with this email address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Assign Subscription Tier
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
              >
                {Object.keys(APP_CONFIG.plans).map((k) => (
                  <option key={k} value={k}>
                    {APP_CONFIG.plans[k as keyof typeof APP_CONFIG.plans].name} (
                    {APP_CONFIG.plans[k as keyof typeof APP_CONFIG.plans].price} ETB/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Internal Onboarding Notes (Optional)
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. VIP client, scheduled demo for Thursday"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setApproveReq(null);
                  setAErr("");
                }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={aLoad}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-semibold disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {aLoad ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Provision</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── Reject Modal ────────────────────────────────────── */}
      <Modal
        open={!!rejectReq}
        onClose={() => {
          setRejectReq(null);
          setRErr("");
          setReason("");
        }}
        title="Decline Registration Request"
      >
        {rejectReq && (
          <div className="space-y-4">
            {rErr && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2 rounded-xl">
                {rErr}
              </div>
            )}
            <p className="text-xs text-gray-600">
              You are about to decline the application from{" "}
              <strong className="text-gray-900">{rejectReq.restaurantName}</strong>. Please select or write a reason.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Preset Reason</label>
              <select
                value={presetReason}
                onChange={(e) => {
                  setPresetReason(e.target.value);
                  setReason(e.target.value);
                }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 mb-2"
              >
                <option value="Incomplete documentation or invalid contact information">
                  Incomplete documentation / contact info
                </option>
                <option value="Outside current serviceable onboarding zone">
                  Outside current serviceable zone
                </option>
                <option value="Duplicate registration application">
                  Duplicate application
                </option>
                <option value="Does not meet platform commercial licensing requirements">
                  Licensing requirements not met
                </option>
                <option value="Custom">Custom explanation...</option>
              </select>

              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setRErr("");
                }}
                rows={3}
                placeholder="Details of rejection to store on file..."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => {
                  setRejectReq(null);
                  setReason("");
                  setRErr("");
                }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rLoad}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-xs font-semibold disabled:opacity-60 transition-colors shadow-sm"
              >
                {rLoad ? "Processing..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Credentials Modal (Success) ─────────────────────── */}
      <Modal open={!!creds} onClose={() => setCreds(null)} title="Restaurant Account Provisioned!">
        {creds && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-base">Onboarding Complete!</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                The restaurant account is active and ready to log in.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-sans font-bold">
                  Login Email
                </span>
                <span className="font-semibold text-gray-900 text-sm select-all">{creds.email}</span>
              </div>
              {creds.password && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-sans font-bold">
                    Generated Password
                  </span>
                  <span className="font-bold text-[#F97316] text-sm select-all">{creds.password}</span>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                await copyToClipboard(
                  `SOFRA Partner Credentials:\nPortal: ${window.location.origin}/restaurant/login\nEmail: ${creds.email}\nPassword: ${creds.password}`
                );
                toast.success("Partner credentials copied to clipboard!");
              }}
              className="w-full border border-gray-200 hover:border-gray-300 rounded-xl py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Credentials</span>
            </button>

            <button
              onClick={() => setCreds(null)}
              className="w-full bg-[#F97316] hover:bg-orange-600 text-white rounded-xl py-2.5 text-xs font-semibold transition-colors shadow-sm"
            >
              Done & Return to Requests
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingRequests;
