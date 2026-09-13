import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      const data = res.data;
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to request password reset.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-50 blur-3xl opacity-50" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-orange-50 blur-3xl opacity-50" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-6">
            <span className="text-3xl font-black bg-gradient-to-br from-[#F97316] to-[#ea580c] bg-clip-text text-transparent">S</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reset your password</h2>
          <p className="mt-3 text-[15px] text-gray-500 max-w-sm mx-auto">
            Enter the email associated with your restaurant account.
          </p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-gray-100 relative">
          
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for {email}, password reset instructions have been sent.
              </p>
              <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">
                &larr; Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[13px] font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#F97316] hover:bg-[#ea580c] disabled:opacity-50 disabled:hover:bg-[#F97316] text-white font-bold text-[15px] py-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 flex justify-center items-center gap-2"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
        
        {!success && (
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
