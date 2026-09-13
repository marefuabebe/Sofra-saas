import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Download, QrCode as QrCodeIcon, ExternalLink, Copy, Share2, 
  Store, Image as ImageIcon, Palette, Clock, CreditCard, Shield, Activity, 
  Smartphone, BarChart3, ShieldCheck, Sparkles, Upload, Save, Lock, LayoutTemplate, Plus, Trash2, Globe,
  ChevronLeft, ChevronRight, CheckCircle2, MapPin, Mail, Phone, Eye, Send, Monitor, RefreshCw, Check, Search
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Alert,
  Loading,
} from "../../components/ui";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../services/api";
import { socket } from "../../config/socket";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Restaurant {
  name: string;
  slug: string;
  verificationStatus: string;
  subscription?: any;
  status?: string;
  subscriptionPlan?: string;
  entitlements?: any;
}

const RestaurantSettings: React.FC = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // default to profile instead of qr to avoid locking them on first load
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth"
      });
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    restaurantType: "",
    logoUrl: "",
    coverUrl: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      tiktok: "",
      telegram: "",
      website: "",
      googleMaps: "",
    },
    aboutUs: {
      text: "",
      imageUrl: "",
    },
    culinaryTeam: [] as { name: string; role: string; imageUrl: string; bio?: string; twitter?: string; instagram?: string; linkedin?: string }[],
    theme: {
      brandColor: "#ff6b00",
      layoutStyle: "list" as "list" | "grid",
    },
    taxRate: 0,
    acceptedPaymentMethods: ["cash"],
    businessHours: null as any,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  // PDF Table Tent States
  const [tableCount, setTableCount] = useState(10);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentRenderTable, setCurrentRenderTable] = useState(1);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data } = await api.get("/auth/me");

        if (!data.success) throw new Error("Failed to load");
        
        setRestaurant({
          name: data.data.restaurantName,
          slug: data.data.restaurantSlug,
          verificationStatus: data.data.verificationStatus,
          subscription: data.data.subscription,
          status: data.data.status,
          subscriptionPlan: data.data.subscriptionPlan,
          entitlements: data.data.entitlements,
        } as any);

        setFormData({
          name: data.data.restaurantName || "",
          phone: data.data.phone || "",
          email: data.data.email || "",
          address: data.data.address || "",
          description: data.data.description || "",
          restaurantType: data.data.restaurantType || "",
          logoUrl: data.data.logoUrl || "",
          coverUrl: data.data.coverUrl || "",
          socialLinks: data.data.socialLinks || {
            facebook: "",
            instagram: "",
            twitter: "",
            linkedin: "",
            tiktok: "",
            telegram: "",
            website: "",
            googleMaps: "",
          },
          businessHours: data.data.businessHours || {
            monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            friday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            saturday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
            sunday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          },
          aboutUs: data.data.aboutUs || { text: "", imageUrl: "" },
          culinaryTeam: data.data.culinaryTeam || [],
          theme: data.data.theme || { brandColor: "#ff6b00", layoutStyle: "list" },
          taxRate: data.data.taxRate || 0,
          acceptedPaymentMethods: data.data.acceptedPaymentMethods || ["cash"],
        });
      } catch (err) {
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();

    const handleSync = () => {
      fetchRestaurant();
    };

    socket.on("verification:approved", handleSync);
    socket.on("subscription:updated", handleSync);

    return () => {
      socket.off("verification:approved", handleSync);
      socket.off("subscription:updated", handleSync);
    };
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      const { data } = await api.put("/restaurant/settings", payload);
      if (data.success) {
        toast.success("Settings updated successfully!");
        setRestaurant(prev => prev ? { ...prev, name: data.data.name } : null);
      }
    } catch (err) {
      toast.error("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQRCode = () => {
    if (!restaurant) return;
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${restaurant.slug}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const generateTableTents = async () => {
    if (!restaurant) return;
    if (tableCount < 1 || tableCount > 100) {
      toast.error("Please enter a valid number of tables (1-100)");
      return;
    }

    setIsGeneratingPDF(true);
    const toastId = toast.loading("Preparing PDF layout...");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4" // 210 x 297 mm
      });

      // We will loop through the table count, update the state, wait a tick, capture, and add to PDF
      for (let i = 1; i <= tableCount; i++) {
        setCurrentRenderTable(i);
        toast.loading(`Generating page ${i} of ${tableCount}...`, { id: toastId });
        
        // Wait for React to render the new table number in the hidden template
        await new Promise(resolve => setTimeout(resolve, 300));

        const element = document.getElementById("table-tent-template");
        if (!element) throw new Error("Template not found");

        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        if (i > 1) {
          pdf.addPage();
        }

        // Add the image to the PDF
        // A4 size is 210x297mm. We'll leave a small margin or fill the page.
        // The aspect ratio of the template should match or we center it.
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, (pdf.internal.pageSize.getHeight() - pdfHeight) / 2, pdfWidth, pdfHeight);
      }

      pdf.save(`${restaurant.slug}-table-tents.pdf`);
      toast.success(`Successfully downloaded PDF for ${tableCount} tables!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy text"));
  };

  const handleShareQR = async () => {
    const menuUrl = `${window.location.origin}/${restaurant?.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurant?.name} - Scan to Order`,
          text: `Check out our digital menu at ${restaurant?.name}!`,
          url: menuUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy(menuUrl);
    }
  };

  if (loading) return <Loading text="Loading settings..." />;
  if (error || !restaurant) return <Alert type="error" message={error || "Restaurant not found"} />;

  const menuUrl = `${window.location.origin}/${restaurant.slug}`;
  const isApproved = restaurant.verificationStatus === "APPROVED";

  const sidebarItems = [
    { id: "qr", icon: <QrCodeIcon className="w-5 h-5" />, title: "QR Code Generator", desc: "", locked: !isApproved },
    { id: "profile", icon: <Store className="w-5 h-5" />, title: "Restaurant Profile", desc: "Update name, contact & address" },
    { id: "images", icon: <ImageIcon className="w-5 h-5" />, title: "Logo & Images", desc: "Upload logo and cover images" },
    { id: "landing", icon: <LayoutTemplate className="w-5 h-5" />, title: "Landing Page", desc: "About Us & Culinary Team" },
    { id: "theme", icon: <Palette className="w-5 h-5" />, title: "Ordering Page Theme", desc: "Customize colors and layout" },
    { id: "hours", icon: <Clock className="w-5 h-5" />, title: "Business Hours", desc: "Set working hours and holidays" },
    { id: "tax", icon: <CreditCard className="w-5 h-5" />, title: "Tax & Payments", desc: "Configure tax rates & payments" },
    { id: "security", icon: <Shield className="w-5 h-5" />, title: "Security", desc: "Change password & security" },
  ];

  // Profile completion calculation
  const completionItems = [
    { label: "Restaurant Name", done: Boolean(formData.name) },
    { label: "Phone Number", done: Boolean(formData.phone) },
    { label: "Physical Address", done: Boolean(formData.address) },
    { label: "Public Email", done: Boolean(formData.email) },
    { label: "Cuisine Type", done: Boolean(formData.restaurantType) },
    { label: "Description / Bio", done: Boolean(formData.description) },
    { label: "Brand Logo", done: Boolean(formData.logoUrl) },
    { label: "Cover Image", done: Boolean(formData.coverUrl) },
    { 
      label: "Business Hours", 
      done: Boolean(formData.businessHours && Object.values(formData.businessHours).some((d: any) => d.isOpen)) 
    },
    { 
      label: "Social / Maps Link", 
      done: Boolean(formData.socialLinks && Object.values(formData.socialLinks).some((v: any) => Boolean(v))) 
    },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  const applyPresetHours = (type: "weekdays" | "all" | "copyMonday") => {
    if (type === "weekdays") {
      setFormData(prev => ({
        ...prev,
        businessHours: {
          ...prev.businessHours,
          monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          friday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
          saturday: prev.businessHours?.saturday || { isOpen: true, openTime: "10:00", closeTime: "23:00" },
          sunday: prev.businessHours?.sunday || { isOpen: true, openTime: "10:00", closeTime: "23:00" },
        }
      }));
      toast.success("Applied 09:00 - 22:00 to Weekdays!");
    } else if (type === "all") {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const updated: any = {};
      allDays.forEach(d => {
        updated[d] = { isOpen: true, openTime: "10:00", closeTime: "23:00" };
      });
      setFormData(prev => ({ ...prev, businessHours: updated }));
      toast.success("Applied 10:00 - 23:00 to All 7 Days!");
    } else if (type === "copyMonday") {
      const mon = formData.businessHours?.monday || { isOpen: true, openTime: "09:00", closeTime: "22:00" };
      const allDays = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const updated: any = { monday: { ...mon } };
      allDays.forEach(d => {
        updated[d] = { ...mon };
      });
      setFormData(prev => ({ ...prev, businessHours: updated }));
      toast.success("Copied Monday's schedule to all other days!");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <style>{`
        .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          height: 100%;
          width: 100%;
          margin-left: 8px;
        }
        .PhoneInputCountry {
          margin-right: 8px;
        }
      `}</style>

      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt={formData.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {formData.name || restaurant.name || "Restaurant Settings"}
              </h2>
              {isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Storefront
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Verification Pending
                </span>
              )}
              {restaurant.subscriptionPlan && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                  {restaurant.subscriptionPlan} Plan
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Manage branding, digital table QR codes & operations</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">Live URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono text-xs">/{restaurant.slug}</code></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Preview Storefront</span>
          </a>
          <Button
            icon={<Save className="w-4 h-4" />}
            onClick={() => handleSaveProfile()}
            loading={isSaving}
            className="px-5 py-2.5 shadow-md shadow-orange-500/20 font-bold"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Horizontal Navigation Tabs with Scroll Arrows */}
        <div className="w-full">
          <div className="relative flex items-center">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="absolute left-1 z-10 p-2 rounded-xl bg-white/95 border border-gray-200 shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all hidden md:flex items-center justify-center -translate-x-1/2"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Tabs List */}
            <div
              ref={tabsScrollRef}
              className="flex flex-row overflow-x-auto hide-scrollbar gap-2 p-1.5 bg-white rounded-2xl border border-border shadow-sm w-full scroll-smooth items-center"
            >
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.locked) {
                        navigate('/dashboard/verification');
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#F97316] text-white shadow-md shadow-orange-500/25 scale-[1.01]'
                        : item.locked
                        ? 'text-gray-400 hover:bg-gray-50 opacity-70'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <div className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}>
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                    {item.locked && <Lock className="w-3.5 h-3.5 text-gray-400 ml-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="absolute right-1 z-10 p-2 rounded-xl bg-white/95 border border-gray-200 shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all hidden md:flex items-center justify-center translate-x-1/2"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 w-full max-w-7xl mx-auto">
          
          {/* QR Code Generator Tab */}
          {activeTab === "qr" && (
            <>
              <Card className="border-border shadow-sm p-8">
                <div className="flex items-start space-x-4 mb-8">
                  <div className="bg-accent/10 p-3 rounded-2xl shrink-0">
                    <QrCodeIcon className="w-7 h-7 text-accent" />
                  </div>
                  <div className="mt-1">
                    <h3 className="text-2xl font-bold text-text">QR Code Generator</h3>
                    <p className="text-text-secondary text-sm mt-1">
                      Download and print your unique QR code for customers to scan and view your menu.
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
                  <div className="flex flex-col space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border flex items-center justify-center">
                      <QRCodeSVG
                        id="qr-code-svg"
                        value={menuUrl}
                        size={280}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="flex flex-col space-y-3 pt-2">
                      <button onClick={downloadQRCode} className="flex items-center justify-center space-x-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-bold transition-colors shadow-sm">
                        <Download className="w-5 h-5" /><span>Download QR Code</span>
                      </button>
                      <button onClick={handleShareQR} className="flex items-center justify-center space-x-2 bg-white hover:bg-bg-subtle text-text py-3 rounded-xl font-bold transition-colors border border-border shadow-sm">
                        <Share2 className="w-5 h-5" /><span>Share QR Code</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-text mb-2 block">Restaurant Name</label>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-border shadow-sm">
                        <span className="font-medium text-text px-1">{restaurant.name}</span>
                        <button onClick={() => handleCopy(restaurant.name)} className="p-2 text-text-secondary hover:text-text rounded-md hover:bg-bg-subtle transition-colors"><Copy className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-text mb-2 block">Menu URL</label>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-border shadow-sm">
                        <span className="text-text-secondary text-sm truncate px-1">{menuUrl}</span>
                        <button onClick={() => handleCopy(menuUrl)} className="p-2 text-text-secondary hover:text-text rounded-md hover:bg-bg-subtle transition-colors shrink-0"><Copy className="w-4 h-4" /></button>
                      </div>
                      <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 mt-3 bg-white border border-border shadow-sm rounded-lg text-sm font-bold text-text hover:bg-bg-subtle transition-colors">
                        <ExternalLink className="w-4 h-4 mr-2" />Open menu in new tab
                      </a>
                    </div>
                    <div className="bg-[#fff7f0] border border-[#ffe0cc] rounded-2xl p-6 mt-4">
                      <h4 className="font-bold text-text mb-4 text-base">How to use</h4>
                      <ul className="space-y-4">
                        <li className="flex items-start"><span className="bg-accent text-white font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0 text-xs shadow-sm">1</span><span className="text-text-secondary text-sm mt-0.5">Download the QR code image</span></li>
                        <li className="flex items-start"><span className="bg-accent text-white font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0 text-xs shadow-sm">2</span><span className="text-text-secondary text-sm mt-0.5">Print and place it on tables or entrance</span></li>
                        <li className="flex items-start"><span className="bg-accent text-white font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0 text-xs shadow-sm">3</span><span className="text-text-secondary text-sm mt-0.5">Customers scan with any smartphone camera</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="mt-8 border-border shadow-sm p-8">
                <div className="flex items-start space-x-4 mb-8">
                  <div className="bg-[#fff7f0] p-3 rounded-2xl shrink-0">
                    <LayoutTemplate className="w-7 h-7 text-accent" />
                  </div>
                  <div className="mt-1">
                    <h3 className="text-2xl font-bold text-text">PDF Table Tents</h3>
                    <p className="text-text-secondary text-sm mt-1">
                      Generate unique QR codes for each table. Customers can scan to order directly to their table number.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-border flex flex-col md:flex-row md:items-end gap-4 max-w-2xl">
                  <div className="flex-1">
                    <label className="text-sm font-bold text-text mb-2 block">Number of Tables</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={tableCount} 
                      onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  <Button 
                    className="shrink-0"
                    onClick={generateTableTents} 
                    disabled={isGeneratingPDF}
                    icon={isGeneratingPDF ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                  >
                    {isGeneratingPDF ? "Generating PDF..." : "Download Table Tents"}
                  </Button>
                </div>
              </Card>

              {/* Hidden template for PDF generation */}
              <div className="overflow-hidden h-0 w-0 absolute opacity-0 pointer-events-none">
                <div 
                  id="table-tent-template" 
                  className="bg-white flex flex-col items-center justify-center relative"
                  style={{ width: '800px', height: '1131px', padding: '60px' }} // Approx A4 ratio at higher res
                >
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-white" />
                  <div className="absolute top-0 left-0 w-full h-4 bg-accent" />
                  <div className="absolute bottom-0 left-0 w-full h-4 bg-accent" />
                  
                  <div className="relative z-10 flex flex-col items-center w-full h-full border-4 border-accent/20 rounded-3xl p-12 text-center">
                    {formData.logoUrl && (
                      <img src={formData.logoUrl} alt="Logo" className="w-32 h-32 rounded-full object-cover mb-8 shadow-md border-4 border-white" crossOrigin="anonymous" />
                    )}
                    <h1 className="text-5xl font-black text-gray-900 mb-2">{formData.name || restaurant?.name}</h1>
                    <p className="text-xl text-gray-500 mb-16 font-medium">Scan to view our menu and order</p>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-16 border border-gray-100">
                      <QRCodeSVG
                        value={`${menuUrl}?table=${currentRenderTable}`}
                        size={350}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    
                    <div className="mt-auto bg-accent text-white px-16 py-6 rounded-full shadow-lg">
                      <p className="text-2xl font-bold uppercase tracking-widest opacity-80 mb-1">Table</p>
                      <p className="text-7xl font-black">{currentRenderTable}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="p-4 flex items-center space-x-4 border-border shadow-sm"><div className="bg-green-100 p-3 rounded-full shrink-0"><Activity className="w-5 h-5 text-green-600" /></div><div><h4 className="font-bold text-text text-sm">Real-time Updates</h4><p className="text-[11px] text-text-secondary leading-tight mt-0.5">Menu changes reflect instantly</p></div></Card>
                <Card className="p-4 flex items-center space-x-4 border-border shadow-sm"><div className="bg-blue-100 p-3 rounded-full shrink-0"><Smartphone className="w-5 h-5 text-blue-600" /></div><div><h4 className="font-bold text-text text-sm">Easy Access</h4><p className="text-[11px] text-text-secondary leading-tight mt-0.5">Customers access menu without any app</p></div></Card>
                <Card className="p-4 flex items-center space-x-4 border-border shadow-sm"><div className="bg-purple-100 p-3 rounded-full shrink-0"><BarChart3 className="w-5 h-5 text-purple-600" /></div><div><h4 className="font-bold text-text text-sm">Track Scans</h4><p className="text-[11px] text-text-secondary leading-tight mt-0.5">Monitor QR code scans and engagement</p></div></Card>
                <Card className="p-4 flex items-center space-x-4 border-border shadow-sm"><div className="bg-orange-100 p-3 rounded-full shrink-0"><ShieldCheck className="w-5 h-5 text-orange-600" /></div><div><h4 className="font-bold text-text text-sm">Secure & Reliable</h4><p className="text-[11px] text-text-secondary leading-tight mt-0.5">Your menu is always available</p></div></Card>
              </div>
            </>
          )}

          {/* Restaurant Profile Tab */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column - Form Fields (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-2xl shrink-0 text-primary">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Brand & Core Details</h3>
                      <p className="text-gray-500 text-sm mt-0.5">Establish your restaurant name, cuisine identity, and customer bio.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Restaurant Name *</label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          placeholder="e.g. Habesha Gourmet"
                          className="w-full" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Cuisine / Restaurant Type</label>
                        <Input 
                          value={formData.restaurantType} 
                          onChange={(e) => setFormData({...formData, restaurantType: e.target.value})} 
                          placeholder="e.g. Ethiopian, Traditional, Cafe"
                          className="w-full" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Physical Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="e.g. Bole Road, Behind Edna Mall, Addis Ababa"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Description / Bio</label>
                      <textarea 
                        className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y" 
                        rows={3}
                        placeholder="Tell your guests about your culinary heritage, fresh ingredients, and signature dining experience..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                      <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                        <span>Visible on your diner landing and menu pages</span>
                        <span>{formData.description?.length || 0} characters</span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="pt-5 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>Contact & Communication</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                          <div className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <PhoneInput
                              international
                              defaultCountry="ET"
                              value={formData.phone} 
                              onChange={(val: any) => setFormData({...formData, phone: val || ""})} 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Public Email</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="email"
                              value={formData.email} 
                              onChange={(e) => setFormData({...formData, email: e.target.value})} 
                              placeholder="contact@restaurant.et"
                              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="pt-5 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>Social Media & Location Links</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">Telegram Link / Username</label>
                          <Input 
                            value={formData.socialLinks.telegram} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, telegram: e.target.value}})} 
                            placeholder="https://t.me/yourrestaurant"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">Instagram URL</label>
                          <Input 
                            value={formData.socialLinks.instagram} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} 
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">TikTok URL</label>
                          <Input 
                            value={formData.socialLinks.tiktok} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, tiktok: e.target.value}})} 
                            placeholder="https://tiktok.com/@..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">Facebook URL</label>
                          <Input 
                            value={formData.socialLinks.facebook} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})} 
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">Official Website</label>
                          <Input 
                            value={formData.socialLinks.website} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, website: e.target.value}})} 
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-semibold mb-1 block">Google Maps Link</label>
                          <Input 
                            value={formData.socialLinks.googleMaps} 
                            onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, googleMaps: e.target.value}})} 
                            placeholder="https://maps.google.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Changes are committed to server when saved</span>
                      <Button icon={<Save className="w-4 h-4" />} loading={isSaving}>Save Profile Changes</Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Right Column - Storefront Live Mirror & Completeness Scorecard (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Diner Card Preview */}
                <Card className="border-border shadow-sm overflow-hidden bg-white">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Live Customer Mirror</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Real-time Preview
                    </span>
                  </div>

                  {/* Hero banner preview */}
                  <div className="relative h-32 bg-gradient-to-r from-orange-500 via-amber-500 to-primary flex items-center justify-center overflow-hidden">
                    {formData.coverUrl ? (
                      <img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white/80 text-xs font-medium tracking-wide flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>Cover Banner Placeholder</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>

                  {/* Restaurant avatar & identity */}
                  <div className="px-6 pb-6 pt-0 relative">
                    <div className="-mt-10 mb-3 flex items-end justify-between">
                      <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-9 h-9 text-primary" />
                        )}
                      </div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-gray-900 leading-tight">
                      {formData.name || restaurant?.name || "Restaurant Name"}
                    </h4>
                    <p className="text-xs text-primary font-bold mt-0.5">
                      {formData.restaurantType || "Ethiopian & International Cuisine"}
                    </p>

                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {formData.description || "Welcome to our digital menu. Enjoy authentic dining and fast QR ordering directly from your table."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{formData.address || "Addis Ababa, Ethiopia"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formData.phone || "+251 (Add phone)"}</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <a
                        href={menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-primary font-bold text-xs border border-orange-200 transition-colors shadow-sm"
                      >
                        <span>Visit Customer Menu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Profile Completeness Card */}
                <Card className="border-border shadow-sm p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Storefront Completeness</span>
                    </h4>
                    <span className="text-sm font-black text-primary">{completionPercentage}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {completionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${item.done ? 'bg-emerald-100 text-emerald-600 font-bold' : 'bg-gray-100 text-gray-400'}`}>
                          {item.done ? "✓" : "•"}
                        </div>
                        <span className={`truncate ${item.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-[11px] text-orange-800 leading-relaxed">
                    💡 Complete profiles build customer trust and increase dine-in QR scan orders by up to <strong>35%</strong>.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Logo & Images Tab */}
          {activeTab === "images" && (
            <Card className="border-border shadow-sm p-8">
              <div className="flex items-start space-x-4 mb-8">
                <div className="bg-accent/10 p-3 rounded-2xl shrink-0"><ImageIcon className="w-7 h-7 text-accent" /></div>
                <div className="mt-1">
                  <h3 className="text-2xl font-bold text-text">Logo & Images</h3>
                  <p className="text-text-secondary text-sm mt-1">Upload your brand assets to display on your digital menu.</p>
                </div>
              </div>
              <div className="relative">
                {!restaurant?.entitlements?.customTheme && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border border-orange-200/50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm text-center border border-gray-100">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-orange-500" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Pro</h4>
                      <p className="text-sm text-gray-500 mb-6">Custom logo and cover image uploads are available on the Pro plan.</p>
                      <Button onClick={() => navigate("/dashboard/billing")} className="w-full">
                        View Plans
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className={`space-y-8 max-w-2xl ${!restaurant?.entitlements?.customTheme ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
                  <div>
                    <label className="label mb-3">Restaurant Logo</label>
                    <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-bg-subtle border-2 border-dashed border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                      {uploadingImage === "logo" ? (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">Uploading</span>
                        </div>
                      ) : null}
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-text-secondary/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className={`inline-flex items-center justify-center px-4 py-2 border-2 border-accent text-accent font-semibold rounded-lg cursor-pointer transition-colors mb-2 ${uploadingImage === "logo" ? 'opacity-50 pointer-events-none' : 'hover:bg-accent hover:text-white'}`}>
                        {uploadingImage === "logo" ? (
                          <><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2"></div> Uploading...</>
                        ) : (
                          <><Upload className="w-4 h-4 mr-2" /> Upload Logo</>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          disabled={uploadingImage === "logo"}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage("logo");
                            const form = new FormData();
                            form.append("image", file);
                            try {
                              const { data } = await api.post("/restaurant/upload", form, {
                                headers: { "Content-Type": "multipart/form-data" }
                              });
                              if (data.success) {
                                setFormData(prev => ({ ...prev, logoUrl: data.data.url }));
                                toast.success("Logo uploaded successfully!");
                              }
                            } catch (err) {
                              toast.error("Upload failed.");
                            } finally {
                              setUploadingImage(null);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-text-secondary">Recommended size: 256x256px. PNG or JPG.</p>
                      {formData.logoUrl && (
                        <button 
                          onClick={() => setFormData(prev => ({...prev, logoUrl: ""}))}
                          className="text-xs text-red-500 hover:text-red-600 font-medium mt-2 block"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full h-px bg-border/50"></div>
                <div>
                  <label className="label mb-3">Cover Image</label>
                  <div className="w-full h-48 rounded-xl bg-bg-subtle border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative">
                    {uploadingImage === "cover" ? (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 text-white">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="font-bold">Uploading Cover...</span>
                      </div>
                    ) : null}
                    
                    {formData.coverUrl ? (
                      <img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-text-secondary/50 mb-2" />
                        <span className="font-medium text-text-secondary">No cover image uploaded</span>
                      </>
                    )}
                    
                    <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity ${formData.coverUrl ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                      <label className={`inline-flex items-center justify-center px-4 py-2 bg-white text-black hover:bg-gray-100 font-semibold rounded-lg cursor-pointer transition-colors ${uploadingImage === "cover" ? 'pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4 mr-2" /> {formData.coverUrl ? 'Change Cover' : 'Upload Cover'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          disabled={uploadingImage === "cover"}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage("cover");
                            const form = new FormData();
                            form.append("image", file);
                            try {
                              const { data } = await api.post("/restaurant/upload", form, {
                                headers: { "Content-Type": "multipart/form-data" }
                              });
                              if (data.success) {
                                setFormData(prev => ({ ...prev, coverUrl: data.data.url }));
                                toast.success("Cover image uploaded!");
                              }
                            } catch (err) {
                              toast.error("Upload failed.");
                            } finally {
                              setUploadingImage(null);
                            }
                          }}
                        />
                      </label>
                      {formData.coverUrl && (
                        <button 
                          onClick={() => setFormData(prev => ({...prev, coverUrl: ""}))}
                          className="mt-3 text-white text-sm hover:text-red-400 font-medium bg-black/50 px-3 py-1 rounded-full"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">Recommended size: 1200x400px. High quality landscape image.</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button icon={<Save className="w-4 h-4" />} onClick={handleSaveProfile} loading={isSaving}>Save Changes</Button>
                </div>
              </div>
              </div>
            </Card>
          )}

          {/* Landing Page Content Tab */}
          {activeTab === "landing" && (
            <Card className="border-border shadow-sm p-8">
              <div className="flex items-start space-x-4 mb-8">
                <div className="bg-accent/10 p-3 rounded-2xl shrink-0"><LayoutTemplate className="w-7 h-7 text-accent" /></div>
                <div className="mt-1">
                  <h3 className="text-2xl font-bold text-text">Landing Page</h3>
                  <p className="text-text-secondary text-sm mt-1">Configure your restaurant's "About Us" and "Culinary Team" sections.</p>
                </div>
              </div>
              <div className="space-y-8 max-w-2xl">
                
                {/* About Us */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-text">About Us</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="label mb-2">Description</label>
                      <textarea
                        className="w-full input min-h-[120px] py-3"
                        placeholder="Tell your customers about your restaurant's story..."
                        value={formData.aboutUs.text}
                        onChange={(e) => setFormData(prev => ({...prev, aboutUs: {...prev.aboutUs, text: e.target.value}}))}
                      ></textarea>
                    </div>
                    <div>
                      <label className="label mb-2">About Us Photo</label>
                      <div className="flex items-center gap-4">
                        {formData.aboutUs.imageUrl && (
                          <div className="w-32 h-32 rounded-lg overflow-hidden border border-border">
                            <img src={formData.aboutUs.imageUrl} alt="About Us" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <label className={`inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-border hover:border-accent font-medium rounded-lg cursor-pointer transition-colors h-32 w-32 text-center text-sm flex-col relative overflow-hidden ${uploadingImage === "about" ? 'pointer-events-none' : 'text-text-secondary hover:text-accent'}`}>
                          {uploadingImage === "about" ? (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 text-white">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mb-2" />
                              {formData.aboutUs.imageUrl ? "Change" : "Upload"}
                            </>
                          )}
                          <input 
                            type="file" className="hidden" accept="image/*"
                            disabled={uploadingImage === "about"}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImage("about");
                              const form = new FormData(); form.append("image", file);
                              try {
                                const { data } = await api.post("/restaurant/upload", form, { headers: { "Content-Type": "multipart/form-data" }});
                                if (data.success) {
                                  setFormData(prev => ({...prev, aboutUs: {...prev.aboutUs, imageUrl: data.data.url}}));
                                  toast.success("Image uploaded!");
                                }
                              } catch (err) { toast.error("Upload failed."); }
                              finally { setUploadingImage(null); }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border/50"></div>

                {/* Culinary Team */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-text">Culinary Team</h4>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`${window.location.origin}/${restaurant.slug}#chefs`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 font-bold border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors shadow-sm text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Live Preview
                      </a>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setFormData(prev => ({
                          ...prev, 
                          culinaryTeam: [...prev.culinaryTeam, { name: "", role: "", imageUrl: "", bio: "", twitter: "", instagram: "", linkedin: "" }]
                        }))}
                      >
                        Add Member
                      </Button>
                    </div>
                  </div>
                  
                  {formData.culinaryTeam.length === 0 ? (
                    <div className="text-center py-8 bg-bg-subtle rounded-xl border border-dashed border-border text-text-secondary">
                      No team members added yet. Add your chefs!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.culinaryTeam.map((member, index) => (
                        <div key={index} className="flex gap-4 items-start p-4 border border-border rounded-xl bg-bg">
                          <div className="shrink-0">
                            <label className={`w-20 h-20 rounded-full border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-bg-subtle relative group ${uploadingImage === `chef-${index}` ? 'pointer-events-none' : ''}`}>
                              {uploadingImage === `chef-${index}` ? (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 text-white">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : null}
                              {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-text-secondary/50" />
                              )}
                              <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                <Upload className="w-5 h-5 text-white" />
                              </div>
                              <input 
                                type="file" className="hidden" accept="image/*"
                                disabled={uploadingImage === `chef-${index}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingImage(`chef-${index}`);
                                  const form = new FormData(); form.append("image", file);
                                  try {
                                    const { data } = await api.post("/restaurant/upload", form, { headers: { "Content-Type": "multipart/form-data" }});
                                    if (data.success) {
                                      const newTeam = [...formData.culinaryTeam];
                                      newTeam[index].imageUrl = data.data.url;
                                      setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                                      toast.success("Chef photo uploaded!");
                                    }
                                  } catch (err) { toast.error("Upload failed."); }
                                  finally { setUploadingImage(null); }
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input 
                              placeholder="Name (e.g. Gordon Ramsay)" 
                              value={member.name}
                              onChange={(e) => {
                                const newTeam = [...formData.culinaryTeam];
                                newTeam[index].name = e.target.value;
                                setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                              }}
                            />
                            <Input 
                              placeholder="Role (e.g. Executive Chef)" 
                              value={member.role}
                              onChange={(e) => {
                                const newTeam = [...formData.culinaryTeam];
                                newTeam[index].role = e.target.value;
                                setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                              }}
                            />
                            <textarea
                              placeholder="Short Bio (Optional)"
                              className="input w-full min-h-[80px]"
                              value={member.bio || ""}
                              onChange={(e) => {
                                const newTeam = [...formData.culinaryTeam];
                                newTeam[index].bio = e.target.value;
                                setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                              }}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input 
                                placeholder="Twitter URL" 
                                value={member.twitter || ""}
                                onChange={(e) => {
                                  const newTeam = [...formData.culinaryTeam];
                                  newTeam[index].twitter = e.target.value;
                                  setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                                }}
                              />
                              <Input 
                                placeholder="Instagram URL" 
                                value={member.instagram || ""}
                                onChange={(e) => {
                                  const newTeam = [...formData.culinaryTeam];
                                  newTeam[index].instagram = e.target.value;
                                  setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                                }}
                              />
                              <Input 
                                placeholder="LinkedIn URL" 
                                value={member.linkedin || ""}
                                onChange={(e) => {
                                  const newTeam = [...formData.culinaryTeam];
                                  newTeam[index].linkedin = e.target.value;
                                  setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                                }}
                              />
                            </div>
                          </div>
                          <button 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => {
                              const newTeam = formData.culinaryTeam.filter((_, i) => i !== index);
                              setFormData(prev => ({...prev, culinaryTeam: newTeam}));
                            }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <Button icon={<Save className="w-4 h-4" />} onClick={handleSaveProfile} loading={isSaving}>Save Landing Page</Button>
                </div>

                {/* Standardized Platform Sections Notice */}
                <div className="mt-8 p-5 bg-orange-50/70 border border-orange-200/80 rounded-2xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#d4512e] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                        <span>Standardized Platform Sections</span>
                        <span className="text-[10px] uppercase font-black bg-orange-200/70 text-orange-900 px-2 py-0.5 rounded-full">Common & Constant</span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        The <strong>SOFRA Dining Guarantee</strong>, <strong>Universal Diner FAQ</strong>, and <strong>How It Works</strong> sections are automatically included and standardized across all SOFRA restaurant storefronts. These trust-building sections cannot be edited or removed to guarantee a consistent customer experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Ordering Page Theme Tab */}
          {activeTab === "theme" && (
            <Card className="border-border shadow-sm p-8">
              <div className="flex items-start space-x-4 mb-8">
                <div className="bg-accent/10 p-3 rounded-2xl shrink-0"><Palette className="w-7 h-7 text-accent" /></div>
                <div className="mt-1">
                  <h3 className="text-2xl font-bold text-text">Ordering Page Theme</h3>
                  <p className="text-text-secondary text-sm mt-1">Customize the look and feel of your customer-facing digital menu.</p>
                </div>
              </div>
              <div className="relative">
                {!restaurant?.entitlements?.customTheme && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border border-orange-200/50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm text-center border border-gray-100">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-orange-500" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Pro</h4>
                      <p className="text-sm text-gray-500 mb-6">Custom theme colors and advanced layouts are available on the Pro plan.</p>
                      <Button onClick={() => navigate("/dashboard/billing")} className="w-full">
                        View Plans
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className={`space-y-8 max-w-2xl ${!restaurant?.entitlements?.customTheme ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
                  <div>
                    <label className="label mb-3">Brand Color</label>
                    <div className="flex items-center gap-4">
                      {['#ff6b00', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#111827'].map((color) => (
                        <button 
                          key={color} 
                          onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, brandColor: color } }))}
                          className={`w-10 h-10 rounded-full border-2 ${formData.theme.brandColor === color ? 'border-text scale-110 shadow-sm' : 'border-transparent hover:scale-110'} transition-all`}
                          style={{ backgroundColor: color }}
                        ></button>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-text transition-colors">
                        <span className="text-text-secondary text-xl">+</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label mb-3">Layout Style</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, layoutStyle: "list" } }))}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${formData.theme.layoutStyle === "list" ? 'border-accent bg-accent/5' : 'border-transparent hover:border-border'}`}
                      >
                        <div className="w-full h-24 bg-white rounded border border-border/50 mb-2 flex flex-col p-2 gap-2">
                          <div className="w-1/2 h-3 bg-bg-subtle rounded"></div>
                          <div className="flex gap-2"><div className="w-8 h-8 bg-bg-subtle rounded"></div><div className="w-1/2 h-8 bg-bg-subtle rounded"></div></div>
                        </div>
                        <span className={`font-bold text-sm ${formData.theme.layoutStyle === "list" ? 'text-text' : 'text-text-secondary'}`}>Modern List {formData.theme.layoutStyle === "list" && '(Active)'}</span>
                      </div>
                      <div 
                        onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, layoutStyle: "grid" } }))}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${formData.theme.layoutStyle === "grid" ? 'border-accent bg-accent/5' : 'border-transparent hover:border-border'}`}
                      >
                        <div className="w-full h-24 bg-white rounded border border-border/50 mb-2 grid grid-cols-2 gap-2 p-2">
                          <div className="w-full h-full bg-bg-subtle rounded"></div><div className="w-full h-full bg-bg-subtle rounded"></div>
                        </div>
                        <span className={`font-bold text-sm ${formData.theme.layoutStyle === "grid" ? 'text-text' : 'text-text-secondary'}`}>Grid View {formData.theme.layoutStyle === "grid" && '(Active)'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button icon={<Save className="w-4 h-4" />} onClick={handleSaveProfile} loading={isSaving}>Save Theme</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Business Hours Tab */}
          {activeTab === "hours" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Weekly Schedule (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-2xl shrink-0 text-primary">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Operating Schedule</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Set regular business hours for dine-in and online orders.</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Presets */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 mb-6">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">Quick Schedule Presets</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPresetHours("weekdays")}
                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary text-xs font-bold text-gray-700 transition-all shadow-xs"
                      >
                        ⏰ Mon–Fri 09:00–22:00
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetHours("all")}
                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary text-xs font-bold text-gray-700 transition-all shadow-xs"
                      >
                        🌟 All 7 Days 10:00–23:00
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetHours("copyMonday")}
                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary text-xs font-bold text-gray-700 transition-all shadow-xs"
                      >
                        ⚡ Copy Monday to All
                      </button>
                    </div>
                  </div>

                  {/* Day by Day List */}
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayData = formData.businessHours?.[day] || { isOpen: false, openTime: "09:00", closeTime: "22:00" };
                      return (
                        <div 
                          key={day} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                            dayData.isOpen 
                              ? 'bg-white border-gray-200 shadow-xs' 
                              : 'bg-gray-50/60 border-dashed border-gray-200 opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full sm:w-1/3 mb-2 sm:mb-0">
                            <input 
                              type="checkbox" 
                              id={`check-${day}`}
                              checked={dayData.isOpen} 
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [day]: { ...dayData, isOpen: e.target.checked }
                                }
                              }))}
                              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer" 
                            />
                            <label htmlFor={`check-${day}`} className="font-bold text-gray-900 capitalize text-sm cursor-pointer select-none">
                              {day}
                            </label>
                          </div>

                          {dayData.isOpen ? (
                            <div className="flex items-center gap-2.5 w-full sm:w-2/3">
                              <input 
                                type="time"
                                value={dayData.openTime}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  businessHours: {
                                    ...prev.businessHours,
                                    [day]: { ...dayData, openTime: e.target.value }
                                  }
                                }))}
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-primary" 
                              />
                              <span className="text-gray-400 text-xs font-medium">to</span>
                              <input 
                                type="time"
                                value={dayData.closeTime}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  businessHours: {
                                    ...prev.businessHours,
                                    [day]: { ...dayData, closeTime: e.target.value }
                                  }
                                }))}
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-primary" 
                              />
                              <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Open
                              </span>
                            </div>
                          ) : (
                            <div className="w-full sm:w-2/3 flex items-center justify-between sm:justify-end">
                              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                                Closed
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Changes reflect on your live QR diner menu instantly</span>
                    <Button icon={<Save className="w-4 h-4" />} onClick={() => handleSaveProfile()} loading={isSaving}>Save Hours</Button>
                  </div>
                </Card>
              </div>

              {/* Right Column: Operating Summary & Live Status (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border-border shadow-sm p-6 bg-white">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Customer Schedule Card</span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/60 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Store Status</span>
                    </div>
                    <p className="text-base font-black text-gray-900">
                      Open for Table Ordering
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Customers scanning QR codes can browse dishes and send orders to your kitchen.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      const dayData = formData.businessHours?.[day];
                      return (
                        <div key={day} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                          <span className="capitalize font-semibold text-gray-700">{day}</span>
                          {dayData?.isOpen ? (
                            <span className="font-mono text-gray-900 font-medium">
                              {dayData.openTime} – {dayData.closeTime}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700 leading-relaxed">
                    💡 If your restaurant is temporarily closed for maintenance or a national holiday, uncheck the open days here to notify diners.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Tax & Payments Tab */}
          {activeTab === "tax" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column - Configuration (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-2xl shrink-0 text-primary">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Tax & Billing Settings</h3>
                      <p className="text-gray-500 text-sm mt-0.5">Configure default sales VAT and manage accepted diner payment methods.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                        Default Tax Rate (%)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input 
                            type="number" 
                            value={formData.taxRate} 
                            onChange={(e) => setFormData(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))} 
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            step="0.01" 
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                        </div>
                      </div>

                      {/* Ethiopian Standard Presets */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-medium mr-1">Ethiopian Presets:</span>
                        {[
                          { label: "15% (Standard VAT)", val: 15 },
                          { label: "10% (Service Fee)", val: 10 },
                          { label: "0% (Tax Inclusive)", val: 0 }
                        ].map(preset => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, taxRate: preset.val }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              formData.taxRate === preset.val 
                                ? 'bg-[#F97316] text-white border-[#F97316] shadow-xs' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This tax percentage is applied automatically to all digital table orders and dine-in bills.
                      </p>
                    </div>

                    <div className="pt-5 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
                        Accepted Payment Methods
                      </label>
                      <div className="space-y-3">
                        <label className={`flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all ${formData.acceptedPaymentMethods.includes("cash") ? 'border-primary bg-primary/5 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox" 
                            checked={formData.acceptedPaymentMethods.includes("cash")} 
                            onChange={(e) => {
                              setFormData(prev => {
                                const methods = new Set(prev.acceptedPaymentMethods);
                                if (e.target.checked) methods.add("cash"); else methods.delete("cash");
                                return { ...prev, acceptedPaymentMethods: Array.from(methods) };
                              });
                            }}
                            className="w-4 h-4 text-primary rounded focus:ring-primary mt-1" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-sm">Cash on Delivery & Table Cash</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Instant • 0% Fee
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Diners pay cash directly to the server or cash desk upon meal delivery.</p>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all ${formData.acceptedPaymentMethods.includes("online") ? 'border-primary bg-primary/5 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox" 
                            checked={formData.acceptedPaymentMethods.includes("online")}
                            onChange={(e) => {
                              setFormData(prev => {
                                const methods = new Set(prev.acceptedPaymentMethods);
                                if (e.target.checked) methods.add("online"); else methods.delete("online");
                                return { ...prev, acceptedPaymentMethods: Array.from(methods) };
                              });
                            }}
                            className="w-4 h-4 text-primary rounded focus:ring-primary mt-1" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-gray-900 text-sm">Digital Mobile & Card Payments</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                  Telebirr
                                </span>
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                  CBE Birr
                                </span>
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                  Chapa
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Seamless QR mobile wallet checkout directly from the customer's phone.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Tax updates take effect immediately</span>
                      <Button icon={<Save className="w-4 h-4" />} loading={isSaving}>Save Tax & Payments</Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Right Column - Live Tax Calculation Simulator (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border-border shadow-sm p-6 bg-white">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Diner Bill Simulator</span>
                  </h4>

                  {/* Simulated Receipt */}
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-700 space-y-3">
                    <div className="text-center border-b border-dashed border-gray-300 pb-3">
                      <p className="font-bold text-sm text-gray-900">{formData.name || restaurant?.name || "SOFRA RESTAURANT"}</p>
                      <p className="text-[10px] text-gray-400">TABLE 04 • SIMULATED RECEIPT</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span>1x Doro Wat Special</span>
                        <span>350.00 ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Fresh Avocado Juice</span>
                        <span>150.00 ETB</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal:</span>
                        <span>500.00 ETB</span>
                      </div>
                      <div className="flex justify-between text-primary font-bold">
                        <span>VAT Tax ({formData.taxRate}%):</span>
                        <span>+{(500 * (formData.taxRate / 100)).toFixed(2)} ETB</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-900 pt-2 flex justify-between font-black text-sm text-gray-900">
                      <span>TOTAL DUE:</span>
                      <span>{(500 * (1 + formData.taxRate / 100)).toFixed(2)} ETB</span>
                    </div>
                  </div>

                  <div className="mt-5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
                    ✓ Ethiopian tax law requires commercial food establishments to issue transparent VAT breakdowns on guest folios.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card className="border-border shadow-sm p-8">
              <div className="flex items-start space-x-4 mb-8">
                <div className="bg-accent/10 p-3 rounded-2xl shrink-0"><Shield className="w-7 h-7 text-accent" /></div>
                <div className="mt-1">
                  <h3 className="text-2xl font-bold text-text">Security Settings</h3>
                  <p className="text-text-secondary text-sm mt-1">Manage your account password and security preferences.</p>
                </div>
              </div>
              <form className="space-y-6 max-w-xl" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="label">Current Password</label>
                  <Input type="password" placeholder="••••••••" className="mt-1" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <Input type="password" placeholder="••••••••" className="mt-1" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <Input type="password" placeholder="••••••••" className="mt-1" />
                </div>
                <div className="pt-4 border-t border-border">
                  <Button icon={<ShieldCheck className="w-4 h-4" />}>Update Password</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Coming Soon Banner */}
          {activeTab === "qr" && (
            <Card className="bg-[#f8f5ff] border border-[#eaddff] shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Sparkles className="w-6 h-6 text-[#7c3aed]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">More Settings Coming Soon</h3>
                  <p className="text-text-secondary text-sm mt-0.5">
                    We're working on more features to help you manage your restaurant better.
                  </p>
                </div>
              </div>
              <button className="shrink-0 px-6 py-2.5 bg-[#f3e8ff] text-[#7c3aed] font-bold rounded-xl hover:bg-[#eaddff] transition-colors">
                Stay Tuned
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
