import React from "react";
import Navbar from "../../components/ui/Navbar";
import { Link } from "react-router-dom";
import { QrCode, Smartphone, Star, Check, CheckCircle2, Bell, ArrowRight, ArrowLeft, ShoppingCart, Store } from "lucide-react";
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
  <div className="relative w-64 h-[500px] mx-auto">
    {/* Phone body */}
    <div className="absolute inset-0 bg-gray-900 rounded-[44px] shadow-2xl border-4 border-gray-800">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
      {/* Screen */}
      <div className="absolute top-6 inset-x-0 bottom-8 bg-white rounded-[36px] overflow-hidden">
        {/* Status bar */}
        <div className="bg-white px-4 py-2 flex justify-between items-center text-[10px] text-gray-500">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        {/* App content */}
        <div className="bg-white px-3 pb-3 overflow-hidden h-full">
          {/* Restaurant header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900">Our Menu</span>
            <QrCode className="w-4 h-4 text-gray-400" />
          </div>
          {/* Hero food card */}
          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 mb-3 flex items-end p-2 overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwIDkuOTQtOC4wNiAxOC0xOCAxOFMwIDI3Ljk0IDAgMTggOC4wNiAwIDE4IDBzMTggOC4wNiAxOCAxOHoiIGZpbGw9IndoaXRlIi8+PC9nPjwvc3ZnPg==')]" />
            <div className="relative z-10">
              <div className="text-[8px] text-white/80 font-medium">Chef's Special</div>
              <div className="text-[10px] text-white font-bold">Grilled Chicken</div>
              <div className="text-[9px] text-orange-100">299 ETB</div>
            </div>
          </div>
          {/* Category pills */}
          <div className="flex gap-1 mb-2 overflow-x-hidden">
            {["All", "Starters", "Main", "Drinks"].map((c) => (
              <span
                key={c}
                className={`text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap ${c === "All" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {c}
              </span>
            ))}
          </div>
          {/* Menu items */}
          {[
            { name: "Paneer Tikka", price: "189 ETB", emoji: "🍢" },
            { name: "Biryani Bowl", price: "249 ETB", emoji: "🍛" },
            { name: "Cold Coffee", price: "99 ETB", emoji: "☕" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-base leading-none">
                  {item.emoji}
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-gray-800">{item.name}</div>
                  <div className="text-[8px] text-gray-400">{item.price}</div>
                </div>
              </div>
              <button className="w-5 h-5 bg-gray-900 text-white rounded-full text-[10px] font-bold leading-none flex items-center justify-center">
                +
              </button>
            </div>
          ))}
          {/* Order button */}
          <div className="absolute bottom-12 left-3 right-3">
            <div className="bg-gray-900 text-white rounded-xl py-2 text-center text-[9px] font-bold">
              View Cart (2 items)
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Floating badge */}
    <div className="absolute -right-4 top-16 bg-white rounded-xl shadow-xl px-3 py-2 border border-gray-100">
      <div className="text-[10px] text-gray-500 font-medium">New Order!</div>
      <div className="text-[11px] font-bold text-gray-900">Table 4 • 348 ETB</div>
      <div className="flex items-center gap-0.5 mt-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
    {/* Floating QR badge */}
    <div className="absolute -left-6 bottom-24 bg-white rounded-xl shadow-xl px-3 py-2 border border-gray-100">
      <QrCode className="w-8 h-8 text-gray-900 mx-auto mb-1" />
      <div className="text-[9px] text-gray-500 text-center">Scan to order</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Landing Page
───────────────────────────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-20 md:pb-28">
        {/* Subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <FadeInUp className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Now live in 50+ restaurants
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold text-[#0F172A] leading-[1.05] tracking-tight mb-6 relative z-10">
                Digitize Your
                <br />
                Restaurant{" "}
                <span className="relative text-[#F97316]">
                  in Minutes
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C60 4 180 2 298 8"
                      stroke="#F97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {/* Orange Sparkles / Sunburst */}
                <svg className="absolute -top-6 -right-12 w-12 h-12 hidden md:block" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 20L18 24" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M24 10L24 18" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M38 20L30 24" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </h1>

              <p className="text-[17px] text-gray-500 mb-10 max-w-[480px] mx-auto lg:mx-0 leading-relaxed font-medium">
                Get your own QR ordering system. Let customers order directly
                from their phones. No app downloads, no commission fees — just
                seamless digital ordering.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white font-semibold px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-[15px] shadow-lg shadow-gray-900/20"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-colors text-[15px]"
                >
                  See How it Works
                </a>
              </div>

              {/* Stats */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mt-8 gap-6 md:gap-10">
                {/* Stat 1 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Store className="w-10 h-10 text-orange-500" strokeWidth={2} fill="#FFF7ED" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-3xl font-extrabold text-gray-900 leading-none mb-1">50+</span>
                    <span className="text-[13px] font-medium text-gray-500 leading-snug">Active<br />Restaurants</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-gray-100 hidden md:block"></div>

                {/* Stat 2 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="14" width="4" height="7" rx="1" stroke="#22C55E" strokeWidth="2" fill="#F0FDF4" />
                      <rect x="10" y="10" width="4" height="11" rx="1" stroke="#22C55E" strokeWidth="2" fill="#F0FDF4" />
                      <rect x="17" y="6" width="4" height="15" rx="1" stroke="#22C55E" strokeWidth="2" fill="#F0FDF4" />
                      <path d="M2 11L8 5L12 8L21 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 1H21V6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-3xl font-extrabold text-gray-900 leading-none mb-1">10K+</span>
                    <span className="text-[13px] font-medium text-gray-500 leading-snug">Orders<br />Processed</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-gray-100 hidden md:block"></div>

                {/* Stat 3 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Star className="w-10 h-10 text-yellow-400" strokeWidth={2} fill="#FEF9C3" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-3xl font-extrabold text-gray-900 leading-none mb-1 flex items-center gap-1.5">
                      4.9 <Star className="w-5 h-5 text-gray-900" fill="currentColor" strokeWidth={1} />
                    </span>
                    <span className="text-[13px] font-medium text-gray-500 leading-snug">Customer<br />Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <PhoneMock />
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── WHY RESTAURANTS LOVE SOFRA & CTA ────────────────────────────────── */}
      <section id="features" className="py-24 bg-[#FEFDFB]">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[2.5rem] font-bold text-[#0F172A] tracking-tight relative inline-block">
              Why Restaurants Love SOFRA
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#F97316] rounded-full"></div>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-24">
            {/* Feature 1 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.1}} className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] border-2 border-orange-200 flex items-center justify-center mb-5 bg-white shadow-sm group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <QrCode className="w-8 h-8 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">QR Ordering</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[200px]">
                Customers scan, browse menu, and order instantly.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}} className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] border-2 border-green-200 flex items-center justify-center mb-5 bg-white shadow-sm group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 2L22 22" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">No App Downloads</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[200px]">
                No apps, no logins. Just scan and order.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.3}} className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] border-2 border-blue-200 flex items-center justify-center mb-5 bg-white shadow-sm group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H14" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H16V17H21V12Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">Zero Commission</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[200px]">
                Keep 100% of your earnings always.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.4}} className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] border-2 border-purple-200 flex items-center justify-center mb-5 bg-white shadow-sm group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V14" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">Smart Analytics</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[200px]">
                Track orders, sales, and customer insights.
              </p>
            </motion.div>
          </div>

          {/* CTA Section Card */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col md:flex-row items-center max-w-[1100px] mx-auto">
            {/* Left side text */}
            <div className="p-10 md:p-14 lg:p-20 md:w-1/2 flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4">
                Get Started Today
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#0F172A] leading-[1.1] mb-6 tracking-tight">
                Ready to digitize<br />your restaurant?
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-10 max-w-md">
                Join 50+ restaurants on SOFRA. Streamline operations and delight customers with digital ordering.
              </p>
              <div>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 bg-[#0F172A] text-white font-semibold px-8 py-4 rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
                >
                  Get Started for Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            {/* Right side Image */}
            <div className="md:w-1/2 w-full h-64 md:h-auto self-stretch relative bg-[#FEFDFB] hidden md:block">
              <img 
                src="/images/cta_illustration.jpg" 
                alt="Restaurant UI" 
                className="absolute inset-0 w-full h-full object-cover object-center rounded-r-[2.5rem]" 
              />
            </div>
          </div>

        </FadeInUp>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F8FAFC]">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight relative inline-block">
              Loved by Restaurant Owners
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full"></div>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {/* Card 1 */}
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{delay:0.1}} className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 flex flex-col hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-[13px] sm:text-[15px] text-gray-700 leading-relaxed mb-6 sm:mb-8 font-medium italic flex-1">
                "SOFRA made ordering so easy for our customers and our staff. Highly recommended!"
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/images/avatar_rahul.jpg" alt="Rahul Verma" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm">Rahul Verma</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Café Delhi Heights</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{delay:0.2}} className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 flex flex-col hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-[13px] sm:text-[15px] text-gray-700 leading-relaxed mb-6 sm:mb-8 font-medium italic flex-1">
                "No more commission fees eating into our profits. SOFRA is a game changer!"
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/images/avatar_priya.jpg" alt="Priya Nair" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm">Priya Nair</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Spice Hub</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{delay:0.3}} className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 flex flex-col relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer col-span-2 md:col-span-1">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-[15px] text-gray-700 leading-relaxed mb-8 font-medium italic flex-1">
                "Setup took less than 10 minutes. Our orders increased by 30% in the first week!"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="/images/avatar_arjun.jpg" alt="Arjun Mehta" className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Arjun Mehta</div>
                    <div className="text-xs text-gray-500">The Curry House</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-colors bg-white shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-orange-200 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors bg-white shadow-sm">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeInUp>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight relative inline-block">
              How It Works
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full"></div>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Dotted Line connecting the steps */}
            <div className="absolute top-[2.25rem] left-[10%] right-[10%] h-[2px] border-t-[3px] border-dotted border-orange-200 hidden md:block z-0"></div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-4 relative z-10">
              {/* Step 1 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.1}} className="flex flex-col items-center text-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mb-6 ring-8 ring-orange-50 group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  <QrCode className="w-7 h-7 text-gray-700 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-[14px] mb-2">Place QR</h3>
                <p className="text-[13px] text-gray-500 px-2 leading-relaxed">Display our QR code on your table.</p>
              </motion.div>

              {/* Step 2 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}} className="flex flex-col items-center text-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mb-6 ring-8 ring-orange-50 group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  <Smartphone className="w-7 h-7 text-gray-700 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-[14px] mb-2">Customer Scans</h3>
                <p className="text-[13px] text-gray-500 px-2 leading-relaxed">They scan and view your digital menu.</p>
              </motion.div>

              {/* Step 3 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.3}} className="flex flex-col items-center text-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mb-6 ring-8 ring-orange-50 group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-gray-700 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-[14px] mb-2">Place Order</h3>
                <p className="text-[13px] text-gray-500 px-2 leading-relaxed">They add items and place the order.</p>
              </motion.div>

              {/* Step 4 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.4}} className="flex flex-col items-center text-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mb-6 ring-8 ring-orange-50 group-hover:scale-110 transition-transform duration-300">
                  4
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  <Bell className="w-7 h-7 text-orange-500" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-[14px] mb-2">Get Notified</h3>
                <p className="text-[13px] text-gray-500 px-2 leading-relaxed">You get the order in real-time.</p>
              </motion.div>

              {/* Step 5 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.5}} className="flex flex-col items-center text-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mb-6 ring-8 ring-orange-50 group-hover:scale-110 transition-transform duration-300">
                  5
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  <CheckCircle2 className="w-7 h-7 text-orange-600" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-[14px] mb-2">Serve & Repeat</h3>
                <p className="text-[13px] text-gray-500 px-2 leading-relaxed">Serve happy customers and grow more!</p>
              </motion.div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-[#F8FAFC]">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight relative inline-block">
              Simple, Transparent Pricing
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full"></div>
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-medium mt-6 max-w-xl mx-auto">
              Predictable flat rates with 0% transaction commission. Upgrade, downgrade, or switch billing cycles anytime.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-full p-1.5 w-max mx-auto shadow-xs mt-8">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  !isAnnual ? "bg-orange-50 text-orange-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isAnnual ? "bg-orange-50 text-orange-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
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

              <ul className="space-y-3.5 mb-8 flex-1 border-t border-gray-100 pt-6">
                {[
                  "Digital QR Menu",
                  "Up to 500 orders / month",
                  "Standard Sales Reports",
                  "Email Support (48hr response)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-gray-700 font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="block text-center text-xs font-black px-6 py-3.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors shadow-xs"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 border-2 border-orange-500 shadow-xl flex flex-col relative transform md:-translate-y-3 hover:-translate-y-4 hover:shadow-2xl transition-all duration-300 z-10 ring-4 ring-orange-500/10"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                Most Popular
              </div>

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

              <ul className="space-y-3.5 mb-8 flex-1 border-t border-gray-100 pt-6">
                {[
                  "Everything in Starter included",
                  "Up to 1,000 orders / month",
                  "Digital Table QR Self-Ordering",
                  "Custom Brand Colors & Themes",
                  "Table QR Stand PDF Generator",
                  "Priority Support (WhatsApp & Phone)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-gray-800 font-bold">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="block text-center text-xs font-black px-6 py-3.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25 active:scale-95"
              >
                Start Free Trial
              </Link>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-white relative"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Enterprise
              </div>

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

              <ul className="space-y-3 mb-8 flex-1 border-t border-slate-800 pt-6">
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

              <Link
                to="/register"
                className="block text-center text-xs font-black px-6 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-md active:scale-95"
              >
                Get Started Enterprise
              </Link>
            </motion.div>
          </div>
        </FadeInUp>
      </section>


      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0F172A] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl shadow-gray-900/10">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              {/* Store Icon Block */}
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                <Store className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                  Start Your Digital Journey Today
                </h2>
                <p className="text-gray-400 text-sm md:text-[15px]">
                  Join 50+ restaurants already serving happier<br className="hidden md:block" /> customers with SOFRA.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-full transition-colors text-sm shadow-lg shadow-orange-500/20"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:demo@sofra.com"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-400 text-white hover:bg-white/5 font-bold px-6 py-3.5 rounded-full transition-colors text-sm"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-extrabold text-[#F97316] tracking-tight">
                  {APP_CONFIG.appName}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px]">
                The seamless QR ordering system for modern restaurants.
              </p>
            </div>

            {/* Product */}
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
                    {item.href.startsWith('/') ? (
                      <Link to={item.href} className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <a href={item.href} className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Company</h4>
              <ul className="space-y-3">
                {["About Us", "Blog", "Careers", "Contact"].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Refund Policy"].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-gray-400 font-medium">
              © {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.
            </p>
            <div className="flex gap-4">
              {["f", "in", "t", "ig"].map((s) => (
                <a key={s} href="#" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors bg-white">
                  <span className="text-[10px] font-bold uppercase">{s}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
