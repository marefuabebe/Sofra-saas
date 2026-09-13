import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  CheckCircle,
  Package,
  ChefHat,
  Clock,
  Utensils,
  Loader,
  Menu,
  MapPin,
  Heart,
  User,
  SlidersHorizontal,
  Sandwich,
  Soup,
  Coffee,
  Croissant,
  Phone,
  Mail,
  Globe,
  Smartphone,
  Bell,
  Banknote,
  CreditCard,
  Calendar,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Music2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Layers,
  ShieldCheck,
  Zap,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Modal,
  Loading,
  Alert,
} from "../../components/ui";
import {
  createOrder,
} from "../../services/restaurantService";
import type { MenuItem } from "../../config/supabase";
import { formatCurrency, isValidPhone } from "../../utils/helpers";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface CartItem extends MenuItem {
  quantity: number;
  selectedSize?: { name: string; price: number };
  selectedAddons: { name: string; price: number }[];
  itemTotal: number;
}

const CustomerMenu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [view, setView] = useState<"menu" | "cart">("menu");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "about" | "contact">("menu");

  // Category Ribbon Scroll & Quick Navigation
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Universal Platform FAQ State (Common & Constant across all restaurants)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const platformFaqs = [
    {
      question: "How do I order directly from my table using the QR code?",
      answer: "Simply point your smartphone's camera at the QR code on your table tent and tap the link. You can browse the complete menu, customize dishes with sizes and add-ons, and tap 'Place Order'. Your ticket is dispatched directly to the kitchen display screen without waiting for a waiter."
    },
    {
      question: "What payment methods are supported on SOFRA?",
      answer: "We support flexible Ethiopian and global payment methods: Telebirr, CBE Birr, online bank debit cards via Chapa, or traditional Cash on Delivery/Pickup. You can select your preferred payment method during checkout."
    },
    {
      question: "How does live order tracking work?",
      answer: "Once you submit your order, your screen automatically opens a real-time progress tracker. You can watch live as the kitchen confirms your ticket, begins cooking, and marks your dishes ready to serve."
    },
    {
      question: "Can I customize dishes for allergies or dietary preferences?",
      answer: "Yes! When choosing an item or inside your cart, you can enter custom instructions (such as 'no onions', 'extra spicy', or allergy warnings) in the Special Instructions notes field. Our kitchen staff reviews every note before preparation."
    },
    {
      question: "Can I place an order for takeaway instead of dine-in?",
      answer: "Absolutely! You can choose between Table Dine-In and Takeaway during checkout. Your meal will be packaged fresh for pickup so you can grab it and go without waiting in line."
    }
  ];

  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  const scrollCategoryRibbon = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkCategoryScroll();
    const timer = setTimeout(checkCategoryScroll, 350);
    const el = categoryScrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkCategoryScroll, { passive: true });
    }
    window.addEventListener("resize", checkCategoryScroll);
    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener("scroll", checkCategoryScroll);
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [categories, activeTab]);

  const handleSelectCategory = (catId: string) => {
    setCategoryFilter(catId);
    setShowCategoryMenu(false);
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(`category-${catId}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 220;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const initialTable = searchParams.get("table") || "";
  const isPreview = searchParams.get("preview") === "true";

  const [activeOrder, setActiveOrder] = useState<{ _id: string, orderNumber: string, status: string, trackingToken: string } | null>(null);

  // Load active order from session storage on mount
  useEffect(() => {
    const savedOrder = sessionStorage.getItem("sofra_active_order");
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Only auto-restore the order view if it is still actively being processed
        if (!["completed", "cancelled", "rejected"].includes(parsedOrder.status)) {
          setActiveOrder(parsedOrder);
        }
      } catch (e) {
        sessionStorage.removeItem("sofra_active_order");
      }
    }
  }, []);

  // Load restaurant and menu
  useEffect(() => {
    loadRestaurant();
  }, [slug]);

  useEffect(() => {
    if (restaurant?.id || restaurant?._id) {
      const restId = restaurant.id || restaurant._id;

      socket.emit("join_restaurant_room", restId);

      const handleRestaurantUpdate = (updatedData: any) => {
        setRestaurant((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...updatedData
          };
        });
      };

      socket.on("menu:updated", loadRestaurant);
      socket.on("restaurant:updated", handleRestaurantUpdate);

      return () => {
        socket.off("menu:updated", loadRestaurant);
        socket.off("restaurant:updated", handleRestaurantUpdate);
      };
    }
  }, [restaurant?.id, restaurant?._id]);

  const loadRestaurant = async () => {
    if (!slug) return;

    try {
      const { data } = await api.get(`/public/${slug}/menu`);

      if (!data.success) {
        throw new Error();
      }

      setRestaurant(data.data.restaurant);
      setCategories(data.data.categories);
      // Flatten items for search and cart
      const allItems = data.data.categories.flatMap((cat: any) => cat.items);
      setMenuItems(allItems);
    } catch (error) {
      console.error("Restaurant not found");
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { _id: "all", name: "All Categories" },
    ...categories,
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch && item.isAvailable;
  });

  const addToCart = (
    item: MenuItem,
    selectedSize?: any,
    selectedAddons: any[] = []
  ) => {
    const basePrice = selectedSize ? selectedSize.price : item.basePrice;
    const addonsTotal = selectedAddons.reduce(
      (sum, addon) => sum + addon.price,
      0
    );
    const itemTotal = basePrice + addonsTotal;

    const cartItem: CartItem = {
      ...item,
      quantity: 1,
      selectedSize,
      selectedAddons,
      itemTotal,
    };

    const existingIndex = cart.findIndex(
      (ci) =>
        ci._id === item._id &&
        ci.selectedSize?.name === selectedSize?.name &&
        JSON.stringify(ci.selectedAddons) === JSON.stringify(selectedAddons)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    setShowItemModal(false);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleItemClick = (item: MenuItem) => {
    if (item.sizes && item.sizes.length > 0) {
      setSelectedItem(item);
      setShowItemModal(true);
    } else {
      addToCart(item);
    }
  };

  if (loading) {
    return <Loading text="Loading menu..." />;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="text-center p-8">
            <Package className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-text mb-2">
              Restaurant Unavailable
            </h2>
            <p className="text-text-secondary">
              This restaurant is currently inactive or pending verification and is not accepting orders at this time.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  // If we have an active order, render the tracking view instead of the menu
  if (activeOrder) {
    return (
      <OrderTrackingView
        order={activeOrder}
        restaurant={restaurant}
        onNewOrder={() => setActiveOrder(null)}
      />
    );
  }

  if (view === "cart") {
    return (
      <>
        <CartView
          cart={cart}
          restaurant={restaurant}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onBack={() => setView("menu")}
          onCheckout={() => setShowCheckout(true)}
          notes={orderNotes}
          onNotesChange={setOrderNotes}
        />
        <CheckoutModal
          isOpen={showCheckout}
          cart={cart}
          restaurantId={restaurant.id || restaurant._id}
          initialTable={initialTable}
          initialNotes={orderNotes}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderData) => {
            setCart([]);
            setShowCheckout(false);
            sessionStorage.setItem("sofra_active_order", JSON.stringify(orderData));
            setActiveOrder(orderData);
          }}
        />
      </>
    );
  }

  const getItemQuantity = (itemId: string) => {
    return cart.reduce((sum, cartItem) => {
      if (cartItem._id === itemId) {
        return sum + cartItem.quantity;
      }
      return sum;
    }, 0);
  };

  const handleAddSimple = (item: MenuItem) => {
    addToCart(item);
  };

  const handleRemoveItem = (itemId: string) => {
    const index = cart.findIndex((ci) => ci._id === itemId);
    if (index >= 0) {
      updateQuantity(index, -1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-orange-200">
      {/* Dynamic Theme Injector */}
      {restaurant.theme?.brandColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .text-accent { color: ${restaurant.theme.brandColor} !important; }
          .bg-accent { background-color: ${restaurant.theme.brandColor} !important; }
          .border-accent { border-color: ${restaurant.theme.brandColor} !important; }
          .hover\\:bg-accent:hover { background-color: ${restaurant.theme.brandColor} !important; }
          .hover\\:text-accent:hover { color: ${restaurant.theme.brandColor} !important; }
          .hover\\:border-accent:hover { border-color: ${restaurant.theme.brandColor} !important; }
          .focus\\:ring-accent:focus { --tw-ring-color: ${restaurant.theme.brandColor} !important; }
          .bg-accent\\/5 { background-color: ${restaurant.theme.brandColor}0D !important; }
          .bg-accent\\/10 { background-color: ${restaurant.theme.brandColor}1A !important; }
          .bg-accent\\/20 { background-color: ${restaurant.theme.brandColor}33 !important; }
          .border-accent\\/20 { border-color: ${restaurant.theme.brandColor}33 !important; }
          .border-accent\\/30 { border-color: ${restaurant.theme.brandColor}4D !important; }
          .border-accent\\/40 { border-color: ${restaurant.theme.brandColor}66 !important; }
          .border-accent\\/50 { border-color: ${restaurant.theme.brandColor}80 !important; }
          
          /* Custom Phone Input Styles for Checkout */
          .phone-input-modern .PhoneInputInput {
            border: none;
            outline: none;
            background: transparent;
            height: 100%;
            width: 100%;
            margin-left: 12px;
            color: #111827;
            font-size: 0.875rem;
          }
          .phone-input-modern .PhoneInputCountry {
            margin-right: 8px;
            padding-right: 8px;
            border-right: 1px solid #e5e7eb;
          }
        `}} />
      )}

      {/* Global Navigation (Stitch AI Design) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md text-white px-4 md:px-8 h-16 md:h-20 flex items-center justify-between border-b border-white/10">
        <div className="font-extrabold text-xl tracking-tight">{restaurant.name}</div>
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold">
          <a href="#" className="border-b-2 border-white pb-1">Home</a>
          <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
          <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it works</a>
          <a href="#chefs" className="text-gray-300 hover:text-white transition-colors">Our Chefs</a>
          <a href="#standards" className="text-gray-300 hover:text-white transition-colors">Guarantee</a>
          <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {!activeOrder && (() => {
            try {
              const savedStr = sessionStorage.getItem("sofra_active_order");
              if (!savedStr) return false;
              const saved = JSON.parse(savedStr);
              return !["completed", "cancelled", "rejected"].includes(saved.status);
            } catch (e) {
              return false;
            }
          })() && (
              <button
                onClick={() => {
                  try {
                    const saved = JSON.parse(sessionStorage.getItem("sofra_active_order")!);
                    setActiveOrder(saved);
                  } catch (e) { }
                }}
                className="bg-accent text-white px-3 md:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-accent/90 transition-colors shadow-sm"
                style={{ backgroundColor: restaurant.theme?.brandColor || '#d4512e' }}
              >
                <Package className="w-4 h-4" />
                <span className="hidden md:inline">Track Order</span>
              </button>
            )}
          <button
            onClick={() => setView("cart")}
            className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span> {cartCount > 0 && <span className="bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{cartCount}</span>}
          </button>
          <button className="hidden sm:flex w-10 h-10 rounded-full bg-white/10 items-center justify-center hover:bg-white/20 transition-colors">
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative w-full h-[400px] md:h-[500px] mt-16 md:mt-0">
        <img
          src={restaurant.coverUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80"}
          alt="cover"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-12 max-w-screen-2xl mx-auto z-10 pt-20">
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold text-white max-w-2xl leading-[1.1] mb-6 tracking-tight">
            Exquisite Flavors, Unforgettable Moments
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-xl">
            {restaurant.description || "Experience the art of exceptional dining, crafted with passion and served with excellence."}
          </p>
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="max-w-screen-xl mx-auto px-4 -mt-20 relative z-20 mb-12">
        <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl shadow-black/10 border border-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt="Logo" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center font-bold text-4xl border-4 border-white shadow-md shrink-0">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{restaurant.name}</h2>
              <p className="text-gray-500 font-medium">{restaurant.restaurantType || "Restaurant"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-sm font-bold text-gray-700">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${restaurant.isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${restaurant.isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
              <span className="text-yellow-500">★</span> 4.8 <span className="text-[10px] text-gray-400 font-normal">(120+)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
              <Clock className="w-4 h-4 text-gray-400" /> 20-30 <span className="text-[10px] text-gray-400 font-normal">min</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
              <MapPin className="w-4 h-4 text-gray-400" /> 1.2 <span className="text-[10px] text-gray-400 font-normal">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-screen-xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#f2f4fb] rounded-2xl p-6 flex gap-4 items-start border border-[#e5e9f5]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm"><Utensils className="w-5 h-5 text-[#d4512e]" /></div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">Dine-in Excellence</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Experience premium service in our upscale bistro.</p>
            </div>
          </div>
          <div className="bg-[#f2f4fb] rounded-2xl p-6 flex gap-4 items-start border border-[#e5e9f5]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm"><Package className="w-5 h-5 text-[#d4512e]" /></div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">Fast Delivery</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Freshly prepared meals delivered straight to your door.</p>
            </div>
          </div>
          <div className="bg-[#f2f4fb] rounded-2xl p-6 flex gap-4 items-start border border-[#e5e9f5]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm"><Calendar className="w-5 h-5 text-[#d4512e]" /></div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">Private Events</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Host your special moments in our elegant spaces.</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "menu" && (
        <>
          {/* Main Menu Section (Contains scoped sticky search and category ribbon) */}
          <section id="menu" className="relative">
            {/* Search and Categories Ribbon */}
          <div className="max-w-screen-xl mx-auto px-4 sticky top-16 md:top-20 z-30 bg-[#f8f9fa] pt-4 pb-3">
            {/* Search Input & Category Filter Toggle */}
            <div className="flex items-center justify-center gap-3 mb-4 max-w-3xl mx-auto relative">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for dishes, drinks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-sm"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowCategoryMenu(prev => !prev)}
                aria-label="Category quick selector"
                title="All Categories"
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0 border ${
                  showCategoryMenu 
                    ? "bg-[#d4512e] text-white border-[#d4512e] shadow-md shadow-[#d4512e]/20" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              {/* Quick Category Jump Popover Menu */}
              {showCategoryMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#d4512e]" />
                      Jump to Category
                    </span>
                    <button 
                      onClick={() => setShowCategoryMenu(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    <button
                      onClick={() => handleSelectCategory("all")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        categoryFilter === "all"
                          ? "bg-[#d4512e]/10 text-[#d4512e]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Menu className="w-3.5 h-3.5" />
                        All Categories
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {menuItems.filter(i => i.isAvailable !== false).length}
                      </span>
                    </button>

                    {categories.map((cat) => {
                      const count = cat.items ? cat.items.filter((i: any) => i.isAvailable !== false).length : 0;
                      const isSelected = categoryFilter === (cat._id || cat.id);
                      return (
                        <button
                          key={cat._id || cat.id}
                          onClick={() => handleSelectCategory(cat._id || cat.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            isSelected
                              ? "bg-[#d4512e]/10 text-[#d4512e]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate flex items-center gap-2">
                            {cat.icon ? (
                              <span>{cat.icon}</span>
                            ) : (
                              <Utensils className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400 ml-2 shrink-0">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal Category Ribbon with Scroll Arrows & Edge Fades */}
            <div className="relative max-w-screen-xl mx-auto px-1 md:px-7">
              {/* Left Scroll Chevron (Desktop) */}
              <button
                type="button"
                onClick={() => scrollCategoryRibbon("left")}
                aria-label="Scroll categories left"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-md text-gray-700 hover:text-white hover:bg-[#d4512e] hover:border-[#d4512e] transition-all hidden md:flex items-center justify-center ${
                  canScrollLeft ? "opacity-100 scale-100 cursor-pointer" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Left Edge Fade Gradient */}
              <div 
                className={`pointer-events-none absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10 hidden md:block transition-opacity duration-300 ${
                  canScrollLeft ? "opacity-100" : "opacity-0"
                }`} 
              />

              {/* Scrollable Categories List */}
              <div
                ref={categoryScrollRef}
                className={`flex items-center overflow-x-auto hide-scrollbar gap-2.5 pb-2 pt-1 max-w-full scroll-smooth px-1 ${
                  categoryOptions.length <= 4 ? "justify-start md:justify-center" : "justify-start"
                }`}
              >
                <button
                  onClick={() => handleSelectCategory("all")}
                  className={`whitespace-nowrap px-5 py-2.5 font-bold text-sm rounded-full transition-all flex items-center gap-2 border shrink-0 ${
                    categoryFilter === "all"
                      ? "bg-[#d4512e] text-white shadow-md shadow-[#d4512e]/30 border-[#d4512e]"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    categoryFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {menuItems.filter(i => i.isAvailable !== false).length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const isBurger = cat.name.toLowerCase().includes('burger');
                  const isEthiopian = cat.name.toLowerCase().includes('ethiopian');
                  const isDrink = cat.name.toLowerCase().includes('drink') || cat.name.toLowerCase().includes('beverage');
                  const isSide = cat.name.toLowerCase().includes('side');
                  const isPizza = cat.name.toLowerCase().includes('pizza');
                  const isSalad = cat.name.toLowerCase().includes('salad');
                  const isDessert = cat.name.toLowerCase().includes('dessert') || cat.name.toLowerCase().includes('sweet');
                  const isSelected = categoryFilter === (cat._id || cat.id);
                  const count = cat.items ? cat.items.filter((i: any) => i.isAvailable !== false).length : 0;

                  return (
                    <button
                      key={cat._id || cat.id}
                      onClick={() => handleSelectCategory(cat._id || cat.id)}
                      className={`whitespace-nowrap px-5 py-2.5 font-bold text-sm rounded-full transition-all flex items-center gap-2 border shrink-0 ${
                        isSelected
                          ? "bg-[#d4512e] text-white shadow-md shadow-[#d4512e]/30 border-[#d4512e]"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {cat.icon ? (
                        <span className="text-base leading-none">{cat.icon}</span>
                      ) : isBurger ? (
                        <Sandwich className="w-4 h-4" />
                      ) : isEthiopian ? (
                        <Soup className="w-4 h-4" />
                      ) : isDrink ? (
                        <Coffee className="w-4 h-4" />
                      ) : isSide ? (
                        <Croissant className="w-4 h-4" />
                      ) : (
                        <Utensils className="w-4 h-4" />
                      )}
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Edge Fade Gradient */}
              <div 
                className={`pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10 hidden md:block transition-opacity duration-300 ${
                  canScrollRight ? "opacity-100" : "opacity-0"
                }`} 
              />

              {/* Right Scroll Chevron (Desktop) */}
              <button
                type="button"
                onClick={() => scrollCategoryRibbon("right")}
                aria-label="Scroll categories right"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-md text-gray-700 hover:text-white hover:bg-[#d4512e] hover:border-[#d4512e] transition-all hidden md:flex items-center justify-center ${
                  canScrollRight ? "opacity-100 scale-100 cursor-pointer" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="max-w-screen-xl mx-auto px-4 py-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No menu items available</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">This restaurant hasn't added any available dishes yet.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {categories.map(category => {
                  const itemsInCategory = filteredItems.filter(item => {
                    const catId = item.categoryId && typeof item.categoryId === 'object' ? item.categoryId._id || item.categoryId.id : item.categoryId;
                    return catId === (category._id || category.id);
                  });

                  if (itemsInCategory.length === 0) return null;

                  return (
                    <div key={category._id || category.id} id={`category-${category._id || category.id}`} className="scroll-mt-[220px]">
                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                          {category.name.toLowerCase().includes('burger') && <Sandwich className="w-6 h-6 text-accent" />}
                          {category.name.toLowerCase().includes('ethiopian') && <Soup className="w-6 h-6 text-accent" />}
                          {category.name.toLowerCase().includes('drink') && <Coffee className="w-6 h-6 text-accent" />}
                          {category.name.toLowerCase().includes('side') && <Croissant className="w-6 h-6 text-accent" />}
                          {category.name}
                        </h2>
                        <span className="text-accent text-xs md:text-sm font-semibold cursor-pointer border border-accent/20 px-3 py-1 rounded-full hover:bg-orange-50 transition-colors">View all {'>'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itemsInCategory.map(item => {
                          const hasVariations = (item.sizes && item.sizes.length > 0) || (item.addons && item.addons.length > 0);
                          const quantity = getItemQuantity(item._id!);

                          return (
                            <motion.div 
                              key={item._id} 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-shadow flex flex-col group cursor-pointer" 
                              onClick={() => hasVariations ? handleItemClick(item) : handleAddSimple(item)}
                            >

                              <div className="relative h-[220px] w-full overflow-hidden">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Utensils className="w-12 h-12 text-gray-400" /></div>
                                )}
                                <div className="absolute top-4 left-4 bg-[#10b981] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">Popular</div>
                                <button className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#d4512e] transition-colors" onClick={(e) => e.stopPropagation()}>
                                  <Heart className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="p-5 flex flex-col flex-1">
                                <h3 className="font-extrabold text-[18px] text-gray-900 mb-2 leading-tight">{item.name}</h3>
                                {item.description && (
                                  <p className="text-[13px] text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">{item.description}</p>
                                )}
                                <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto pt-2 border-t border-gray-50">
                                  <p className="font-extrabold text-gray-900 text-[18px]">
                                    {item.sizes && item.sizes.length > 0
                                      ? formatCurrency(Math.min(...item.sizes.map((s: any) => Number(s?.price) || 0)))
                                      : formatCurrency(item.basePrice)}
                                  </p>

                                  {restaurant.isOpen ? (
                                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                      {quantity === 0 ? (
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => hasVariations ? handleItemClick(item) : handleAddSimple(item)}
                                          className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                          <Plus className="w-5 h-5" />
                                        </motion.button>
                                      ) : (
                                        <div className="flex items-center bg-gray-100 rounded-full overflow-hidden h-10 border border-gray-200">
                                          <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleRemoveItem(item._id!)} 
                                            className="w-10 h-full text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                          >
                                            <Minus className="w-4 h-4" />
                                          </motion.button>
                                          <span className="font-bold text-sm text-gray-900 min-w-[1rem] text-center">{quantity}</span>
                                          <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => hasVariations ? handleItemClick(item) : handleAddSimple(item)} 
                                            className="w-10 h-full text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </motion.button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Unavailable</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

          {/* About Us Section */}
          {(() => {
            const aboutText = restaurant.aboutUs?.text || `Welcome to ${restaurant.name}, where culinary excellence meets a warm, inviting atmosphere. Our passion is crafting unforgettable dining experiences using the finest, locally sourced ingredients. Whether you're here for a casual lunch or a special celebration, our dedicated team ensures every visit is memorable.`;
            const aboutImg = restaurant.aboutUs?.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";
            return (
              <div id="about" className="bg-[#f0f4f8] py-20">
                <div className="max-w-screen-xl mx-auto px-4">
                  <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    <div className="w-full md:w-1/2">
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                        <img src={aboutImg} alt="About Us" className="w-full h-[400px] object-cover" />
                      </div>
                    </div>
                    <div className="w-full md:w-1/2">
                      <h3 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">About Us</h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-8">
                        {aboutText}
                      </p>
                      {restaurant.restaurantType && (
                        <div className="inline-flex bg-white px-4 py-2 rounded-full font-bold text-sm text-[#d4512e] border border-[#d4512e]/20">
                          {restaurant.restaurantType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* How It Works Section */}
          <div id="how-it-works" className="py-24 bg-white relative">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="text-center mb-20">
                <h3 className="text-sm font-bold text-[#d4512e] uppercase tracking-[0.2em] mb-3">Simple Process</h3>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">How It Works</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 max-w-5xl mx-auto relative">
                {/* Connecting Line for Desktop */}
                <div className="hidden md:block absolute top-[3.5rem] left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-gray-200 -z-10"></div>
                
                {/* Connecting Straight Line for Mobile */}
                <div className="absolute top-[8%] bottom-[8%] left-1/2 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-gray-200 block md:hidden z-0 pointer-events-none"></div>

                <div className="relative flex flex-row md:flex-col items-center gap-8 md:gap-0 group text-left md:text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center md:mb-8 border border-gray-50 transform group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgb(212,81,46,0.15)] transition-all duration-300 relative z-10">
                    <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-[#d4512e]" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">1</div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-gray-900 mb-3">Order with Ease</h4>
                    <p className="text-gray-500 leading-relaxed text-sm md:text-base max-w-[280px] mx-auto">Browse our menu and customize your order effortlessly online from any device.</p>
                  </div>
                </div>

                <div className="relative flex flex-row-reverse md:flex-col items-center gap-8 md:gap-0 group text-right md:text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center md:mb-8 border border-gray-50 transform group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgb(212,81,46,0.15)] transition-all duration-300 relative z-10">
                    <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-[#d4512e]" />
                    <div className="absolute -top-3 -right-3 md:-top-3 md:-right-3 md:-left-auto left-auto w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">2</div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-gray-900 mb-3">Expert Preparation</h4>
                    <p className="text-gray-500 leading-relaxed text-sm md:text-base max-w-[280px] mx-auto">Our master chefs craft your meal with the freshest ingredients and absolute passion.</p>
                  </div>
                </div>

                <div className="relative flex flex-row md:flex-col items-center gap-8 md:gap-0 group text-left md:text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center md:mb-8 border border-gray-50 transform group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgb(212,81,46,0.15)] transition-all duration-300 relative z-10">
                    <Heart className="w-8 h-8 md:w-10 md:h-10 text-[#d4512e]" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">3</div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-gray-900 mb-3">Enjoy the Experience</h4>
                    <p className="text-gray-500 leading-relaxed text-sm md:text-base max-w-[280px] mx-auto">Savor every bite of your carefully prepared dish, designed for your delight.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Culinary Team Section */}
          {(() => {
            const chefsList = (restaurant.culinaryTeam && restaurant.culinaryTeam.length > 0)
              ? restaurant.culinaryTeam
              : [
                { name: "Marcus Culiner", role: "Executive Chef", specialty: "French & Fusion", bio: "With over 15 years of Michelin-star experience, Marcus brings unparalleled artistry to every plate.", instagram: "#", twitter: "#", linkedin: "#" },
                { name: "Elena Rossi", role: "Pastry Chef", specialty: "Artisan Desserts", bio: "Elena's delicate pastries blend traditional Italian techniques with modern flavor profiles.", instagram: "#", linkedin: "#" },
                { name: "David Chen", role: "Grill Master", specialty: "Premium Steaks", bio: "A true perfectionist over the flame, ensuring every cut is seared to absolute perfection.", twitter: "#", linkedin: "#" }
              ];

            return (
              <div id="chefs" className="bg-[#f8f9fa] py-24 border-t border-gray-100">
                <div className="max-w-screen-xl mx-auto px-4">
                  <div className="text-center mb-20">
                    <h3 className="text-sm font-bold text-[#d4512e] uppercase tracking-[0.2em] mb-3">The Artisans</h3>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Meet Our Culinary Team</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-6">The passionate experts working tirelessly behind the scenes to deliver an unforgettable dining experience.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
                    {/* Connecting Straight Line for Mobile */}
                    <div className="absolute top-[5%] bottom-[5%] left-1/2 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-[#d4512e]/30 block md:hidden z-0 pointer-events-none"></div>

                    {chefsList.map((member: any, index: number) => (
                      <div key={index} className={`relative z-10 group bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 transition-all duration-300 flex ${index % 2 === 0 ? 'flex-row md:flex-col' : 'flex-row-reverse md:flex-col'} md:h-full`}>
                        
                        {/* Image Header */}
                        <div className="relative w-2/5 md:w-full h-[200px] md:h-[320px] overflow-hidden flex-shrink-0 bg-gray-100">
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700">
                              <User className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Content Body */}
                        <div className={`p-6 md:p-8 flex-1 flex flex-col justify-center ${index % 2 === 0 ? 'text-left md:text-center' : 'text-right md:text-center'}`}>
                          <p className="text-xs font-black text-[#d4512e] uppercase tracking-wider mb-2">{member.role}</p>
                          <h4 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-2">{member.name}</h4>
                          
                          {member.specialty && (
                            <p className="text-sm text-gray-500 font-medium mb-4">Specialty: {member.specialty}</p>
                          )}
                          
                          {member.bio && (
                            <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1 hidden md:block">{member.bio}</p>
                          )}

                          {/* Socials */}
                          <div className={`flex gap-3 mt-auto pt-4 border-t border-gray-50 ${index % 2 === 0 ? 'justify-start md:justify-center' : 'justify-end md:justify-center'}`}>
                            <a href={member.twitter || "#"} onClick={e => !member.twitter && e.preventDefault()} target={member.twitter ? "_blank" : "_self"} rel="noreferrer" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${member.twitter ? 'bg-gray-100 text-gray-600 hover:text-white hover:bg-[#d4512e]' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}><Twitter className="w-4 h-4" /></a>
                            <a href={member.instagram || "#"} onClick={e => !member.instagram && e.preventDefault()} target={member.instagram ? "_blank" : "_self"} rel="noreferrer" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${member.instagram ? 'bg-gray-100 text-gray-600 hover:text-white hover:bg-[#d4512e]' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}><Instagram className="w-4 h-4" /></a>
                            <a href={member.linkedin || "#"} onClick={e => !member.linkedin && e.preventDefault()} target={member.linkedin ? "_blank" : "_self"} rel="noreferrer" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${member.linkedin ? 'bg-gray-100 text-gray-600 hover:text-white hover:bg-[#d4512e]' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}><Linkedin className="w-4 h-4" /></a>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SOFRA Quality, Safety & Dining Guarantee (Common & Constant across all restaurants) */}
          <section id="standards" className="bg-[#111827] text-white py-24 relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#d4512e]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-screen-xl mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-orange-400 text-xs font-black uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Platform Dining Standard</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                  Guaranteed Quality & Zero Friction
                </h2>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                  Every partner restaurant on SOFRA is backed by verified hygiene standards, instant table QR ordering, and seamless Ethiopian payment rails.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Pillar 1 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-orange-500/40 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-2">Verified Hygiene</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Sanitary-inspected kitchens, fresh daily ingredients, and strict safety guidelines for your peace of mind.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-orange-500/40 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-2">Instant Table Order</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Scan the QR at your table to order directly into the kitchen display. Zero waiting for busy servers.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-orange-500/40 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-2">Multi-Rail Payments</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Pay seamlessly with Telebirr, CBE Birr, online debit cards via Chapa, or traditional Cash upon delivery.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-orange-500/40 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-2">Live Status Tracking</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Watch your order status update in real time from Chef Acceptance to Active Cooking to Ready for Pickup.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Universal Diner FAQ Section (Common & Constant across all restaurants) */}
          <section id="faq" className="py-24 bg-white relative">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#d4512e] text-xs font-bold uppercase tracking-wider mb-3">
                  <HelpCircle className="w-4 h-4" />
                  <span>Diner Help Desk</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-500 text-base md:text-lg mt-4 max-w-xl mx-auto">
                  Everything you need to know about contactless table ordering, live kitchen tracking, and payments.
                </p>
              </div>

              <div className="space-y-4">
                {platformFaqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div 
                      key={index}
                      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                        isOpen ? "border-[#d4512e]/40 shadow-md bg-orange-50/20" : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 font-bold text-base md:text-lg text-gray-900"
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                            isOpen ? "bg-[#d4512e] text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            {index + 1}
                          </span>
                          <span>{faq.question}</span>
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#d4512e]" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-6 pt-1 text-sm md:text-base text-gray-600 leading-relaxed border-t border-gray-100/60 pl-14 md:pl-16">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Powered by SOFRA Platform Banner (Common & Constant across all restaurants) */}
          <section className="bg-gradient-to-r from-orange-500 via-[#d4512e] to-amber-600 text-white py-12 relative overflow-hidden">
            <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <span className="text-xs uppercase font-black tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                      Official SOFRA Partner
                    </span>
                    <span className="flex items-center text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Kitchen
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black">
                    Enjoying your dining experience?
                  </h3>
                  <p className="text-white/85 text-sm mt-1 max-w-xl">
                    SOFRA powers modern contactless QR menus, live kitchen display systems, and instant payments across top restaurants in Ethiopia.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <a
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 group"
                >
                  <span>Digitize Your Restaurant</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#1a1a1a] text-white py-16">
            <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  {restaurant.logoUrl ? (
                    <img src={restaurant.logoUrl} alt="Logo" className="w-12 h-12 rounded-full bg-white object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl">{restaurant.name.charAt(0)}</div>
                  )}
                  <span className="font-extrabold text-xl tracking-tight">{restaurant.name}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                  Experience the finest culinary journey. We serve passion on every plate, crafting unforgettable moments for you and your loved ones.
                </p>
                <div className="flex gap-4">
                  <a href={restaurant.socialLinks?.facebook || "#"} onClick={e => !restaurant.socialLinks?.facebook && e.preventDefault()} target={restaurant.socialLinks?.facebook ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                  <a href={restaurant.socialLinks?.twitter || "#"} onClick={e => !restaurant.socialLinks?.twitter && e.preventDefault()} target={restaurant.socialLinks?.twitter ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href={restaurant.socialLinks?.instagram || "#"} onClick={e => !restaurant.socialLinks?.instagram && e.preventDefault()} target={restaurant.socialLinks?.instagram ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                  <a href={restaurant.socialLinks?.linkedin || "#"} onClick={e => !restaurant.socialLinks?.linkedin && e.preventDefault()} target={restaurant.socialLinks?.linkedin ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6">Quick Links</h4>
                <div className="flex flex-col gap-4 text-sm font-medium text-gray-400">
                  <a href="#" onClick={e => { e.preventDefault(); window.scrollTo(0, 0); }} className="hover:text-white transition-colors">Home</a>
                  <a href="#menu" className="hover:text-white transition-colors">Menu</a>
                  <a href="#about" className="hover:text-white transition-colors">About Us</a>
                  <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                  <a href="#chefs" className="hover:text-white transition-colors">Our Chefs</a>
                  <a href="#standards" className="hover:text-white transition-colors">Dining Standards</a>
                  <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6">Legal & Support</h4>
                <div className="flex flex-col gap-4 text-sm font-medium text-gray-400">
                  <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Contact Support</a>
                  <a href="#faq" className="hover:text-white transition-colors">Diner FAQ</a>
                </div>
              </div>
            </div>
            <div className="max-w-screen-xl mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm">© {new Date().getFullYear()} {restaurant.name}. Powered by SOFRA Digital Dining Platform. All rights reserved.</p>
            </div>
          </footer>
        </>
      )}
      <ItemCustomizationModal
        isOpen={showItemModal}
        item={selectedItem}
        onClose={() => setShowItemModal(false)}
        onAdd={addToCart}
      />

      {/* Bottom Cart Bar (Mobile) */}
      {cartCount > 0 && restaurant.isOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] p-4 pb-6 z-40 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-orange-50 text-accent p-2.5 rounded-xl border border-accent/10">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <motion.span 
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-2 -right-2 bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm"
                >
                  {cartCount}
                </motion.span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight">{cartCount} items</p>
                <p className="font-extrabold text-gray-900 text-lg leading-tight">{formatCurrency(cart.reduce((sum, item) => sum + item.itemTotal * item.quantity, 0))}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setView("cart")}
              className="bg-accent hover:bg-accent-hover text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-accent/40 transition-colors flex items-center gap-2"
            >
              View Cart <span className="text-xl leading-none -mt-0.5">›</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Desktop) */}
      {cartCount > 0 && restaurant.isOpen && (
        <div className="hidden md:block fixed bottom-8 right-8 z-40">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("cart")}
            className="bg-accent hover:bg-accent-hover text-white w-20 h-20 rounded-full shadow-2xl shadow-accent/40 flex flex-col items-center justify-center transition-colors relative group border-4 border-white"
          >
            <ShoppingCart className="w-7 h-7 mb-0.5" />
            <span className="font-bold text-[11px] leading-tight text-center">{formatCurrency(cart.reduce((sum, item) => sum + item.itemTotal * item.quantity, 0))}</span>
            <motion.span 
              key={cartCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm transform -translate-y-1/4 translate-x-1/4"
            >
              {cartCount}
            </motion.span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

// Cart View Component (Stitch AI Design)
interface CartViewProps {
  cart: CartItem[];
  restaurant: any;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onBack: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const CartView: React.FC<CartViewProps> = ({
  cart,
  restaurant,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onBack,
  notes,
  onNotesChange,
}) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.itemTotal * item.quantity,
    0
  );
  const tax = subtotal * 0.05; // Assuming 5% for now as in CheckoutModal
  const total = subtotal + tax;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#f8f9fa] text-gray-900 font-sans antialiased min-h-screen flex flex-col relative"
    >
      {/* Immersive Background */}
      <div className="fixed inset-0 z-[0] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#d4512e]/10 blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gray-300/30 blur-[150px] opacity-80"></div>
      </div>

      {/* TopNavBar (Matches Home Page exactly) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md text-white px-4 md:px-8 h-16 md:h-20 flex items-center justify-between border-b border-white/10">
        <div className="font-extrabold text-xl tracking-tight flex items-center gap-2">
          {restaurant.logoUrl ? (
            <img src={restaurant.logoUrl} alt="Logo" className="w-8 h-8 rounded-full bg-white object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">{restaurant.name.charAt(0)}</div>
          )}
          {restaurant.name}
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="border-b-2 border-white pb-1">Home</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="text-gray-300 hover:text-white transition-colors">About</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="text-gray-300 hover:text-white transition-colors">How it works</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="text-gray-300 hover:text-white transition-colors">Our Chefs</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && <span className="bg-[#d4512e] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </button>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-16 pt-24 pb-12 md:pt-32 md:pb-16 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">Your Cart</h1>
            <p className="text-lg text-gray-600">Review your premium selections.</p>
          </div>
          <button onClick={onBack} className="text-[#d4512e] font-bold text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 w-fit mx-auto md:mx-0 hover:opacity-80 transition-opacity bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200 hover:bg-white shadow-sm">
            <span className="text-xl leading-none">&larr;</span>
            Add more items
          </button>
        </div>

        {/* Grid Layout for Cart Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">

          {/* Left Column: Cart Items (8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-8 relative z-10">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-gray-500 font-medium">Your cart is empty</p>
                  <button onClick={onBack} className="mt-6 text-accent font-bold hover:underline">Return to Menu</button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-gray-200/50 relative group last:border-0 last:pb-0">
                    {/* Image */}
                    <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative shadow-md">
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                          <span className="text-2xl font-extrabold text-gray-900">{formatCurrency(item.itemTotal)}</span>
                        </div>
                        <p className="text-base text-gray-600 mb-2 pr-4">{item.description}</p>

                        {(item.selectedSize || item.selectedAddons.length > 0) && (
                          <div className="text-sm text-gray-500 mb-6 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                            {item.selectedSize && <p><span className="font-semibold text-gray-700">Size:</span> {item.selectedSize.name}</p>}
                            {item.selectedAddons.length > 0 && <p><span className="font-semibold text-gray-700">Add-ons:</span> {item.selectedAddons.map(a => a.name).join(', ')}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                        {/* Quantity Selector */}
                        <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full p-1.5 border border-gray-200 shadow-sm">
                          <button onClick={() => onUpdateQuantity(index, -1)} aria-label="Decrease quantity" className="w-10 h-10 flex items-center justify-center rounded-full text-gray-900 hover:bg-gray-100 transition-colors">
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-12 text-center font-bold text-gray-900 text-lg">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(index, 1)} aria-label="Increase quantity" className="w-10 h-10 flex items-center justify-center rounded-full text-gray-900 hover:bg-gray-100 transition-colors">
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        {/* Remove */}
                        <button onClick={() => onRemove(index)} className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50">
                          <X className="w-5 h-5" />
                          <span className="uppercase tracking-widest">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Special Instructions */}
            {cart.length > 0 && (
              <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Special Instructions</h2>
                </div>
                <p className="text-base text-gray-600 mb-5">Any allergies or special requests? Let our kitchen know.</p>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none text-sm text-gray-900 placeholder:text-gray-400 p-4"
                  placeholder="e.g., No pickles, extra napkins..."
                  rows={3}
                ></textarea>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary (4 columns) */}
          {cart.length > 0 && (
            <div className="lg:col-span-4 sticky top-[100px]">
              <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="mb-8">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Summary</h2>
                    <div className="h-0.5 w-8 bg-gray-900"></div>
                  </div>


                  {/* Line Items */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Taxes (5%)</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(tax)}</span>
                    </div>
                    <div className="h-px bg-gray-200 mt-6"></div>
                  </div>

                  {/* Total */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Total Estimated</span>
                      <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(total)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Including VAT</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={onCheckout}
                    className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-xs uppercase tracking-[0.1em] hover:opacity-90 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <span className="relative z-10">Proceed to Checkout</span>
                    <span className="text-lg group-hover:translate-x-1.5 transition-transform duration-300 relative z-10">&rarr;</span>
                  </button>

                  {/* Security Badge */}
                  <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
                    <span className="uppercase tracking-[0.2em] text-[10px] font-bold">Secure SSL Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-16 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {restaurant.logoUrl ? (
                <img src={restaurant.logoUrl} alt="Logo" className="w-12 h-12 rounded-full bg-white object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl">{restaurant.name.charAt(0)}</div>
              )}
              <span className="font-extrabold text-xl tracking-tight">{restaurant.name}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
              Experience the finest culinary journey. We serve passion on every plate, crafting unforgettable moments for you and your loved ones.
            </p>
            <div className="flex gap-4">
              <a href={restaurant.socialLinks?.facebook || "#"} onClick={e => !restaurant.socialLinks?.facebook && e.preventDefault()} target={restaurant.socialLinks?.facebook ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href={restaurant.socialLinks?.twitter || "#"} onClick={e => !restaurant.socialLinks?.twitter && e.preventDefault()} target={restaurant.socialLinks?.twitter ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href={restaurant.socialLinks?.instagram || "#"} onClick={e => !restaurant.socialLinks?.instagram && e.preventDefault()} target={restaurant.socialLinks?.instagram ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href={restaurant.socialLinks?.linkedin || "#"} onClick={e => !restaurant.socialLinks?.linkedin && e.preventDefault()} target={restaurant.socialLinks?.linkedin ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href={restaurant.socialLinks?.tiktok || "#"} onClick={e => !restaurant.socialLinks?.tiktok && e.preventDefault()} target={restaurant.socialLinks?.tiktok ? "_blank" : "_self"} rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Music2 className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-gray-400">
              <a href="#" onClick={e => { e.preventDefault(); onBack(); window.scrollTo(0, 0); }} className="hover:text-white transition-colors">Home</a>
              <a href="#" onClick={e => { e.preventDefault(); onBack(); }} className="hover:text-white transition-colors">Menu</a>
              <a href="#" onClick={e => { e.preventDefault(); onBack(); }} className="hover:text-white transition-colors">About Us</a>
              <a href="#" onClick={e => { e.preventDefault(); onBack(); }} className="hover:text-white transition-colors">How it Works</a>
              <a href="#" onClick={e => { e.preventDefault(); onBack(); }} className="hover:text-white transition-colors">Our Chefs</a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Legal & Support</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-gray-400">
              <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Contact Support</a>
              <a href="#" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">FAQ</a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
};

// Item Customization Modal Component
interface ItemCustomizationModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (item: MenuItem, selectedSize?: any, selectedAddons?: any[]) => void;
}

const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  isOpen,
  item,
  onClose,
  onAdd,
}) => {
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    if (item?.sizes && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0]);
    }
  }, [item]);

  if (!item) return null;

  const toggleAddon = (addon: any) => {
    if (selectedAddons.find((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const calculateTotal = () => {
    const basePrice = selectedSize ? selectedSize.price : item.basePrice;
    const addonsTotal = selectedAddons.reduce(
      (sum, addon) => sum + addon.price,
      0
    );
    return basePrice + addonsTotal;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name} size="md">
      <div className="space-y-6">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        {item.description && (
          <p className="text-text-secondary">{item.description}</p>
        )}

        {/* Sizes */}
        {item.sizes && item.sizes.length > 0 && (
          <div>
            <h4 className="font-semibold text-text mb-3">Select Size</h4>
            <div className="space-y-2">
              {item.sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${selectedSize?.name === size.name
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                    }`}
                >
                  <span className="font-medium text-text">{size.name}</span>
                  <span className="text-accent font-semibold">
                    {formatCurrency(size.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Addons */}
        {item.addons && item.addons.length > 0 && (
          <div>
            <h4 className="font-semibold text-text mb-3">Add-ons (Optional)</h4>
            <div className="space-y-2">
              {item.addons.map((addon) => (
                <button
                  key={addon.name}
                  onClick={() => toggleAddon(addon)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${selectedAddons.find((a) => a.name === addon.name)
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                    }`}
                >
                  <span className="font-medium text-text">{addon.name}</span>
                  <span className="text-accent font-semibold">
                    +{formatCurrency(addon.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex justify-between text-xl font-bold text-text mb-4">
            <span>Total</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
          <Button
            onClick={() => onAdd(item, selectedSize, selectedAddons)}
            fullWidth
            size="lg"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Checkout Modal Component
interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  restaurantId: string;
  initialTable?: string;
  initialNotes?: string;
  onClose: () => void;
  onSuccess: (orderData: any) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  restaurantId,
  initialTable = "",
  initialNotes = "",
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"table" | "takeaway">("table");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.itemTotal * item.quantity,
    0
  );
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!isValidPhone(customerPhone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (orderType === "table" && !tableNumber.trim()) {
      setError("Please enter table number");
      return;
    }

    setLoading(true);

    const orderData = {
      restaurantId: restaurantId,
      orderType: (orderType === "table" ? "table" : "counter") as
        | "table"
        | "counter",
      tableNumber: orderType === "table" ? tableNumber : undefined,
      customerName: customerName,
      customerPhone: customerPhone,
      items: cart.map((item) => ({
        menuItemId: item._id!,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedAddons: item.selectedAddons,
        specialInstructions: undefined,
      })),
      customerNotes: notes,
    };

    const { error: orderError, data } = await createOrder(orderData);

    if (!orderError && data) {
      if (paymentMethod === "online") {
        try {
          const payRes = await fetch(`/api/payments/orders/${data._id!}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restaurantId, returnUrl: window.location.href })
          });
          const payData = await payRes.json();
          if (payData.success && payData.data.checkoutUrl) {
            sessionStorage.setItem("sofra_active_order", JSON.stringify(data));
            window.location.href = payData.data.checkoutUrl;
            return; // Redirecting to Chapa
          } else {
            setError(payData.message || "Failed to initialize online payment");
            setLoading(false);
            return;
          }
        } catch (err: any) {
          setError("Failed to connect to payment provider");
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(data);
        resetForm();
      }, 1000);
    } else {
      setLoading(false);
      setError(orderError || "Failed to place order");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setTableNumber(initialTable);
    setNotes("");
    setOrderType("table");
    setPaymentMethod("cash");
    setSuccess(false);
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Placed!" size="md">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-text mb-2">
            Order Successful!
          </h3>
          <p className="text-text-secondary mb-6">
            Your order has been placed successfully. The restaurant will prepare
            it shortly.
          </p>
          <Button onClick={onClose} fullWidth>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Checkout" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-2">
        {error && <Alert type="error" message={error} />}

        {/* Modern Order Type Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><MapPin className="w-3 h-3" /></div>
            Dining Options
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType("table")}
              className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${orderType === "table"
                  ? "bg-accent text-white shadow-md shadow-accent/30 scale-[1.02] border-transparent"
                  : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
            >
              {orderType === "table" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />}
              <Utensils className={`w-5 h-5 ${orderType === "table" ? "text-white" : "text-gray-400"}`} />
              <span className="font-semibold text-xs md:text-sm">Dine In (Table)</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType("takeaway")}
              className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${orderType === "takeaway"
                  ? "bg-accent text-white shadow-md shadow-accent/30 scale-[1.02] border-transparent"
                  : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
            >
              {orderType === "takeaway" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />}
              <Package className={`w-5 h-5 ${orderType === "takeaway" ? "text-white" : "text-gray-400"}`} />
              <span className="font-semibold text-xs md:text-sm">Takeaway / Parcel</span>
            </button>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <label className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><User className="w-3 h-3" /></div>
            Your Details
          </label>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                required
              />
            </div>

            <div className="phone-input-modern">
              <PhoneInput
                international
                defaultCountry="ET"
                value={customerPhone}
                onChange={(val: any) => setCustomerPhone(val || "")}
                className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 h-[42px] text-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all"
              />
            </div>

            {orderType === "table" && (
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table Number (e.g. 12 or T-5)"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special Instructions (Optional)"
                rows={2}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><CreditCard className="w-3 h-3" /></div>
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2 ${paymentMethod === "cash"
                  ? "border-accent bg-accent/5 text-accent shadow-sm"
                  : "border-gray-100 hover:border-gray-200 text-gray-600 bg-gray-50"
                }`}
            >
              <Banknote className={`w-5 h-5 ${paymentMethod === "cash" ? "text-accent" : "text-gray-400"}`} />
              <span className="font-semibold text-xs text-center">Cash on Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("online")}
              className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2 ${paymentMethod === "online"
                  ? "border-accent bg-accent/5 text-accent shadow-sm"
                  : "border-gray-100 hover:border-gray-200 text-gray-600 bg-gray-50"
                }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentMethod === "online" ? "text-accent" : "text-gray-400"}`} />
              <span className="font-semibold text-xs text-center">Pay Online</span>
            </button>
          </div>
        </div>

        {/* Sleek Order Summary */}
        <div className="bg-[#f8f9fa] rounded-2xl p-4 md:p-5 border border-dashed border-gray-300 relative overflow-hidden">
          <h4 className="font-bold text-gray-900 mb-4 text-sm flex justify-between items-center">
            <span>Order Summary</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          </h4>

          <div className="space-y-2.5 mb-4 max-h-[140px] overflow-y-auto pr-1">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-[13px] md:text-sm">
                <span className="text-gray-700 flex gap-2 w-3/4">
                  <span className="font-bold text-gray-900 shrink-0">{item.quantity}x</span>
                  <span className="truncate">{item.name} {item.selectedSize && <span className="text-gray-400">({item.selectedSize.name})</span>}</span>
                </span>
                <span className="font-semibold text-gray-900 shrink-0">
                  {formatCurrency(item.itemTotal * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
            <div className="flex justify-between text-gray-500 text-[13px]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[13px]">
              <span>Tax (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg md:text-xl font-extrabold text-gray-900 pt-3 mt-2 border-t border-dashed border-gray-300">
              <span>Total</span>
              <span className="text-accent">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/3 py-3.5 rounded-xl font-bold bg-white border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-2/3 py-3.5 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white shadow-[0_8px_20px_rgba(var(--tw-colors-orange-500),0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
            {!loading && <CheckCircle className="w-4 h-4" />}
            Place Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Order Tracking View
const OrderTrackingView: React.FC<{ order: any, restaurant: any, onNewOrder: () => void }> = ({ order, restaurant, onNewOrder }) => {
  const [status, setStatus] = useState(order.status);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to connect to Socket.IO without tokens
    socket.connect();

    // Join the specific order room using tracking token
    socket.emit("join_order_room", { orderId: order._id, trackingToken: order.trackingToken }, (response: any) => {
      if (response && response.success) {
        if (response.status && response.status !== status) {
          setStatus(response.status);

          // Sync with session storage so a page reload doesn't flash the old status
          try {
            const savedStr = sessionStorage.getItem("sofra_active_order");
            if (savedStr) {
              const savedObj = JSON.parse(savedStr);
              savedObj.status = response.status;
              sessionStorage.setItem("sofra_active_order", JSON.stringify(savedObj));
            }
          } catch (e) { }
        }
      } else if (response && !response.success) {
        setError(response.message || "Failed to subscribe to order updates");
      }
    });

    const handleUpdate = (updatedOrder: any) => {
      if (updatedOrder._id === order._id) {
        setStatus(updatedOrder.status);
      }
    };

    const handleNewNotification = (notif: any) => {
      if (notif.recipientId === order._id) {
        setNotification(notif.message);
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    };

    socket.on("order:updated", handleUpdate);
    socket.on("notification:new", handleNewNotification);

    // Reconnection handling logic
    const handleReconnect = () => {
      socket.emit("join_order_room", { orderId: order._id, trackingToken: order.trackingToken }, (response: any) => {
        if (response && response.success && response.status && response.status !== status) {
          setStatus(response.status);
          try {
            const savedStr = sessionStorage.getItem("sofra_active_order");
            if (savedStr) {
              const savedObj = JSON.parse(savedStr);
              savedObj.status = response.status;
              sessionStorage.setItem("sofra_active_order", JSON.stringify(savedObj));
            }
          } catch (e) { }
        }
      });
    };
    socket.on("connect", handleReconnect);

    // Poll payment status initially to catch missed webhooks (e.g., localhost test mode)
    const verifyPayment = async () => {
      try {
        await api.get(`/payments/orders/${order._id}/status`);
      } catch (err) {
        console.error("Failed to verify payment status:", err);
      }
    };
    verifyPayment();

    return () => {
      socket.off("order:updated", handleUpdate);
      socket.off("notification:new", handleNewNotification);
      socket.off("connect", handleReconnect);
      // We do not disconnect the socket fully here in case they are browsing elsewhere, but usually it's fine.
    };
  }, [order._id, order.trackingToken]);

  const getStatusDisplay = () => {
    switch (status) {
      case "pending": return { text: "Order Received", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500", step: 1, icon: <Clock className="w-6 h-6 text-orange-500" /> };
      case "accepted": return { text: "Order Accepted", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500", step: 2, icon: <CheckCircle className="w-6 h-6 text-blue-500" /> };
      case "preparing": return { text: "Preparing", color: "text-accent", bg: "bg-accent/10", border: "border-accent", step: 3, icon: <ChefHat className="w-6 h-6 text-accent animate-pulse" /> };
      case "ready": return { text: "Ready", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500", step: 4, icon: <Utensils className="w-6 h-6 text-green-500 animate-bounce" /> };
      case "completed": return { text: "Completed", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-500", step: 5, icon: <CheckCircle className="w-6 h-6 text-gray-500" /> };
      case "cancelled":
      case "rejected": return { text: "Cancelled", color: "text-red-500", bg: "bg-red-100", border: "border-red-500", step: 0, icon: <X className="w-6 h-6 text-red-500" /> };
      default: return { text: status, color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-500", step: 1, icon: <Loader className="w-6 h-6 text-gray-500 animate-spin" /> };
    }
  };

  const display = getStatusDisplay();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center p-4 pt-12 relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-accent/5 rounded-b-[100%] blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-8 text-center relative z-10">

        {/* Restaurant Branding */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="relative w-24 h-24 rounded-full object-cover mx-auto shadow-md border-4 border-white"
            />
          ) : (
            <div className="relative w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto border-4 border-white">
              <Utensils className="w-10 h-10 text-accent" />
            </div>
          )}
        </div>

        <h2 className="text-3xl font-black text-gray-800 mb-1 tracking-tight">Order Status</h2>
        <p className="text-gray-500 mb-8 font-medium bg-gray-100 inline-block px-4 py-1 rounded-full text-sm">
          #{order.orderNumber || order._id.slice(-6).toUpperCase()}
        </p>

        {error && <Alert type="error" message={error} className="mb-6 rounded-2xl" />}
        {notification && (
          <div className="mb-6 bg-blue-50 text-blue-700 p-4 rounded-2xl text-sm font-medium border border-blue-100 flex items-center justify-center gap-2 animate-pulse">
            <Bell className="w-5 h-5 text-blue-500" />
            {notification}
          </div>
        )}

        {/* Dynamic Status Indicator */}
        <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-2xl mb-4 ${display.bg} ${display.border} shadow-sm transition-all duration-500 scale-110`}>
          {display.icon}
        </div>

        <div className="mb-10">
          <h3 className={`text-2xl font-extrabold tracking-tight ${display.color} mb-2 transition-colors duration-500`}>
            {display.text}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed px-4">
            {status === "pending" && "We've securely sent your order to the kitchen. Awaiting confirmation."}
            {status === "accepted" && "The kitchen has accepted your order and is getting ready."}
            {status === "preparing" && "The chefs are actively preparing your food right now!"}
            {status === "ready" && "Your food is ready! Please collect it or wait for it to be brought to your table."}
            {status === "completed" && "Hope you enjoyed your meal with SOFRA!"}
          </p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative mt-8 mb-16 px-2 sm:px-4">
          <div className="relative flex items-center justify-between z-10">
            {/* Track Background */}
            <div className="absolute left-[10px] right-[10px] top-1/2 -translate-y-1/2 h-1.5 bg-gray-200 rounded-full z-0">
              <div
                className="absolute top-0 left-0 h-full bg-accent transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (display.step - 1) / 3) * 100)}%` }}
              ></div>
            </div>

            {/* Nodes */}
            {[
              { id: 1, label: 'Sent' },
              { id: 2, label: 'Accepted' },
              { id: 3, label: 'Preparing' },
              { id: 4, label: 'Ready' }
            ].map(step => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-[3px] transition-all duration-700 ease-out
                    ${display.step >= step.id ? 'border-accent bg-accent shadow-[0_0_10px_rgba(249,115,22,0.5)] scale-110' : 'border-gray-200 bg-white'}`}
                ></div>
                <span className={`absolute top-7 w-20 sm:w-24 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors duration-500
                  ${display.step >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onNewOrder} variant="outline" fullWidth size="lg" className="rounded-xl font-bold border-2 hover:bg-accent/5 hover:border-accent hover:text-accent transition-all">
          Place Another Order
        </Button>
      </div>
    </motion.div>
  );
};

export default CustomerMenu;
