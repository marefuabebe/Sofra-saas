import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import { Link } from "react-router-dom";
import { Check, Heart, Tag, RefreshCw, ShieldCheck, Headset, TrendingUp, Coins, ChevronDown, ArrowRight, ChevronLeft, ChevronRight, Star , Store } from "lucide-react";
import { APP_CONFIG } from "../../config/config";
import { motion, AnimatePresence } from "framer-motion";

const FadeInUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const PricingPage: React.FC = () => {
    const [isAnnual, setIsAnnual] = useState(false);
  const [ordersPerDay, setOrdersPerDay] = useState(100);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "SOFRA has completely transformed how we take orders. It's fast, easy to use, and our customers love it!",
      name: "Rahul Verma",
      title: "Café Delhi Heights",
      initials: "RV",
      color: "bg-orange-100 text-orange-800"
    },
    {
      text: "The Pro plan is perfectly priced. The insights we get from the analytics helped us increase our weekend sales by 20%.",
      name: "Anjali Gupta",
      title: "The Spice Route",
      initials: "AG",
      color: "bg-green-100 text-green-800"
    },
    {
      text: "We run 5 locations and the Business plan gives us the control we need. Highly recommend the enterprise features.",
      name: "Michael Chen",
      title: "Dragon Wok",
      initials: "MC",
      color: "bg-blue-100 text-blue-800"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const faqs = [
    { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time from your dashboard." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards, UPI, and bank transfers for annual plans." },
    { q: "Is there a setup fee?", a: "No, there are absolutely no setup fees or hidden charges." },
    { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee if you're not fully satisfied." },
    { q: "Do I need technical skills to set this up?", a: "Not at all. SOFRA is designed to be intuitive and easy to use. Our onboarding team is also available to help you get started quickly." },
    { q: "Can I use SOFRA for multiple restaurant locations?", a: "Yes! Our Business plan supports multi-outlet management, allowing you to control menus, staff, and analytics across all your locations from a single dashboard." }
  ];

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900 overflow-x-hidden">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-12">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        
        <FadeInUp className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 bg-orange-50 text-orange-600 text-[11px] font-bold px-3 py-1 rounded-full mb-8">
             <Heart className="w-3.5 h-3.5 fill-orange-500" /> Fair. Simple. Transparent.
          </div>
          
          <h1 className="text-[3rem] md:text-[4rem] font-extrabold text-[#0F172A] leading-[1.1] tracking-tight mb-6">
            Transparent pricing for <br className="hidden md:block"/>
            <span className="relative text-[#F97316]">
              every
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10C60 4 180 2 298 8" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span> restaurant size.
          </h1>
          <p className="text-gray-500 text-[16px] max-w-xl mx-auto leading-relaxed mb-10 font-medium">
            Simple, predictable pricing. No hidden fees, no surprise charges.<br className="hidden md:block" />
            Choose the plan that fits your culinary ambition.
          </p>

          <div className="flex items-center justify-center gap-4 bg-white border border-gray-200 rounded-full p-1.5 w-max mx-auto shadow-sm mb-12">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all ${!isAnnual ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              MONTHLY
            </button>
            
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-[#F97316] transition-colors"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              ANNUALLY 
              <span className="text-[#F97316] bg-orange-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight">(SAVE 20%)</span>
            </button>
          </div>
        </FadeInUp>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────────────────────── */}
      <section className="pb-16 relative px-4">
        <FadeInUp className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative z-10 items-stretch">
          
          {/* Starter Plan */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 mb-1">Starter</h3>
                <p className="text-xs text-gray-500 font-medium min-h-[36px]">
                  Ideal for small cafes, kiosks, and emerging food spots.
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    {isAnnual ? "400" : "500"}
                  </span>
                  <span className="text-sm font-extrabold text-gray-400">ETB / month</span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium mt-1">
                  {isAnnual ? "Billed annually (4,800 ETB / yr)" : "Billed monthly • Cancel anytime"}
                </div>
              </div>

              <ul className="space-y-3.5 mb-8 border-t border-gray-100 pt-6">
                {[
                  "Digital QR Menu", 
                  "Up to 500 orders / month", 
                  "Standard Sales Reports", 
                  "Email Support (48hr response)"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-gray-700 font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="block text-center text-xs font-black px-4 sm:px-6 py-3.5 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors shadow-xs"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border-2 border-orange-500 shadow-2xl shadow-orange-500/10 flex flex-col justify-between relative transform md:-translate-y-3 hover:-translate-y-4 hover:shadow-2xl transition-all duration-300 z-10 ring-4 ring-orange-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md whitespace-nowrap">
              Most Popular
            </div>

            <div>
              <div className="mb-6 mt-1">
                <h3 className="text-2xl font-black text-gray-900 mb-1">Pro</h3>
                <p className="text-xs text-gray-500 font-medium min-h-[36px]">
                  Perfect for busy dine-in restaurants, bistros, and bustling bars.
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    {isAnnual ? "800" : "1,000"}
                  </span>
                  <span className="text-sm font-extrabold text-gray-400">ETB / month</span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium mt-1">
                  {isAnnual ? "Billed annually (9,600 ETB / yr)" : "Billed monthly • Cancel anytime"}
                </div>
              </div>

              <ul className="space-y-3.5 mb-8 border-t border-gray-100 pt-6">
                {[
                  "Everything in Starter included",
                  "Up to 1,000 orders / month",
                  "Digital Table QR Self-Ordering",
                  "Custom Brand Colors & Themes",
                  "Table QR Stand PDF Generator",
                  "Priority Support (WhatsApp & Phone)"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-gray-800 font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="block text-center text-xs font-black px-4 sm:px-6 py-3.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25 active:scale-95"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-white relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Enterprise
            </div>

            <div>
              <div className="mb-6 mt-1">
                <h3 className="text-2xl font-black text-white mb-1">Enterprise</h3>
                <p className="text-xs text-slate-400 font-medium min-h-[36px]">
                  For high-volume restaurants, fine dining establishments, and hotels.
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {isAnnual ? "2,000" : "2,500"}
                  </span>
                  <span className="text-sm font-extrabold text-slate-400">ETB / month</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  {isAnnual ? "Billed annually (24,000 ETB / yr)" : "Billed monthly • Cancel anytime"}
                </div>
              </div>

              <ul className="space-y-3 mb-8 border-t border-slate-800 pt-6">
                {[
                  "Everything in Pro included",
                  "Unlimited monthly orders & dishes",
                  "Full Financial Reports & Peak-Hour Telemetry",
                  "Automated Data Ledger Exports (CSV, Excel, PDF)",
                  "High-Resolution Table QR PDF Stand Generator",
                  "Multi-Rail Payments (Telebirr, CBE Birr, Chapa, Cash)",
                  "Custom Storefront Branding & Color Themes",
                  "Priority VIP Phone & WhatsApp Support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-slate-200 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="block text-center text-xs font-black px-6 py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-md active:scale-95"
            >
              Get Started Enterprise
            </Link>
          </div>
        </FadeInUp>
      </section>

      {/* ── FOUR BADGES ROW ───────────────────────────────────────────────── */}
      <section className="pb-24 px-2 md:px-4">
        <div className="max-w-5xl mx-auto border border-gray-100 rounded-3xl p-4 md:p-8 bg-white shadow-sm flex items-center justify-between gap-2 md:gap-6 w-full">
          <div className="flex flex-col xl:flex-row items-center text-center xl:text-left gap-2 md:gap-4 flex-1">
            <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border border-gray-100 rounded-xl shrink-0"><Tag className="w-4 h-4 md:w-6 md:h-6 text-orange-500" strokeWidth={2}/></div>
            <div>
              <div className="font-extrabold text-[9px] md:text-[13px] text-gray-900 leading-tight">No hidden fees</div>
              <div className="text-[8px] md:text-[11px] text-gray-500 font-medium hidden sm:block">What you see is what you pay.</div>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100 shrink-0 hidden md:block self-center"></div>
          <div className="flex flex-col xl:flex-row items-center text-center xl:text-left gap-2 md:gap-4 flex-1">
            <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border border-gray-100 rounded-xl shrink-0"><RefreshCw className="w-4 h-4 md:w-6 md:h-6 text-orange-500" strokeWidth={2}/></div>
            <div>
              <div className="font-extrabold text-[9px] md:text-[13px] text-gray-900 leading-tight">Cancel anytime</div>
              <div className="text-[8px] md:text-[11px] text-gray-500 font-medium hidden sm:block">No lock-ins. No commitments.</div>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100 shrink-0 hidden md:block self-center"></div>
          <div className="flex flex-col xl:flex-row items-center text-center xl:text-left gap-2 md:gap-4 flex-1">
            <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border border-gray-100 rounded-xl shrink-0"><ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-orange-500" strokeWidth={2}/></div>
            <div>
              <div className="font-extrabold text-[9px] md:text-[13px] text-gray-900 leading-tight">100% secure</div>
              <div className="text-[8px] md:text-[11px] text-gray-500 font-medium hidden sm:block">Your data is safe with us.</div>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100 shrink-0 hidden md:block self-center"></div>
          <div className="flex flex-col xl:flex-row items-center text-center xl:text-left gap-2 md:gap-4 flex-1">
            <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border border-gray-100 rounded-xl shrink-0"><Headset className="w-4 h-4 md:w-6 md:h-6 text-orange-500" strokeWidth={2}/></div>
            <div>
              <div className="font-extrabold text-[9px] md:text-[13px] text-gray-900 leading-tight">24/7 support</div>
              <div className="text-[8px] md:text-[11px] text-gray-500 font-medium hidden sm:block">We're here whenever you need us.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARE PLANS (REDESIGNED AS FEATURE GROUPS) ────────────────── */}
      <section className="pb-24 px-4 bg-white">
        <FadeInUp className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Everything you get</h2>
            <p className="text-gray-500 font-medium">A deep dive into our platform's capabilities across all plans.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Starter Features */}
            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100 flex flex-col justify-start">
               <div className="flex items-center gap-3 mb-4 sm:mb-6">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100 shrink-0"><Store className="w-5 h-5 text-gray-700"/></div>
                 <h3 className="text-lg sm:text-xl font-bold text-gray-900">Starter Core</h3>
               </div>
               <div className="space-y-4 sm:space-y-6 flex-1">
                 <div>
                   <ul className="space-y-2.5 sm:space-y-3 mt-2 sm:mt-4">
                     {["Digital QR Menu", "Up to 500 orders / month", "Standard Sales Reports", "Email Support (48hr response)"].map(f => (
                       <li key={f} className="flex items-start gap-2 sm:gap-2.5">
                         <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={3}/>
                         <span className="text-xs sm:text-[13px] font-semibold text-gray-700">{f}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>

            {/* Pro Features */}
            <div className="bg-orange-50/50 rounded-3xl p-6 sm:p-8 border-2 border-orange-200 relative flex flex-col justify-start">
               <div className="absolute top-0 right-4 sm:right-8 -translate-y-1/2 bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-sm">Popular</div>
               <div className="flex items-center gap-3 mb-4 sm:mb-6">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-orange-100 shrink-0"><TrendingUp className="w-5 h-5 text-orange-500"/></div>
                 <h3 className="text-lg sm:text-xl font-bold text-gray-900">Pro Features</h3>
               </div>
               <p className="text-[11px] sm:text-[12px] font-bold text-orange-600 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-orange-200/50">Everything in Starter, plus:</p>
               <div className="space-y-4 sm:space-y-6 flex-1">
                 <div>
                   <ul className="space-y-2.5 sm:space-y-3 mt-2 sm:mt-4">
                     {[
                       "Up to 1,000 orders / month",
                       "Digital Table QR Self-Ordering",
                       "Custom Brand Colors & Themes",
                       "Table QR Stand PDF Generator",
                       "Priority Support (WhatsApp & Phone)"
                     ].map(f => (
                       <li key={f} className="flex items-start gap-2 sm:gap-2.5">
                         <Check className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" strokeWidth={3}/>
                         <span className="text-xs sm:text-[13px] font-semibold text-gray-800">{f}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>

            {/* Enterprise Features */}
            <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-800 text-white shadow-xl col-span-2 lg:col-span-1">
               <div className="flex items-center gap-3 mb-4 sm:mb-6">
                 <div className="w-10 h-10 bg-gray-800 rounded-xl shadow-sm flex items-center justify-center border border-gray-700 shrink-0"><ShieldCheck className="w-5 h-5 text-white"/></div>
                 <h3 className="text-lg sm:text-xl font-bold text-white">Enterprise Suite</h3>
               </div>
               <p className="text-[11px] sm:text-[12px] font-bold text-gray-400 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-800">Everything in Pro, plus:</p>
               <div className="space-y-4 sm:space-y-6">
                 <div>
                   <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                     {[
                       "Unlimited monthly orders & dishes",
                       "Full Financial Reports & Peak-Hour Telemetry",
                       "Automated Data Ledger Exports (CSV, Excel, PDF)",
                       "Multi-Rail Payments (Telebirr, CBE Birr, Chapa, Cash)",
                       "Priority VIP Phone & WhatsApp Support",
                     ].map(f => (
                       <li key={f} className="flex items-start gap-2 sm:gap-2.5">
                         <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" strokeWidth={3}/>
                         <span className="text-xs sm:text-[13px] font-semibold text-gray-200">{f}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── UNIQUE ROI CALCULATOR SECTION ─────────────────────────────────── */}
      <section className="pb-24 px-4">
        <FadeInUp className="max-w-6xl mx-auto">
          <div className="bg-[#0F172A] rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-2xl border border-gray-800">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-6 border border-white/10">
                   <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> ROI Calculator
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                  Stop paying <span className="text-orange-400">hefty commissions</span> to aggregators.
                </h2>
                <p className="text-gray-400 text-[15px] font-medium leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  Third-party delivery apps take up to 30% of your revenue. See how much you could save every month by shifting dine-in and pickup orders to SOFRA.
                </p>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto lg:mx-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white text-[13px] font-bold">Daily Orders Shifted</span>
                    <span className="text-orange-400 font-black text-xl">{ordersPerDay}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    step="10"
                    value={ordersPerDay} 
                    onChange={(e) => setOrdersPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1">
                    <span>10</span>
                    <span>500+</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-[400px] shrink-0">
                <div className="bg-white rounded-3xl p-8 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative">
                  <div className="absolute -top-4 -right-4 bg-green-500 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg transform rotate-6">
                    IT PAYS FOR ITSELF!
                  </div>
                  <div className="text-center">
                    <div className="text-[13px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Estimated Monthly Savings</div>
                    <div className="text-[4rem] font-black text-gray-900 leading-none tracking-tighter mb-4">
                      {APP_CONFIG.defaultCurrency}{(ordersPerDay * 400 * 0.25 * 30).toLocaleString()}
                    </div>
                    <p className="text-[12px] text-gray-500 font-medium leading-relaxed mb-6">
                      Based on an average order value of 400 ETB and a typical 25% aggregator commission.
                    </p>
                    <Link to="/register" className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
                      Start saving today <ArrowRight className="w-4 h-4"/>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── 3 COLUMN METRICS & TESTIMONIALS ─────────────────────────────────── */}
      <section className="pb-24 px-4">
        <FadeInUp className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
            <h2 className="text-[22px] font-extrabold text-gray-900 mb-8 leading-tight">
              Why restaurants<br/>love SOFRA
              <div className="w-8 h-1 bg-orange-500 mt-3 rounded-full"></div>
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-green-500" /></div>
                <div>
                  <div className="text-[13px] font-bold text-gray-900 mb-1">Boost Efficiency</div>
                  <div className="text-[11px] text-gray-500 leading-relaxed font-medium">Streamline operations and serve more customers with less effort.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0"><Coins className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <div className="text-[13px] font-bold text-gray-900 mb-1">Increase Revenue</div>
                  <div className="text-[11px] text-gray-500 leading-relaxed font-medium">Smart insights help you upsell, cross-sell and grow sales.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0"><Heart className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <div className="text-[13px] font-bold text-gray-900 mb-1">Delight Customers</div>
                  <div className="text-[11px] text-gray-500 leading-relaxed font-medium">Fast ordering, accurate service, happy customers—always.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden h-[500px] md:h-auto group">
            <img src="/images/avatar_arjun.jpg" alt="Restaurant Team" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{objectPosition: 'center'}} />
            {/* The image in the design looks like 2 people, using avatar_arjun as placeholder or any image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-40">
              <div className="text-[10px] text-gray-500 font-bold mb-1">Today's Orders</div>
              <div className="flex items-end justify-between">
                <div className="text-xl font-black text-gray-900">128</div>
                <div className="text-[9px] font-bold text-green-500 flex items-center mb-1">↑ 18%</div>
              </div>
              <div className="text-[9px] text-gray-400 mt-1">vs yesterday</div>
            </div>

            <div className="absolute bottom-1/2 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-44 translate-y-8">
              <div className="text-[10px] text-gray-500 font-bold mb-1">Revenue</div>
              <div className="text-2xl font-black text-gray-900 mb-1">24,560 ETB</div>
              <div className="text-[9px] flex items-center gap-1"><span className="text-green-500 font-bold flex items-center">↑ 24%</span> <span className="text-gray-400">vs yesterday</span></div>
            </div>

            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-32">
              <div className="text-[10px] text-gray-500 font-bold mb-1">Active Tables</div>
              <div className="text-xl font-black text-gray-900 mb-1">10</div>
              <div className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live now
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
            <h2 className="text-[22px] font-extrabold text-gray-900 mb-8 leading-tight">
              What restaurant<br/>owners say
              <div className="w-8 h-1 bg-orange-500 mt-3 rounded-full"></div>
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6 flex-1 flex flex-col justify-between relative hover:-translate-y-1 transition-transform overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500"/>)}
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-relaxed mb-6 h-[80px]">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${testimonials[currentTestimonial].color}`}>
                      {testimonials[currentTestimonial].initials}
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-900">{testimonials[currentTestimonial].name}</div>
                      <div className="text-[10px] font-medium text-gray-500">{testimonials[currentTestimonial].title}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between px-2">
               <div className="flex gap-1.5">
                 {testimonials.map((_, i) => (
                   <button 
                     key={i}
                     onClick={() => setCurrentTestimonial(i)}
                     className={`w-1.5 h-1.5 rounded-full transition-colors ${currentTestimonial === i ? 'bg-orange-500' : 'bg-gray-300 hover:bg-gray-400'}`}
                     aria-label={`Go to testimonial ${i + 1}`}
                   />
                 ))}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                   className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                   aria-label="Previous testimonial"
                 >
                   <ChevronLeft className="w-3 h-3"/>
                 </button>
                 <button 
                   onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                   className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                   aria-label="Next testimonial"
                 >
                   <ChevronRight className="w-3 h-3"/>
                 </button>
               </div>
            </div>
          </div>
          
        </FadeInUp>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="pb-24 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-xl sm:rounded-2xl bg-white shadow-sm overflow-hidden h-max">
              <button 
                className="w-full flex items-center justify-between p-3.5 sm:p-5 text-left focus:outline-none hover:bg-gray-50 transition-colors gap-2"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-orange-500' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div 
                    initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}}
                    className="overflow-hidden"
                  >
                    <p className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 text-[11px] sm:text-[12px] text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-2.5 sm:pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="pb-24 px-4 max-w-6xl mx-auto">
        <div className="bg-[#FFF8F4] rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden border border-orange-100">
          <div className="absolute top-4 right-10 w-8 h-8 opacity-20">
             <Star className="w-full h-full text-orange-400 fill-orange-400" />
          </div>
          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-[#F97316] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">Ready to take your restaurant to the next level?</h2>
              <p className="text-[13px] text-gray-500 font-medium">Join 50+ restaurants already growing with SOFRA.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto shrink-0">
            <Link to="/register" className="inline-flex items-center justify-center bg-[#F97316] text-white font-bold px-6 py-3 rounded-full hover:bg-orange-600 transition-colors text-[13px]">
              Start Free Trial <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
            <a href="/demo" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-full hover:bg-white transition-colors text-[13px] bg-white/50">
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center shadow-sm">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-extrabold text-[#F97316] tracking-tight">{APP_CONFIG.appName}</span>
              </Link>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium mb-6">
                The seamless QR ordering system for modern restaurants.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: "Features", href: "/features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "How it Works", href: "/how-it-works" },
                { label: "Contact", href: "/contact" },
                  { label: "Updates", href: "#" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Company</h4>
              <ul className="space-y-3">
                {["About Us", "Blog", "Careers", "Contact"].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-gray-500 font-medium">© {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
