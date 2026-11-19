import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Shield, User, Briefcase, UserCheck, KeyRound, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { BrandLogo } from '../../components/common/BrandLogo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, getRoleDashboardPath } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const userRole = await login(email, password);
      success(`Welcome back! Logged in successfully.`);
      navigate(from || getRoleDashboardPath(userRole));
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'staff' | 'agent' | 'customer', agencySlug?: string) => {
    setIsLoading(true);
    try {
      const userRole = await demoLogin(role, agencySlug);
      success(`Switched to demo ${role.toUpperCase()} account.`);
      navigate(getRoleDashboardPath(userRole));
    } catch (err: any) {
      error(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F1E7]/60 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <TravelPatternBg variant="cream" opacity={0.05} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm inline-block mb-3 border border-[#EFE7DA]">
          <BrandLogo size="lg" to="/" />
        </div>
        <h2 className="text-xl font-bold text-[#082C43] font-display">
          Unified Account Portal
        </h2>
        <p className="text-xs text-[#173247]/70 mt-1">
          Single secure login for Customers, Staff, B2B Travel Agents & Administrators
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-[#EFE7DA]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Email Address or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="name@travelgenie.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#EFE7DA] text-[#FF795C] focus:ring-[#FF795C]"
                />
                <span className="text-[#173247]/80 font-medium">Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please use the quick demo accounts below or contact admin@travelgenie.com to reset password.'); }} className="text-[#17648A] hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-bold shadow-md shadow-[#FF795C]/25"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Accounts Helper (Instant Testing of all 4 roles) */}
          <div className="mt-8 pt-6 border-t border-[#EFE7DA]">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#17648A] mb-3">
              <KeyRound className="w-3.5 h-3.5 text-[#FF795C]" />
              <span>Instant Test Logins (1-Click Evaluation)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#082C43]/20 bg-[#082C43]/5 hover:bg-[#082C43] hover:text-white font-semibold transition-all text-left cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#FF795C] shrink-0" />
                <div>
                  <span className="block font-bold">Admin Portal</span>
                  <span className="text-[10px] opacity-70">Aditya (CEO)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#17648A]/20 bg-[#17648A]/5 hover:bg-[#17648A] hover:text-white font-semibold transition-all text-left cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                <div>
                  <span className="block font-bold">Staff CRM</span>
                  <span className="text-[10px] opacity-70">Priya (Consultant)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('agent')}
                className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-600 hover:text-white font-semibold transition-all text-left cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <span className="block font-bold">B2B Agent</span>
                  <span className="text-[10px] opacity-70">Vikram (Partner)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                className="flex items-center gap-2 p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-600 hover:text-white font-semibold transition-all text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div>
                  <span className="block font-bold">Customer Hub</span>
                  <span className="text-[10px] opacity-70">Ananya (Traveler)</span>
                </div>
              </button>
            </div>

            {/* Multi-Agency 2 Demo */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'voyage-bliss')}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-[#55C9BD]/30 bg-[#55C9BD]/10 hover:bg-[#55C9BD] hover:text-[#041D30] font-semibold text-xs transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-[#17648A]" />
                  <span>Test Agency 2: Voyage Bliss (Multi-Tenancy)</span>
                </span>
                <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-bold">
                  Isolated Admin
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#173247]/70">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#FF795C] font-bold hover:underline">
              Create Customer Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
