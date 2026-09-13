import React, { useEffect, useState } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  Home,
  FileCheck,
  ShieldCheck,
  Store,
  FolderOpen,
  Inbox,
  BarChart2,
  History,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import DashboardHome from "./DashboardHome";
import PendingRequests from "./PendingRequests";
import AllRestaurants from "./AllRestaurants";
import Analytics from "./Analytics";
import VerificationRequests from "./VerificationRequests";
import VerificationDetails from "./VerificationDetails";
import Documents from "./Documents";
import OrdersOverview from "./OrdersOverview";
import ActivityLog from "./ActivityLog";
import Notifications from "./Notifications";
import AdminSettings from "./Settings";
import { api } from "../../services/api";
import NotificationBell from "../../components/ui/NotificationBell";
import { socket } from "../../config/socket";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [verificationCount, setVerificationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data.data.role === "admin") {
          setAdmin(data.data);
          // Force socket to reconnect so the backend re-reads cookies and assigns admin_room
          if (socket.connected) socket.disconnect();
          socket.connect();
        } else {
          navigate("/admin/login");
        }
      } catch {
        navigate("/admin/login");
      }
    };
    fetchAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [reqRes, verRes, notifRes] = await Promise.all([
          api.get("/admin/requests/pending"),
          api.get("/verification/queue"),
          api.get("/notifications/unread-count"),
        ]);
        setPendingCount(reqRes.data?.data?.length || 0);
        setVerificationCount(verRes.data?.data?.length || 0);
        setNotificationCount(notifRes.data?.data?.count || 0);
      } catch (_) {}
    };
    fetchCounts();
    
    socket.on("request:new", fetchCounts);
    socket.on("request:updated", fetchCounts);
    socket.on("notification:new", fetchCounts);
    
    return () => {
      socket.off("request:new", fetchCounts);
      socket.off("request:updated", fetchCounts);
      socket.off("notification:new", fetchCounts);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/admin/login");
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-[#1A1D24] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-lg">S</span>
          </div>
          <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  type NavItem = {
    path: string;
    icon: React.ElementType;
    label: string;
    exact?: boolean;
    badge?: number;
  };

  type NavGroup = {
    label: string | null;
    items: NavItem[];
  };

  const navGroups: NavGroup[] = [
    {
      label: null,
      items: [
        { path: "/admin", icon: Home, label: "Dashboard", exact: true },
      ],
    },
    {
      label: "MANAGEMENT",
      items: [
        { path: "/admin/verification", icon: ShieldCheck, label: "Verification & KYC", badge: verificationCount },
        { path: "/admin/restaurants", icon: Store, label: "Restaurants" },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { path: "/admin/orders", icon: Inbox, label: "Orders Overview" },
        { path: "/admin/analytics", icon: BarChart2, label: "Analytics" },
        { path: "/admin/activity", icon: History, label: "Activity Log" },
        { path: "/admin/notifications", icon: Bell, label: "Notifications", badge: notificationCount },
        { path: "/admin/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === "/admin" || location.pathname === "/admin/";
    return location.pathname.startsWith(path) && path !== "/admin";
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-[#1A1D24] z-50 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-base">S</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SOFRA</span>
          <button
            className="ml-auto text-white/50 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold text-white/30 px-3 mb-2 tracking-widest uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact
                    ? location.pathname === "/admin" || location.pathname === "/admin/"
                    : location.pathname.startsWith(item.path) && item.path !== "/admin";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                        active
                          ? "bg-white/5 text-[#F97316]"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-[#F97316]" : ""}`} />
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className={`ml-auto flex-shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                            active ? "bg-[#F97316] text-white" : "bg-[#F97316] text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Profile at Bottom */}
        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F97316] font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{admin.name || "Admin User"}</p>
              <p className="text-white/40 text-[10px] truncate">Platform Admin</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col lg:pl-[240px] min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 md:px-6 gap-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Center Search */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
              />
            </div>
          </div>


          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NotificationBell role="admin" />

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{admin.name || "Admin User"}</p>
                <p className="text-[11px] text-gray-400 leading-tight">Super Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="verification" element={<VerificationRequests />} />
            <Route path="verification/:id" element={<VerificationDetails />} />
            <Route path="requests" element={<Navigate to="/admin/verification" replace />} />
            <Route path="restaurants" element={<AllRestaurants />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="documents" element={<Documents />} />
            <Route path="orders" element={<OrdersOverview />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
