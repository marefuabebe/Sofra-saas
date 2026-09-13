import { useState, useEffect, useMemo } from "react";
import { Loading } from "../../components/ui";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import {
  CreditCard,
  Check,
  AlertCircle,
  ShieldCheck,
  Download,
  Sparkles,
  Zap,
  Building,
  RefreshCw,
  Receipt,
  FileText,
  ArrowUpRight,
  HelpCircle,
  ChevronDown,
  Lock
} from "lucide-react";
import toast from "react-hot-toast";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  isPopular?: boolean;
  features: PlanFeature[];
}

const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 500,
    annualPrice: 400,
    description: "Ideal for small cafes, kiosks, and emerging food spots.",
    features: [
      { text: "Digital QR Menu", included: true },
      { text: "Up to 500 orders / month", included: true },
      { text: "Standard Sales Reports", included: true },
      { text: "Email Support (48hr response)", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 1000,
    annualPrice: 800,
    description: "Perfect for busy dine-in restaurants, bistros, and bustling bars.",
    isPopular: true,
    features: [
      { text: "Everything in Starter included", included: true },
      { text: "Up to 1,000 orders / month", included: true },
      { text: "Digital Table QR Self-Ordering", included: true },
      { text: "Custom Brand Colors & Themes", included: true },
      { text: "Table QR Stand PDF Generator", included: true },
      { text: "Priority Support (WhatsApp & Phone)", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 2500,
    annualPrice: 2000,
    description: "For high-volume restaurants, fine dining establishments, and hotels.",
    features: [
      { text: "Everything in Pro included", included: true },
      { text: "Unlimited monthly orders & dishes", included: true },
      { text: "Full Financial Reports & Peak-Hour Telemetry", included: true },
      { text: "Automated Data Ledger Exports (CSV, Excel, PDF)", included: true },
      { text: "High-Resolution Table QR PDF Stand Generator", included: true },
      { text: "Multi-Rail Payments (Telebirr, CBE Birr, Chapa, Cash)", included: true },
      { text: "Custom Storefront Branding & Color Themes", included: true },
      { text: "Priority VIP Phone & WhatsApp Support", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "Can I switch plans while my current plan is active?",
    a: "No. Your restaurant must complete its active billing cycle before switching to a different plan. Once your current plan finishes on its renewal date, you can freely switch to Starter, Pro, or Enterprise.",
  },
  {
    q: "Does SOFRA take a commission on my food sales?",
    a: "No! SOFRA charges 0% commission on orders. You keep 100% of your restaurant earnings. The subscription fee is your only platform cost.",
  },
  {
    q: "What payment methods are supported for billing in Ethiopia?",
    a: "We support Chapa, Telebirr, CBE Birr, Awash Bank, and international Visa/Mastercards with instant automated activation.",
  },
  {
    q: "What happens if my subscription expires?",
    a: "Your menu data and catalog remain completely safe. Your digital QR menu enters a grace period before requiring renewal to reopen diner self-ordering.",
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUALLY">("MONTHLY");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();

    const handleSubUpdate = () => {
      fetchInitialData();
    };

    socket.on("subscription:updated", handleSubUpdate);
    socket.on("payment:updated", handleSubUpdate);

    return () => {
      socket.off("subscription:updated", handleSubUpdate);
      socket.off("payment:updated", handleSubUpdate);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [userRes, invoicesRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/payments/subscriptions/invoices"),
      ]);

      if (userRes.status === "fulfilled" && userRes.value.data.success) {
        setUser(userRes.value.data.data);
      }

      if (invoicesRes.status === "fulfilled" && invoicesRes.value.data.success) {
        setInvoices(invoicesRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Error loading billing details:", err);
      toast.error("Failed to load billing information");
    } finally {
      setIsLoading(false);
    }
  };

  const sub = user?.subscription;
  const currentPlanId = (sub?.plan || "pro").toLowerCase();
  const isFreeTrial = currentPlanId === "free_trial";

  // Calculation of next renewal date
  const renewalDateInfo = useMemo(() => {
    const end = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date(Date.now() + 24 * 86400000);
    const now = new Date();
    const diffDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      formatted: end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      daysRemaining: diffDays,
    };
  }, [sub]);

  // Current plan is active & in progress if not expired/past_due/cancelled and end date is in the future
  const isCurrentPlanActive = useMemo(() => {
    if (!sub) return false;
    if (["EXPIRED", "PAST_DUE", "CANCELLED"].includes(sub.status)) return false;
    if (!sub.currentPeriodEnd) return false;
    return new Date(sub.currentPeriodEnd).getTime() > Date.now();
  }, [sub]);

  const handleChoosePlan = async (planId: string) => {
    if (!user?.subscription?._id) {
      toast.error("Subscription record not found.");
      return;
    }

    if (planId === currentPlanId && sub?.status === "ACTIVE") {
      toast("You are already active on this plan", { icon: "ℹ️" });
      return;
    }

    // RESTRICTION: Without finished current plan, the restaurant cannot switch plan.
    if (isCurrentPlanActive && planId !== currentPlanId) {
      toast.error(
        `Plan switch restricted: Your current ${sub?.plan?.toUpperCase() || "plan"} is active until ${renewalDateInfo.formatted}. You cannot switch plans until your current plan finishes.`,
        { icon: "🔒", duration: 5000 }
      );
      return;
    }

    setIsProcessing(planId);
    try {
      const returnUrl = window.location.origin + "/dashboard/billing?payment=success";
      const { data } = await api.post(`/payments/subscriptions/${user.subscription._id}/pay`, {
        returnUrl,
        plan: planId,
        billingCycle,
      });

      if (data.success && data.data && data.data.checkoutUrl) {
        toast.loading("Redirecting to secure payment checkout...");
        window.location.href = data.data.checkoutUrl;
      } else {
        toast.error("Failed to initialize payment. Missing checkout URL.");
        setIsProcessing(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initialize checkout.");
      setIsProcessing(null);
    }
  };

  const handleRefreshStatus = async () => {
    toast.loading("Verifying latest payment status...", { id: "refresh-status" });
    try {
      await api.post("/payments/subscriptions/verify-pending");
      await fetchInitialData();
      toast.success("Subscription status up-to-date!", { id: "refresh-status" });
    } catch (e) {
      await fetchInitialData();
      toast.success("Subscription refreshed", { id: "refresh-status" });
    }
  };

  // Export receipt as formatted file
  const downloadReceipt = (inv: any) => {
    const content = [
      `SOFRA RESTAURANT PLATFORM INVOICE`,
      `-----------------------------------------`,
      `Invoice Ref: ${inv.transactionReference || inv._id}`,
      `Date: ${new Date(inv.createdAt).toLocaleString()}`,
      `Plan: ${inv.targetPlan ? inv.targetPlan.toUpperCase() : "PRO PLAN"} (${inv.targetBillingCycle || "MONTHLY"})`,
      `Amount Paid: ${inv.amount || 1000} ${inv.currency || "ETB"}`,
      `Payment Method: ${inv.provider || "CHAPA / TELEBIRR"}`,
      `Status: ${inv.status || "COMPLETED"}`,
      `Tenant: ${user?.restaurantName || "Restaurant Partner"}`,
      `-----------------------------------------`,
      `Thank you for powering your restaurant with SOFRA.`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sofra-invoice-${inv.transactionReference || "receipt"}.txt`;
    a.click();
    toast.success("Invoice receipt downloaded");
  };

  if (isLoading) {
    return <Loading text="Loading billing records, plans, and invoices..." />;
  }

  return (
    <div className="space-y-8 pb-20 w-full">
      {/* ─── Header & Telemetry Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Billing & Subscriptions
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{sub?.status === "ACTIVE" || sub?.status === "TRIAL" ? "Account Active" : "Action Required"}</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your restaurant tier, payment cycle, invoices, and platform quotas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefreshStatus}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-all active:scale-95"
            title="Refresh payment and subscription status"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Verify Status</span>
          </button>
        </div>
      </div>

      {/* ─── Active Subscription Command Hub (Replaces the big empty box!) ─── */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          {/* Left: Active Tier Badge & Meta */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-wider">
                  Current Active Subscription
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    sub?.status === "ACTIVE" || sub?.status === "TRIAL"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {sub?.status || "ACTIVE"}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                  {isFreeTrial ? "Free Trial" : `${sub?.plan?.toUpperCase() || "PRO"} Tier`}
                </h2>
                <span className="text-sm font-bold text-gray-500">
                  • {sub?.billingCycle === "ANNUALLY" ? "Annual Billing" : "Monthly Billing"}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {sub?.status === "EXPIRED" ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Subscription has expired. Renew your plan to unlock restaurant self-ordering.
                  </span>
                ) : (
                  <span>
                    Your next renewal date is <strong className="text-gray-800">{renewalDateInfo.formatted}</strong> ({renewalDateInfo.daysRemaining} days remaining).
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Price & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Recurring Rate
              </div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                {currentPlanId === "starter" ? "500" : currentPlanId === "enterprise" ? "2,500" : "1,000"}{" "}
                <span className="text-xs font-bold text-gray-500">ETB / month</span>
              </div>
              <div className="text-[11px] text-gray-400">0% transaction commission</div>
            </div>

            <button
              onClick={() => {
                if (isCurrentPlanActive) {
                  toast(`Your current ${sub?.plan?.toUpperCase() || "plan"} is active until ${renewalDateInfo.formatted}. Plan switching unlocks after your active period finishes.`, {
                    icon: "🔒",
                    duration: 4000,
                  });
                }
                const target = document.getElementById("pricing-plans");
                target?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                isCurrentPlanActive
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
              }`}
            >
              {isCurrentPlanActive ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Switch Plan (Locked)</span>
                </>
              ) : (
                <>
                  <span>Change Plan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Live Platform Usage Quotas */}
        <div>
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
            Plan Feature Entitlements & Capacity
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Orders Quota */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600">Monthly Orders Capacity</span>
                <span className="font-extrabold text-emerald-700">
                  {currentPlanId === "starter"
                    ? "3 / 500 orders"
                    : currentPlanId === "pro"
                    ? "3 / 1,000 orders"
                    : "Unlimited Orders"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: currentPlanId === "starter" ? "2%" : currentPlanId === "pro" ? "1%" : "100%",
                  }}
                />
              </div>
              <div className="text-[11px] text-gray-400">
                {currentPlanId === "enterprise"
                  ? "No caps on diner tickets"
                  : "Resets at next billing cycle"}
              </div>
            </div>

            {/* Menu Dish Quota */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600">Digital Menu Items</span>
                <span className="font-extrabold text-orange-600">Unlimited Catalog</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full w-full" />
              </div>
              <div className="text-[11px] text-gray-400">Portion pricing, chef badges, 86 toggles</div>
            </div>

            {/* Storefront Branding Quota */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600">Storefront Branding</span>
                <span className="font-extrabold text-indigo-700">
                  {currentPlanId === "starter" ? "Default SOFRA Theme" : "Custom Themes & Styling"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: currentPlanId === "starter" ? "33%" : "100%" }}
                />
              </div>
              <div className="text-[11px] text-gray-400">
                {currentPlanId === "starter" ? "Upgrade to Pro for custom palette & banners" : "Custom accent colors & banners active"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Billing Cycle Toggle (Monthly vs Annual with 20% Discount) ─── */}
      <div id="pricing-plans" className="pt-2 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Flexible Plans — Zero Commission on Restaurant Orders</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Select Your Growth Plan
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
          Scale your restaurant operations effortlessly. Upgrade, downgrade, or switch billing cycles anytime.
        </p>

        {/* Switcher */}
        <div className="inline-flex items-center gap-3 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs mt-4">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-white text-gray-900 shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("ANNUALLY")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              billingCycle === "ANNUALLY"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Annual Billing</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                billingCycle === "ANNUALLY" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              SAVE 20%
            </span>
          </button>
        </div>

        {/* Plan Switch Restriction Notice */}
        {isCurrentPlanActive && (
          <div className="max-w-2xl mx-auto mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-950">Plan Switch Restricted</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Active Period in Progress
                </span>
              </div>
              <p className="text-amber-800 mt-1 leading-relaxed">
                Your restaurant is currently subscribed to the <strong className="font-bold text-amber-950">{sub?.plan?.toUpperCase()}</strong> plan until <strong className="font-bold text-amber-950">{renewalDateInfo.formatted}</strong> ({renewalDateInfo.daysRemaining} days remaining). In accordance with platform policy, you cannot switch plans until your current billing period finishes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3 Tier Cards (Upgraded with Active Awareness & Highlights) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const displayPrice = billingCycle === "ANNUALLY" ? plan.annualPrice : plan.monthlyPrice;
          const isSwitchRestricted = isCurrentPlanActive && !isCurrent;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-200 border-2 ${
                isCurrent
                  ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg"
                  : isSwitchRestricted
                  ? "border-gray-200 bg-gray-50/50 shadow-xs"
                  : plan.isPopular
                  ? "border-orange-500 shadow-xl shadow-orange-500/10 scale-100 lg:scale-105 z-10"
                  : "border-gray-200/90 hover:border-gray-300 shadow-xs"
              }`}
            >
              {/* Badges */}
              {isCurrent ? (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Current Active Plan
                  </span>
                </div>
              ) : isSwitchRestricted ? (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-xs flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Locked Until Plan Finishes
                  </span>
                </div>
              ) : plan.isPopular ? (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              ) : null}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                  </div>
                  {plan.id === "enterprise" && <Building className="w-5 h-5 text-indigo-500" />}
                  {plan.id === "pro" && <Zap className="w-5 h-5 text-orange-500" />}
                  {plan.id === "starter" && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                </div>

                <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>

                {/* Price */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-gray-500">ETB / month</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {billingCycle === "ANNUALLY" ? (
                      <span className="text-emerald-700 font-bold">
                        Billed annually ({(displayPrice * 12).toLocaleString()} ETB/year)
                      </span>
                    ) : (
                      "Billed monthly • Cancel anytime"
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 mt-6 mb-8 text-xs">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 ${feat.included ? "text-gray-700 font-medium" : "text-gray-400 opacity-60"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          feat.included ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {feat.included ? <Check className="w-2.5 h-2.5" /> : <span className="text-[9px]">✕</span>}
                      </div>
                      <span className={feat.included ? "font-bold text-gray-800" : ""}>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleChoosePlan(plan.id)}
                disabled={isProcessing !== null || isCurrent}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-85 ${
                  isCurrent
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default"
                    : isSwitchRestricted
                    ? "bg-gray-100 hover:bg-amber-50/70 text-gray-500 hover:text-amber-900 border border-gray-200 hover:border-amber-300 cursor-pointer"
                    : plan.isPopular
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 cursor-pointer"
                    : "bg-gray-900 hover:bg-gray-800 text-white cursor-pointer"
                }`}
                title={
                  isSwitchRestricted
                    ? `Plan switch locked until current plan finishes on ${renewalDateInfo.formatted}`
                    : undefined
                }
              >
                {isProcessing === plan.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Connecting Checkout...</span>
                  </>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Active Plan
                  </span>
                ) : isSwitchRestricted ? (
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Locked until current plan finishes</span>
                  </span>
                ) : sub?.status === "EXPIRED" && sub?.plan === plan.id ? (
                  `Renew ${plan.name}`
                ) : plan.monthlyPrice < (PLANS.find((p) => p.id === currentPlanId)?.monthlyPrice || 1000) ? (
                  `Switch to ${plan.name}`
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Payment Rails & Trust Banner ─── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-gray-900">Supported Ethiopian & Global Payment Rails</h4>
            <p className="text-[11px] text-gray-500">
              Instant automated activation via Chapa, Telebirr, CBE Birr, and Visa/Mastercard.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-600">
          <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">📱 Telebirr</span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">🏦 CBE Birr</span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">💳 Chapa</span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">🌍 Visa / Mastercard</span>
        </div>
      </div>

      {/* ─── Invoices & Billing History Ledger ─── */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-500" />
              <span>Billing History & Invoices</span>
            </h3>
            <p className="text-xs text-gray-400">Download official receipts and tax invoices for accounting.</p>
          </div>
          <span className="text-xs font-bold text-gray-500">{invoices.length} Statements</span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-bold text-gray-700">No Past Invoices Recorded Yet</div>
            <p className="text-gray-400 max-w-sm mx-auto mt-1">
              Your official tax receipts and renewal invoices will appear here automatically upon subscription renewal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Invoice Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Plan & Cycle</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-800">
                      {inv.transactionReference || inv._id?.slice(-8)}
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-medium">
                      {new Date(inv.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-gray-900 capitalize">
                      {inv.targetPlan || "Pro"} ({inv.targetBillingCycle || "Monthly"})
                    </td>
                    <td className="py-3 px-3 text-right font-black text-gray-900">
                      {inv.amount?.toLocaleString()} {inv.currency || "ETB"}
                    </td>
                    <td className="py-3 px-3 text-gray-600 uppercase text-[11px]">
                      {inv.provider || "CHAPA"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                          inv.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inv.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => downloadReceipt(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 text-[11px] font-bold transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Frequently Asked Questions Accordion ─── */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-extrabold text-gray-900">Billing & Subscription FAQs</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3.5">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-extrabold text-gray-800 hover:text-orange-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-500" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed pr-6 animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
