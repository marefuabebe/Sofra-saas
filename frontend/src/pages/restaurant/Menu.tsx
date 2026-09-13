import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Copy,
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  Check,
  Utensils,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import {
  Card,
  Button,
  Modal,
  Loading,
  Alert
} from "../../components/ui";
import {
  subscribeToMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemFeatured,
  duplicateMenuItem,
  bulkToggleMenuItemAvailability,
  bulkDeleteMenuItems,
  getCategories,
} from "../../services/restaurantService";
import { formatCurrency } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Curated high-resolution food photography presets from Unsplash
const FOOD_IMAGE_PRESETS = [
  {
    name: "Cheeseburger & Fries",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    icon: "🍔",
  },
  {
    name: "Pepperoni Pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    icon: "🍕",
  },
  {
    name: "Ethiopian Doro Wot",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    icon: "🍲",
  },
  {
    name: "Fresh Garden Salad",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
    icon: "🥗",
  },
  {
    name: "Italian Pasta",
    url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80",
    icon: "🍝",
  },
  {
    name: "Grilled Steak",
    url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&auto=format&fit=crop&q=80",
    icon: "🥩",
  },
  {
    name: "Ethiopian Coffee",
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
    icon: "☕",
  },
  {
    name: "Cold Fruit Smoothie",
    url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
    icon: "🍹",
  },
  {
    name: "Chocolate Dessert",
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    icon: "🍰",
  },
  {
    name: "Crispy Wings & Sides",
    url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80",
    icon: "🍗",
  }
];

// Popular dietary and badge tags
const POPULAR_TAGS = [
  { label: "Spicy", icon: "🌶️" },
  { label: "Vegetarian", icon: "🌱" },
  { label: "Vegan", icon: "🥑" },
  { label: "Gluten-Free", icon: "🌾" },
  { label: "Chef's Special", icon: "⭐" },
  { label: "Best Seller", icon: "🔥" },
  { label: "Halal", icon: "☪️" },
  { label: "Kid Friendly", icon: "👶" }
];

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering, search & view state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "soldout" | "featured">("all");
  const [sortBy, setSortBy] = useState<"sequence" | "price-asc" | "price-desc" | "name-asc" | "prep-asc">("sequence");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  // Selection state for batch operations
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategoryRibbon = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  // Modals state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch initial data & subscribe to real-time updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (e) {
        console.error("Error fetching categories:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const subscription = subscribeToMenuItems("any", (data) => {
      setMenuItems(data || []);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Category lookup helper map
  const categoryMap = useMemo(() => {
    const map = new Map<string, any>();
    categories.forEach((c) => map.set(c._id, c));
    return map;
  }, [categories]);

  // Executive Telemetry KPI metrics
  const metrics = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((i) => i.isAvailable !== false).length;
    const soldOut = menuItems.filter((i) => i.isAvailable === false).length;
    const featured = menuItems.filter((i) => Boolean(i.isFeatured)).length;
    const totalPrice = menuItems.reduce((acc, i) => acc + (Number(i.basePrice) || 0), 0);
    const avgPrice = total > 0 ? totalPrice / total : 0;

    return { total, available, soldOut, featured, avgPrice };
  }, [menuItems]);

  // Category list options with counts
  const categoryTabs = useMemo(() => {
    return [
      { _id: "all", name: "All Categories", count: menuItems.length, icon: "🍽️" },
      ...categories.map((c) => {
        const count = menuItems.filter((item) => {
          const catId = item.categoryId?._id || item.categoryId;
          return catId === c._id;
        }).length;
        return {
          _id: c._id,
          name: c.name,
          count,
          icon: c.icon || "📁"
        };
      })
    ];
  }, [categories, menuItems]);

  // Filtered and Sorted Menu Items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...menuItems];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const nameMatch = (item.name || "").toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const tagMatch = Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes(q));
        const catName = (item.categoryId?.name || "").toLowerCase();
        return nameMatch || descMatch || tagMatch || catName.includes(q);
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((item) => {
        const catId = item.categoryId?._id || item.categoryId;
        return catId === selectedCategory;
      });
    }

    // Status filter
    if (statusFilter === "available") {
      result = result.filter((item) => item.isAvailable !== false);
    } else if (statusFilter === "soldout") {
      result = result.filter((item) => item.isAvailable === false);
    } else if (statusFilter === "featured") {
      result = result.filter((item) => Boolean(item.isFeatured));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "price-asc") {
        return (a.basePrice || 0) - (b.basePrice || 0);
      }
      if (sortBy === "price-desc") {
        return (b.basePrice || 0) - (a.basePrice || 0);
      }
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "prep-asc") {
        return (a.prepTimeMinutes || 999) - (b.prepTimeMinutes || 999);
      }
      // Default: displayOrder or creation date
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });

    return result;
  }, [menuItems, searchTerm, selectedCategory, statusFilter, sortBy]);

  // 1-Click Availability / 86 Toggle
  const handleToggleAvailability = async (item: any) => {
    const newStatus = !item.isAvailable;
    const itemId = item._id || item.id;

    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((i) => (i._id === itemId || i.id === itemId ? { ...i, isAvailable: newStatus } : i))
    );

    const success = await toggleMenuItemAvailability(itemId, newStatus);
    if (success) {
      toast.success(
        newStatus
          ? `🟢 "${item.name}" is now Available for orders`
          : `🔴 "${item.name}" is 86'd (Sold Out)`
      );
    } else {
      toast.error(`Failed to update status for "${item.name}"`);
      // Revert optimistic update on failure
      setMenuItems((prev) =>
        prev.map((i) => (i._id === itemId || i.id === itemId ? { ...i, isAvailable: !newStatus } : i))
      );
    }
  };

  // 1-Click Featured Star Toggle
  const handleToggleFeatured = async (item: any) => {
    const newFeatured = !item.isFeatured;
    const itemId = item._id || item.id;

    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((i) => (i._id === itemId || i.id === itemId ? { ...i, isFeatured: newFeatured } : i))
    );

    const success = await toggleMenuItemFeatured(itemId, newFeatured);
    if (success) {
      toast.success(
        newFeatured
          ? `⭐ Marked "${item.name}" as Featured Special`
          : `Unmarked "${item.name}" from specials`
      );
    } else {
      toast.error(`Failed to toggle featured for "${item.name}"`);
      setMenuItems((prev) =>
        prev.map((i) => (i._id === itemId || i.id === itemId ? { ...i, isFeatured: !newFeatured } : i))
      );
    }
  };

  // 1-Click Dish Duplication / Clone
  const handleDuplicate = async (item: any) => {
    const itemId = item._id || item.id;
    toast.loading(`Cloning "${item.name}"...`, { id: "dup-toast" });
    const duplicated = await duplicateMenuItem(itemId);
    toast.dismiss("dup-toast");

    if (duplicated) {
      toast.success(`✨ Created duplicate: "${duplicated.name}"`);
    } else {
      toast.error(`Failed to duplicate "${item.name}"`);
    }
  };

  // Multi-Select Item Selection
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === filteredAndSortedItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredAndSortedItems.map((i) => i._id || i.id));
    }
  };

  // Batch Availability Action
  const handleBatchAvailability = async (isAvailable: boolean) => {
    if (selectedItemIds.length === 0) return;
    setIsBatchLoading(true);
    const count = selectedItemIds.length;
    const success = await bulkToggleMenuItemAvailability(selectedItemIds, isAvailable);
    setIsBatchLoading(false);

    if (success) {
      toast.success(
        isAvailable
          ? `🟢 Marked ${count} dishes as Available`
          : `🔴 Marked ${count} dishes as 86'd / Sold Out`
      );
      setSelectedItemIds([]);
    } else {
      toast.error("Failed to perform bulk availability update");
    }
  };

  // Batch Delete Action
  const handleBatchDelete = async () => {
    if (selectedItemIds.length === 0) return;
    const count = selectedItemIds.length;
    if (!window.confirm(`Are you sure you want to delete ${count} selected menu dishes? This action cannot be undone.`)) {
      return;
    }

    setIsBatchLoading(true);
    const success = await bulkDeleteMenuItems(selectedItemIds);
    setIsBatchLoading(false);

    if (success) {
      toast.success(`🗑️ Removed ${count} dishes from your menu`);
      setSelectedItemIds([]);
    } else {
      toast.error("Failed to delete selected items");
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <Loading text="Loading restaurant menu catalog..." />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Clean Header & Primary Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Menu Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>Live Menu</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Control dishes, live 86 inventory stockouts, portion pricing, chef tags, and real-time diner QR menu visibility.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/dashboard/categories")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-bold transition-all shadow-xs"
          >
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>Manage Categories</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* ─── 5 Executive Telemetry & KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Dishes */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Catalog</span>
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">{metrics.total}</div>
          <div className="mt-1 text-[11px] text-gray-400">All registered dishes</div>
        </div>

        {/* Available Now */}
        <div
          onClick={() => setStatusFilter("available")}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === "available"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
              : "border-gray-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Available Now</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{metrics.available}</div>
          <div className="mt-1 text-[11px] text-emerald-600/80 font-medium">Ready to order</div>
        </div>

        {/* Sold Out / 86'd */}
        <div
          onClick={() => setStatusFilter("soldout")}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === "soldout"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
              : "border-gray-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Sold Out / 86'd</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{metrics.soldOut}</div>
          <div className="mt-1 text-[11px] text-amber-600/80 font-medium">Kitchen stockout</div>
        </div>

        {/* Featured Specials */}
        <div
          onClick={() => setStatusFilter("featured")}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === "featured"
              ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20"
              : "border-gray-200/80 hover:border-orange-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Chef Specials</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-orange-600">{metrics.featured}</div>
          <div className="mt-1 text-[11px] text-orange-600/80 font-medium">Promoted on diner QR</div>
        </div>

        {/* Average Price */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Price</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(metrics.avgPrice)}
          </div>
          <div className="mt-1 text-[11px] text-gray-400">Mean dish ticket</div>
        </div>
      </div>

      {/* ─── Search, Sorting & View Toggle Controls ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Omni Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by dish name, ingredient, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Direct Category Jump Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs focus:outline-none focus:border-orange-500 cursor-pointer max-w-[160px] truncate"
                title="Direct category selection"
              >
                {categoryTabs.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-xl bg-gray-100/90 p-1 border border-gray-200/60 text-xs font-bold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs font-black"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                onClick={() => setStatusFilter("available")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "available"
                    ? "bg-white text-emerald-700 shadow-xs font-black"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                In Stock ({metrics.available})
              </button>
              <button
                onClick={() => setStatusFilter("soldout")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "soldout"
                    ? "bg-white text-amber-700 shadow-xs font-black"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                86'd ({metrics.soldOut})
              </button>
              <button
                onClick={() => setStatusFilter("featured")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  statusFilter === "featured"
                    ? "bg-white text-orange-600 shadow-xs font-black"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                <span>Featured</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="sequence">Sort: Menu Sequence</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
                <option value="name-asc">Sort: Name (A to Z)</option>
                <option value="prep-asc">Sort: Prep Time (Fastest)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode Switcher */}
            <div className="inline-flex rounded-xl bg-gray-100/90 p-1 border border-gray-200/60">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-orange-600 shadow-xs font-bold"
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
                    ? "bg-white text-orange-600 shadow-xs font-bold"
                    : "text-gray-400 hover:text-gray-700"
                }`}
                title="Dense Data Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips Ribbon with Left/Right Arrow Navigation */}
        <div className="relative flex items-center pt-2.5 border-t border-gray-100">
          {/* Label + Total Count */}
          <div className="flex items-center gap-1.5 shrink-0 pr-2.5 border-r border-gray-200/80 mr-1.5">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Category
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {categories.length}
            </span>
          </div>

          {/* Left Arrow Navigator */}
          <button
            type="button"
            onClick={() => scrollCategoryRibbon("left")}
            className="flex items-center justify-center w-7 h-7 rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 border border-gray-200 text-gray-500 transition-all shrink-0 mr-1.5 shadow-2xs cursor-pointer active:scale-90"
            title="Scroll categories left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Horizontally Scrollable Chips Container */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth select-none flex-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categoryTabs.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                    isSelected
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs shadow-orange-500/20"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-200/70 text-gray-500"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Navigator */}
          <button
            type="button"
            onClick={() => scrollCategoryRibbon("right")}
            className="flex items-center justify-center w-7 h-7 rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 border border-gray-200 text-gray-500 transition-all shrink-0 ml-1.5 shadow-2xs cursor-pointer active:scale-90"
            title="Scroll categories right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Main Catalog Content ─── */}
      {filteredAndSortedItems.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border-gray-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">
            No Menu Items Found
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            {searchTerm || selectedCategory !== "all" || statusFilter !== "all"
              ? "Try resetting your search query or selecting a different category filter."
              : "Get started by adding your first delicious dish to your digital menu."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchTerm || selectedCategory !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              Add New Dish
            </button>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        /* ─── Visual Food Cards Grid ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => {
            const itemId = item._id || item.id;
            const isSelected = selectedItemIds.includes(itemId);
            const category = categoryMap.get(item.categoryId?._id || item.categoryId);

            return (
              <div
                key={itemId}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                  !item.isAvailable ? "bg-gray-50/70 border-gray-200" : "border-gray-200/90 hover:border-orange-300"
                } ${isSelected ? "ring-2 ring-orange-500 border-orange-500" : ""}`}
              >
                {/* Food Image Container */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        !item.isAvailable ? "grayscale contrast-75 opacity-70" : ""
                      }`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-orange-300">
                      <Utensils className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-[10px] font-bold text-orange-400">Photo Pending</span>
                    </div>
                  )}

                  {/* Multi-Select Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => handleToggleSelect(itemId)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-black/40 text-transparent hover:bg-black/60 backdrop-blur-xs border border-white/30"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Top-Right: Featured Star Toggle */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                        item.isFeatured
                          ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30"
                          : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
                      }`}
                      title={item.isFeatured ? "Featured Dish" : "Mark as Featured"}
                    >
                      <Star className={`w-4 h-4 ${item.isFeatured ? "fill-white" : ""}`} />
                    </button>
                  </div>

                  {/* Bottom Image Overlay: Price Badge & Status */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white font-black text-xs shadow-md">
                      {formatCurrency(item.basePrice)}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        item.isAvailable
                          ? "bg-emerald-500/90 text-white"
                          : "bg-amber-600/90 text-white"
                      }`}
                    >
                      {item.isAvailable ? "In Stock" : "86'd (Sold Out)"}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Category & Prep Time */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                      <span className="flex items-center gap-1 text-orange-600 truncate">
                        <span>{category?.icon || "📁"}</span>
                        <span>{category?.name || "Uncategorized"}</span>
                      </span>

                      {item.prepTimeMinutes ? (
                        <span className="flex items-center gap-1 text-gray-400 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{item.prepTimeMinutes}m</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Dish Name */}
                    <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h4>

                    {/* Customer Description */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description || "No customer description entered."}
                    </p>

                    {/* Dietary Tags & Variations indicator */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {Array.isArray(item.tags) &&
                        item.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      {item.sizes && item.sizes.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[10px] font-bold">
                          +{item.sizes.length} sizes
                        </span>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                          +{item.addons.length} extras
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* 1-Click Availability / 86 Toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
                      }`}
                      title={item.isAvailable ? "Click to 86 / Mark Sold Out" : "Click to mark Available"}
                    >
                      <span className={`w-2 h-2 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>{item.isAvailable ? "In Stock" : "86'd"}</span>
                    </button>

                    {/* Action Icon Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Duplicate Dish"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Dish"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Dense Data Table View ─── */
        <Card className="p-0 overflow-hidden border-gray-200/80 shadow-xs rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <button
                      onClick={handleSelectAll}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                        selectedItemIds.length === filteredAndSortedItems.length
                          ? "bg-orange-500 text-white"
                          : "border border-gray-300 bg-white"
                      }`}
                    >
                      {selectedItemIds.length === filteredAndSortedItems.length && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">ITEM & DESCRIPTION</th>
                  <th className="px-4 py-3.5">CATEGORY</th>
                  <th className="px-4 py-3.5">BASE PRICE</th>
                  <th className="px-4 py-3.5">EXTRAS</th>
                  <th className="px-4 py-3.5 text-center">PREP</th>
                  <th className="px-4 py-3.5 text-center">FEATURED</th>
                  <th className="px-4 py-3.5 text-center">STOCK STATUS</th>
                  <th className="px-4 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredAndSortedItems.map((item) => {
                  const itemId = item._id || item.id;
                  const isSelected = selectedItemIds.includes(itemId);
                  const category = categoryMap.get(item.categoryId?._id || item.categoryId);

                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-orange-50/20 transition-colors ${
                        !item.isAvailable ? "opacity-75 bg-gray-50/40" : ""
                      } ${isSelected ? "bg-orange-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleSelect(itemId)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "border border-gray-300 bg-white hover:border-gray-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </td>

                      {/* Item Thumbnail & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                              <Utensils className="w-4 h-4" />
                            </div>
                          )}
                          <div className="max-w-xs">
                            <div className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.isFeatured && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-gray-400 text-[11px] truncate mt-0.5">
                              {item.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 font-bold text-gray-700">
                        <span className="flex items-center gap-1 text-xs">
                          <span>{category?.icon || "📁"}</span>
                          <span>{category?.name || "Uncategorized"}</span>
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="px-4 py-3 font-black text-gray-900 text-xs">
                        {formatCurrency(item.basePrice)}
                      </td>

                      {/* Variations */}
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          {item.sizes && item.sizes.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-700">
                              {item.sizes.length} sizes
                            </span>
                          ) : (
                            <span className="text-gray-300 text-[11px]">—</span>
                          )}
                          {item.addons && item.addons.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700">
                              +{item.addons.length} extras
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Prep Time */}
                      <td className="px-4 py-3 text-center text-gray-500 font-bold">
                        {item.prepTimeMinutes ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{item.prepTimeMinutes}m</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Featured Star Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isFeatured
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-gray-300 hover:text-amber-500 hover:bg-gray-100"
                          }`}
                          title={item.isFeatured ? "Unfeature" : "Feature on menu"}
                        >
                          <Star className={`w-4 h-4 ${item.isFeatured ? "fill-amber-400" : ""}`} />
                        </button>
                      </td>

                      {/* Stock / 86 Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                            item.isAvailable
                              ? "bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200/70"
                              : "bg-amber-100/70 text-amber-800 hover:bg-amber-200/70"
                          }`}
                          title="Click to toggle availability"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isAvailable ? "bg-emerald-600" : "bg-amber-600"
                            }`}
                          />
                          <span>{item.isAvailable ? "In Stock" : "86'd"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Duplicate Dish"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Dish"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Dish"
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
        </Card>
      )}

      {/* ─── Multi-Select Floating Batch Action Dock ─── */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700/80 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-300 pr-2 border-r border-gray-700">
              {selectedItemIds.length} dishes selected
            </span>

            <button
              onClick={() => handleBatchAvailability(true)}
              disabled={isBatchLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark In-Stock</span>
            </button>

            <button
              onClick={() => handleBatchAvailability(false)}
              disabled={isBatchLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Mark 86'd</span>
            </button>

            <button
              onClick={handleBatchDelete}
              disabled={isBatchLoading}
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedItemIds([])}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Menu Item Modal ─── */}
      <MenuItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        categories={categories}
      />

      <MenuItemModal
        isOpen={showEditModal}
        item={selectedItem}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        mode="edit"
        categories={categories}
      />

      {/* ─── Delete Item Confirmation Modal ─── */}
      <DeleteModal
        isOpen={showDeleteModal}
        item={selectedItem}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
};

// ─── Enhanced Add / Edit Menu Item Modal ───
interface MenuItemModalProps {
  isOpen: boolean;
  item?: any | null;
  onClose: () => void;
  mode: "add" | "edit";
  categories: any[];
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  item,
  onClose,
  mode,
  categories,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    basePrice: "",
    imageUrl: "",
    isAvailable: true,
    isFeatured: false,
    prepTimeMinutes: 15,
    tags: [] as string[],
    sizes: [] as { name: string; price: number }[],
    addons: [] as { name: string; price: number }[],
  });

  const [newSize, setNewSize] = useState({ name: "", price: "" });
  const [newAddon, setNewAddon] = useState({ name: "", price: "" });

  useEffect(() => {
    if (mode === "edit" && item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        categoryId: item.categoryId?._id || item.categoryId || (categories[0]?._id ?? ""),
        basePrice: (item.basePrice || item.base_price || 0).toString(),
        imageUrl: item.imageUrl || item.image_url || "",
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        isFeatured: Boolean(item.isFeatured),
        prepTimeMinutes: item.prepTimeMinutes || 15,
        tags: Array.isArray(item.tags) ? item.tags : [],
        sizes: item.sizes || [],
        addons: item.addons || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        categoryId: categories[0]?._id || "",
        basePrice: "",
        imageUrl: "",
        isAvailable: true,
        isFeatured: false,
        prepTimeMinutes: 15,
        tags: [],
        sizes: [],
        addons: [],
      });
    }
  }, [mode, item, isOpen, categories]);

  const handleApplyImagePreset = (preset: typeof FOOD_IMAGE_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: preset.url,
      name: prev.name ? prev.name : preset.name
    }));
  };

  const handleToggleTag = (tagLabel: string) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tagLabel);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tagLabel) : [...prev.tags, tagLabel]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Dish name is required");
      return;
    }
    if (!formData.categoryId) {
      setError("Please select a valid menu category");
      return;
    }
    if (!formData.basePrice || isNaN(Number(formData.basePrice)) || Number(formData.basePrice) < 0) {
      setError("Valid base price is required");
      return;
    }

    setLoading(true);

    const menuItemData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      categoryId: formData.categoryId,
      basePrice: parseFloat(formData.basePrice),
      imageUrl: formData.imageUrl.trim() || undefined,
      isAvailable: formData.isAvailable,
      isFeatured: formData.isFeatured,
      prepTimeMinutes: Number(formData.prepTimeMinutes) || 15,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      sizes: formData.sizes.length > 0 ? formData.sizes.map((s) => ({ name: s.name, price: Number(s.price) })) : undefined,
      addons: formData.addons.length > 0 ? formData.addons.map((a) => ({ name: a.name, price: Number(a.price) })) : undefined,
    };

    let success = false;
    let serverError = "";
    try {
      if (mode === "add") {
        success = await createMenuItem(menuItemData);
      } else if (mode === "edit" && item) {
        success = await updateMenuItem(item._id || item.id, menuItemData);
      }
    } catch (err: any) {
      serverError = err.response?.data?.message || err.message;
    }

    setLoading(false);
    if (success) {
      toast.success(mode === "add" ? `✨ Added "${formData.name}" to menu` : `Updated "${formData.name}"`);
      onClose();
    } else {
      setError(serverError || `Failed to ${mode} menu item. Please try again.`);
    }
  };

  const addSize = () => {
    if (newSize.name.trim() && newSize.price) {
      setFormData({
        ...formData,
        sizes: [
          ...formData.sizes,
          { name: newSize.name.trim(), price: parseFloat(newSize.price) },
        ],
      });
      setNewSize({ name: "", price: "" });
    }
  };

  const removeSize = (index: number) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, i) => i !== index),
    });
  };

  const addAddon = () => {
    if (newAddon.name.trim() && newAddon.price) {
      setFormData({
        ...formData,
        addons: [
          ...formData.addons,
          { name: newAddon.name.trim(), price: parseFloat(newAddon.price) },
        ],
      });
      setNewAddon({ name: "", price: "" });
    }
  };

  const removeAddon = (index: number) => {
    setFormData({
      ...formData,
      addons: formData.addons.filter((_, i) => i !== index),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "Add Menu Item" : "Edit Menu Item"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {error && <Alert type="error" message={error} />}

        {/* ─── 1. Basic Information ─── */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-4">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
            Basic Information
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dish Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Dish Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Classic Cheeseburger"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Menu Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon || "📁"} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Base Price */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Base Price ($ / ETB) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>

            {/* Kitchen Prep Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kitchen Prep Time (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.prepTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                  className="w-24 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                />
                <div className="flex gap-1">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setFormData({ ...formData, prepTimeMinutes: mins })}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        formData.prepTimeMinutes === mins
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Customer Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe delicious ingredients, cooking style, or flavor profiles..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500 shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* ─── 2. Food Photo & High-Res Presets Gallery ─── */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Food Photography & Image Presets</span>
            </span>
            <span className="text-[10px] text-gray-400">Click a preset to autofill</span>
          </div>

          {/* Presets Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            {FOOD_IMAGE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.name}
                onClick={() => handleApplyImagePreset(preset)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                  formData.imageUrl === preset.url
                    ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Image URL & Thumbnail Preview */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>
            {formData.imageUrl && (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shadow-xs shrink-0 bg-gray-100">
                <img
                  src={formData.imageUrl}
                  alt="Dish preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. Dietary & Badges Tags ─── */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-2.5">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
            Dietary & Special Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => {
              const isSelected = formData.tags.includes(tag.label);
              return (
                <button
                  type="button"
                  key={tag.label}
                  onClick={() => handleToggleTag(tag.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                    isSelected
                      ? "bg-orange-500 text-white border-orange-500 shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 4. Sizes & Portions ─── */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Portion Sizes (Optional)
            </span>
            <span className="text-[10px] text-gray-400">e.g. Small, Regular, Large</span>
          </div>

          {formData.sizes.length > 0 && (
            <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
              {formData.sizes.map((size, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg text-xs">
                  <span className="font-bold text-gray-800">{size.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-orange-600">{formatCurrency(size.price)}</span>
                    <button
                      type="button"
                      onClick={() => removeSize(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Size name (e.g. Large)"
              value={newSize.name}
              onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newSize.price}
              onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
              className="w-28 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={addSize}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
            >
              Add Size
            </button>
          </div>
        </div>

        {/* ─── 5. Add-ons & Extras ─── */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Add-ons & Extras (Optional)
            </span>
            <span className="text-[10px] text-gray-400">e.g. Extra Cheese, Bacon</span>
          </div>

          {formData.addons.length > 0 && (
            <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
              {formData.addons.map((addon, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg text-xs">
                  <span className="font-bold text-gray-800">{addon.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-emerald-600">+{formatCurrency(addon.price)}</span>
                    <button
                      type="button"
                      onClick={() => removeAddon(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Extra name (e.g. Avocado)"
              value={newAddon.name}
              onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newAddon.price}
              onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
              className="w-28 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={addAddon}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
            >
              Add Extra
            </button>
          </div>
        </div>

        {/* ─── 6. Availability & Featured Controls ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Availability Toggle */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-gray-900">
                {formData.isAvailable ? "In Stock (Available)" : "86'd (Sold Out)"}
              </div>
              <div className="text-[10px] text-gray-400">
                {formData.isAvailable ? "Visible to customers for ordering" : "Hidden from digital menu ordering"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                formData.isAvailable ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  formData.isAvailable ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Featured Toggle */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1">
                <Star className={`w-3.5 h-3.5 ${formData.isFeatured ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
                <span>Featured Dish</span>
              </div>
              <div className="text-[10px] text-gray-400">
                Pin at the top of digital menu as a Chef's Special
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                formData.isFeatured ? "bg-amber-400" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  formData.isFeatured ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ─── 7. Live Diner Mobile Preview ─── */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-200/60 space-y-2">
          <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider block">
            Diner Mobile Preview
          </span>
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-100 shadow-xs">
            {formData.imageUrl ? (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-500 font-bold shrink-0">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-xs text-gray-900 truncate">
                  {formData.name || "Dish Name"}
                </h5>
                <span className="font-black text-xs text-orange-600 shrink-0 ml-2">
                  {formData.basePrice ? formatCurrency(Number(formData.basePrice)) : "$0.00"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {formData.description || "Description preview on phone"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {formData.isFeatured && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                    ⭐ Special
                  </span>
                )}
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                  {formData.isAvailable ? "Available" : "Sold Out"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Submit Actions */}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === "add" ? "Save New Dish" : "Update Dish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Delete Item Confirmation Modal ───
interface DeleteModalProps {
  isOpen: boolean;
  item: any | null;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, item, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!item) return;

    setLoading(true);
    const itemId = item._id || item.id;
    const success = await deleteMenuItem(itemId);
    setLoading(false);

    if (success) {
      toast.success(`Removed "${item.name}" from menu`);
      onClose();
    } else {
      toast.error(`Failed to delete "${item.name}"`);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Menu Dish" size="md">
      <div className="space-y-4">
        <Alert
          type="warning"
          message={`Are you sure you want to delete "${item.name}"? This will permanently remove the dish and all its variations from your digital catalog.`}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            Delete Dish
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Menu;
