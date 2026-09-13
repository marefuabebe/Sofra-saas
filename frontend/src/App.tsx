import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { api } from "./services/api";
import { updateGlobalConfig } from "./config/config";
import { ConfirmProvider } from "./context/ConfirmContext";

// Components
import PageTransition from "./components/ui/PageTransition";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import FeaturesPage from "./pages/public/FeaturesPage";
import PricingPage from "./pages/public/PricingPage";
import HowItWorksPage from "./pages/public/HowItWorksPage";
import RegisterPage from "./pages/public/RegisterPage";
import LoginPage from "./pages/public/LoginPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";
import ContactPage from "./pages/public/ContactPage";
import TermsPage from "./pages/public/TermsPage";
import PrivacyPage from "./pages/public/PrivacyPage";

// Restaurant dashboard
import RestaurantDashboard from "./pages/restaurant/Dashboard";

// Admin panel
import AdminLogin from "./pages/admin/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";

// Customer ordering
import CustomerMenu from "./pages/customer/CustomerMenu";

// 404
import NotFoundPage from "./pages/NotFoundPage";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/features" element={<PageTransition><FeaturesPage /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
        <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />

        {/* Restaurant Dashboard Routes */}
        <Route path="/dashboard/*" element={<PageTransition><RestaurantDashboard /></PageTransition>} />

        {/* Admin Panel Routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin/*" element={<PageTransition><AdminDashboard /></PageTransition>} />

        {/* Customer Ordering Route */}
        <Route path="/:slug" element={<PageTransition><CustomerMenu /></PageTransition>} />

        {/* 404 */}
        <Route path="/404" element={<PageTransition><NotFoundPage /></PageTransition>} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [configVersion, setConfigVersion] = useState(0);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get("/public/config");
      if (data.success && data.data) {
        // Extract just the currency symbol (e.g. "USD ($)" -> "$ ")
        let currencySymbol = data.data.currency;
        if (currencySymbol.includes("(")) {
          const match = currencySymbol.match(/\((.*?)\)/);
          if (match) currencySymbol = match[1] + " ";
        }
        
        updateGlobalConfig({
          defaultCurrency: currencySymbol,
          appName: data.data.platformName || "SOFRA",
          dateFormat: data.data.dateFormat || "DD MMM, YYYY",
          rowsPerPage: parseInt(data.data.rowsPerPage) || 10
        });
      }
    } catch (err) {
      console.error("Failed to load global config:", err);
    }
  };

  useEffect(() => {
    fetchConfig();

    const handleConfigUpdate = async () => {
      await fetchConfig();
      setConfigVersion(v => v + 1); // Force re-render of the app tree
    };

    window.addEventListener("config_updated", handleConfigUpdate);
    return () => window.removeEventListener("config_updated", handleConfigUpdate);
  }, []);

  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            className: 'text-xs font-bold font-sans',
            duration: 4000,
            style: {
              borderRadius: '16px',
              background: '#090D16',
              color: '#F1F5F9',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#F43F5E',
                secondary: '#FFFFFF',
              },
            },
          }} 
        />
        <AnimatedRoutes key={configVersion} />
      </ConfirmProvider>
    </BrowserRouter>
  );
}

export default App;
