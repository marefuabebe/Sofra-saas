import React, { useState } from "react";
import Navbar from "../../components/ui/Navbar";
import { Link } from "react-router-dom";
import { CheckCircle2, Phone, Mail, MessageSquare, MapPin, ChevronDown, User, Tag, Send, ArrowRight, RefreshCw, Play, TrendingUp , Store } from "lucide-react";
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

const ContactPage: React.FC = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans antialiased overflow-x-hidden">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative bg-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-gray-50">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] z-0 mask-image-[radial-gradient(ellipse_at_center,black,transparent_80%)]" style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'}}></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
          <FadeInUp className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-orange-50/80 text-orange-500 text-[12px] font-bold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> We're Here to Help
            </div>
            <h1 className="text-5xl md:text-[3.5rem] font-black text-gray-900 tracking-tight leading-[1.05] mb-6">
              Let's Build Something<br/><span className="text-orange-500">Amazing</span> Together.
            </h1>
            <p className="text-gray-500 text-[16px] max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
              Have questions or need support? Our team is ready to help you streamline your restaurant operations.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10 text-[13px] font-bold text-gray-700">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange-500"/> Quick Responses</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange-500"/> Friendly Support</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange-500"/> Real Solutions</span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-2.5">
                <img src="/images/avatar_rahul.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=AJ&background=F97316&color=fff"; }} />
                <img src="/images/avatar_rahul.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=RV&background=22C55E&color=fff"; }} style={{ filter: 'hue-rotate(90deg)' }} />
                <img src="/images/avatar_rahul.jpg" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="User" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=SM&background=3B82F6&color=fff"; }} style={{ filter: 'hue-rotate(180deg)' }} />
              </div>
              <div>
                <div className="flex text-orange-500 mb-0.5">
                  {[1,2,3,4,5].map(i => <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <div className="text-[12px] font-semibold text-gray-500">Loved by <span className="text-gray-900 font-bold">50+</span> restaurants worldwide</div>
              </div>
            </div>
          </FadeInUp>
          
          <FadeInUp className="flex-1 w-full relative" delay={0.2}>
            <div className="relative w-full max-w-[500px] mx-auto flex items-center justify-center" style={{minHeight: '400px'}}>
              {/* Organic Wavy Dashed Line */}
              <div className="absolute top-[-10%] left-[-10%] right-[-10%] bottom-[-10%] z-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 500 400" className="w-full h-full overflow-visible">
                  <path d="M 50 300 C 50 100, 200 50, 250 50 C 350 50, 450 150, 450 350" fill="none" stroke="#fed7aa" strokeWidth="2.5" strokeDasharray="8 12" />
                  <path d="M 100 150 C 50 100, 150 0, 250 50" fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="6 10" />
                </svg>
              </div>

              {/* 3D CSS Map Pin */}
              <div className="absolute top-[2%] left-[25%] z-20 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="relative w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-[50%_50%_50%_0] shadow-[8px_8px_20px_rgba(249,115,22,0.3)]" style={{ transform: 'rotate(-45deg)' }}>
                  <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-white rounded-full shadow-inner" style={{ transform: 'translate(-50%, -50%)' }}></div>
                </div>
              </div>

              {/* Center restaurant illustration */}
              <img src="/images/restaurant_storefront.jpg" alt="SOFRA Restaurant" className="relative z-10 w-[420px] h-[420px] object-contain drop-shadow-2xl mt-10 mix-blend-multiply" />
              
              {/* Top-right — Live Chat */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute top-[10%] -right-8 bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-3.5 pr-8 flex items-center gap-4 z-20 cursor-pointer"
              >
                <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 fill-orange-100"/></div>
                <div>
                  <div className="text-[13px] font-black text-gray-900 flex items-center gap-1.5 mb-0.5">Live Chat <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span></div>
                  <div className="text-[10px] text-gray-500 font-medium leading-snug">Chat with our support<br/>team in real-time</div>
                </div>
              </motion.div>
              
              {/* Middle-left — Call Us */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute top-[45%] -left-12 bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-3.5 pr-8 flex items-center gap-4 z-20 cursor-pointer"
              >
                <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Phone className="w-5 h-5 fill-orange-100"/></div>
                <div>
                  <div className="text-[13px] font-black text-gray-900 mb-0.5">Call Us</div>
                  <div className="text-[10px] text-gray-500 font-medium">+91 12345 67890</div>
                </div>
              </motion.div>

              {/* Bottom-right — Email Us */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute bottom-[5%] -right-4 bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-3.5 pr-8 flex items-center gap-4 z-20 cursor-pointer"
              >
                <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Mail className="w-5 h-5 fill-orange-100"/></div>
                <div>
                  <div className="text-[13px] font-black text-gray-900 mb-0.5">Email Us</div>
                  <div className="text-[10px] text-gray-500 font-medium">hello@sofra.com</div>
                </div>
              </motion.div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── CONTACT CONTENT ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left: Get in Touch Cards */}
          <div className="flex-1">
            <FadeInUp>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Get in Touch</h2>
              <p className="text-gray-500 text-[15px] mb-10 max-w-md">
                Choose the best way to reach us. We're here to support you every step of the way.
              </p>
            </FadeInUp>

            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {[
                { icon: <Phone className="w-5 h-5"/>, title: "Call Us", desc: "Mon – Sat, 9:00 AM – 7:00 PM", action: "+91 12345 67890", actionColor: "text-orange-500" },
                { icon: <Mail className="w-5 h-5"/>, title: "Email Us", desc: "We reply within 24 hours", action: "hello@sofra.com", actionColor: "text-orange-500" },
                { icon: <MessageSquare className="w-5 h-5"/>, title: "Live Chat", desc: "Chat with our support team", action: "Online Now", actionColor: "text-green-500" },
                { icon: <MapPin className="w-5 h-5"/>, title: "Our Location", desc: "123 Food Street, Koramangala, Bangalore, India", action: "", actionColor: "" },
              ].map((card, i) => (
                <FadeInUp key={i} delay={i * 0.1} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] hover:-translate-y-1.5 hover:border-orange-200 cursor-pointer transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-3 sm:mb-5">
                      {card.icon}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{card.title}</h3>
                    <p className="text-xs sm:text-[13px] text-gray-500 mb-2 sm:mb-3 leading-relaxed">{card.desc}</p>
                  </div>
                  {card.action && <div className={`text-xs sm:text-[14px] font-bold ${card.actionColor} truncate`}>{card.action}</div>}
                </FadeInUp>
              ))}
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="flex-[1.2]">
            <FadeInUp delay={0.2} className="bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 sm:mb-3 tracking-tight">Send Us a Message</h2>
              <p className="text-xs sm:text-[14px] text-gray-500 mb-6 sm:mb-8">Fill out the form below and we'll get back to you soon.</p>

              <form className="space-y-4 sm:space-y-5" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input type="text" placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pl-9 sm:pl-11 p-3 sm:p-3.5 transition-colors" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input type="email" placeholder="Email Address" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pl-9 sm:pl-11 p-3 sm:p-3.5 transition-colors" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input type="tel" placeholder="Phone Number" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pl-9 sm:pl-11 p-3 sm:p-3.5 transition-colors" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <input type="text" placeholder="Subject" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pl-9 sm:pl-11 p-3 sm:p-3.5 transition-colors" />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <textarea rows={5} placeholder="Message" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pl-11 p-3.5 transition-colors resize-none"></textarea>
                </div>

                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-[15px] px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300">
                  Send Message <Send className="w-4 h-4"/>
                </button>
              </form>
            </FadeInUp>
          </div>

        </div>
      </section>

      {/* ── FAQS ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-50">
        <FadeInUp className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-[15px] text-gray-500">Quick answers to common questions.</p>
            </div>
            <button className="bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-bold text-sm px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors shadow-sm w-max">
              View All FAQs <ArrowRight className="w-4 h-4"/>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 items-start">
            {[
              { q: "How does SOFRA QR ordering work?", a: "Customers simply scan the QR code placed on their table using their smartphone camera. This instantly opens your digital menu where they can browse, order, and pay without waiting for a server." },
              { q: "Is SOFRA suitable for all restaurant sizes?", a: "Absolutely! Whether you run a small cozy cafe, a bustling food truck, or a multi-location fine dining restaurant, SOFRA scales effortlessly to meet your operational needs." },
              { q: "Is there a setup fee or hidden charges?", a: "No, we believe in complete transparency. There are zero setup fees and no hidden charges. You only pay the flat monthly subscription fee for your chosen plan." },
              { q: "Which payment methods do you support?", a: "We support all major credit/debit cards, Apple Pay, Google Pay, and popular local digital wallets. Payouts are routed directly to your connected bank account." },
              { q: "Can I cancel or change my plan later?", a: "Yes! You are not locked into any long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time directly from your dashboard." },
              { q: "Do you offer a free trial?", a: "Yes, we offer a 14-day fully-featured free trial with no credit card required. You can test out all the premium features before making a commitment." },
            ].map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div 
                  key={i} 
                  className={`bg-white border ${isOpen ? 'border-orange-200' : 'border-gray-100'} rounded-xl sm:rounded-2xl p-3.5 sm:p-5 cursor-pointer hover:border-orange-200 transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] h-max`}
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-[14px] font-bold text-gray-800 leading-snug">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : ''}`}/>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[11px] sm:text-[13.5px] text-gray-500 leading-relaxed border-t border-gray-50 pt-2.5 sm:pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <FadeInUp className="max-w-5xl mx-auto bg-[#0A101D] rounded-3xl p-6 sm:p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative overflow-hidden shadow-2xl">
          {/* Decorative lines */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border border-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>

          <div className="shrink-0 relative z-10 hidden md:block">
            <img src="/images/restaurant_storefront.jpg" alt="Restaurant" className="w-48 h-48 lg:w-64 lg:h-64 object-contain" />
            <div className="absolute top-1/4 -left-4 bg-white rounded-lg p-2 shadow-lg flex items-center gap-2 animate-bounce" style={{animationDuration: '3s'}}>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="absolute bottom-1/4 -right-4 bg-white rounded-lg p-2 shadow-lg flex items-center gap-2 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left z-10 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-4 tracking-tight">
              Ready to <span className="text-orange-500">Elevate</span> Your Restaurant?
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
              Join 50+ restaurants already growing with SOFRA.
            </p>
            <div className="flex flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <Link to="/register" className="flex-1 sm:flex-initial bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm px-5 sm:px-8 py-3 sm:py-3.5 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] whitespace-nowrap">
                Start Free Trial <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
              </Link>
              <Link to="/demo" className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-xs sm:text-sm px-5 sm:px-8 py-3 sm:py-3.5 rounded-full flex items-center justify-center transition-all whitespace-nowrap">
                Book a Demo
              </Link>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-4 lg:gap-6 z-10 w-full pt-6 lg:pt-0 border-t lg:border-t-0 border-white/10">
            {[
              { title: "14-day free trial", desc: "No credit card required", icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"/> },
              { title: "Cancel anytime", desc: "No lock-ins", icon: <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"/> },
              { title: "Quick setup", desc: "Get started in minutes", icon: <Play className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"/> },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <div className="text-white font-bold text-[11px] sm:text-sm whitespace-nowrap">{feature.title}</div>
                  <div className="text-gray-400 text-[10px] sm:text-[11px] hidden sm:block">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeInUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-black text-gray-900 tracking-tight">SOFRA</span>
              </Link>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-6 max-w-xs">
                The seamless QR ordering system for modern restaurants.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"><span className="font-bold text-xs">f</span></div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"><span className="font-bold text-xs">ig</span></div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"><span className="font-bold text-xs">tw</span></div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"><span className="font-bold text-xs">in</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-5">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-[13px] text-gray-500 hover:text-orange-500">Features</Link></li>
                <li><Link to="/pricing" className="text-[13px] text-gray-500 hover:text-orange-500">Pricing</Link></li>
                <li><Link to="/how-it-works" className="text-[13px] text-gray-500 hover:text-orange-500">How it Works</Link></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-orange-500">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-5">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-orange-500">About Us</a></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-orange-500">Blog</a></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-orange-500">Careers</a></li>
                <li><Link to="/contact" className="text-[13px] text-gray-500 hover:text-orange-500">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-5">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-[13px] text-gray-500"><Mail className="w-4 h-4"/> hello@sofra.com</li>
                <li className="flex items-center gap-2 text-[13px] text-gray-500"><Phone className="w-4 h-4"/> +91 12345 67890</li>
                <li className="flex items-start gap-2 text-[13px] text-gray-500"><MapPin className="w-4 h-4 shrink-0 mt-0.5"/> 123 Food Street, Koramangala,<br/>Bangalore, Karnataka 560034</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex items-center justify-center">
            <p className="text-[12px] text-gray-400">© 2024 SOFRA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
