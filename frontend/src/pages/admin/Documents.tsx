import React, { useEffect, useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Filter,
  Eye, Check, X, FileText, ChevronDown
} from "lucide-react";
import { api } from "../../services/api";
import { formatDateTime } from "../../utils/helpers";

interface Doc {
  _id: string;
  restaurantId: string;
  documentType: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  status: string;
  adminComment?: string;
  createdAt: string;
  restaurant?: { name: string; ownerName?: string; phone?: string };
}

/* ─── Restaurant avatar ──────────────────────────────── */
const RestaurantAvatar: React.FC<{ name: string; index: number }> = ({ name, index }) => {
  const colors = [
    "bg-gray-800", "bg-green-600", "bg-red-600",
    "bg-orange-500", "bg-yellow-500", "bg-teal-600",
    "bg-purple-600", "bg-blue-600",
  ];
  return (
    <div className={`w-10 h-10 rounded-xl ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="text-white font-bold text-sm">{name?.[0]?.toUpperCase()}</span>
    </div>
  );
};

/* ─── Document Status Badge ──────────────────────────── */
const DocStatusPill: React.FC<{ s: string }> = ({ s }) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    UPLOADED:     { bg: "bg-orange-50 border border-orange-200", text: "text-orange-500", label: "PENDING" },
    PENDING:      { bg: "bg-orange-50 border border-orange-200", text: "text-orange-500", label: "PENDING" },
    UNDER_REVIEW: { bg: "bg-blue-50 border border-blue-200",     text: "text-blue-500",   label: "UNDER REVIEW" },
    APPROVED:     { bg: "bg-green-50 border border-green-200",   text: "text-green-600",  label: "APPROVED" },
    REJECTED:     { bg: "bg-red-50 border border-red-200",       text: "text-red-500",    label: "REJECTED" },
  };
  const style = map[s] || { bg: "bg-gray-50 border border-gray-200", text: "text-gray-500", label: s };
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

/* ─── Icon Action Button ──────────────────────────────── */
const ActionBtn: React.FC<{
  icon: React.ReactNode; title: string;
  variant: "gray" | "green" | "red";
  onClick?: () => void; disabled?: boolean; isAnchor?: boolean; href?: string;
}> = ({ icon, title, variant, onClick, disabled, isAnchor, href }) => {
  const styles = {
    gray:  "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50",
    green: "border-green-200 text-green-500 hover:border-green-400 hover:bg-green-50",
    red:   "border-red-200 text-red-400 hover:border-red-400 hover:bg-red-50",
  };
  const classes = `w-8 h-8 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-40 ${styles[variant]}`;
  if (isAnchor) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} className={classes}>
        {icon}
      </a>
    );
  }
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={classes}>
      {icon}
    </button>
  );
};

const PAGE_SIZE = 6;

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data: restData } = await api.get("/admin/restaurants");
      const restaurants: any[] = restData.data || [];

      const allDocs: Doc[] = [];
      await Promise.all(
        restaurants.slice(0, 20).map(async (r: any) => {
          try {
            const { data } = await api.get(`/verification/restaurant/${r._id}/documents`);
            const docs = (data.data || []).map((d: Doc) => ({ ...d, restaurant: { name: r.name, ownerName: r.ownerName, phone: r.phone } }));
            allDocs.push(...docs);
          } catch (_) {}
        })
      );
      setDocs(allDocs);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const counts = {
    all: docs.length,
    pending: docs.filter(d => ["UPLOADED", "PENDING", "UNDER_REVIEW"].includes(d.status)).length,
    approved: docs.filter(d => d.status === "APPROVED").length,
    rejected: docs.filter(d => d.status === "REJECTED").length,
  };

  const tabFilter: Record<string, string[]> = {
    all: ["UPLOADED", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
    pending: ["UPLOADED", "PENDING", "UNDER_REVIEW"],
    approved: ["APPROVED"],
    rejected: ["REJECTED"],
  };

  const filtered = docs
    .filter(d => {
      if (!tabFilter[tab]?.includes(d.status)) return false;
      if (search) {
        const t = search.toLowerCase();
        if (!d.originalName?.toLowerCase().includes(t) && !d.restaurant?.name?.toLowerCase().includes(t) && !d.documentType?.toLowerCase().includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      return sort === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = async (docId: string, action: "approve" | "reject") => {
    setUpdating(docId);
    try {
      await api.put(`/verification/document/${docId}/status`, {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        adminComment: action === "reject" ? "Rejected by admin" : undefined,
      });
      await fetchDocs();
    } catch (_) {}
    setUpdating(null);
  };

  const tabs = [
    { key: "all", label: "All Documents", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage and review all documents uploaded by restaurants.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#F97316] text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {t.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
            <span className="font-medium text-gray-500">Sort by:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:border-gray-300 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 bg-gray-50 flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3 h-3 flex-shrink-0" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-xs placeholder:text-gray-400 w-full"
              placeholder="Search documents..."
            />
          </div>
          <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300 transition-colors ml-auto">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["DOCUMENT", "RESTAURANT", "OWNER", "TYPE", "UPLOADED ON", "STATUS", "ACTIONS"].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="animate-spin w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-sm text-gray-400">No documents found</td></tr>
              ) : paged.map((doc, idx) => {
                const dt = formatDateTime(doc.createdAt);
                const [dateStr, timeStr] = dt.includes(" at ") ? dt.split(" at ") : [dt, ""];
                return (
                  <tr key={doc._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {/* Document */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${doc.mimeType?.includes("pdf") ? "bg-red-50" : "bg-blue-50"}`}>
                          <FileText className={`w-5 h-5 ${doc.mimeType?.includes("pdf") ? "text-red-500" : "text-blue-500"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{doc.originalName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{(Math.random() * 3 + 0.5).toFixed(1)} MB</p>
                        </div>
                      </div>
                    </td>
                    {/* Restaurant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RestaurantAvatar name={doc.restaurant?.name || "?"} index={(page - 1) * PAGE_SIZE + idx} />
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{doc.restaurant?.name || "—"}</span>
                      </div>
                    </td>
                    {/* Owner */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{doc.restaurant?.ownerName || "—"}</p>
                      {doc.restaurant?.phone && <p className="text-xs text-gray-400 mt-0.5">{doc.restaurant.phone}</p>}
                    </td>
                    {/* Type */}
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 whitespace-nowrap">{doc.documentType?.replace(/_/g, " ")}</td>
                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{dateStr}</p>
                      {timeStr && <p className="text-xs text-gray-400 mt-0.5">{timeStr}</p>}
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4"><DocStatusPill s={doc.status} /></td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn
                          isAnchor href={doc.fileUrl}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          title="View" variant="gray"
                        />
                        <ActionBtn
                          onClick={() => handleAction(doc._id, "approve")}
                          disabled={updating === doc._id || doc.status === "APPROVED"}
                          icon={updating === doc._id ? <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          title="Approve" variant="green"
                        />
                        <ActionBtn
                          onClick={() => handleAction(doc._id, "reject")}
                          disabled={updating === doc._id || doc.status === "REJECTED"}
                          icon={<X className="w-3.5 h-3.5" />}
                          title="Reject" variant="red"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  page === p
                    ? "bg-[#F97316] text-white shadow-sm"
                    : "border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {p}
              </button>
            ))}
            {totalPages > 7 && <span className="text-gray-300 text-xs px-0.5">…</span>}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
