import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Mail, Lock } from "lucide-react";
import { Button, Input, Alert, Card } from "../../components/ui";
import { api } from "../../services/api";
import { isValidEmail } from "../../utils/helpers";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const { data } = await api.post("/auth/admin/login", {
        email: formData.email.toLowerCase(),
        password: formData.password,
      });

      if (!data.success) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Login successful - auto-login handled via HTTP-only cookie

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || "Invalid email or password. Please try again.");
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
    <div className="min-h-screen bg-bg-subtle flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Login Card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center border border-border">
                  <Shield className="w-6 h-6 text-text" />
                </div>
                <Link
                  to="/"
                  className="text-sm text-text-secondary hover:text-text transition-colors flex items-center"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Return
                </Link>
              </div>
              <h1 className="text-2xl font-semibold text-text tracking-tight mb-1">Admin Portal</h1>
              <p className="text-sm text-text-secondary">Sign in to manage the platform</p>
            </div>

            {/* Error Alert */}
            {error && <Alert type="error" message={error} className="mb-6 rounded-lg text-sm" />}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-text-muted" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-bg-subtle text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-text-muted" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-bg-subtle text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Authenticating..." : "Sign in to portal"}
                </button>
              </div>
            </form>
          </div>
          
          {/* Subtle footer strip */}
          <div className="bg-bg-subtle/50 px-8 py-4 border-t border-border">
            <p className="text-xs text-text-muted text-center">
              Restricted access. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
