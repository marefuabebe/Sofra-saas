import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { CheckCircle, ArrowLeft } from "lucide-react";
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

    setLoading(true);

    try {
      // Insert registration request via API
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
        password: formData.password || undefined
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to register");
      }

      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err, "Failed to submit registration. Please verify your inputs and try again."));
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default RegisterPage;
