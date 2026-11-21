import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, Shield, ShieldCheck, User, Briefcase, UserCheck, KeyRound, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { BrandLogo } from '../../components/common/BrandLogo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, demoLogin, getRoleDashboardPath } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'admin' | 'manager' | 'staff' | 'agent' | 'customer'>(() => {
    const r = searchParams.get('role')?.toLowerCase();
    if (r === 'staff' || r === 'agent' || r === 'admin' || r === 'customer' || r === 'manager') {
      return r as any;
    }
    return 'admin'; // Default to admin/manager
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get('role')?.toLowerCase();
    if (r === 'staff' || r === 'agent' || r === 'admin' || r === 'customer' || r === 'manager') {
      setActiveTab(r as any);
    }
  }, [searchParams]);

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

  const handleDemoLogin = async (role: 'admin' | 'manager' | 'staff' | 'agent' | 'customer', agencySlug?: string) => {
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

  // Role info configuration for intuitive mobile & desktop UX
  const roleConfig = {
    admin: {
      label: 'Super Admin',
      badge: 'Executive',
      icon: Shield,
      color: '#FF795C',
      bgLight: 'bg-[#FF795C]/10 text-[#082C43] border-[#FF795C]/30',
      activeTabClass: 'bg-[#082C43] text-white shadow-md',
      desc: 'Super Admin control: Provision IDs, manage all roles, and oversee all operational tabs.',
      sampleEmail: 'admin@travelgenie.com'
    },
    manager: {
      label: 'Manager CRM',
      badge: 'Operations',
      icon: ShieldCheck,
      color: '#8B5CF6',
      bgLight: 'bg-purple-500/10 text-purple-900 border-purple-500/30',
      activeTabClass: 'bg-purple-800 text-white shadow-md',
      desc: 'Operations & catalog control: Customer leads allocation to staff, packages, bookings, and destinations.',
      sampleEmail: 'manager@travelgenie.com'
    },
    staff: {
      label: 'Staff CRM',
      badge: 'Operations',
      icon: UserCheck,
      color: '#55C9BD',
      bgLight: 'bg-[#55C9BD]/10 text-[#082C43] border-[#55C9BD]/40',
      activeTabClass: 'bg-[#082C43] text-white shadow-md',
      desc: 'Assigned customer leads, custom itineraries, consultations & follow-ups.',
      sampleEmail: 'priya.staff@travelgenie.com'
    },
    agent: {
      label: 'B2B Agent',
      badge: 'Wholesale',
      icon: Briefcase,
      color: '#F59E0B',
      bgLight: 'bg-amber-500/10 text-amber-900 border-amber-500/30',
      activeTabClass: 'bg-[#082C43] text-white shadow-md',
      desc: 'B2B net pricing, package wholesale purchasing & agent ledger balance.',
      sampleEmail: 'vikram.agent@globetrotters.com'
    },
    customer: {
      label: 'Customer Hub',
      badge: 'Traveler',
      icon: User,
      color: '#10B981',
      bgLight: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30',
      activeTabClass: 'bg-[#082C43] text-white shadow-md',
      desc: 'Personal bookings, payment receipts, vouchers & itinerary tracking.',
      sampleEmail: 'ananya.customer@gmail.com'
    }
  };

  const currentRole = roleConfig[activeTab];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-[#F8F1E7]/60 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <TravelPatternBg variant="cream" opacity={0.05} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm inline-block mb-3 border border-[#EFE7DA]">
          <BrandLogo size="lg" to="/" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#082C43] font-display">
          Unified Portal Sign In
        </h2>
        <p className="text-xs text-[#173247]/70 mt-1 max-w-sm mx-auto">
          Dedicated sign-in access for Travel Genie Staff, B2B Agents, Administrators & Clients
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-6 sm:py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-[#EFE7DA]">
          
          {/* Mobile-Friendly Role Navigation Tabs */}
          <div className="mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#17648A] block mb-2">
              Select Your Access Role:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-[#F8F1E7] rounded-2xl border border-[#EFE7DA]">
              {(['admin', 'manager', 'staff', 'agent', 'customer'] as const).map((r) => {
                const conf = roleConfig[r];
                const Icon = conf.icon;
                const isSelected = activeTab === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveTab(r);
                      setEmail(conf.sampleEmail);
                      setPassword('password123');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#082C43] text-white shadow-sm ring-1 ring-black/10'
                        : 'text-[#082C43]/70 hover:text-[#082C43] hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{conf.label.replace(' Portal', '').replace(' CRM', '').replace(' Hub', '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Role Explainer Banner */}
            <div className={`mt-3 p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${currentRole.bgLight}`}>
              <CurrentIcon className="w-4 h-4 shrink-0 mt-0.5 text-[#082C43]" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#082C43]">{currentRole.label}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/10">
                    {currentRole.badge}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                  {currentRole.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Demo Login Button for Selected Role */}
          <button
            type="button"
            onClick={() => handleDemoLogin(activeTab)}
            disabled={isLoading}
            className="w-full mb-4 py-2.5 px-3 rounded-xl border border-dashed border-[#17648A] bg-[#17648A]/5 hover:bg-[#17648A]/10 text-[#082C43] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-[#FF795C]" />
            <span>1-Click Test Sign In as {currentRole.label}</span>
          </button>

          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-[#EFE7DA] w-full" />
            <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 shrink-0">
              or enter credentials
            </span>
            <div className="border-t border-[#EFE7DA] w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={currentRole.sampleEmail}
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

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#EFE7DA] text-[#FF795C] focus:ring-[#FF795C]"
                />
                <span className="text-[#173247]/80 font-medium">Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For password resets, contact support at info@tripbygenie.com or use the 1-Click test login above.');
                }}
                className="text-[#17648A] hover:underline font-semibold"
              >
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
              Sign In to {currentRole.label}
            </Button>
          </form>

          {/* Quick Demo Accounts Grid (1-Click for all 4 roles) */}
          <div className="mt-6 pt-5 border-t border-[#EFE7DA]">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#17648A] mb-3">
              <KeyRound className="w-3.5 h-3.5 text-[#FF795C]" />
              <span>Direct 1-Click Role Switcher</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#082C43]/20 bg-[#082C43]/5 hover:bg-[#082C43] hover:text-white font-semibold transition-all text-left cursor-pointer group"
              >
                <Shield className="w-3.5 h-3.5 text-[#FF795C] shrink-0" />
                <div className="truncate">
                  <span className="block font-bold truncate">Super Admin</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-inherit">Aditya (Admin)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('manager')}
                className="flex items-center gap-2 p-2 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-700 hover:text-white font-semibold transition-all text-left cursor-pointer group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div className="truncate">
                  <span className="block font-bold truncate">Manager CRM</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-inherit">Rajesh (Operations)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#55C9BD]/30 bg-[#55C9BD]/5 hover:bg-[#55C9BD] hover:text-[#082C43] font-semibold transition-all text-left cursor-pointer group"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#17648A] shrink-0" />
                <div className="truncate">
                  <span className="block font-bold truncate">Staff CRM</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-inherit">Priya (Consultant)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('agent')}
                className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-600 hover:text-white font-semibold transition-all text-left cursor-pointer group"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="truncate">
                  <span className="block font-bold truncate">B2B Agent</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-inherit">Vikram (Partner)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                className="flex items-center gap-2 p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-600 hover:text-white font-semibold transition-all text-left cursor-pointer group col-span-2 sm:col-span-1"
              >
                <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="block font-bold truncate">Customer Hub</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-inherit">Ananya (Traveler)</span>
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
                  <span>Agency 2: Voyage Bliss (Multi-Tenant)</span>
                </span>
                <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-bold">
                  Isolated Admin
                </span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-[#173247]/70">
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
