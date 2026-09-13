import React, { useState, useEffect, useMemo } from "react";
import {
  Settings2, CreditCard, ChevronDown, ShieldCheck, Save, RefreshCw,
  Sliders, Globe, Lock, Cpu, Server, Check, AlertCircle, AlertTriangle,
  Info, Download, Copy, Shield, Layers, KeyRound, Wrench, CheckCircle2,
  Zap, ArrowRight, Eye, EyeOff, Building, DollarSign, Calculator
} from "lucide-react";
import { api } from "../../services/api";
import { Alert } from "../../components/ui";
import { copyToClipboard } from "../../utils/helpers";
import { useConfirm } from "../../context/ConfirmContext";
import toast from "react-hot-toast";

/* ─── Navigation Sections ────────────────────────────────── */
const sections = [
  { key: "identity", icon: Settings2, label: "Platform Identity", sub: "Branding & metadata" },
  { key: "localization", icon: Globe, label: "Regional & Locale", sub: "Currency & timezones" },
  { key: "monetization", icon: CreditCard, label: "Revenue & Fees", sub: "Commissions & tax rates" },
  { key: "compliance", icon: ShieldCheck, label: "KYC & Governance", sub: "Verification gatekeeper" },
  { key: "security", icon: Lock, label: "Admin Security", sub: "Credentials & sessions" },
  { key: "maintenance", icon: Wrench, label: "System Maintenance", sub: "Killswitches & alerts" },
];

/* ─── Reusable Input Elements ────────────────────────────── */
const Field: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
      {sub && <span className="text-[11px] text-gray-400 font-medium">{sub}</span>}
    </div>
    {children}
  </div>
);

const TextInput: React.FC<{
  value: string | number;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, type = "text", prefix, suffix, disabled = false }) => (
  <div className="relative flex items-center">
    {prefix && (
      <span className="absolute left-3.5 text-gray-400 text-xs font-bold pointer-events-none">
        {prefix}
      </span>
    )}
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all ${
        prefix ? "pl-9" : ""
      } ${suffix ? "pr-12" : ""} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    />
    {suffix && (
      <span className="absolute right-3.5 text-gray-400 text-xs font-bold pointer-events-none">
        {suffix}
      </span>
    )}
  </div>
);

const SelectInput: React.FC<{
  value: string;
  options: { value: string; label: string }[] | string[];
  onChange?: (v: string) => void;
}> = ({ value, options, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none pr-10 cursor-pointer transition-all"
    >
      {options.map(o => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange?: (v: boolean) => void; label?: string; description?: string }> = ({
  checked, onChange, label, description
}) => (
  <div
    onClick={() => onChange?.(!checked)}
    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
      checked
        ? "bg-orange-50/40 border-orange-200 ring-1 ring-orange-300/30"
        : "bg-white border-gray-200/80 hover:border-gray-300"
    }`}
  >
    <div className="space-y-0.5">
      {label && <p className="text-sm font-bold text-gray-900">{label}</p>}
      {description && <p className="text-xs text-gray-500 leading-relaxed">{description}</p>}
    </div>
    <div
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#F97316]" : "bg-gray-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  </div>
);

/* ─── Main Settings Component ────────────────────────────── */
const Settings: React.FC = () => {
  const { confirm } = useConfirm();
  const [activeSection, setActiveSection] = useState("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    platformName: "SOFRA",
    platformEmail: "support@sofra.com",
    timezone: "(GMT+03:00) East Africa Time (Ethiopia)",
    dateFormat: "DD MMM, YYYY",
    currency: "ETB (Br)",
    rowsPerPage: "10",
    maintenance: false,
    maintenanceNotice: "System upgrade in progress. Normal operations will resume shortly.",
    commissionRate: 5,
    taxRate: 15,
    payoutThreshold: 1000,
    requireKycBeforeLive: true,
    autoSlugRestaurants: true,
    sessionTimeoutHours: 24,
  });

  // Security Credentials Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Commission Calculator Simulation State
  const [simOrderAmount, setSimOrderAmount] = useState<number>(1000);

  /* ─── Fetch Settings ─── */
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/settings");
      if (data.success && data.data) {
        setForm(prev => ({
          ...prev,
          ...data.data,
          // Defaults if not set in DB
          commissionRate: data.data.commissionRate ?? 5,
          taxRate: data.data.taxRate ?? 15,
          payoutThreshold: data.data.payoutThreshold ?? 1000,
          requireKycBeforeLive: data.data.requireKycBeforeLive ?? true,
          autoSlugRestaurants: data.data.autoSlugRestaurants ?? true,
          sessionTimeoutHours: data.data.sessionTimeoutHours ?? 24,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError("Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /* ─── Save Settings ─── */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");
      const { data } = await api.put("/admin/settings", form);
      if (data.success) {
        setSaved(true);
        setSuccessMsg("Configuration synchronized across all platform services.");
        window.dispatchEvent(new Event("config_updated"));
        setTimeout(() => {
          setSaved(false);
          setSuccessMsg("");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Password Update ─── */
  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");
      const { data } = await api.put("/auth/admin/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (data.success) {
        setSaved(true);
        setSuccessMsg("Administrator password updated successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setSaved(false);
          setSuccessMsg("");
        }, 3500);
      }
    } catch (err: any) {
      console.error("Failed to update password:", err);
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Export Config Backup ─── */
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "2.4",
      configuration: form,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sofra_settings_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Configuration backup downloaded.");
  };

  /* ─── Reload Config from Database ─── */
  const handleReload = async () => {
    const confirmed = await confirm({
      title: "Reload Saved Configuration?",
      message: "Are you sure you want to reload settings from the database? Any unsaved changes will be discarded.",
      confirmText: "Reload",
      cancelText: "Keep Editing",
      type: "warning",
    });
    if (confirmed) {
      await fetchSettings();
      toast.success("Configuration reloaded from database.");
    }
  };

  /* ─── Discard Unsaved Changes ─── */
  const handleDiscard = async () => {
    const confirmed = await confirm({
      title: "Discard Unsaved Changes?",
      message: "Are you sure you want to discard your modifications?",
      confirmText: "Discard",
      cancelText: "Continue Editing",
      type: "warning",
    });
    if (confirmed) {
      await fetchSettings();
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Unsaved changes discarded.");
    }
  };

  /* ─── Password Entropy Evaluation ─── */
  const passwordStrength = useMemo(() => {
    const p = passwordForm.newPassword;
    let score = 0;
    if (p.length >= 6) score += 20;
    if (p.length >= 10) score += 20;
    if (/[A-Z]/.test(p)) score += 20;
    if (/[0-9]/.test(p)) score += 20;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;

    let label = "Very Weak";
    let color = "bg-rose-500 text-rose-600";
    if (score >= 40 && score < 60) {
      label = "Fair";
      color = "bg-amber-500 text-amber-600";
    } else if (score >= 60 && score < 80) {
      label = "Good";
      color = "bg-blue-500 text-blue-600";
    } else if (score >= 80) {
      label = "Strong Enterprise";
      color = "bg-emerald-500 text-emerald-600";
    }

    return { score, label, color };
  }, [passwordForm.newPassword]);

  /* ─── Section Renderers ─── */
  const renderPanel = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#F97316] border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500 mt-3">Loading system configuration...</p>
        </div>
      );
    }

    /* 1. Platform Identity */
    if (activeSection === "identity") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Platform Identity & Master Branding</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure your primary platform credentials, support contacts, and default data grid density.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Platform Brand Name" sub="Display title">
              <TextInput
                value={form.platformName}
                onChange={v => setForm(f => ({ ...f, platformName: v }))}
                placeholder="e.g. SOFRA"
              />
            </Field>

            <Field label="Official Support Email" sub="Inbound contact">
              <TextInput
                type="email"
                value={form.platformEmail}
                onChange={v => setForm(f => ({ ...f, platformEmail: v }))}
                placeholder="support@sofra.com"
              />
            </Field>

            <Field label="Default Data Grid Rows" sub="Table pagination default">
              <SelectInput
                value={form.rowsPerPage}
                options={["10", "20", "50", "100"]}
                onChange={v => setForm(f => ({ ...f, rowsPerPage: v }))}
              />
            </Field>

            <Field label="Platform Architecture" sub="Immutable instance">
              <TextInput
                value="SOFRA Enterprise v2.4 (Distributed Cluster)"
                disabled
                suffix="ACTIVE"
              />
            </Field>
          </div>

          {/* Live Brand Header Preview */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Live Brand Receipt / Invoice Preview
            </span>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {form.platformName?.[0] || "S"}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{form.platformName || "SOFRA"}</h4>
                  <p className="text-xs text-gray-400">{form.platformEmail || "support@sofra.com"}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                Verified Global Hub
              </span>
            </div>
          </div>
        </div>
      );
    }

    /* 2. Regional & Locale */
    if (activeSection === "localization") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Regional, Currency & Localization</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Set the primary operating currency, time zone calculations, and timestamp formatting for your tenants.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Operating Currency" sub="Default POS currency">
              <SelectInput
                value={form.currency}
                options={[
                  { value: "ETB (Br)", label: "Ethiopian Birr - ETB (Br)" },
                  { value: "USD ($)", label: "US Dollar - USD ($)" },
                  { value: "EUR (€)", label: "Euro - EUR (€)" },
                  { value: "GBP (£)", label: "British Pound - GBP (£)" },
                  { value: "AED (د.إ)", label: "UAE Dirham - AED (د.إ)" },
                ]}
                onChange={v => setForm(f => ({ ...f, currency: v }))}
              />
            </Field>

            <Field label="Time Zone" sub="System clock sync">
              <SelectInput
                value={form.timezone}
                options={[
                  "(GMT+03:00) East Africa Time (Ethiopia)",
                  "(GMT+00:00) UTC / Greenwich Mean Time",
                  "(GMT+01:00) Central European Time",
                  "(GMT+04:00) Gulf Standard Time (Dubai)",
                  "(GMT-05:00) Eastern Time (US & Canada)",
                  "(GMT-08:00) Pacific Time (US & Canada)"
                ]}
                onChange={v => setForm(f => ({ ...f, timezone: v }))}
              />
            </Field>

            <Field label="Date & Time Display Format">
              <SelectInput
                value={form.dateFormat}
                options={[
                  { value: "DD MMM, YYYY", label: "07 Sep, 2026 (DD MMM, YYYY)" },
                  { value: "MM/DD/YYYY", label: "09/07/2026 (MM/DD/YYYY)" },
                  { value: "YYYY-MM-DD", label: "2026-09-07 (ISO Standard)" }
                ]}
                onChange={v => setForm(f => ({ ...f, dateFormat: v }))}
              />
            </Field>

            <Field label="Primary Locale Language" sub="Platform interface">
              <SelectInput
                value="English (US) / Amharic Native Support"
                options={["English (US) / Amharic Native Support"]}
                onChange={() => {}}
              />
            </Field>
          </div>

          {/* Localization Live Simulation */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Formatted Output Simulation
            </span>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-400 font-medium">Sample Order Total:</span>{" "}
                <span className="font-bold font-mono text-gray-900 text-sm">
                  {form.currency.includes("ETB") ? "2,450.00 ETB" : "$2,450.00"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Timestamp Output:</span>{" "}
                <span className="font-bold text-gray-800">
                  {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at{" "}
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* 3. Monetization & Commission */
    if (activeSection === "monetization") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Revenue, Commissions & Payouts</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Govern the platform fee percentage deducted on restaurant sales, local tax rates, and payout thresholds.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Platform Commission Rate (%)" sub="Per-order deduction">
              <TextInput
                type="number"
                value={form.commissionRate}
                onChange={v => setForm(f => ({ ...f, commissionRate: Math.max(0, Math.min(100, parseFloat(v) || 0)) }))}
                suffix="%"
              />
            </Field>

            <Field label="Standard VAT / Tax Rate (%)" sub="Local government levy">
              <TextInput
                type="number"
                value={form.taxRate || 15}
                onChange={v => setForm(f => ({ ...f, taxRate: Math.max(0, parseFloat(v) || 0) }))}
                suffix="%"
              />
            </Field>

            <Field label="Minimum Payout Threshold" sub="Settlement floor">
              <TextInput
                type="number"
                value={form.payoutThreshold || 1000}
                onChange={v => setForm(f => ({ ...f, payoutThreshold: Math.max(0, parseFloat(v) || 0) }))}
                suffix={form.currency.includes("ETB") ? "ETB" : "USD"}
              />
            </Field>
          </div>

          {/* Interactive Fee Simulation Calculator */}
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-2xl p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Live Algorithmic Revenue Simulator
                </h3>
              </div>
              <span className="text-xs font-mono text-[#F97316] font-bold">
                Rate: {form.commissionRate}%
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Simulate an order value to preview real-time platform revenue split vs. restaurant merchant payout.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-zinc-400">Order Amount:</span>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={simOrderAmount}
                onChange={e => setSimOrderAmount(parseFloat(e.target.value))}
                className="flex-1 accent-[#F97316] cursor-pointer"
              />
              <span className="text-sm font-mono font-bold text-white bg-white/10 px-3 py-1 rounded-lg">
                {simOrderAmount} {form.currency.includes("ETB") ? "ETB" : "$"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Platform Revenue ({form.commissionRate}%)</span>
                <p className="text-lg font-black text-[#F97316] font-mono mt-0.5">
                  {((simOrderAmount * form.commissionRate) / 100).toFixed(2)} {form.currency.includes("ETB") ? "ETB" : "$"}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Merchant Net Payout</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {(simOrderAmount - (simOrderAmount * form.commissionRate) / 100).toFixed(2)} {form.currency.includes("ETB") ? "ETB" : "$"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* 4. Compliance & KYC */
    if (activeSection === "compliance") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">KYC & Regulatory Compliance Gate</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enforce automated compliance rules, document gating, and verification checkpoints before restaurants can accept orders.
            </p>
          </div>

          <div className="space-y-4">
            <Toggle
              checked={form.requireKycBeforeLive}
              onChange={v => setForm(f => ({ ...f, requireKycBeforeLive: v }))}
              label="Mandatory KYC Approval Before Going Live"
              description="When enabled, restaurants cannot activate online ordering or publish their menu until an administrator reviews and approves their business licenses and KYC documents in the Compliance Vault."
            />

            <Toggle
              checked={form.autoSlugRestaurants}
              onChange={v => setForm(f => ({ ...f, autoSlugRestaurants: v }))}
              label="Automatic SEO URL Slug Generation"
              description="Automatically generate URL slugs (e.g. /menu/restaurant-name) from the official registered restaurant name upon onboarding."
            />

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Unified Compliance Pipeline Active</h4>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  All restaurant registration requests, document audits, and license approvals flow directly into the{" "}
                  <strong>Verification & KYC</strong> vault. No unverified establishment can process transactions on the SOFRA platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* 5. Admin Security */
    if (activeSection === "security") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Administrator Security & Access Control</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Rotate platform super-admin credentials and configure maximum session authentication durations.
            </p>
          </div>

          {/* Session Expiry Policy */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Admin Session Timeout" sub="JWT token lifecycle">
              <SelectInput
                value={`${form.sessionTimeoutHours || 24} Hours`}
                options={["12 Hours", "24 Hours", "48 Hours", "7 Days"]}
                onChange={v => setForm(f => ({ ...f, sessionTimeoutHours: parseInt(v) || 24 }))}
              />
            </Field>

            <Field label="Cryptographic Storage" sub="Encryption standard">
              <TextInput value="bcrypt (Salt rounds: 10) + JWT Bearer" disabled suffix="AES-256" />
            </Field>
          </div>

          {/* Password Rotation Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F97316]" /> Rotate Super Admin Password
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update credentials for the primary root administrator account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>

            <div className="max-w-lg space-y-4">
              <Field label="Current Admin Password">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={v => setPasswordForm(f => ({ ...f, currentPassword: v }))}
                />
              </Field>

              <Field label="New Secure Password" sub="Min 6 characters">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Must contain numbers & letters"
                  value={passwordForm.newPassword}
                  onChange={v => setPasswordForm(f => ({ ...f, newPassword: v }))}
                />
              </Field>

              {/* Password strength entropy meter */}
              {passwordForm.newPassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase">Entropy Score</span>
                    <span className={passwordStrength.color.split(" ")[1]}>
                      {passwordStrength.label} ({passwordStrength.score}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color.split(" ")[0]}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <Field label="Confirm New Password">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={passwordForm.confirmPassword}
                  onChange={v => setPasswordForm(f => ({ ...f, confirmPassword: v }))}
                />
              </Field>

              <button
                onClick={handlePasswordUpdate}
                disabled={saving}
                className="mt-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                Update Admin Password
              </button>
            </div>
          </div>
        </div>
      );
    }

    /* 6. Maintenance & Killswitch */
    if (activeSection === "maintenance") {
      return (
        <div className="space-y-8 animate-in fade-in-50">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Platform Maintenance & Infrastructure</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Control global maintenance mode killswitches and broadcast emergency banners to all tenants and customers.
            </p>
          </div>

          <div className="space-y-6">
            <Toggle
              checked={form.maintenance}
              onChange={v => setForm(f => ({ ...f, maintenance: v }))}
              label="Global Maintenance Mode"
              description="Temporarily suspend ordering and merchant dashboard access for all tenants while system upgrades or data migrations are in progress. Administrators retain root access."
            />

            <Field label="Custom Maintenance Announcement Banner" sub="Broadcasted to public users">
              <TextInput
                value={form.maintenanceNotice || ""}
                onChange={v => setForm(f => ({ ...f, maintenanceNotice: v }))}
                placeholder="e.g. Scheduled system upgrade in progress..."
              />
            </Field>

            {/* Live Customer Preview of Maintenance Mode */}
            <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Simulated Public Maintenance Notice
              </span>
              <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                form.maintenance
                  ? "bg-amber-500 text-white border-amber-600 shadow-md"
                  : "bg-gray-100 text-gray-400 border-gray-200 opacity-60"
              }`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${form.maintenance ? "animate-bounce" : ""}`} />
                <div className="text-xs font-semibold">
                  <span className="font-bold uppercase tracking-wider block text-[10px] opacity-80">
                    {form.maintenance ? "Active Platform Banner" : "Preview (Currently Offline)"}
                  </span>
                  {form.maintenanceNotice || "System maintenance is currently in progress."}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ── TOP FUTURISTIC GOVERNANCE & CONTROL RIBBON ── */}
      <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-black text-white rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Sliders className="w-6 h-6 text-[#F97316] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Platform Governance & Master Settings
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All Systems Nominal
              </span>
              {form.maintenance && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Maintenance Active
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Master switchboard for multi-tenant SaaS policies, currency localization, commission splits, and security parameters.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:border-white/20"
            title="Export JSON Configuration Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup Config</span>
          </button>

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
            title="Reload from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              saved
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[#F97316]/20"
            } disabled:opacity-60`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Synced</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 4 EXECUTIVE PLATFORM HEALTH KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Environment Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">System State</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {form.maintenance ? "Maintenance" : "Live Production"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">99.98% High Availability</p>
        </div>

        {/* Global Commission */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">Commission Engine</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{form.commissionRate}%</span>
            <span className="text-[11px] font-bold text-[#F97316]">per transaction</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">VAT: {form.taxRate || 15}%</p>
        </div>

        {/* Compliance Policy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">KYC Compliance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600">
              {form.requireKycBeforeLive ? "Enforced" : "Optional"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Identity verification checkpoint</p>
        </div>

        {/* Currency & Locale */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Default Currency</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
              {form.currency?.split(" ")?.[0] || "ETB"}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">{form.currency?.split(" ")?.[1] || "(Br)"}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Timezone: EAT (UTC+3)</p>
        </div>
      </div>

      {/* ── ALERTS (ERROR OR SUCCESS) ── */}
      {error && (
        <div className="animate-in fade-in-50">
          <Alert type="error" message={error} />
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in-50 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── SETTINGS SHELL (SIDEBAR + MAIN CONTENT AREA) ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[620px]">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-200/80 p-4 sm:p-6 flex-shrink-0">
          <nav className="space-y-1.5">
            {sections.map(s => {
              const active = activeSection === s.key;
              const IconComp = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all ${
                    active
                      ? "bg-gray-900 text-white shadow-sm ring-1 ring-black"
                      : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      active ? "bg-white/10 text-[#F97316]" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${active ? "text-white" : "text-gray-800"}`}>
                      {s.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 truncate ${active ? "text-gray-400" : "text-gray-400"}`}>
                      {s.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Settings Panel */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto">
            {renderPanel()}
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-400 font-medium">
              Changes apply across all restaurant dashboards & customer menus upon save.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Discard
              </button>

              <button
                onClick={activeSection === "security" ? handlePasswordUpdate : handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>Save {activeSection === "security" ? "Password" : "Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
