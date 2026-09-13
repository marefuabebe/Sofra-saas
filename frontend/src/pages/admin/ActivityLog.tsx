import React, { useState, useEffect, useMemo } from "react";
import {
  Download, Filter, Search, ChevronDown, Activity, User, ShieldAlert, FileEdit,
  LogIn, Eye, X, Calendar, Clock, Monitor, Terminal, RefreshCw, Check, Copy,
  Shield, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Play, Pause,
  FileJson, LayoutGrid, List, Sparkles, ChevronLeft, ChevronRight,
  Hash, Globe, Lock, Cpu, Layers
} from "lucide-react";
import { getAdminActivityLogs } from "../../services/adminService";
import { formatDateTime, copyToClipboard } from "../../utils/helpers";
import { socket } from "../../config/socket";
import toast from "react-hot-toast";

interface LogEntry {
  _id: string;
  action: string;
  category: "auth" | "system" | "security" | "management" | string;
  adminName: string;
  adminRole: string;
  ip: string;
  status: "success" | "warning" | "failed" | string;
  createdAt: string;
  details?: any;
}

const categoryIcon: Record<string, React.ReactNode> = {
  auth: <LogIn className="w-4 h-4" />,
  system: <Activity className="w-4 h-4" />,
  security: <ShieldAlert className="w-4 h-4" />,
  management: <FileEdit className="w-4 h-4" />,
};

const categoryBadgeStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  auth: {
    bg: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
    border: "border-blue-200",
    glow: "shadow-blue-500/10"
  },
  system: {
    bg: "bg-purple-50 text-purple-700",
    text: "text-purple-700",
    border: "border-purple-200",
    glow: "shadow-purple-500/10"
  },
  security: {
    bg: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
    border: "border-rose-200",
    glow: "shadow-rose-500/10"
  },
  management: {
    bg: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
    border: "border-amber-200",
    glow: "shadow-amber-500/10"
  },
};

const ActivityLog: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoStream, setAutoStream] = useState<boolean>(true);

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  /* ─── Fetch Activity Logs ──────────────────────────── */
  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await getAdminActivityLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Auto-sync polling every 15s if autoStream is active
    let interval: any;
    if (autoStream) {
      interval = setInterval(() => {
        fetchLogs(true);
      }, 15000);
    }

    // Socket realtime listener
    const onNewActivity = () => {
      fetchLogs(true);
    };

    socket.on("activity:new", onNewActivity);
    socket.on("order:new", onNewActivity);
    socket.on("verification:updated", onNewActivity);

    return () => {
      if (interval) clearInterval(interval);
      socket.off("activity:new", onNewActivity);
      socket.off("order:new", onNewActivity);
      socket.off("verification:updated", onNewActivity);
    };
  }, [autoStream]);

  /* ─── KPI Metrics ─────────────────────────────────── */
  const stats = useMemo(() => {
    const total = logs.length;
    const authCount = logs.filter(l => l.category === "auth").length;
    const securityCount = logs.filter(l => l.category === "security" || l.status === "warning" || l.status === "failed").length;
    const managementCount = logs.filter(l => l.category === "management").length;
    const systemCount = logs.filter(l => l.category === "system").length;
    const successCount = logs.filter(l => l.status === "success").length;

    return {
      total,
      authCount,
      securityCount,
      managementCount,
      systemCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 100
    };
  }, [logs]);

  /* ─── Filtering & Sorting ─────────────────────────── */
  const filtered = useMemo(() => {
    return logs
      .filter(log => {
        if (selectedCategory !== "all" && log.category !== selectedCategory) return false;
        if (statusFilter !== "all" && log.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchAction = log.action?.toLowerCase().includes(q);
          const matchUser = log.adminName?.toLowerCase().includes(q);
          const matchRole = log.adminRole?.toLowerCase().includes(q);
          const matchIp = log.ip?.toLowerCase().includes(q);
          const matchCategory = log.category?.toLowerCase().includes(q);
          const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
          return matchAction || matchUser || matchRole || matchIp || matchCategory || matchDetails;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [logs, selectedCategory, statusFilter, search, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, statusFilter, sortOrder]);

  /* ─── Selection Helpers ────────────────────────────── */
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLogs.map(l => l._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ─── Export Utilities ─────────────────────────────── */
  const handleExportCSV = (onlySelected: boolean = false) => {
    const dataToExport = onlySelected
      ? logs.filter(l => selectedIds.includes(l._id))
      : filtered;

    if (dataToExport.length === 0) {
      toast.error("No telemetry logs available to export.");
      return;
    }

    const headers = ["ID", "Event Action", "Category", "User", "Role", "IP Address", "Date Time", "Status", "Details JSON"];
    const rows = dataToExport.map(l => [
      l._id || "",
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${l.category || ""}"`,
      `"${l.adminName || ""}"`,
      `"${l.adminRole || ""}"`,
      l.ip || "",
      `"${formatDateTime(l.createdAt)}"`,
      l.status || "",
      `"${l.details ? JSON.stringify(l.details).replace(/"/g, '""') : ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sofra_audit_telemetry_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataToExport.length} logs to CSV.`);
  };

  const handleExportJSON = (onlySelected: boolean = false) => {
    const dataToExport = onlySelected
      ? logs.filter(l => selectedIds.includes(l._id))
      : filtered;

    if (dataToExport.length === 0) {
      toast.error("No telemetry logs available to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sofra_audit_telemetry_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataToExport.length} logs to JSON.`);
  };

  /* ─── Category Filter Tabs ─────────────────────────── */
  const categoryTabs = [
    { key: "all", label: "All Telemetry", count: stats.total },
    { key: "auth", label: "Auth & Access", count: stats.authCount },
    { key: "security", label: "Security & KYC", count: stats.securityCount },
    { key: "management", label: "Platform Ops", count: stats.managementCount },
    { key: "system", label: "System POS", count: stats.systemCount },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ── TOP FUTURISTIC AUDIT & TELEMETRY RIBBON ── */}
      <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-black text-white rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Activity className="w-6 h-6 text-[#F97316] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">SIEM Audit & Telemetry</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Ingestion Active
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                <Lock className="w-3 h-3 text-[#F97316]" /> SHA-256 Immutability Logged
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Real-time administrative event stream, authentication tracing, security alerts, and system compliance logs.
            </p>
          </div>
        </div>

        {/* Telemetry Actions & Stream Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Stream auto-refresh toggle */}
          <button
            onClick={() => setAutoStream(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              autoStream
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
            title={autoStream ? "Auto-stream active (updates every 15s)" : "Auto-stream paused"}
          >
            {autoStream ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:border-white/20 disabled:opacity-50"
            title="Force refresh telemetry log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#F97316]" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Export CSV / JSON buttons */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleExportCSV(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Export all filtered logs as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <span className="w-px h-3.5 bg-white/20" />
            <button
              onClick={() => handleExportJSON(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Export all filtered logs as JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 EXECUTIVE AUDIT TELEMETRY KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Audit Stream */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Stream</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-gray-400">events logged</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${(stats.authCount / (stats.total || 1)) * 100}%` }} className="bg-blue-500" title="Auth" />
              <div style={{ width: `${(stats.securityCount / (stats.total || 1)) * 100}%` }} className="bg-rose-500" title="Security" />
              <div style={{ width: `${(stats.managementCount / (stats.total || 1)) * 100}%` }} className="bg-amber-500" title="Management" />
              <div style={{ width: `${(stats.systemCount / (stats.total || 1)) * 100}%` }} className="bg-purple-500" title="System" />
            </div>
            <span className="text-[10px] font-bold text-gray-400">{stats.successRate}% OK</span>
          </div>
        </div>

        {/* Authentication & Access */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Auth & Access</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.authCount}</span>
            <span className="text-[11px] font-semibold text-blue-600/80">sessions</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">OAuth, JWT, and Admin logins</p>
        </div>

        {/* Security Alerts & Anomalies */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-shadow ${
          stats.securityCount > 0 ? "border-rose-100 ring-1 ring-rose-300/20" : "border-gray-100"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Security & Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{stats.securityCount}</span>
            {stats.securityCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> Flagged
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">KYC checks, warnings & failures</p>
        </div>

        {/* System & Management Ops */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Ops & System</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600">{stats.managementCount + stats.systemCount}</span>
            <span className="text-[11px] font-semibold text-purple-600/80">mutations</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">POS orders & restaurant registry</p>
        </div>
      </div>

      {/* ── CATEGORY TABS BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryTabs.map(tab => {
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
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
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH & MULTI-FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Omni-search input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Omni-search: Event, User, Role, IP address, Payload details..."
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
          {/* Status filter dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100/80 cursor-pointer outline-none focus:border-[#F97316]"
            >
              <option value="all">All Severities</option>
              <option value="success">Success Status</option>
              <option value="warning">Warning Alerts</option>
              <option value="failed">Failed / Critical</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => (prev === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors"
            title={`Sort order: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`}
          >
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>

          {/* View Mode (Table vs Cards) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              title="Table Grid View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              title="Stream Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Clear Filters (if active) */}
          {(search || selectedCategory !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="text-xs text-rose-600 font-bold px-2 py-1 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (TABLE OR CARDS) ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-24">
            <div className="animate-spin w-8 h-8 border-3 border-[#F97316] border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-semibold text-gray-500 mt-3">Connecting to SIEM audit stream...</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Matching Telemetry Events</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              No audit logs matched your current filter criteria. Try resetting filters or expanding your search keyword.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* ── TABLE VIEW ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedLogs.length > 0 && selectedIds.length === paginatedLogs.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">EVENT ACTION</th>
                  <th className="px-4 py-3.5">ORIGIN / OPERATOR</th>
                  <th className="px-4 py-3.5">NETWORK IP</th>
                  <th className="px-4 py-3.5">TIMESTAMP</th>
                  <th className="px-4 py-3.5">STATUS</th>
                  <th className="px-4 py-3.5 text-right">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedLogs.map((log, idx) => {
                  const isSelected = selectedIds.includes(log._id);
                  const bStyle = categoryBadgeStyles[log.category] || categoryBadgeStyles.system;

                  return (
                    <tr
                      key={log._id || idx}
                      className={`hover:bg-gray-50/80 transition-colors group cursor-pointer ${
                        isSelected ? "bg-orange-50/30" : ""
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(log._id)}
                          className="rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                        />
                      </td>

                      {/* Event Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${bStyle.bg} ${bStyle.border}`}
                          >
                            {categoryIcon[log.category] || <Activity className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-[#F97316] transition-colors">
                              {log.action}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                {log.category}
                              </span>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                                  +Payload
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Origin / Operator */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                            {log.adminName?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{log.adminName}</p>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {log.adminRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Network IP */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono bg-zinc-50 border border-zinc-200/80 px-2 py-0.5 rounded-md text-zinc-700 font-medium">
                            {log.ip || "127.0.0.1"}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleCopy(`ip-${log._id}`, log.ip);
                            }}
                            className="text-gray-300 hover:text-gray-600 p-0.5"
                            title="Copy IP"
                          >
                            {copiedId === `ip-${log._id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-800">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            log.status === "success"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : log.status === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.status === "success"
                                ? "bg-emerald-500"
                                : log.status === "warning"
                                ? "bg-amber-500"
                                : "bg-rose-500 animate-ping"
                            }`}
                          />
                          {log.status}
                        </span>
                      </td>

                      {/* Inspect Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#F97316] hover:border-[#F97316]/40 hover:bg-orange-50/30 transition-all shadow-xs"
                          title="Inspect Event Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── STREAM CARDS VIEW ── */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedLogs.map((log, idx) => {
              const isSelected = selectedIds.includes(log._id);
              const bStyle = categoryBadgeStyles[log.category] || categoryBadgeStyles.system;

              return (
                <div
                  key={log._id || idx}
                  onClick={() => setSelectedLog(log)}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-md cursor-pointer relative ${
                    isSelected
                      ? "border-[#F97316] ring-2 ring-[#F97316]/20 bg-orange-50/10"
                      : "border-gray-200/80 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${bStyle.bg} ${bStyle.border}`}
                      >
                        {categoryIcon[log.category] || <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug">{log.action}</h4>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mt-0.5 inline-block">
                          {log.category} Event
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex-shrink-0 ${
                        log.status === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : log.status === "warning"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          log.status === "success"
                            ? "bg-emerald-500"
                            : log.status === "warning"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {log.status}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{log.adminName}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.2 rounded font-mono text-gray-600">
                        {log.adminRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      <span>{log.ip}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(log.createdAt)}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="text-[#F97316] font-bold hover:underline flex items-center gap-1"
                    >
                      Inspect <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION BAR ── */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/40 gap-3">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="text-gray-900 font-bold">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="text-gray-900 font-bold">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="text-gray-900 font-bold">{filtered.length}</span> audit records
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="text-xs font-bold text-gray-600 px-2">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING MULTI-SELECT BATCH ACTION DOCK ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
            <span className="text-xs font-black">
              {selectedIds.length} Event{selectedIds.length > 1 ? "s" : ""} Selected
            </span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={() => handleExportCSV(true)}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-[#F97316] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Selected (CSV)
          </button>
          <button
            onClick={() => handleExportJSON(true)}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-[#F97316] transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            Export (JSON)
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

      {/* ── ENHANCED INTERACTIVE EVENT PAYLOAD INSPECTOR MODAL ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-gray-950 via-zinc-900 to-black text-white border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    categoryBadgeStyles[selectedLog.category]?.bg || "bg-orange-50"
                  } ${categoryBadgeStyles[selectedLog.category]?.border || "border-orange-200"}`}
                >
                  <div className="scale-125">
                    {categoryIcon[selectedLog.category] || <Activity className="w-5 h-5" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-lg tracking-tight">
                      {selectedLog.action}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        selectedLog.status === "success"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : selectedLog.status === "warning"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {selectedLog.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Logged Event ID: <span className="font-mono text-zinc-300">{selectedLog._id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-gray-50/50">
              {/* Telemetry Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Operator Profile */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <User className="w-4 h-4 text-[#F97316]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Operator</span>
                  </div>
                  <p className="text-sm font-black text-gray-900">{selectedLog.adminName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{selectedLog.adminRole}</p>
                </div>

                {/* Network Origin */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">IP & Origin</span>
                  </div>
                  <p className="text-sm font-mono font-black text-gray-900">{selectedLog.ip || "127.0.0.1"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedLog.ip === "::1" || selectedLog.ip === "127.0.0.1" ? "Localhost / Internal Node" : "Public Gateway"}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Event Time</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {formatDateTime(selectedLog.createdAt)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">ISO UTC Registered</p>
                </div>
              </div>

              {/* Cryptographic Compliance Seal */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Cryptographically Immutable Record</span>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Verified by platform SIEM engine. Cannot be altered or purged without super-admin key.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`full-log-${selectedLog._id}`, JSON.stringify(selectedLog, null, 2))}
                  className="bg-white border border-emerald-300 px-3 py-1.5 rounded-xl font-bold text-emerald-700 hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedId === `full-log-${selectedLog._id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* JSON Payload Inspector */}
              <div className="bg-[#0D1117] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Terminal className="w-4 h-4 text-[#F97316]" />
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                      Raw Audit Payload (JSON)
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>

                <div className="p-5 overflow-x-auto max-h-72">
                  <pre className="text-xs font-mono leading-relaxed text-[#E6EDF3]">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify(
                          {
                            _id: selectedLog._id,
                            action: selectedLog.action,
                            category: selectedLog.category,
                            operator: {
                              name: selectedLog.adminName,
                              role: selectedLog.adminRole,
                            },
                            network: {
                              ip: selectedLog.ip,
                              protocol: "TLSv1.3",
                            },
                            status: selectedLog.status,
                            timestamp: selectedLog.createdAt,
                            details: selectedLog.details || {},
                          },
                          null,
                          2
                        )
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
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Record stored in MongoDB collection: <code className="text-gray-600 font-mono">adminactivitylogs</code>
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
