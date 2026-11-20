import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  MapPin,
  Image,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Building2,
  Tag,
  Clock,
  FileText,
  ShoppingBag,
  ExternalLink,
  Shield,
  RefreshCw,
  Check,
  Globe2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AppNotification } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { user, agency, role, logout, switchAgency, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [agenciesList, setAgenciesList] = useState<any[]>([]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    fetchNotifications();
    fetchAgencies();
  }, [location.pathname]);

  // Prevent background chain scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileSidebarOpen]);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAgencies = async () => {
    try {
      const data = await api.getAgencies();
      setAgenciesList(data);
    } catch (e) {
      // ignore
    }
  };

  const handleSwitchAgency = async (agencyId: string) => {
    try {
      await switchAgency(agencyId);
      setIsAgencyDropdownOpen(false);
      success('Switched agency context successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to switch agency');
    }
  };

  const markAllNotifications = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('All notifications marked as read.');
    } catch (e) {
      // ignore
    }
  };

  // Nav menus configured per role
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Leads & Enquiries', path: '/admin/leads', icon: Users, badge: 'Core' },
        { name: 'Staff Management', path: '/admin/staff', icon: UserCheck },
        { name: 'B2B Travel Agents', path: '/admin/agents', icon: Briefcase },
        { name: 'Customer Directory', path: '/admin/customers', icon: Users },
        { name: 'Holiday Packages', path: '/admin/packages', icon: Layers },
        { name: 'Destinations', path: '/admin/destinations', icon: MapPin },
        { name: 'Hero Banners', path: '/admin/banners', icon: Image },
        { name: 'Bookings & Trips', path: '/admin/bookings', icon: CalendarCheck },
        { name: 'Payments & Ledger', path: '/admin/payments', icon: CreditCard },
        { name: 'Reports & CSV', path: '/admin/reports', icon: BarChart3 },
        { name: 'Agency Settings', path: '/admin/settings', icon: Settings }
      ];
    } else if (role === 'staff') {
      return [
        { name: 'Staff Overview', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'My Assigned Leads', path: '/staff/leads', icon: Users },
        { name: 'Follow-ups Agenda', path: '/staff/follow-ups', icon: Clock },
        { name: 'Bookings & Conversions', path: '/staff/bookings', icon: CalendarCheck },
        { name: 'My Profile', path: '/staff/profile', icon: UserCheck }
      ];
    } else if (role === 'agent') {
      return [
        { name: 'B2B Overview', path: '/agent/dashboard', icon: LayoutDashboard },
        { name: 'Wholesale Packages', path: '/agent/marketplace', icon: ShoppingBag, badge: 'Market' },
        { name: 'Purchase Orders', path: '/agent/purchases', icon: FileText },
        { name: 'Client Bookings', path: '/agent/bookings', icon: CalendarCheck },
        { name: 'Agent Ledger', path: '/agent/transactions', icon: CreditCard },
        { name: 'Partner Profile', path: '/agent/profile', icon: Building2 }
      ];
    } else {
      // Customer
      return [
        { name: 'My Travel Hub', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'My Enquiries', path: '/customer/enquiries', icon: FileText },
        { name: 'Booked Trips', path: '/customer/bookings', icon: CalendarCheck },
        { name: 'Payment Receipts', path: '/customer/payments', icon: CreditCard },
        { name: 'Traveler Profile', path: '/customer/profile', icon: UserCheck }
      ];
    }
  };

  const navLinks = getNavLinks();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F8F1E7]/40 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#082C43] text-white flex-col shrink-0 border-r border-[#041D30] z-20">
        {/* Brand header */}
        <div className="p-4 border-b border-white/10 flex flex-col gap-2">
          <div className="bg-white px-3 py-2 rounded-2xl shadow-xs flex items-center justify-center">
            <BrandLogo size="md" to="/" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#55C9BD] tracking-wider block text-center">
            {role === 'admin'
              ? 'Administrator CRM'
              : role === 'staff'
              ? 'Staff Operations'
              : role === 'agent'
              ? 'B2B Wholesale Portal'
              : 'Customer Account'}
          </span>
        </div>

        {/* Current Agency Capsule */}
        <div className="px-4 py-3 bg-[#041D30]/60 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
            <span className="font-semibold text-white/90 truncate">
              {agency?.name || 'Travel Genie Holidays'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#17648A] text-white shrink-0">
            {agency?.currency || 'INR'}
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#FF795C] text-white shadow-md shadow-[#FF795C]/25'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#55C9BD]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#55C9BD]/20 text-[#55C9BD]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User profile & quick sign out */}
        <div className="p-4 border-t border-white/10 bg-[#041D30]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
              />
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-[#55C9BD] uppercase font-semibold block truncate">
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSignOutConfirmOpen(true)}
              title="Sign Out"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/"
            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#55C9BD] hover:text-white pt-2 border-t border-white/5 transition-colors"
          >
            <span>Visit Public Travel Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#EFE7DA] px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          {/* Mobile hamburger & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#082C43] hover:bg-[#F8F1E7] shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-[#082C43] font-display leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#173247]/60 hidden sm:block leading-tight truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Live Public Website */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#17648A] to-[#082C43] text-white hover:opacity-90 text-xs font-bold transition-all shadow-sm"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#55C9BD]" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            {/* Multi-Agency Switcher (Tenant isolation test helper) */}
            <div className="relative">
              <button
                onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/50 hover:bg-[#F8F1E7] text-xs font-semibold text-[#082C43] transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#17648A]" />
                <span className="hidden md:inline truncate max-w-[130px]">
                  {agency?.name ? agency.name.split(' ')[0] : 'Agency'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isAgencyDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#EFE7DA] p-2 z-40 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Agency Tenant
                  </div>
                  {agenciesList.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSwitchAgency(a.id)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[#F8F1E7] text-left cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-[#082C43]">{a.name}</div>
                        <div className="text-[10px] text-slate-400">{a.slug}</div>
                      </div>
                      {agency?.id === a.id && (
                        <Check className="w-4 h-4 text-[#55C9BD] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Demo Switcher Pill (1-click test of all 4 roles) */}
            <div className="hidden xl:flex items-center gap-1 bg-[#F8F1E7] p-1 rounded-xl border border-[#EFE7DA] text-xs">
              <span className="text-[10px] font-bold text-[#17648A] px-1.5 uppercase">Switch Role:</span>
              <button
                onClick={() => demoLogin('admin')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  role === 'admin' ? 'bg-[#082C43] text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => demoLogin('staff')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  role === 'staff' ? 'bg-[#082C43] text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => demoLogin('agent')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  role === 'agent' ? 'bg-[#082C43] text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                }`}
              >
                Agent
              </button>
              <button
                onClick={() => demoLogin('customer')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  role === 'customer' ? 'bg-[#082C43] text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                }`}
              >
                Customer
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-[#082C43] hover:bg-[#F8F1E7] transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF795C] rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#EFE7DA] p-4 z-40 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DA]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#082C43]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF795C] text-white">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllNotifications}
                      className="text-xs text-[#17648A] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center text-slate-400 py-6">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-colors ${
                            n.is_read
                              ? 'bg-white border-[#EFE7DA]/50 text-slate-600'
                              : 'bg-[#F8F1E7] border-[#17648A]/30 text-[#082C43] font-medium'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Custom page action buttons */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Main Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden overscroll-contain"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            className="fixed inset-0 bg-[#041D30]/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div
            className="relative w-80 max-w-[85vw] bg-[#082C43] text-white flex flex-col z-50 p-4 shadow-2xl overscroll-contain"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-xs">
                <BrandLogo size="sm" to="/" onClick={() => setIsMobileSidebarOpen(false)} />
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Capsule in Mobile Drawer */}
            <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                />
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-[#55C9BD] uppercase font-bold tracking-wider">
                    {role === 'admin'
                      ? 'Administrator'
                      : role === 'staff'
                      ? 'Staff Operations'
                      : role === 'agent'
                      ? 'B2B Partner'
                      : 'Traveler'}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#17648A] text-white shrink-0 uppercase">
                {role}
              </span>
            </div>

            {/* Quick Role Switcher (Mobile testing helper) */}
            <div className="mb-2 p-2 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#55C9BD] block mb-1.5">
                Switch Portal Role:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    demoLogin('staff');
                  }}
                  className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    role === 'staff'
                      ? 'bg-[#55C9BD] text-[#082C43] shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Staff CRM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    demoLogin('agent');
                  }}
                  className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    role === 'agent'
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">B2B Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    demoLogin('admin');
                  }}
                  className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-[#FF795C] text-white shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Admin CRM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    demoLogin('customer');
                  }}
                  className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    role === 'customer'
                      ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Customer</span>
                </button>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="py-2 space-y-1 flex-1 overflow-y-auto">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#FF795C] text-white shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#55C9BD] transition-colors"
              >
                <Globe2 className="w-4 h-4" />
                <span>Visit Public Travel Site</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>

              <button
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  setIsSignOutConfirmOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold p-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white shadow-sm transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Sign Out Confirmation Modal */}
      {isSignOutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#082C43] font-display">Confirm Sign Out</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to end your session as <strong className="text-gray-800">{user?.name}</strong> ({role.toUpperCase()})?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignOutConfirmOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 transition-colors cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
