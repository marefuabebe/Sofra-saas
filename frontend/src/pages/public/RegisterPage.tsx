import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { CheckCircle, ArrowLeft, Mail, RefreshCw, X, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import {
  Input,
  Select,
  Textarea,
  Alert,
} from "../../components/ui";
import Navbar from "../../components/ui/Navbar";
import { APP_CONFIG } from "../../config/config";
import { api, getErrorMessage } from "../../services/api";
import { isValidEmail, isValidPhone } from "../../utils/helpers";

interface FormData {
  restaurant_name: string;
  owner_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  restaurant_type: string;
  heard_from: string;
  notes: string;
  password?: string;
}

const RegisterPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    restaurant_name: "",
    owner_name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    restaurant_type: "",
    heard_from: "",
    notes: "",
    password: "",
  });

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (location.state && location.state.googleEmail) {
      setFormData(prev => ({
        ...prev,
        owner_name: location.state.googleName || "",
        email: location.state.googleEmail || "",
      }));
    }
  }, [location.state]);

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.restaurant_name.trim()) {
      newErrors.restaurant_name = "Restaurant name is required";
    }

    if (!formData.owner_name.trim()) {
      newErrors.owner_name = "Owner name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.restaurant_type) {
      newErrors.restaurant_type = "Restaurant type is required";
    }

    if (!location.state?.googleEmail) {
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Google Signups bypass OTP since Google has already verified the email
    if (location.state?.googleEmail) {
      setLoading(true);
      try {
        const { data } = await api.post("/public/register", {
          restaurantName: formData.restaurant_name.trim(),
          ownerName: formData.owner_name.trim(),
          phone: formData.phone.replace(/[\s\-()]/g, ""),
          email: formData.email.trim() || undefined,
          city: formData.city.trim(),
          address: formData.address.trim() || undefined,
          restaurantType: formData.restaurant_type,
          heardFrom: formData.heard_from || undefined,
          notes: formData.notes.trim() || undefined,
          isGoogleSignup: true,
        });

        if (!data.success) {
          throw new Error(data.message || "Failed to register");
        }

        const token = data.token || data.data?.token;
        if (token) {
          localStorage.setItem("token", token);
        }

        toast.success("Welcome to SOFRA!");
        window.location.href = "/dashboard";
      } catch (err: any) {
        console.error("Registration error:", err);
        setError(getErrorMessage(err, "Failed to submit registration. Please verify your inputs and try again."));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard email/password registration: send 6-digit OTP
    setLoading(true);
    try {
      const { data } = await api.post("/public/send-registration-otp", {
        email: formData.email.trim(),
        restaurantName: formData.restaurant_name.trim(),
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to send verification code");
      }

      toast.success("Verification code sent to your email!");
      setShowOtpModal(true);
      setResendCooldown(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      console.error("OTP request error:", err);
      setError(getErrorMessage(err, "Failed to send verification code. Please check your email and try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newOtp = [...otpDigits];
      newOtp[index] = "";
      setOtpDigits(newOtp);
      return;
    }

    const digit = cleanVal.slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);
    setOtpError("");

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleVerifyOtpAndRegister(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtpDigits(newOtp);
    setOtpError("");

    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pasted.length === 6) {
      handleVerifyOtpAndRegister(pasted);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setOtpError("");
    try {
      const { data } = await api.post("/public/send-registration-otp", {
        email: formData.email.trim(),
        restaurantName: formData.restaurant_name.trim(),
      });
      if (!data.success) {
        throw new Error(data.message || "Failed to resend code");
      }
      toast.success("New verification code sent!");
      setResendCooldown(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setOtpError(getErrorMessage(err, "Failed to resend code. Please try again."));
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtpAndRegister = async (overrideOtp?: string) => {
    const finalOtp = overrideOtp || otpDigits.join("");
    if (finalOtp.length !== 6) {
      setOtpError("Please enter all 6 digits of the verification code");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");

    try {
      const { data } = await api.post("/public/register", {
        restaurantName: formData.restaurant_name.trim(),
        ownerName: formData.owner_name.trim(),
        phone: formData.phone.replace(/[\s\-()]/g, ""),
        email: formData.email.trim(),
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        restaurantType: formData.restaurant_type,
        heardFrom: formData.heard_from || undefined,
        notes: formData.notes.trim() || undefined,
        password: formData.password,
        otp: finalOtp,
        isGoogleSignup: false,
      });

      if (!data.success) {
        throw new Error(data.message || "Registration failed");
      }

      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }

      toast.success("Email verified! Welcome to SOFRA.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setOtpError(getErrorMessage(err, "Invalid or expired verification code. Please check and try again."));
      setOtpSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Remove the old success screen since we redirect immediately

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased flex flex-col relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Global Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-6 pb-10 w-full max-w-2xl mx-auto">
        
        {/* Back Button */}
        <div className="w-full max-w-2xl mb-4">
          <Link to="/" className="inline-flex items-center text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white w-full rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 px-6 py-8 md:px-10 md:py-8 relative">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-[28px] font-bold text-gray-900 mb-2">Register Your Restaurant</h1>
            <p className="text-[15px] text-gray-500">Start your digital journey today</p>
          </div>

          {error && <Alert type="error" message={error} className="mb-6 rounded-xl" />}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Details */}
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">
                Restaurant Details
              </h2>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Restaurant Name"
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleChange}
                    error={errors.restaurant_name}
                    placeholder="e.g., Tasty Bites Restaurant"
                    required
                  />

                  <Select
                    label="Restaurant Type"
                    name="restaurant_type"
                    value={formData.restaurant_type}
                    onChange={handleChange}
                    error={errors.restaurant_type}
                    options={APP_CONFIG.restaurantTypes.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    placeholder="e.g., Mumbai"
                    required
                  />

                  <Input
                    label="Address (Optional)"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">
                Owner Details
              </h2>
              <div className="space-y-3">
                <Input
                  label="Owner Name"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  error={errors.owner_name}
                  placeholder="Your full name"
                  required
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label mb-1 block text-sm font-medium text-gray-700">
                      Phone Number<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <PhoneInput
                        international
                        defaultCountry="ET"
                        value={formData.phone}
                        onChange={(value) => {
                          setFormData(prev => ({ ...prev, phone: value || "" }));
                          if (errors.phone) {
                            setErrors(prev => ({ ...prev, phone: "" }));
                          }
                        }}
                        className={`w-full flex items-center bg-white border ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl px-3 py-2 text-[15px] text-gray-900 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-colors [&>input]:w-full [&>input]:bg-transparent [&>input]:border-none [&>input]:outline-none [&>input]:ml-2`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="your@email.com"
                    required
                    readOnly={!!location.state?.googleEmail}
                    className={location.state?.googleEmail ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                  />
                </div>

                {!location.state?.googleEmail && (
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Create a strong password"
                    required
                  />
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">
                Additional Information
              </h2>
              <div className="space-y-3">
                <Select
                  label="How did you hear about us?"
                  name="heard_from"
                  value={formData.heard_from}
                  onChange={handleChange}
                  options={APP_CONFIG.heardFromOptions.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                />

                <Textarea
                  label="Additional Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific requirements or questions..."
                  rows={2}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[13px] text-gray-500 font-medium">
              By creating an account, you agree to our <Link to="/terms" className="text-orange-500 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-[15px] py-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Login Link */}
            <div className="pt-2 text-center text-[14px] text-gray-500 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-orange-500 font-bold hover:text-orange-600 transition-colors"
              >
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* ─── 6-Digit Email OTP Verification Modal ────────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-[#161922] border border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close / Cancel Button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4 shadow-lg shadow-orange-500/10">
              <Mail className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Verify Your Email
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              We've dispatched a 6-digit confirmation code to{" "}
              <span className="text-orange-400 font-bold break-all">{formData.email}</span>.
              <br />
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-xs text-gray-400 hover:text-orange-400 underline mt-1 inline-block transition-colors"
              >
                Wrong email? Click here to edit
              </button>
            </p>

            {/* Error Message */}
            {otpError && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-normal">
                {otpError}
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={otpSubmitting}
                  className="w-11 h-13 sm:w-13 sm:h-15 text-center text-2xl font-black text-white bg-gray-900/90 border-2 border-gray-700/80 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtpAndRegister()}
              disabled={otpSubmitting || otpDigits.some((d) => !d)}
              className="w-full bg-[#F97316] hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm py-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mb-4"
            >
              {otpSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Code & Provisioning...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verify & Complete Registration
                </>
              )}
            </button>

            {/* Resend Timer / Action */}
            <div className="text-xs text-gray-400">
              Didn't receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-gray-400 font-semibold">
                  Resend in <span className="text-orange-400 font-bold">{resendCooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-orange-400 font-bold hover:underline hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
                >
                  {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
