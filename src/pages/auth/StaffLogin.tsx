import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, Compass, Plane, Globe2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';

export const StaffLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, getRoleDashboardPath, isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  const urlEmail = searchParams.get('email') || '';
  const urlRole = searchParams.get('role') || 'sales';
  const isOps = urlRole.toLowerCase() === 'operations';

  const [email, setEmail] = useState(urlEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [urlEmail]);

  // If already logged in as staff/operations, redirect to workspace
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'staff' || user.role === 'sales' || user.role === 'operations')) {
      navigate(getRoleDashboardPath(user.role));
    }
  }, [isAuthenticated, user, navigate, getRoleDashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      error('Please enter your Corporate Email address.');
      return;
    }
    if (!password) {
      error('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const userRole = await login(cleanEmail, password);
      success(`Welcome to Trip by Genie! Your staff workspace is activated.`);
      navigate(getRoleDashboardPath(userRole));
    } catch (err: any) {
      error(err.message || 'Login failed. Please verify your corporate email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] relative flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambience */}
      <TravelPatternBg opacity={0.03} />

      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF795C]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#17648A]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-[#EFE7DA]/60 bg-white/70 backdrop-blur-md">
        <BrandLogo size="md" to="/" />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hidden sm:inline">Empowering Journeys Across The Globe</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#17648A]/10 text-[#17648A] font-bold text-[11px]">
            <Compass className="w-3.5 h-3.5" /> Staff Portal
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-3xl border border-[#EFE7DA] shadow-xl shadow-slate-900/5 p-7 sm:p-9 relative overflow-hidden">
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF795C] via-[#17648A] to-[#082C43]" />

            {/* Travel Greetings Banner */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF795C] text-xs font-bold mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FF795C]" />
                <span>Welcome to the Team!</span>
              </div>
              <h1 className="text-2xl sm:text-2xl font-black text-[#082C43] tracking-tight">
                Staff Workspace Login
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Welcome to <strong className="text-[#082C43]">Trip by Genie</strong> — your central portal for crafting dream vacations, managing bespoke itineraries & delivering magical travel experiences.
              </p>
            </div>

            {/* Role Badge Indicator */}
            <div className="mb-6 p-3 rounded-xl bg-[#F8F1E7]/70 border border-[#EFE7DA] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#17648A] text-white flex items-center justify-center shadow-xs shrink-0">
                {isOps ? <Plane className="w-4.5 h-4.5" /> : <Globe2 className="w-4.5 h-4.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Workspace
                </span>
                <span className="block text-xs font-bold text-[#082C43] truncate">
                  {isOps ? 'Operations & Logistics Dashboard' : 'Sales & Tour Itinerary Dashboard'}
                </span>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Corporate Email Field */}
              <div>
                <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                  Corporate Email (Login ID) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FFFDF8] border border-[#EFE7DA] rounded-xl text-xs sm:text-sm font-semibold text-[#082C43] focus:outline-none focus:ring-2 focus:ring-[#17648A]/20 focus:border-[#17648A] transition-all"
                  />
                </div>
                {urlEmail && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pre-filled with your provisioned account email.
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your temporary or set password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#FFFDF8] border border-[#EFE7DA] rounded-xl text-xs sm:text-sm font-semibold text-[#082C43] focus:outline-none focus:ring-2 focus:ring-[#17648A]/20 focus:border-[#17648A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the temporary password from your invitation email.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#FF795C] to-[#FF5733] hover:from-[#ff6b4a] hover:to-[#f04925] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#FF795C]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <span>Log In to Staff Workspace</span>
                  </>
                )}
              </button>
            </form>

            {/* Onboarding Notice */}
            <div className="mt-6 pt-5 border-t border-[#EFE7DA] text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Logging in automatically activates your staff profile and opens your workspace.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-400 border-t border-[#EFE7DA]/50 bg-white/40">
        &copy; {new Date().getFullYear()} Trip by Genie. Travel Specialist & Operations Management System.
      </footer>
    </div>
  );
};
