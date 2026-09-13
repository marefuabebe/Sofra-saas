import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { APP_CONFIG } from "../../config/config";
import { api } from "../../services/api";
import { isValidEmail } from "../../utils/helpers";
import Navbar from "../../components/ui/Navbar";
import { Alert } from "../../components/ui";
import { useGoogleLogin } from '@react-oauth/google';
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.post("/auth/google", {
          token: tokenResponse.access_token, 
        });
        
        if (!data.success) {
          setError(data.message || "Authentication failed");
          setLoading(false);
          return;
        }

        if (data.data.action === "register") {
          // Progressive Profiling: Redirect to register with prefilled data
          navigate("/register", { 
            state: { 
              googleName: data.data.googleData.name, 
              googleEmail: data.data.googleData.email 
            } 
          });
          return;
        }

        if (data.data.action === "login") {
          // Login successful
          navigate("/dashboard");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to sign in with Google");
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google Sign-In was cancelled or failed");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/restaurant/login", {
        email: formData.email.toLowerCase(),
        password: formData.password,
      });

      if (!data.success) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }
      // Login successful - auto-login handled via HTTP-only cookie

      // Redirect to restaurant dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please check your connection.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-10 pb-16">
        
        {/* Back Button */}
        <div className="w-full max-w-[480px] mb-4">
          <Link to="/" className="inline-flex items-center text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white w-full max-w-[480px] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 px-12 py-8 relative">
          
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-[15px] text-gray-500">Login to access your {APP_CONFIG.appName} account</p>
          </div>

          {/* Pending Registration Alert */}
          {error === "pending" && (
            <Alert
              type="warning"
              title="Account Pending Verification"
              message="Your registration is under review. Our team will contact you within 24 hours to complete the setup."
              className="mb-6 rounded-xl"
            />
          )}

          {/* Error Alert */}
          {error && error !== "pending" && (
            <Alert type="error" message={error} className="mb-6 rounded-xl" />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-bold text-gray-900">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-bold text-gray-900">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="block w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-[13px] font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                Forgot password?
              </Link>
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
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-7">
            <div className="flex-1 border-t border-gray-100"></div>
            <span className="px-4 text-[13px] text-gray-400 font-medium bg-white">or</span>
            <div className="flex-1 border-t border-gray-100"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold text-[14px] py-3.5 rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-2.5 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-[14px] text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
              Sign up
            </Link>
          </div>

        </div>

        {/* Admin Login Link */}
        <div className="mt-8">
          <Link
            to="/admin/login"
            className="text-[13px] text-gray-400 hover:text-gray-600 font-medium transition-colors opacity-60 hover:opacity-100"
          >
            Admin Login
          </Link>
        </div>

      </div>

      {/* Footer Terms */}
      <div className="pb-8 text-center px-4 relative z-10">
        <p className="text-[13px] text-gray-500 font-medium">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-orange-500 hover:text-orange-600 transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-orange-500 hover:text-orange-600 transition-colors">Privacy Policy</Link>.
        </p>
      </div>

    </div>
  );
};

export default LoginPage;
