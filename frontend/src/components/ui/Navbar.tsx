import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Store, Menu as MenuIcon, X, Home, Sparkles, CreditCard, Info, Phone, LogIn, ChevronRight } from "lucide-react";
import { APP_CONFIG } from "../../config/config";
import { motion, AnimatePresence } from "framer-motion";

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Features", href: "/features", icon: Sparkles },
    { label: "Pricing", href: "/pricing", icon: CreditCard },
    { label: "How it Works", href: "/how-it-works", icon: Info },
    { label: "Contact", href: "/contact", icon: Phone },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 sticky top-0 z-50 pt-6 pb-2">
      <nav className="max-w-7xl mx-auto bg-[#0B1121] rounded-[24px] px-5 shadow-2xl border border-white/5 relative">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 relative z-10">
            <div className="w-9 h-9 bg-[#F97316] rounded-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black text-[#F97316] tracking-tight">
              {APP_CONFIG.appName}
            </span>
          </Link>

          {/* DESKTOP LINKS (Centered absolutely) */}
          <div className="hidden lg:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {navLinks.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`text-[14px] font-semibold flex items-center gap-1.5 transition-colors relative pb-1
                    ${isActive ? 'text-[#F97316]' : 'text-gray-300 hover:text-white'}
                  `}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'opacity-70'}`} />
                  {item.label}
                  {/* Orange Active Underline */}
                  {isActive && (
                    <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#F97316] rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* RIGHT SIDE BUTTONS */}
          <div className="hidden lg:flex items-center gap-6 relative z-10">
            <Link to="/login" className="text-[14px] font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
              <LogIn className="w-4 h-4 opacity-70" />
              Login
            </Link>
            <Link to="/register" className="bg-white hover:bg-gray-100 text-gray-900 text-[14px] font-bold px-6 py-2.5 rounded-full transition-all shadow-md flex items-center gap-1.5">
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-gray-300 p-1 relative z-10" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* MOBILE MENU (Expandable) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{height: 0, opacity: 0}} animate={{height: "auto", opacity: 1}} exit={{height: 0, opacity: 0}}
              className="lg:hidden py-4 space-y-1 border-t border-white/10 overflow-hidden"
            >
              {navLinks.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold mb-1
                      ${isActive ? 'bg-orange-500/10 text-orange-500' : 'text-gray-300 hover:text-white hover:bg-white/5'}
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 opacity-80" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-3 px-3">
                <Link to="/login" className="flex items-center gap-2 text-sm text-gray-300 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-white text-gray-900 text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
