import React, { useEffect, useState } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  Store as StoreIcon,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FileText,
  Settings,
  ShieldCheck,
  Lock,
  Bell,
  Smartphone,
  CreditCard,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui";
import { socket } from "../../config/socket";
import RestaurantHome from "./RestaurantHome";
import Orders from "./Orders";
import Menu from "./Menu";
import Reports from "./Reports";
import RestaurantSettings from "./RestaurantSettings";
import Categories from "./Categories";
import VerificationCenter from "./VerificationCenter";
import Notifications from "./Notifications";
import BillingPage from "./BillingPage";
import { api } from "../../services/api";
import MobilePreview from "../../components/ui/MobilePreview";
import NotificationBell from "../../components/ui/NotificationBell";
import toast from "react-hot-toast";

const RestaurantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isCancellingPayment, setIsCancellingPayment] = useState(false);

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data);
      setRestaurant({
        name: data.data.restaurantName,
        slug: data.data.restaurantSlug,
        verificationStatus: data.data.verificationStatus,
        subscription: data.data.subscription,
        pendingPayment: data.data.pendingPayment,
        canOperate: data.data.access?.canOperate || false,
        entitlements: data.data.entitlements
      });
    } catch (err) {
      navigate("/login");
    }
  };

  const handleCheckPaymentStatus = async () => {
    setIsCheckingPayment(true);
    try {
      const response = await api.post("/payments/subscriptions/verify-pending");
      if (response.data?.success) {
         toast.success("Payment verification complete");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment verification error");
    } finally {
      await fetchUser();
      setIsCheckingPayment(false);
    }
  };

  const handleCancelPendingPayment = async () => {
    setIsCancellingPayment(true);
    try {
      const response = await api.post("/payments/subscriptions/cancel-pending");
      if (response.data?.success) {
        toast.success("Pending checkout cancelled");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel checkout");
    } finally {
      await fetchUser();
      setIsCancellingPayment(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    
    // Listen for realtime events
    const onUpdate = () => fetchUser();
    
    socket.on("verification:approved", onUpdate);
    socket.on("subscription:updated", onUpdate);

    return () => {
      socket.off("verification:approved", onUpdate);
      socket.off("subscription:updated", onUpdate);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/login");
    }
  };

  if (!user) return null;

  const isApproved = restaurant?.verificationStatus === "APPROVED";
  const canOperate = restaurant?.canOperate === true;
  const subscription = restaurant?.subscription || {};
  const isTrial = subscription.plan === "free_trial" || subscription.plan === "FREE_TRIAL";
  const hasPendingPayment = !!restaurant?.pendingPayment;
  const hasFailedPayment = restaurant?.pendingPayment?.status === "FAILED";
  const isExpired = !canOperate && isApproved;

  const navItems: Array<{
    path: string;
    icon: any;
    label: string;
    requireOperate: boolean;
    capability?: string;
    comingSoon?: boolean;
  }> = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", requireOperate: false },
    { path: "/dashboard/verification", icon: ShieldCheck, label: "Verification Center", requireOperate: false },
    { path: "/dashboard/orders", icon: ShoppingBag, label: "Orders", requireOperate: true },
    { path: "/dashboard/categories", icon: UtensilsCrossed, label: "Categories", requireOperate: true },
    { path: "/dashboard/menu", icon: UtensilsCrossed, label: "Menu Management", requireOperate: true },
    { path: "/dashboard/reports", icon: BarChart3, label: "Reports & Analytics", requireOperate: true },
    { path: "/dashboard/notifications", icon: Bell, label: "Notifications", requireOperate: false },
    { path: "/dashboard/billing", icon: CreditCard, label: "Billing", requireOperate: false },
    { path: "/dashboard/settings", icon: Settings, label: "Settings", requireOperate: false },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Fixed to left side */}
      <div className="hidden lg:flex w-[280px] flex-col bg-white border-r border-gray-100 flex-shrink-0 relative z-20">
        
        {/* Logo Block */}
        <div className="p-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#F97316] to-[#FB923C] rounded-xl flex items-center justify-center shadow-sm">
              <StoreIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-[#F97316] tracking-tight">SOFRA</span>
          </div>
        </div>

        {/* Profile Block */}
        <div className="px-4 mb-6">
          <div className="bg-[#FAFAFA] border border-gray-100 rounded-2xl p-3 flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <StoreIcon className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {restaurant?.name || "Restaurant"}
                </p>
                {isApproved && (
                  <span className="flex items-center gap-0.5 text-[9px] uppercase font-bold text-green-600 bg-green-50 border border-green-200 px-1 py-0.5 rounded shrink-0 leading-none">
                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5 leading-tight">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {/* Navigation & Promo */}
        <div className="flex-1 px-3 overflow-y-auto overflow-x-hidden space-y-1 pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            // A feature is locked if it requires operate but user can't operate
            let isLocked = item.requireOperate && !canOperate;
            
            // Or if it requires a specific plan entitlement that user doesn't have
            const hasEntitlement = !item.capability || (restaurant?.entitlements?.[item.capability] === true || restaurant?.entitlements?.includes?.(item.capability));
            
            if (item.capability && !hasEntitlement) {
              isLocked = true;
            }
            
            return (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      if (item.comingSoon) {
                        toast("This feature is coming soon!", { icon: "🚧" });
                      } else if (item.capability) {
                        toast("Upgrade your plan to unlock this feature", { icon: "🔒" });
                      } else {
                        navigate("/dashboard/locked");
                      }
                    }
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors font-semibold text-sm ${
                    isActive && !isLocked
                      ? "bg-[#FFF4ED] text-[#F97316]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  } ${isLocked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {isLocked ? <Lock className="w-4 h-4 opacity-60" /> : <item.icon className={`w-4 h-4 ${isActive ? "text-[#F97316]" : "text-gray-400"}`} />}
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
                {/* Hover Tooltip for Locked Items */}
                {isLocked && item.capability && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.comingSoon ? "Coming Soon" : "Upgrade to Pro"}
                  </div>
                )}
              </div>
            );
          })}

          {/* Compact Promo Card inside scroll container */}
          {(!canOperate || (canOperate && isTrial)) && (
            <div className="pt-3">
              <div className="bg-gradient-to-br from-orange-50/90 to-amber-50/50 border border-orange-200/80 rounded-2xl p-3.5 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center shrink-0">
                    {isApproved ? <StoreIcon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">
                      {!isApproved ? "Verification Required" : (canOperate && isTrial) ? "Free Trial Active" : "Payment Required"}
                    </h4>
                    <p className="text-[10px] text-gray-500 truncate">
                      {isApproved ? "Store live & verified" : "Pending compliance"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(!isApproved ? '/dashboard/verification' : '/dashboard/billing')}
                  className="w-full mt-2 flex items-center justify-between px-3 py-1.5 bg-white border border-orange-200/80 shadow-2xs rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <span>{!isApproved ? "View Requirements" : "View Billing"}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              <span>Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC] overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
          {/* Left: Search Bar */}
          <div className="flex-1 max-w-md hidden md:flex">
            <div className="flex items-center gap-2 w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2 focus-within:bg-white focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all shadow-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search orders, menu items, or customers..."
                className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
              />
              <div className="flex items-center gap-1 opacity-60">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-sans font-bold text-gray-500 shadow-sm">⌘</kbd>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-sans font-bold text-gray-500 shadow-sm">K</kbd>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-5 ml-auto">
            {/* Live Store Status */}
            {canOperate && (
              <div title="Toggle Store Status" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors shadow-sm">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </div>
                <span className="text-[11px] font-bold text-green-700 uppercase tracking-wide mt-0.5">Accepting Orders</span>
              </div>
            )}

            <div className="h-6 w-px bg-gray-200 hidden lg:block"></div>
            
            {/* Live Preview Button */}
            <button 
              onClick={() => setShowMobilePreview(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 font-bold border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors shadow-sm"
              title="Live Preview"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider mt-0.5">Live Preview</span>
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <NotificationBell role="owner" />
            
            <div 
              onClick={() => navigate('/dashboard/settings')} 
              className="flex items-center gap-3 cursor-pointer group"
              title="Go to Settings"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{user?.email?.split('@')[0] || "Owner"}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {isApproved ? (
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">Restaurant Admin</span>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-tr from-orange-100 to-orange-50 border border-orange-200 shadow-sm rounded-full flex items-center justify-center text-orange-600 font-bold text-sm group-hover:scale-105 transition-transform">
                {(restaurant?.name || "R").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Banners for various locked states */}
        {!isApproved && (
          <div className="bg-orange-50 border-b border-orange-100 px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
            <div className="flex items-start space-x-3">
              <div className="text-xl mt-0.5">{['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(restaurant?.verificationStatus) ? <Clock className="w-6 h-6 text-orange-500" /> : <AlertTriangle className="w-6 h-6 text-orange-500" />}</div>
              <div>
                <h4 className="font-bold text-orange-900">
                  {['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(restaurant?.verificationStatus) ? 'Verification Under Review' : 'Restaurant Verification Required'}
                </h4>
                <p className="text-sm text-orange-800 mt-0.5">
                  {['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(restaurant?.verificationStatus) 
                    ? 'Your verification documents are currently being reviewed by our team.' 
                    : 'Complete restaurant verification before you can activate your restaurant.'}
                </p>
              </div>
            </div>
            {!['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(restaurant?.verificationStatus) && (
              <Button onClick={() => navigate('/dashboard/verification')} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-sm" size="sm">
                Complete Verification
              </Button>
            )}
          </div>
        )}

        {isApproved && canOperate && isTrial && !hasPendingPayment && !hasFailedPayment && (
          <div className="bg-orange-50 border-b border-orange-100 px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
            <div className="flex items-start space-x-3">
              <div className="text-xl mt-0.5"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
              <div>
                <h4 className="font-bold text-orange-900">Free Trial Active</h4>
                <p className="text-sm text-orange-800 mt-0.5">
                  Your restaurant is verified and currently operating under the free trial. Choose a paid plan to continue after your trial ends.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard/billing')} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-sm" size="sm">
              View Billing
            </Button>
          </div>
        )}

        {isApproved && hasPendingPayment && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs z-10 sticky top-0">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-blue-950 text-sm">
                    {canOperate ? "Incomplete Subscription Checkout" : "Subscription Payment Processing"}
                  </h4>
                  {restaurant?.pendingPayment?.targetPlan && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full border border-blue-300">
                      {restaurant.pendingPayment.targetPlan} Plan {restaurant.pendingPayment.amount ? `(${restaurant.pendingPayment.amount} ETB)` : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-800/90 mt-0.5">
                  {canOperate 
                    ? "A checkout session was started but payment was not finalized. You can cancel this attempt or check its status." 
                    : "Your subscription payment is being verified. Operations will unlock after payment confirmation."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={handleCancelPendingPayment}
                disabled={isCancellingPayment || isCheckingPayment}
                variant="outline"
                className="text-xs font-semibold text-gray-700 hover:text-red-600 hover:border-red-200 bg-white shadow-2xs h-8 px-3 transition-colors"
                size="sm"
              >
                {isCancellingPayment ? "Cancelling..." : "Cancel Attempt"}
              </Button>
              <Button 
                onClick={handleCheckPaymentStatus} 
                disabled={isCheckingPayment || isCancellingPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs text-xs font-semibold h-8 px-3.5 flex items-center gap-1.5" 
                size="sm"
              >
                {isCheckingPayment ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Checking...
                  </>
                ) : (
                  "Check Status"
                )}
              </Button>
            </div>
          </div>
        )}

        {isApproved && isExpired && !hasPendingPayment && !hasFailedPayment && (
          <div className="bg-orange-50 border-b border-orange-100 px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
            <div className="flex items-start space-x-3">
              <div className="text-xl mt-0.5"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <div>
                <h4 className="font-bold text-orange-900">Subscription Required</h4>
                <p className="text-sm text-orange-800 mt-0.5">
                  Your restaurant has been verified. Complete your subscription payment to activate restaurant operations.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard/billing')} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-sm" size="sm">
              Complete Payment
            </Button>
          </div>
        )}

        {isApproved && hasFailedPayment && (
          <div className="bg-red-50 border-b border-red-100 px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
            <div className="flex items-start space-x-3">
              <div className="text-xl mt-0.5"><XCircle className="w-6 h-6 text-red-500" /></div>
              <div>
                <h4 className="font-bold text-red-900">Payment Failed</h4>
                <p className="text-sm text-red-800 mt-0.5">
                  Your subscription payment could not be completed.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard/billing')} className="bg-red-600 hover:bg-red-700 text-white shrink-0 shadow-sm" size="sm">
              Try Again
            </Button>
          </div>
        )}
        <div className="max-w-7xl mx-auto p-6 lg:p-8 w-full flex-1">
          <Routes>
            <Route index element={<RestaurantHome />} />
            <Route path="verification" element={<VerificationCenter />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<RestaurantSettings />} />
            <Route path="notifications" element={<Notifications />} />
            {canOperate ? (
              <>
                <Route path="orders" element={<Orders />} />
                <Route path="categories" element={<Categories />} />
                <Route path="menu" element={<Menu />} />
                <Route path="reports" element={<Reports />} />
              </>
            ) : (
              <Route path="*" element={
                <div className="bg-white rounded-2xl border border-warning/20 p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    {!isApproved ? <ShieldCheck className="w-10 h-10 text-warning" /> : <Lock className="w-10 h-10 text-warning" />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Feature Locked — {!isApproved ? 'Verification Required' : 'Subscription Payment Required'}
                  </h2>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {!isApproved 
                      ? 'Your restaurant is currently unverified. You must complete the verification process to unlock access to operational features like Menu Management and Live Orders.'
                      : 'You must have an active subscription or trial to access operational features.'}
                  </p>
                  <Button 
                    onClick={() => navigate(!isApproved ? "/dashboard/verification" : "/dashboard/settings")} 
                    className="rounded-xl font-bold px-8 py-3 bg-[#F97316] hover:bg-orange-600"
                  >
                    {!isApproved ? 'Go to Verification Center' : 'Go to Billing'}
                  </Button>
                </div>
              } />
            )}
          </Routes>
        </div>
      </main>

      {/* Mobile Preview Modal */}
      {restaurant?.slug && (
        <MobilePreview 
          isOpen={showMobilePreview} 
          onClose={() => setShowMobilePreview(false)} 
          restaurantSlug={restaurant.slug} 
        />
      )}
    </div>
  );
};

export default RestaurantDashboard;
