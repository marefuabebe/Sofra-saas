import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  LayoutGrid,
  List,
  Utensils,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Tag,
  Check
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Badge,
  Modal,
  Loading,
  Alert
} from "../../components/ui";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  reorderCategories,
  bulkToggleCategoryStatus
} from "../../services/restaurantService";
import { socket } from "../../config/socket";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

type ViewMode = "grid" | "table";
type StatusFilter = "all" | "active" | "hidden";
type SortOption = "order" | "name_asc" | "items_desc" | "newest";

const PRESET_TEMPLATES = [
  { name: "Burgers", icon: "🍔", description: "Juicy handcrafted burgers and sliders" },
  { name: "Pizza", icon: "🍕", description: "Artisan wood-fired and classic pizzas" },
  { name: "Ethiopian Cuisine", icon: "🍲", description: "Traditional authentic dishes and platters" },
  { name: "Breakfast & Brunch", icon: "🥞", description: "Start your day with hearty morning favorites" },
  { name: "Main Courses", icon: "🥩", description: "Signature entrees, steaks, and chef specials" },
  { name: "Fresh Salads", icon: "🥗", description: "Crisp seasonal greens and organic bowls" },
  { name: "Appetizers & Starters", icon: "🥟", description: "Finger foods, bites, and shareable plates" },
  { name: "Hot Beverages", icon: "☕", description: "Freshly brewed specialty coffee and teas" },
  { name: "Cold Drinks", icon: "🍹", description: "Chilled smoothies, fresh juices, and sodas" },
  { name: "Desserts & Sweets", icon: "🍰", description: "Delicious pastries, cakes, and sweet treats" }
];

const CATEGORY_NAME_OPTIONS = [
  { name: "Burgers", icon: "🍔", defaultDesc: "Juicy handcrafted burgers and sliders" },
  { name: "Pizza", icon: "🍕", defaultDesc: "Artisan wood-fired and classic pizzas" },
  { name: "Ethiopian Food", icon: "🍲", defaultDesc: "Traditional authentic dishes and platters" },
  { name: "Breakfast & Brunch", icon: "🥞", defaultDesc: "Start your day with hearty morning favorites" },
  { name: "Main Courses", icon: "🥩", defaultDesc: "Signature entrees, steaks, and chef specials" },
  { name: "Fresh Salads", icon: "🥗", defaultDesc: "Crisp seasonal greens and organic bowls" },
  { name: "Appetizers & Starters", icon: "🥟", defaultDesc: "Finger foods, bites, and shareable plates" },
  { name: "Sandwiches & Wraps", icon: "🥪", defaultDesc: "Fresh toasted subs, wraps, and sandwiches" },
  { name: "Hot Beverages", icon: "☕", defaultDesc: "Freshly brewed specialty coffee and teas" },
  { name: "Cold Drinks", icon: "🍹", defaultDesc: "Chilled smoothies, fresh juices, and sodas" },
  { name: "Desserts & Sweets", icon: "🍰", defaultDesc: "Delicious pastries, cakes, and sweet treats" },
  { name: "Pasta & Italian", icon: "🍝", defaultDesc: "Handcrafted pasta, lasagna, and Italian classics" },
  { name: "Chicken & Wings", icon: "🍗", defaultDesc: "Crispy fried chicken, grilled fillets, and wings" },
  { name: "Soups & Broths", icon: "🍜", defaultDesc: "Warm, hearty seasonal soups and broths" },
  { name: "Seafood & Fish", icon: "🐟", defaultDesc: "Fresh catches, grilled fish, and seafood platters" },
  { name: "Kids Menu", icon: "👶", defaultDesc: "Child-friendly portions and kids' favorite meals" },
  { name: "Sides & Extras", icon: "🍟", defaultDesc: "Crispy fries, dips, sauces, and side orders" },
  { name: "Chef's Specials", icon: "✨", defaultDesc: "Exclusive daily recipes curated by our head chef" },
  { name: "Alcoholic Beverages", icon: "🍷", defaultDesc: "Craft beers, selected wines, and cocktails" }
];

const CATEGORY_ICON_OPTIONS = [
  { value: "🍽️", label: "🍽️ General Dining" },
  { value: "🍔", label: "🍔 Burgers & Sliders" },
  { value: "🍕", label: "🍕 Pizza & Calzones" },
  { value: "🍲", label: "🍲 Ethiopian & Stews" },
  { value: "🥞", label: "🥞 Breakfast & Pancakes" },
  { value: "🥩", label: "🥩 Steaks & Meats" },
  { value: "🍗", label: "🍗 Chicken & Wings" },
  { value: "🥗", label: "🥗 Salads & Bowls" },
  { value: "🥪", label: "🥪 Sandwiches & Wraps" },
  { value: "🥟", label: "🥟 Appetizers & Starters" },
  { value: "🍜", label: "🍜 Soups & Noodles" },
  { value: "🍝", label: "🍝 Pasta & Italian" },
  { value: "🍣", label: "🍣 Sushi & Asian" },
  { value: "🌮", label: "🌮 Tacos & Mexican" },
  { value: "🐟", label: "🐟 Fish & Seafood" },
  { value: "☕", label: "☕ Coffee & Tea" },
  { value: "🍹", label: "🍹 Juices & Cocktails" },
  { value: "🍷", label: "🍷 Wine & Bar" },
  { value: "🍰", label: "🍰 Cakes & Bakery" },
  { value: "🍦", label: "🍦 Ice Cream & Shakes" },
  { value: "🍟", label: "🍟 Fries & Sides" },
  { value: "✨", label: "✨ Chef's Special" },
  { value: "👶", label: "👶 Kids Selection" }
];

const POPULAR_EMOJIS = ["🍽️", "🍔", "🍕", "🍲", "🥞", "🥩", "🥗", "🥟", "☕", "🍹", "🍰", "🥪", "🍜", "🍣", "🌮", "🍦"];

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Presentation
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("order");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Multi-select Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [actionError, setActionError] = useState("");

  const fetchCategories = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    socket.on("menu:updated", () => fetchCategories(true));
    return () => {
      socket.off("menu:updated");
    };
  }, []);

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch =
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.description || "").toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter === "active") return cat.isActive;
        if (statusFilter === "hidden") return !cat.isActive;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "order") return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (sortBy === "items_desc") return (b.itemCount ?? 0) - (a.itemCount ?? 0);
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [categories, searchTerm, statusFilter, sortBy]);

  // Executive KPI Counts
  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const hiddenCount = categories.filter((c) => !c.isActive).length;
  const totalDishesCount = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);

  // Status Toggle
  const handleToggleStatus = async (category: Category) => {
    const nextState = !category.isActive;
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c._id === category._id ? { ...c, isActive: nextState } : c))
    );
    const ok = await toggleCategoryStatus(category._id, nextState);
    if (ok) {
      toast.success(`"${category.name}" is now ${nextState ? "Active in menu" : "Hidden"}`);
    } else {
      toast.error("Failed to update status");
      fetchCategories(true);
    }
  };

  // Reorder Handler (Move Up or Down)
  const handleReorderShift = async (category: Category, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const currentIndex = sorted.findIndex((c) => c._id === category._id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetCategory = sorted[targetIndex];

    // Swap their displayOrder values
    const currentOrder = category.displayOrder ?? currentIndex;
    const targetOrder = targetCategory.displayOrder ?? targetIndex;

    const newCurrentOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder 
      ? (direction === "up" ? currentOrder + 1 : currentOrder - 1) 
      : currentOrder;

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => {
        if (c._id === category._id) return { ...c, displayOrder: newCurrentOrder };
        if (c._id === targetCategory._id) return { ...c, displayOrder: newTargetOrder };
        return c;
      })
    );

    const res = await reorderCategories([
      { id: category._id, displayOrder: newCurrentOrder },
      { id: targetCategory._id, displayOrder: newTargetOrder }
    ]);

    if (res.success) {
      toast.success(`Reordered "${category.name}"`);
    } else {
      toast.error("Failed to save new order");
      fetchCategories(true);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCategories.map((c) => c._id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk visibility toggle
  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (selectedIds.includes(c._id) ? { ...c, isActive } : c))
    );

    const res = await bulkToggleCategoryStatus(selectedIds, isActive);
    setIsBulkProcessing(false);
    if (res.success) {
      toast.success(`Updated ${selectedIds.length} categories to ${isActive ? "Active" : "Hidden"}`);
      setSelectedIds([]);
    } else {
      toast.error("Bulk update failed");
      fetchCategories(true);
    }
  };

  // Delete handlers
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
    setActionError("");
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setActionError("");
    const response = await deleteCategory(selectedCategory._id);
    if (response.success) {
      toast.success(`Category "${selectedCategory.name}" deleted`);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      setSelectedIds((prev) => prev.filter((id) => id !== selectedCategory._id));
      fetchCategories(true);
    } else {
      setActionError(response.message);
    }
  };

  if (loading && categories.length === 0) {
    return <Loading text="Loading category architecture..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header & Top Command Ribbon ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Menu Hierarchy Active</span>
            </span>
            <span className="text-xs text-gray-400 font-medium">Real-time Catalog Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <span>Menu Categories</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
            Structure your dining catalog, adjust customer display rankings, and control category availability across QR ordering and takeaway.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchCategories(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            title="Refresh category stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Cards Ribbon ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Categories */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Total Categories
            </span>
            <div className="text-2xl font-black text-gray-900">{totalCount}</div>
            <span className="text-[11px] text-gray-400 font-medium">Catalog structure</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Active in Menu */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Active in Menu
            </span>
            <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Visible to guests
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Hidden / Draft */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Hidden / Draft
            </span>
            <div className="text-2xl font-black text-amber-600">{hiddenCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Unpublished from store</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Total Linked Dishes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Assigned Dishes
            </span>
            <div className="text-2xl font-black text-blue-600">{totalDishesCount}</div>
            <span className="text-[11px] text-blue-600 font-medium">Across all categories</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Utensils className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Control Bar: Search, Filters, Sorters & View Switcher ─── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === "all"
                ? "bg-white text-gray-900 shadow-2xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Categories ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === "active"
                ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/80"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("hidden")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === "hidden"
                ? "bg-amber-50 text-amber-700 shadow-2xs border border-amber-200/80"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Hidden ({hiddenCount})
          </button>
        </div>

        {/* Right: Search + Sort + View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Omni-search */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search category or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-orange-500 bg-white shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white shadow-2xs focus:outline-none focus:border-orange-500"
          >
            <option value="order">Sort: Menu Sequence (Rank)</option>
            <option value="name_asc">Sort: Alphabetical (A-Z)</option>
            <option value="items_desc">Sort: Most Dishes First</option>
            <option value="newest">Sort: Recently Created</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white text-orange-600 shadow-2xs font-bold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-orange-600 shadow-2xs font-bold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Empty State ─── */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {categories.length === 0 ? "No Categories Created Yet" : "No Matching Categories Found"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            {categories.length === 0
              ? "Categories organize your menu so customers can quickly browse appetizers, main dishes, beverages, and desserts."
              : "Try adjusting your search terms or clearing status filters to find what you need."}
          </p>
          {categories.length === 0 ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Category</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─── DUAL VIEW 1: INTERACTIVE CARDS GRID ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCategories.map((cat, idx) => {
            const isSelected = selectedIds.includes(cat._id);
            return (
              <div
                key={cat._id}
                className={`bg-white rounded-3xl border p-5 transition-all flex flex-col justify-between space-y-4 hover:shadow-md relative group ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/10 shadow-sm"
                    : !cat.isActive
                    ? "border-gray-200 bg-gray-50/40 opacity-80"
                    : "border-gray-100 shadow-2xs hover:border-orange-200"
                }`}
              >
                {/* Top Row: Select, Emoji Icon, Rank, and Move Up/Down Controls */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(cat._id)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
                    />

                    {/* Emoji Icon Container */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-100 to-amber-50 border border-orange-200/80 flex items-center justify-center text-2xl shadow-2xs select-none">
                      {cat.icon || "🍽️"}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-mono font-black uppercase">
                          Rank #{cat.displayOrder ?? idx + 1}
                        </span>
                        {!cat.isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-bold">
                            Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mt-0.5 line-clamp-1">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  {/* Ordering Arrows */}
                  <div className="flex flex-col items-center bg-gray-50 p-1 rounded-xl border border-gray-200/80 shrink-0">
                    <button
                      onClick={() => handleReorderShift(cat, "up")}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white rounded transition-colors"
                      title="Move Up in Menu"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorderShift(cat, "down")}
                      disabled={idx === filteredCategories.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white rounded transition-colors"
                      title="Move Down in Menu"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">
                  {cat.description || "No description specified. Displays under category name on mobile."}
                </p>

                {/* Middle: Linked Dishes & Visibility Switch */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                  {/* Shortcut to view items */}
                  <button
                    onClick={() => navigate(`/dashboard/menu?category=${cat._id}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50/80 hover:bg-orange-100 text-orange-700 font-bold transition-colors"
                    title="View dishes in this category"
                  >
                    <Utensils className="w-3 h-3 text-orange-500" />
                    <span>{cat.itemCount || 0} Dishes</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                  </button>

                  {/* Quick Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(cat)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                      cat.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {cat.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-gray-400" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className="p-1.5 rounded-lg border border-transparent hover:border-red-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── DUAL VIEW 2: DENSE DATA TABLE ─── */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredCategories.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-16 text-center">RANK</th>
                  <th className="py-3 px-4">CATEGORY & ICON</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4 text-center">LINKED DISHES</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat, idx) => {
                  const isSelected = selectedIds.includes(cat._id);
                  return (
                    <tr
                      key={cat._id}
                      className={`hover:bg-orange-50/20 transition-colors ${
                        isSelected ? "bg-orange-50/30" : !cat.isActive ? "opacity-75 bg-gray-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cat._id)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
                        />
                      </td>

                      {/* Rank & Reorder Controls */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono font-bold text-gray-700">
                          <span>#{cat.displayOrder ?? idx + 1}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleReorderShift(cat, "up")}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-gray-900 disabled:opacity-20"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReorderShift(cat, "down")}
                              disabled={idx === filteredCategories.length - 1}
                              className="text-gray-400 hover:text-gray-900 disabled:opacity-20"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Category Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-base shadow-2xs select-none">
                            {cat.icon || "🍽️"}
                          </span>
                          <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {cat.description || "—"}
                      </td>

                      {/* Dishes count */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/dashboard/menu?category=${cat._id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold transition-colors"
                        >
                          <Utensils className="w-3 h-3 text-orange-500" />
                          <span>{cat.itemCount || 0}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {cat.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-gray-400" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cat)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-red-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ─── Multi-Select Floating Batch Dock ─── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900/95 text-white backdrop-blur-md shadow-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="text-xs font-bold pr-2 border-r border-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
              {selectedIds.length}
            </span>
            <span>Selected</span>
          </div>

          <button
            onClick={() => handleBulkStatus(true)}
            disabled={isBulkProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Make Active</span>
          </button>

          <button
            onClick={() => handleBulkStatus(false)}
            disabled={isBulkProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide from Menu</span>
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-gray-400 hover:text-white ml-2 pl-2 border-l border-gray-700 font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ─── Add Category Modal ─── */}
      <CategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchCategories(true);
        }}
      />

      {/* ─── Edit Category Modal ─── */}
      {selectedCategory && (
        <CategoryModal
          isOpen={showEditModal}
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
            fetchCategories(true);
          }}
        />
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
          setActionError("");
        }}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start space-x-3 border border-red-100">
            <Trash2 className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <h4 className="font-bold text-sm text-red-900">Confirm Deletion</h4>
              <p className="text-xs text-red-700 mt-1">
                Are you sure you want to delete <strong>"{selectedCategory?.name}"</strong>?
              </p>
            </div>
          </div>

          {selectedCategory && (selectedCategory.itemCount ?? 0) > 0 && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Dependent Dishes Warning:</span>
                This category currently contains <strong>{selectedCategory.itemCount} dish(es)</strong>. You cannot delete it until you reassign or remove those items.
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    navigate(`/dashboard/menu?category=${selectedCategory._id}`);
                  }}
                  className="mt-2 block font-bold text-orange-600 hover:text-orange-700 underline"
                >
                  View and reassign dishes in Menu Management →
                </button>
              </div>
            </div>
          )}

          {actionError && <Alert type="error" message={actionError} />}

          <div className="flex justify-end gap-2.5 mt-6 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
                setActionError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 border-red-600 text-xs font-bold"
              onClick={handleDeleteConfirm}
              disabled={Boolean(selectedCategory && (selectedCategory.itemCount ?? 0) > 0)}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Modal for Add / Edit Category ───
const CategoryModal: React.FC<{
  isOpen: boolean;
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, category, onClose, onSuccess }) => {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [icon, setIcon] = useState(category?.icon || "🍽️");
  const [displayOrder, setDisplayOrder] = useState<number | string>(category?.displayOrder || 0);
  const [isActive, setIsActive] = useState(category ? category.isActive : true);
  const [isCustomName, setIsCustomName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const initialName = category?.name || "";
      setName(initialName);
      setDescription(category?.description || "");
      setIcon(category?.icon || "🍽️");
      setDisplayOrder(category?.displayOrder ?? 0);
      setIsActive(category ? category.isActive : true);
      setError("");

      const isPreset = CATEGORY_NAME_OPTIONS.some(
        (c) => c.name.toLowerCase() === initialName.toLowerCase()
      );
      setIsCustomName(Boolean(initialName && !isPreset));
    }
  }, [isOpen, category]);

  const handleNameSelect = (val: string) => {
    if (val === "__custom__") {
      setIsCustomName(true);
      setName("");
    } else {
      setIsCustomName(false);
      setName(val);
      const matched = CATEGORY_NAME_OPTIONS.find((c) => c.name === val);
      if (matched) {
        setIcon(matched.icon);
        if (!description || description.trim() === "") {
          setDescription(matched.defaultDesc);
        }
      }
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setDescription(preset.description);
    setIsCustomName(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      icon: icon || "🍽️",
      displayOrder: Number(displayOrder) || 0,
      isActive
    };

    let success = false;
    if (category) {
      success = await updateCategory(category._id, payload);
    } else {
      success = await createCategory(payload);
    }

    setLoading(false);
    if (success) {
      toast.success(category ? "Category updated successfully" : "New category added to menu");
      onSuccess();
    } else {
      setError(`Failed to ${category ? "update" : "create"} category. Ensure name is unique.`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Menu Category" : "Add Menu Category"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} />}

        {/* Preset Quick Templates */}
        {!category && (
          <div>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Template Presets (Click to autofill)</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-700 text-xs font-bold transition-all border border-gray-200/60 flex items-center gap-1"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section: Basic Information */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-4">
          {/* Category Icon & Name Dropdowns */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Category Icon & Name *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Category Icon Dropdown */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Category Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold shadow-2xs focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Name Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <select
                  value={isCustomName ? "__custom__" : name}
                  onChange={(e) => handleNameSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold shadow-2xs focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Select Category Name --</option>
                  <optgroup label="Popular Categories">
                    {CATEGORY_NAME_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.icon} {opt.name}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">✏️ Custom Category (Type your own)...</option>
                </select>
              </div>
            </div>

            {/* Custom Name Input if Selected */}
            {isCustomName && (
              <div className="mt-2.5 animate-in fade-in duration-200">
                <label className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                  Type Custom Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter custom category name..."
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-orange-300 bg-white text-xs font-bold shadow-2xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Customer Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Freshly tossed salads and organic vegetables"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium shadow-2xs focus:border-orange-500 focus:outline-none resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Short subtitle displayed to diners under the category heading.
            </p>
          </div>

          {/* Display Order Sequence */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Menu Display Order (Rank)
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              min={0}
              className="w-32 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold shadow-2xs focus:border-orange-500 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Lower numbers appear first on customer menus (e.g. 1 = Top of menu).
            </p>
          </div>
        </div>

        {/* Live Customer Preview */}
        <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider block">
              Diner Mobile Preview
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-lg">{icon || "🍽️"}</span>
              <span className="text-xs font-black text-gray-900">{name || "Category Name"}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-orange-600 border border-orange-200 shadow-2xs">
            {isActive ? "Published" : "Hidden"}
          </span>
        </div>

        {/* Status Toggle & Submit Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div
                className={`block w-12 h-7 rounded-full transition-colors ${
                  isActive ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                  isActive ? "transform translate-x-5" : ""
                }`}
              />
            </div>
            <div className="ml-3">
              <div className="text-xs font-bold text-gray-900">
                {isActive ? "Category Active" : "Category Hidden"}
              </div>
              <div className="text-[10px] text-gray-500">
                {isActive ? "Visible on public store" : "Hidden from QR menu"}
              </div>
            </div>
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {category ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default Categories;
