import React from "react";
import Navbar from "../../components/ui/Navbar";
import { Link } from "react-router-dom";
import { Check, CheckCircle2, Play, TrendingUp, PieChart, Bell, CreditCard, Users, Smartphone, ArrowRight, RefreshCw, Headset, ShoppingBag, UtensilsCrossed, QrCode, Sparkles , Store, Heart } from "lucide-react";
import { APP_CONFIG } from "../../config/config";
import { motion } from "framer-motion";

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

const HowItWorksPage: React.FC = () => {
  
  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative bg-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] z-0 mask-image-[radial-gradient(ellipse_at_center,black,transparent_80%)]" style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'}}></div>
        
        {/* Subtle warm radial glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-100/60 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
          <FadeInUp className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-orange-50/80 text-orange-500 text-[12px] font-bold px-4 py-1.5 rounded-full mb-6">
              Simple <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Fast <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Powerful
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.08] mb-6">
              How SOFRA<br/><span className="text-orange-500">Works</span>
            </h1>
            <p className="text-gray-500 text-[15px] max-w-md mx-auto lg:mx-0 leading-relaxed mb-10">
              Get started in minutes and streamline your restaurant operations like never before.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link to="/register" className="w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg">
                Start Free Trial <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link to="/demo" className="w-full sm:w-auto bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold text-sm px-8 py-3.5 rounded-full flex items-center justify-center transition-all">
                Book a Demo
              </Link>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-2.5">
                <img src="/images/avatar_rahul.jpg" className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=AJ&background=F97316&color=fff"; }} />
                <img src="/images/avatar_rahul.jpg" className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=RV&background=22C55E&color=fff"; }} style={{ filter: 'hue-rotate(90deg)' }} />
                <img src="/images/avatar_rahul.jpg" className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=SM&background=3B82F6&color=fff"; }} style={{ filter: 'hue-rotate(180deg)' }} />
              </div>
              <div className="text-[12px] font-semibold text-gray-600">Loved by <span className="text-orange-500 font-bold">50+</span> restaurants worldwide</div>
            </div>
          </FadeInUp>
          
          <FadeInUp className="flex-1 w-full relative" delay={0.2}>
            <div className="relative w-full max-w-[520px] mx-auto flex items-center justify-center" style={{minHeight: '420px'}}>
              {/* Perfect SVG Orbit Arc */}
              <div className="absolute top-[15%] left-[5%] right-[5%] bottom-[25%] z-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
                  <path d="M 20 200 A 180 180 0 0 1 380 200" fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="8 8" />
                </svg>
              </div>

              {/* Sparkles */}
              <Sparkles className="absolute top-[30%] -left-10 w-4 h-4 text-orange-200 fill-orange-200 z-0"/>
              <Sparkles className="absolute top-[50%] -right-10 w-5 h-5 text-orange-200 fill-orange-200 z-0"/>

              {/* Center restaurant illustration */}
              <img src="/images/restaurant_storefront.jpg" alt="SOFRA Restaurant" className="relative z-10 w-[380px] h-[380px] object-contain drop-shadow-2xl mt-10 mix-blend-multiply" />
              
              {/* Floating feature badges around the orbit */}
              {/* Top — QR Ordering */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-2 z-20 border border-gray-50 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><QrCode className="w-6 h-6"/></div>
                <span className="text-[10px] font-bold text-gray-900 whitespace-nowrap">QR Ordering</span>
              </div>
              
              {/* Middle-left — Smart Analytics */}
              <div className="absolute top-[30%] -left-6 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-2 z-20 border border-gray-50 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6"/></div>
                <span className="text-[10px] font-bold text-gray-900 whitespace-nowrap">Smart Analytics</span>
              </div>

              {/* Middle-right — Real-time Alerts */}
              <div className="absolute top-[30%] -right-6 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-2 z-20 border border-gray-50 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6"/></div>
                <span className="text-[10px] font-bold text-gray-900 whitespace-nowrap">Real-time Alerts</span>
              </div>

              {/* Bottom-left — Secure Payments */}
              <div className="absolute bottom-[5%] -left-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-2 z-20 border border-gray-50 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6"/></div>
                <span className="text-[10px] font-bold text-gray-900 whitespace-nowrap">Secure Payments</span>
              </div>

              {/* Bottom-right — Happy Customers */}
              <div className="absolute bottom-[5%] -right-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-2 z-20 border border-gray-50 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><Users className="w-6 h-6"/></div>
                <span className="text-[10px] font-bold text-gray-900 whitespace-nowrap">Happy Customers</span>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── 1. GET STARTED IN 5 EASY STEPS (Alternating Timeline) ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <FadeInUp className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">1. Get Started in <span className="text-orange-500">5 Easy Steps</span></h2>
            <p className="text-[15px] text-gray-500 font-medium max-w-xl mx-auto">From setup to serving – we've made the transition to digital ordering incredibly seamless.</p>
          </div>

          <div className="relative">
            {/* Center vertical dashed line (Desktop) */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-orange-200"></div>

            <div className="grid grid-cols-2 lg:block gap-3 sm:gap-6 lg:gap-0 lg:space-y-0">
              {[
                { step: 1, title: "Create Account", desc: "Sign up in seconds and set up your restaurant profile. No credit card required.", icon: <Store className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />, bg: "bg-orange-50" },
                { step: 2, title: "Add Your Menu", desc: "Upload your menu, set prices, and customize categories with beautiful photos.", icon: <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />, bg: "bg-green-50" },
                { step: 3, title: "Enable QR Ordering", desc: "Generate your unique QR codes and place them instantly on every table.", icon: <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />, bg: "bg-blue-50" },
                { step: 4, title: "Receive Orders", desc: "Orders appear instantly on your live dashboard and get sent straight to the kitchen.", icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />, bg: "bg-purple-50" },
                { step: 5, title: "Serve & Grow", desc: "Deliver fast service, track real-time performance, and grow your revenue.", icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />, bg: "bg-emerald-50" },
              ].map((item, i) => (
                <FadeInUp key={i} delay={i * 0.15} className={`flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''} ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  
                  {/* Desktop offset (empty space for the other side) */}
                  <div className="hidden lg:block w-1/2"></div>
                  
                  {/* Central Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center w-12 h-12 bg-white rounded-full border-4 border-orange-100 z-10 shadow-lg group-hover:border-orange-500 transition-colors">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  </div>

                  {/* Content Card */}
                  <div className={`w-full h-full lg:w-1/2 flex ${i % 2 !== 0 ? 'lg:justify-start' : 'lg:justify-end'}`}>
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all w-full max-w-md relative group overflow-hidden flex flex-col justify-between">
                      {/* Giant faded step number */}
                      <div className="absolute -right-3 -bottom-5 sm:-right-6 sm:-bottom-8 text-[60px] sm:text-[90px] lg:text-[120px] font-black text-gray-50 opacity-50 group-hover:scale-110 group-hover:text-orange-50/50 transition-all pointer-events-none">
                        {item.step}
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 mb-2.5 sm:mb-4">
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center shadow-sm shrink-0`}>
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5 sm:mb-1">Step {item.step}</div>
                            <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 leading-tight">{item.title}</h3>
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-[13px] text-gray-500 leading-relaxed sm:pl-[72px]">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeInUp>
              ))}
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── 2. SEE IT IN ACTION ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FFF9F5] overflow-hidden">
        <FadeInUp className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 max-w-md">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              2 . SOFRA in Real-Time
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              See It in <span className="text-orange-500 underline decoration-orange-200 decoration-4 underline-offset-[10px]">Action</span>
            </h2>
            <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
              From a customer scanning the QR code to the order reaching your kitchen – everything happens in real-time.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                "Customer scans QR & places order",
                "Order appears instantly on dashboard",
                "Kitchen receives & prepares the order",
                "Customer gets notified when it's ready"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3}/>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-800">{text}</span>
                </li>
              ))}
            </ul>

            <button className="bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-600 font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 transition-colors shadow-sm hover:shadow-md">
              <Play className="w-4 h-4 fill-current"/> Watch Demo Video
            </button>
          </div>

          <div className="flex-[1.5] w-full relative">
            {/* Floating Order Toast */}
            <div className="absolute top-[15%] -left-8 lg:-left-12 z-20 bg-white rounded-2xl p-4 shadow-2xl border border-orange-100 w-60 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"><Bell className="w-3 h-3 text-white"/></div>
                <span className="text-[11px] font-extrabold text-gray-900">New Order Received</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-bold text-gray-900">Table 4</span>
                </div>
                <div className="text-[9px] text-gray-500 mb-3">2 items • 340 ETB</div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-700">
                    <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-[8px]">🍗</div> Paneer Tikka <span className="ml-auto text-gray-400">x1</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-700">
                    <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-[8px]">🍚</div> Biryani Bowl <span className="ml-auto text-gray-400">x1</span>
                  </div>
                </div>
                <button className="w-full bg-orange-500 text-white text-[10px] font-bold py-2 rounded-lg mb-2 hover:bg-orange-600 transition-colors">Accept Order</button>
                <div className="text-center text-[9px] text-green-600 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3"/> Kitchen Notified
                </div>
              </div>
            </div>

            {/* Dashboard Mockup (Pure CSS) */}
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden flex flex-col relative z-10 w-full max-h-[500px]">
              {/* Window chrome */}
              <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-0.5 rounded">Today, May 20</span>
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[9px] font-bold text-orange-600">A</div>
                </div>
              </div>
              {/* Dashboard Content */}
              <div className="flex-1 flex min-h-0">
                {/* Sidebar */}
                <div className="w-14 border-r border-gray-100 flex flex-col items-center py-4 space-y-5 shrink-0 bg-white">
                  <Store className="w-5 h-5 text-orange-500"/>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center"><PieChart className="w-4 h-4 text-orange-500"/></div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"><UtensilsCrossed className="w-4 h-4 text-gray-300"/></div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-gray-300"/></div>
                </div>
                {/* Main */}
                <div className="flex-1 p-5 flex flex-col gap-4 bg-gray-50/50 overflow-hidden">
                  <div className="font-bold text-[14px] text-gray-900">Dashboard</div>
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: "Orders", v: "128", p: "+ 18%", c: "text-green-500" },
                      { l: "Revenue", v: "24,560 ETB", p: "+ 24%", c: "text-green-500" },
                      { l: "Avg. Order Value", v: "192 ETB", p: "+ 12%", c: "text-green-500" },
                      { l: "Active Tables", v: "10", p: "Live now", c: "text-red-500" },
                    ].map((s,i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                        <div className="text-[9px] text-gray-500 font-semibold mb-1">{s.l}</div>
                        <div className="text-lg font-black text-gray-900 leading-tight">{s.v}</div>
                        <div className={`text-[8px] font-bold ${s.c} mt-0.5`}>{s.p}</div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom Row */}
                  <div className="flex gap-3 flex-1 min-h-0">
                    {/* Chart */}
                    <div className="flex-[2] bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[11px] font-bold text-gray-900">Orders Overview</div>
                        <div className="flex gap-1.5">
                          <span className="text-[8px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">72 Orders</span>
                        </div>
                      </div>
                      <div className="flex-1 relative flex items-end min-h-[80px]">
                        <svg className="w-full h-full" viewBox="0 0 120 50" preserveAspectRatio="none">
                           <path d="M0,42 L12,38 L24,40 L36,30 L48,33 L60,18 L72,22 L84,12 L96,16 L108,8 L120,22" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                           <path d="M0,42 L12,38 L24,40 L36,30 L48,33 L60,18 L72,22 L84,12 L96,16 L108,8 L120,22 L120,50 L0,50 Z" fill="url(#chartGrad)" stroke="none"/>
                           <defs>
                             <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                               <stop offset="0%" stopColor="#F97316" stopOpacity="0.25"/>
                               <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
                             </linearGradient>
                           </defs>
                        </svg>
                        {/* Tooltip */}
                        <div className="absolute top-[5%] left-[72%] bg-gray-900 text-white rounded-md px-2 py-1 flex flex-col items-center shadow-lg">
                          <span className="text-[8px] font-bold">72 Orders</span>
                          <span className="text-[7px] text-gray-400">12 PM</span>
                          <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-0.5"></div>
                        </div>
                        {/* Dot on chart */}
                        <div className="absolute top-[5%] left-[72%] w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow translate-x-[3px] translate-y-[18px]"></div>
                      </div>
                      <div className="flex justify-between text-[7px] text-gray-400 font-medium mt-2">
                        <span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span>
                      </div>
                    </div>
                    {/* Top Selling */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col">
                      <div className="text-[11px] font-bold text-gray-900 mb-3">Top Selling Items</div>
                      <div className="space-y-3 flex-1">
                        {[
                          { n: "Paneer Tikka", p: 128, e: "🍗" },
                          { n: "Biryani Bowl", p: 96, e: "🍚" },
                          { n: "Cold Coffee", p: 72, e: "☕" },
                          { n: "Margherita Pizza", p: 64, e: "🍕" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-[10px]">{item.e}</div>
                              <div className="text-[10px] font-semibold text-gray-700">{item.n}</div>
                            </div>
                            <div className="text-[10px] font-bold text-gray-900">{item.p}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── 3. EVERYTHING YOU NEED, ALL IN ONE PLACE (Premium Clean Grid) ──────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
        <FadeInUp className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Everything You Need, <span className="text-orange-500">All in One Place</span></h2>
            <p className="text-[16px] text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Powerful tools built specifically to run your restaurant operations smoothly and efficiently, without the clutter.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              { 
                title: "Digital Menu", 
                desc: "Showcase your menu with rich photos, exact pricing, and effortless categorization. Update availability in a single tap.", 
                icon: <Smartphone className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600"/>, 
                bg: "bg-orange-50",
                hoverBorder: "group-hover:border-orange-200"
              },
              { 
                title: "QR Ordering", 
                desc: "Contactless ordering that provides a seamless and modern dining experience for your guests straight from their table.", 
                icon: <QrCode className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600"/>, 
                bg: "bg-blue-50",
                hoverBorder: "group-hover:border-blue-200"
              },
              { 
                title: "Smart Analytics", 
                desc: "Track daily sales, discover top-selling items, and unlock actionable customer insights instantly on your dashboard.", 
                icon: <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600"/>, 
                bg: "bg-emerald-50",
                hoverBorder: "group-hover:border-emerald-200"
              },
              { 
                title: "Real-time Alerts", 
                desc: "Get instant notifications for new orders and important updates sent straight to the kitchen display.", 
                icon: <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-rose-600"/>, 
                bg: "bg-rose-50",
                hoverBorder: "group-hover:border-rose-200"
              },
              { 
                title: "Secure Payments", 
                desc: "Accept payments safely with multiple reliable options. Split bills and manage transactions effortlessly.", 
                icon: <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600"/>, 
                bg: "bg-purple-50",
                hoverBorder: "group-hover:border-purple-200"
              },
              { 
                title: "Multi-outlet", 
                desc: "Manage multiple locations, menus, and staff from a single, centralized, and powerful administrative dashboard.", 
                icon: <Store className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600"/>, 
                bg: "bg-indigo-50",
                hoverBorder: "group-hover:border-indigo-200"
              },
            ].map((item, i) => (
              <FadeInUp key={i} delay={i * 0.1} className={`bg-white rounded-2xl sm:rounded-[32px] p-5 sm:p-8 lg:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-start ${item.hoverBorder}`}>
                <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center mb-4 sm:mb-8 group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-1.5 sm:mb-3 tracking-tight">{item.title}</h3>
                <p className="text-xs sm:text-[14px] lg:text-[15px] text-gray-500 leading-relaxed">{item.desc}</p>
              </FadeInUp>
            ))}
          </div>
        </FadeInUp>
      </section>

      {/* ── 4. TRUSTED BY RESTAURANTS LIKE YOURS ──────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <FadeInUp className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-3">4. Trusted by Restaurants Like Yours</h2>
          <p className="text-[13px] text-gray-500 font-medium mb-14">Join a growing community of restaurant owners who love SOFRA.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { val: "50+", label: "Active Restaurants", desc: "Across cities and growing every day.", icon: <Store className="w-5 h-5 sm:w-7 sm:h-7 text-orange-500"/>, bg: "bg-orange-50" },
              { val: "10K+", label: "Orders Processed", desc: "Every single day through our platform.", icon: <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-green-500"/>, bg: "bg-green-50" },
              { val: "4.9", label: "Customer Rating", desc: "Loved by restaurant owners worldwide.", icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-500 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, bg: "bg-yellow-50" },
              { val: "99.9%", label: "Uptime", desc: "Reliable performance when you need it most.", icon: <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500"/>, bg: "bg-blue-50" },
            ].map((item, i) => (
              <FadeInUp key={i} delay={i * 0.1} className="flex flex-col items-center text-center group">
                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full ${item.bg} flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                  {item.icon}
                </div>
                <div className="text-2xl sm:text-4xl font-black text-gray-900 mb-0.5 sm:mb-1">{item.val}</div>
                <div className="text-[11px] sm:text-[12px] font-bold text-gray-800 mb-0.5 sm:mb-1">{item.label}</div>
                <p className="text-[10px] text-gray-500 leading-relaxed max-w-[160px]">{item.desc}</p>
              </FadeInUp>
            ))}
          </div>
        </FadeInUp>
      </section>

      {/* ── 5. CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <FadeInUp className="max-w-6xl mx-auto bg-[#0F172A] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
          {/* Background glow */}
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 90% 20%, #F97316 0%, transparent 40%)'}}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 mb-10">
            {/* Left store image */}
            <div className="w-full lg:w-1/4 flex justify-center shrink-0">
              <div className="w-44 h-44 rounded-3xl overflow-hidden border border-gray-700/50 relative shadow-2xl">
                <img src="/images/restaurant_storefront.jpg" alt="Restaurant storefront" className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent"></div>
              </div>
            </div>

            {/* Center text */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                5. Ready to <span className="text-orange-500">Transform</span> Your Restaurant?
              </h2>
              <p className="text-gray-400 text-[14px] leading-relaxed max-w-lg mx-auto lg:mx-0">
                Start your journey with SOFRA today and experience the future of restaurant operations.
              </p>
            </div>

            {/* Right buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="flex flex-col items-center">
                <Link to="/register" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25">
                  Start Free Trial <ArrowRight className="w-4 h-4"/>
                </Link>
                <span className="text-[10px] text-gray-500 mt-2 font-medium">No credit card required</span>
              </div>
              <Link to="/demo" className="border border-gray-600 text-white hover:bg-gray-800 font-bold text-sm px-8 py-3.5 rounded-full flex items-center justify-center transition-all">
                Book a Demo
              </Link>
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-800">
            {[
              { icon: <ShoppingBag className="w-3.5 h-3.5 text-orange-500"/>, title: "Free 14-day trial", desc: "Explore all features" },
              { icon: <CheckCircle2 className="w-3.5 h-3.5 text-orange-500"/>, title: "No setup fees", desc: "Get started for free" },
              { icon: <RefreshCw className="w-3.5 h-3.5 text-orange-500"/>, title: "Cancel anytime", desc: "No lock-ins" },
              { icon: <Headset className="w-3.5 h-3.5 text-orange-500"/>, title: "24/7 support", desc: "We're here for you" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center shrink-0">{badge.icon}</div>
                <div>
                  <div className="text-[11px] font-bold text-white">{badge.title}</div>
                  <div className="text-[9px] text-gray-500">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeInUp>
      </section>
      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 lg:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-[#F97316] tracking-tight">{APP_CONFIG.appName}</span>
              </Link>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium mb-6">
                The modern operating system for ambitious restaurants. Digitize your operations, streamline service, and grow your bottom line.
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
            <p className="text-[13px] text-gray-400">Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current inline-block mx-0.5 -mt-0.5" /> for restaurants</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HowItWorksPage;
