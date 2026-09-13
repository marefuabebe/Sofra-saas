import React from "react";
import Navbar from "../../components/ui/Navbar";
import { Link } from "react-router-dom";
import { QrCode, Sparkles, Star, BarChart3, Users, ArrowRight, ChevronRight, ShieldCheck, Box, Smartphone, LineChart, PieChart, ArrowLeft, Clock, Coins, Smile, Bell, Store } from "lucide-react";
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

/* ─────────────────────────────────────────────────────────────────────────────
   Phone Mock Component
───────────────────────────────────────────────────────────────────────────── */
const PhoneMock: React.FC = () => (
  <div className="relative w-64 h-[500px]">
    {/* Phone body */}
    <div className="absolute inset-0 bg-gray-900 rounded-[44px] shadow-2xl border-4 border-gray-800">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
      <div className="absolute top-6 inset-x-0 bottom-8 bg-white rounded-[36px] overflow-hidden">
        <div className="bg-white px-4 py-2 flex justify-between items-center text-[10px] text-gray-500">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="bg-white px-3 pb-3 overflow-hidden h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center"><ChevronRight className="w-3 h-3 rotate-180" /></div>
               <span className="text-xs font-bold text-gray-900">Your Menu</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
               <Store className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          <div className="flex gap-1 mb-2 overflow-x-hidden pt-1">
            {["All", "Starters", "Main", "Drinks"].map((c) => (
              <span
                key={c}
                className={`text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap ${c === "All" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="w-full h-20 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 mb-3 flex items-center p-2 overflow-hidden relative mt-1 shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 mr-3">
               <span className="text-lg">🍕</span>
            </div>
            <div className="relative z-10">
              <div className="text-[8px] text-white/80 font-medium">Chef's Special</div>
              <div className="text-[10px] text-white font-bold">Grilled Chicken</div>
              <div className="text-[9px] text-orange-100 mt-1">299 ETB</div>
            </div>
            <div className="absolute right-2 bottom-2 w-5 h-5 bg-white text-orange-500 rounded-full flex items-center justify-center text-[12px] font-bold leading-none">+</div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 pb-10 space-y-2">
            {[
              { name: "Paneer Tikka", price: "189 ETB", emoji: "🍢", desc: "Spicy grilled cottage cheese skewers" },
              { name: "Biryani Bowl", price: "249 ETB", emoji: "🍛", desc: "Aromatic seasoned rice and veggies" },
              { name: "Cold Coffee", price: "99 ETB", emoji: "☕", desc: "Refreshing iced coffee" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-lg leading-none shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-800">{item.name}</div>
                    <div className="text-[8px] text-gray-400 line-clamp-1">{item.desc}</div>
                    <div className="text-[9px] font-bold text-gray-600 mt-0.5">{item.price}</div>
                  </div>
                </div>
                <button className="w-5 h-5 bg-gray-900 text-white rounded-full text-[12px] font-bold leading-none flex items-center justify-center shrink-0">
                  +
                </button>
              </div>
            ))}
          </div>
          <div className="absolute bottom-10 left-3 right-3 bg-gradient-to-t from-white via-white pt-4">
            <div className="bg-gray-900 text-white rounded-xl py-2.5 px-4 flex justify-between items-center text-[10px] font-bold shadow-lg">
              <span>View Cart (2 items)</span>
              <span>438 ETB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -left-12 bottom-12 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 z-20 flex flex-col items-center">
      <QrCode className="w-10 h-10 text-gray-900 mb-1" />
      <div className="text-[8px] font-bold text-gray-700 text-center uppercase tracking-wider">Scan to order</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Dashboard Mock Component
───────────────────────────────────────────────────────────────────────────── */
const DashboardMock: React.FC = () => (
  <div className="w-[850px] h-[550px] bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 flex overflow-hidden">
    <div className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-6 gap-8">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm">
         <Store className="w-5 h-5" />
      </div>
      <div className="flex flex-col gap-6 text-gray-400">
         <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Store className="w-4 h-4" /></div>
         <QrCode className="w-5 h-5 mx-auto" />
         <BarChart3 className="w-5 h-5 mx-auto" />
         <Users className="w-5 h-5 mx-auto" />
         <ShieldCheck className="w-5 h-5 mx-auto" />
         <Box className="w-5 h-5 mx-auto" />
      </div>
    </div>
    <div className="flex-1 p-8 flex flex-col bg-[#F9FAFB]/50">
       <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-6">
             <div className="text-xs bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 font-medium">
               Today, May 20 <ChevronRight className="w-3 h-3 rotate-90" />
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm relative">
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <Bell className="w-3 h-3 text-gray-600" />
               </div>
               <img src="/images/avatar_rahul.jpg" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
             </div>
          </div>
       </div>
       <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            {label: "Orders", val: "128", trend: "+18%"}, 
            {label: "Revenue", val: "24,560 ETB", trend: "+24%"}, 
            {label: "Avg. Order Value", val: "192 ETB", trend: "+12%"}, 
            {label: "Active Tables", val: "10", trend: "Live now"}
          ].map(s => (
            <div key={s.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
               <div className="text-xs text-gray-500 mb-1.5 font-medium">{s.label}</div>
               <div className="text-[28px] font-black text-gray-900 mb-1 tracking-tight">{s.val}</div>
               <div className={`text-[11px] font-bold flex gap-1 ${s.trend.includes('+') ? 'text-green-500' : 'text-green-500'}`}>
                  {s.trend} <span className="text-gray-400 font-medium">vs yesterday</span>
               </div>
            </div>
          ))}
       </div>
       <div className="flex gap-5 flex-1 h-0">
          <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-gray-800">Orders Overview</h3>
             </div>
             <div className="flex-1 relative pb-6 flex items-end">
               <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6">
                 {[100, 75, 50, 25, 0].map(v => (
                   <div key={v} className="flex items-center gap-3">
                     <span className="text-[10px] text-gray-400 font-medium w-6 text-right">{v}</span>
                     <div className="flex-1 border-t border-gray-100 border-dashed"></div>
                   </div>
                 ))}
               </div>
               <svg className="w-full h-full relative z-10 pl-9" viewBox="0 0 100 50" preserveAspectRatio="none">
                 <path d="M0,40 L10,38 L20,42 L30,28 L40,32 L50,15 L60,25 L70,12 L80,28 L90,20 L100,5" fill="none" stroke="#F97316" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                 <circle cx="70" cy="12" r="3.5" fill="white" stroke="#F97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
               </svg>
               <div className="absolute top-[20%] left-[62%] bg-white shadow-xl border border-gray-100 rounded-xl px-3 py-2 text-center z-20 pointer-events-none drop-shadow-md">
                 <div className="font-bold text-gray-900 text-xs">72 Orders</div>
                 <div className="text-gray-400 text-[9px] font-medium mt-0.5">12 PM</div>
               </div>
             </div>
             <div className="absolute bottom-2 left-16 right-4 flex justify-between text-[10px] text-gray-400 font-medium">
               <span>12 AM</span>
               <span>4 AM</span>
               <span>8 AM</span>
               <span>12 PM</span>
               <span>4 PM</span>
               <span>8 PM</span>
             </div>
          </div>
          <div className="flex-[1] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
             <h3 className="text-sm font-bold text-gray-800 mb-6">Top Selling Items</h3>
             <div className="space-y-4 overflow-y-auto flex-1 pr-2">
               {[ 
                 {name:"Paneer Tikka", val:"126", no:1, emoji:"🍢", bg:"bg-orange-100"}, 
                 {name:"Biryani Bowl", val:"96", no:2, emoji:"🍛", bg:"bg-orange-100"}, 
                 {name:"Cold Coffee", val:"72", no:3, emoji:"☕", bg:"bg-orange-100"},
                 {name:"Margherita Pizza", val:"64", no:4, emoji:"🍕", bg:"bg-orange-100"} 
               ].map(i => (
                 <div key={i.no} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm font-bold relative shrink-0 border border-orange-100">
                      <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-gray-200 rounded-full text-[8px] flex items-center justify-center text-gray-600 font-bold">{i.no}</span>
                      {i.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-gray-800">{i.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{i.val}</div>
                    </div>
                    <div className="text-[12px] font-bold text-gray-900">{i.val}</div>
                 </div>
               ))}
             </div>
          </div>
       </div>
    </div>
  </div>
);

const FeaturesPage: React.FC = () => {
  
  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans antialiased selection:bg-orange-100">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO & DASHBOARD OVERLAY ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-6 pb-20 md:pt-10 md:pb-28">
        {/* Subtle background grid (from LandingPage) */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12 lg:gap-16 relative z-10">
          
          <div className="flex-1 pt-4 pb-10 relative z-20">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 text-[12px] font-bold text-orange-600 mb-6">
              <Sparkles className="w-4 h-4" /> All-in-One Restaurant OS
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
              <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold text-[#0F172A] leading-[1.05] tracking-tight mb-6">
                Features designed for <br className="hidden md:block" />
                <span className="text-[#F97316]">modern hospitality.</span>
              </h1>
            </motion.div>
            
            <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="text-[17px] text-gray-500 max-w-[480px] mb-10 leading-relaxed font-medium">
              Elevate your restaurant's operations with our integrated suite of tools. From intelligent tableside ordering to real-time kitchen analytics, SOFRA brings clarity to chaos.
            </motion.p>
            
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-14">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 text-[15px] hover:-translate-y-1">
                Explore Platform <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="/demo" className="inline-flex items-center justify-center border-2 border-gray-200 text-gray-700 font-bold px-8 py-4 rounded-full hover:border-gray-400 transition-all bg-white text-[15px] hover:-translate-y-1 shadow-sm">
                Book Demo
              </a>
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4}} className="flex items-center gap-4">
              <div className="flex -space-x-3 drop-shadow-sm">
                <img src="/images/avatar_rahul.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="/images/avatar_priya.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="/images/avatar_arjun.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />)}
                </div>
                <div className="text-[13px] text-gray-500 font-medium tracking-tight">Loved by <span className="font-bold text-orange-500">50+</span> restaurants worldwide</div>
              </div>
            </motion.div>
          </div>

          <div className="flex-[1.2] relative hidden lg:block perspective-[1000px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200/40 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div initial={{opacity:0, x:100}} animate={{opacity:1, x:0}} transition={{delay:0.2, type: "spring", stiffness: 50}}
              className="absolute top-0 -right-24 transform scale-[0.70] origin-top-right z-0"
            >
              <DashboardMock />
            </motion.div>
            
            <motion.div initial={{opacity:0, y:100}} animate={{opacity:1, y:0}} transition={{delay:0.4, type: "spring", stiffness: 50}}
              className="absolute top-[35%] -right-12 z-10 transform scale-[0.75] origin-bottom-right drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
            >
              <PhoneMock />
            </motion.div>
          </div>
        </div>
      </section>



      {/* ── CORE CAPABILITIES ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight relative inline-block">
              Core Capabilities
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full"></div>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[
              { title: "QR Menu & Ordering", desc: "Contactless menus and instant ordering through QR.", icon: <QrCode strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> },
              { title: "Real-time Dashboard", desc: "Live insights on orders, revenue, and table status.", icon: <PieChart strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> },
              { title: "Multi-Outlet Management", desc: "Manage multiple outlets from one powerful dashboard.", icon: <Store strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> },
              { title: "Staff Management", desc: "Assign roles, track performance, and manage access.", icon: <Users strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> },
              { title: "Payments & Billing", desc: "Seamless billing with multiple payment options.", icon: <Box strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> },
              { title: "Reports & Analytics", desc: "In-depth reports to help you make data-driven decisions.", icon: <BarChart3 strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" /> },
            ].map((f, i) => (
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: i*0.1}} key={f.title} className="bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-4 sm:p-8 rounded-2xl sm:rounded-[1.5rem] flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 sm:mb-5 shrink-0">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-xs sm:text-[15px] mb-1 sm:mb-2.5 leading-tight">{f.title}</h3>
                <p className="text-[11px] sm:text-[13px] text-gray-500 leading-relaxed font-medium px-0 sm:px-4">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </FadeInUp>
      </section>

      {/* ── AI BANNER ───────────────────────────────────────────────────────── */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="rounded-3xl bg-gradient-to-r from-[#1A0B16] via-[#2D1115] to-[#8C3A1D] p-6 md:p-8 flex flex-col xl:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-400 p-1 relative flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)] border-2 border-orange-500/50">
              <div className="absolute inset-0 rounded-full border border-orange-300/30 scale-[1.2] opacity-50 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border border-orange-300/20 scale-[1.4] opacity-30"></div>
              <span className="text-2xl font-black text-white tracking-widest relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">AI</span>
            </div>

            <div className="flex-1 text-center xl:text-left z-10">
              <div className="flex items-center justify-center xl:justify-start gap-2 mb-2">
                 <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight whitespace-nowrap">AI-Powered Restaurant Assistant</h2>
                 <span className="bg-[#6366F1] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">NEW</span>
              </div>
              <p className="text-gray-300 text-[13px] max-w-lg mx-auto xl:mx-0 leading-relaxed">
                Get smart suggestions, demand forecasts, and automated insights to run your restaurant like never before.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 text-left z-10 w-full xl:w-auto overflow-x-auto hide-scrollbar snap-x">
              <div className="flex items-start gap-3 snap-center shrink-0">
                 <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10"><LineChart className="w-4 h-4 text-white/90"/></div>
                 <div>
                   <div className="text-white text-xs font-bold mb-0.5">Demand Forecasting</div>
                   <div className="text-white/60 text-[10px] font-medium max-w-[120px] leading-relaxed">Know what will sell, before it does.</div>
                 </div>
              </div>
              <div className="flex items-start gap-3 snap-center shrink-0">
                 <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10"><PieChart className="w-4 h-4 text-white/90"/></div>
                 <div>
                   <div className="text-white text-xs font-bold mb-0.5">Smart Suggestions</div>
                   <div className="text-white/60 text-[10px] font-medium max-w-[120px] leading-relaxed">AI recommends the best dishes & offers.</div>
                 </div>
              </div>
              <div className="flex items-start gap-3 snap-center shrink-0">
                 <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10"><BarChart3 className="w-4 h-4 text-white/90"/></div>
                 <div>
                   <div className="text-white text-xs font-bold mb-0.5">Automated Reports</div>
                   <div className="text-white/60 text-[10px] font-medium max-w-[120px] leading-relaxed">Get daily insights, delivered to you.</div>
                 </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── METRICS (Why Restaurants Love SOFRA) ────────────────────────────── */}
      <section className="py-20 bg-[#FDFCFB]">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight relative inline-block">
              Why Restaurants Love SOFRA
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-orange-500 rounded-full"></div>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-4 sm:p-7 rounded-[1.5rem] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-full flex items-center justify-center shrink-0"><LineChart strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /></div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-0.5 sm:mb-1">+35%</div>
                <div className="text-xs sm:text-[13px] font-bold text-gray-900 mb-1 sm:mb-2">Increase in Orders</div>
                <div className="text-[11px] sm:text-[12px] text-gray-500 leading-relaxed font-medium">More orders, happier customers.</div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-7 rounded-[1.5rem] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0"><Clock strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" /></div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-0.5 sm:mb-1">-40%</div>
                <div className="text-xs sm:text-[13px] font-bold text-gray-900 mb-1 sm:mb-2">Less Manual Work</div>
                <div className="text-[11px] sm:text-[12px] text-gray-500 leading-relaxed font-medium">Automate tasks and save valuable time.</div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-7 rounded-[1.5rem] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-full flex items-center justify-center shrink-0"><Coins strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" /></div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-0.5 sm:mb-1">+28%</div>
                <div className="text-xs sm:text-[13px] font-bold text-gray-900 mb-1 sm:mb-2">Revenue Growth</div>
                <div className="text-[11px] sm:text-[12px] text-gray-500 leading-relaxed font-medium">Data-driven decisions that grow your business.</div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-7 rounded-[1.5rem] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0"><Smile strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /></div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-0.5 sm:mb-1">99.9%</div>
                <div className="text-xs sm:text-[13px] font-bold text-gray-900 mb-1 sm:mb-2">Uptime Guaranteed</div>
                <div className="text-[11px] sm:text-[12px] text-gray-500 leading-relaxed font-medium">Reliable performance, always.</div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight relative inline-block">
              Loved by Restaurant Owners
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full"></div>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col hover:-translate-y-2 transition-transform">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />)}
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed mb-6 sm:mb-8 font-medium flex-1">
                "SOFRA made ordering so easy for our customers and our staff. Highly recommended!"
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/images/avatar_rahul.jpg" alt="Rahul Verma" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm">Rahul Verma</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Café Delhi Heights</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col hover:-translate-y-2 transition-transform">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />)}
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed mb-6 sm:mb-8 font-medium flex-1">
                "No more commission fees eating into our profits. SOFRA is a game changer!"
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/images/avatar_priya.jpg" alt="Priya Nair" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm">Priya Nair</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Spice Hub</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col relative hover:-translate-y-2 transition-transform col-span-2 md:col-span-1">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />)}
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed mb-6 sm:mb-8 font-medium flex-1">
                "Setup took less than 10 minutes. Our orders increased by 30% in the first week!"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img src="/images/avatar_arjun.jpg" alt="Arjun Mehta" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-bold text-gray-900 text-xs sm:text-sm">Arjun Mehta</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">The Curry House</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 bg-white"><ArrowLeft className="w-3 h-3" /></button>
                  <button className="w-7 h-7 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 bg-white"><ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>


      {/* ── 5 FEATURE CARDS ROW ──────────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[
            {title:"QR Tableside Ordering", desc:"Let customers scan table QR codes to browse your live menu and place orders from their phone.", icon:<Smartphone strokeWidth={1.5} className="w-7 h-7 text-orange-500"/>, bg:"bg-orange-50"},
            {title:"Live Order Tracking", desc:"Real-time sound alerts and status updates keep your kitchen and waitstaff in sync.", icon:<Bell strokeWidth={1.5} className="w-7 h-7 text-purple-600"/>, bg:"bg-purple-50"},
            {title:"Live Menu Control", desc:"Manage categories, dish customizations, and toggle item stock availability in real time.", icon:<Box strokeWidth={1.5} className="w-7 h-7 text-green-600"/>, bg:"bg-green-50"},
            {title:"Sales & Revenue Analytics", desc:"Track daily revenue, best-selling dishes, order volume, and average order values.", icon:<BarChart3 strokeWidth={1.5} className="w-7 h-7 text-blue-600"/>, bg:"bg-blue-50"},
            {title:"Secure Cloud Platform", desc:"Encrypted authentication, role-based staff access, and reliable cloud-backed data storage.", icon:<ShieldCheck strokeWidth={1.5} className="w-7 h-7 text-yellow-600"/>, bg:"bg-yellow-50"},
          ].map((f, i) => (
            <motion.div 
              initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: i*0.1}}
              key={i} 
              className={`bg-white rounded-[1.5rem] p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-start ${i === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${f.bg} ring-6 sm:ring-8 ring-white`}>
                {f.icon}
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-[15px] mb-2 sm:mb-3 leading-tight">{f.title}</h3>
              <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0F172A] rounded-[2.5rem] p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl">
            {/* Background patterns */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            
            <div className="flex items-center gap-8 relative z-10 w-full lg:w-auto">
              <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Store className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">Ready to Transform Your Restaurant?</h2>
                <p className="text-gray-400 text-[15px] font-medium">Join 50+ restaurants already growing with SOFRA.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto shrink-0">
              <Link to="/register" className="inline-flex items-center justify-center bg-orange-500 text-white font-bold px-8 py-4 rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 text-[15px] whitespace-nowrap">
                Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <a href="/demo" className="inline-flex items-center justify-center border border-gray-600 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-[15px] whitespace-nowrap">
                Book a Demo
              </a>
            </div>
          </div>
        </FadeInUp>
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
                  <li key={label}><a href="#" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Refund Policy"].map((label) => (
                  <li key={label}><a href="#" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-gray-400 font-medium">© {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
