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
  ChevronRight,
  Menu,
  X,
  Trash2,
  UserCheck,
  Building2,
  Tag,
  Clock,
  FileText,
  ShoppingBag,
  ExternalLink,
  Shield,
  ShieldCheck,
  RefreshCw,
  Check,
  Globe2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AppNotification } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ChangePasswordModal } from '../common/ChangePasswordModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

interface NavGroup {
  id: string;
  name: string;
  icon: any;
  color: string;
  badge?: string;
  badgeColor?: string;
  items: {
    name: string;
    path: string;
    icon: any;
    badge?: string;
  }[];
}

const getManagementGroups = (prefix: string): NavGroup[] => [
  {
    id: 'staff',
    name: 'Staff Management',
    icon: UserCheck,
    color: 'text-[#55C9BD]',
    badge: 'Staff',
    badgeColor: 'bg-[#55C9BD]/20 text-[#55C9BD]',
    items: [
      { name: 'Staff Roster & Allocation', path: `${prefix}/staff`, icon: UserCheck }
    ]
  },
  {
    id: 'agent',
    name: 'Agent Management',
    icon: Briefcase,
    color: 'text-amber-400',
    badge: 'B2B',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    items: [
      { name: 'B2B Travel Agents', path: `${prefix}/agents`, icon: Briefcase },
      { name: 'Wholesale Packages', path: '/agent/marketplace', icon: ShoppingBag, badge: 'Trade' },
      { name: 'Agent Purchase Orders', path: '/agent/purchases', icon: FileText },
      { name: 'Wholesale Ledger', path: '/agent/transactions', icon: CreditCard }
    ]
  },
  {
    id: 'customer',
    name: 'Customer Management',
    icon: Users,
    color: 'text-emerald-400',
    badge: 'Clients',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    items: [
      { name: 'Customer Directory', path: `${prefix}/customers`, icon: Users },
      { name: 'Create Paid Customer ID', path: `${prefix}/customers?action=create-paid`, icon: KeyRound, badge: 'New ID' },
      { name: 'Digital Document Vault', path: '/customer/documents', icon: FileText, badge: 'Vault' },
      { name: 'Customer Support Desk', path: '/customer/support', icon: FileText }
    ]
  },
  {
    id: 'settings',
    name: 'Website & Settings',
    icon: Settings,
    color: 'text-sky-400',
    badge: 'CMS',
    badgeColor: 'bg-sky-500/20 text-sky-300',
    items: [
      { name: 'Hero Banners', path: `${prefix}/banners`, icon: Image },
      { name: 'Holiday Packages', path: `${prefix}/packages`, icon: Layers },
      { name: 'Group Tours (CRUD)', path: `${prefix}/group-tours`, icon: Users, badge: 'Fixed' },
      { name: 'Destinations Catalog', path: `${prefix}/destinations`, icon: MapPin },
      { name: 'Agency Settings', path: `${prefix}/settings`, icon: Settings },
      { name: 'View Live Website', path: '/', icon: ExternalLink }
    ]
  }
];

const getTopManagementLinks = (prefix: string, isSuperAdmin: boolean) => {
  const links = [
    { name: isSuperAdmin ? 'Super Admin Dashboard' : 'Manager Overview', path: `${prefix}/dashboard`, icon: LayoutDashboard }
  ];
  if (isSuperAdmin) {
    links.push({ name: 'ID & Role Management', path: '/admin/users', icon: KeyRound, badge: 'Super' });
  }
  links.push(
    { name: 'Leads & Enquiries', path: `${prefix}/leads`, icon: Users, badge: 'Assign' },
    { name: 'Bookings & Execution', path: `${prefix}/bookings`, icon: CalendarCheck },
    { name: 'Payments & Ledger', path: `${prefix}/payments`, icon: CreditCard }
  );
  return links;
};

const getBottomManagementLinks = (prefix: string) => [
  { name: 'Reports & CSV', path: `${prefix}/reports`, icon: BarChart3 }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { user, agency, role, logout, switchAgency, demoLogin, isAdminSession, getRoleDashboardPath } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tg_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleRoleSwitch = async (targetRole: any) => {
    try {
      const switchedRole = await demoLogin(targetRole);
      const targetPath = getRoleDashboardPath(switchedRole);
      navigate(targetPath);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tg_sidebar_collapsed', String(next));
      } catch { }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  // Grouped management dropdowns for Manager and Admin
  const [managementDropdowns, setManagementDropdowns] = useState<Record<string, boolean>>({
    staff: false,
    agent: false,
    customer: false,
    settings: false
  });

  const toggleManagementDropdown = (section: string) => {
    setManagementDropdowns((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Auto-expand group containing the active route
  useEffect(() => {
    if (role === 'manager' || role === 'admin') {
      const p = location.pathname;
      const full = location.pathname + location.search;
      const prefix = role === 'admin' ? '/admin' : '/manager';
      const groups = getManagementGroups(prefix);

      for (const group of groups) {
        if (
          group.items.some((i) => {
            if (i.path.includes('?')) {
              return full === i.path;
            }
            return p === i.path || (i.path !== '/' && p.startsWith(i.path));
          })
        ) {
          setManagementDropdowns((prev) => ({
            ...prev,
            [group.id]: true
          }));
        }
      }
    }
  }, [location.pathname, location.search, role]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    fetchNotifications();
  }, [location.pathname]);

  // Reset any global overflow lock on initial mount and route change
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
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

  const markAllNotifications = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('All notifications marked as read.');
    } catch (e) {
      // ignore
    }
  };

  const handleMarkSingleAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id, true);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) => (prev ? { ...prev, is_read: true } : null));
      }
      success('Notification marked as read.');
    } catch (e) {
      error('Failed to mark notification as read.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(null);
      }
      success('Notification deleted.');
    } catch (e) {
      error('Failed to delete notification.');
    }
  };

  // Nav menus configured per role
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { name: 'Super Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'ID & Role Management', path: '/admin/users', icon: KeyRound, badge: 'Super' }
      ];
    } else if (role === 'manager') {
      return [
        { name: 'Manager Overview', path: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Leads & Enquiries', path: '/manager/leads', icon: Users, badge: 'Assign' },
        { name: 'Staff Management', path: '/manager/staff', icon: UserCheck },
        { name: 'Holiday Packages', path: '/manager/packages', icon: Layers },
        { name: 'Group Tours', path: '/manager/group-tours', icon: Users, badge: 'Fixed' },
        { name: 'Destinations', path: '/manager/destinations', icon: MapPin },
        { name: 'Hero Banners', path: '/manager/banners', icon: Image },
        { name: 'Bookings & Execution', path: '/manager/bookings', icon: CalendarCheck },
        { name: 'B2B Travel Agents', path: '/manager/agents', icon: Briefcase },
        { name: 'Customer Directory', path: '/manager/customers', icon: Users },
        { name: 'Payments & Ledger', path: '/manager/payments', icon: CreditCard },
        { name: 'Reports & CSV', path: '/manager/reports', icon: BarChart3 },
        { name: 'Agency Settings', path: '/manager/settings', icon: Settings }
      ];
    } else if (role === 'staff' || role === 'sales') {
      return [
        { name: 'Sales Overview', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'My Assigned Leads', path: '/staff/leads', icon: Users },
        { name: 'Bookings & Conversions', path: '/staff/bookings', icon: CalendarCheck },
        { name: 'My Profile', path: '/staff/profile', icon: UserCheck }
      ];
    } else if (role === 'operations') {
      return [
        { name: 'Operations Overview', path: '/operations/dashboard', icon: LayoutDashboard },
        { name: 'Booking Execution Desk', path: '/operations/bookings', icon: CalendarCheck },
        { name: 'Travel Document Vault', path: '/customer/documents', icon: FileText }
      ];
    } else if (role === 'agent') {
      return [
        { name: 'B2B Overview', path: '/agent/dashboard', icon: LayoutDashboard },
        { name: 'Wholesale Packages', path: '/agent/marketplace', icon: ShoppingBag, badge: 'Market' },
        { name: 'Purchase Orders', path: '/agent/purchases', icon: FileText },
        { name: 'Passenger Directory', path: '/agent/customers', icon: Users },
        { name: 'B2B Invoices & Vouchers', path: '/agent/documents', icon: FileText },
        { name: 'Client Bookings', path: '/agent/bookings', icon: CalendarCheck },
        { name: 'Agent Ledger', path: '/agent/transactions', icon: CreditCard },
        { name: 'Partner Profile', path: '/agent/profile', icon: Building2 }
      ];
    } else {
      // Customer
      return [
        { name: 'My Travel Hub', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'Digital Document Wallet', path: '/customer/documents', icon: FileText, badge: 'Wallet' },
        { name: 'My Enquiries', path: '/customer/enquiries', icon: FileText },
        { name: 'Booked Trips', path: '/customer/bookings', icon: CalendarCheck },
        { name: 'Support Inquiries', path: '/customer/support', icon: FileText },
        { name: 'Payment Receipts', path: '/customer/payments', icon: CreditCard },
        { name: 'Traveler Profile', path: '/customer/profile', icon: UserCheck }
      ];
    }
  };

  const isManagerOrAdmin = role === 'manager' || role === 'admin';
  const managementPrefix = role === 'admin' ? '/admin' : '/manager';
  const managementTopLinks = getTopManagementLinks(managementPrefix, role === 'admin');
  const managementGroups = getManagementGroups(managementPrefix);
  const managementBottomLinks = getBottomManagementLinks(managementPrefix);
  const navLinks = getNavLinks();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
      <div className="h-screen bg-[#F8F1E7]/40 flex w-full overflow-hidden">
        {/* Desktop Sidebar with Protruding Toggle Button */}
        <aside
          className={`hidden lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'
            } h-full bg-[#485264] text-white flex-col shrink-0 border-r border-[#5F6B82] z-40 transition-all duration-300 ease-in-out relative`}
        >
          {/* Protruding Sidebar Collapse / Expand Toggle Button (Compact & Sleek, positioned clearly below the header) */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? "Expand Sidebar (Ctrl + B)" : "Collapse Sidebar (Ctrl + B)"}
            className="absolute -right-2.5 top-24 z-50 w-5 h-7.5 bg-[#2563EB] hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center rounded-r-xl shadow-md shadow-blue-900/30 cursor-pointer transition-all duration-200 border border-l-0 border-white/20 group hover:w-5.5 hover:shadow-blue-500/40"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Brand header */}
          <div className={`p-4 border-b border-white/10 flex flex-col gap-2 shrink-0 ${isSidebarCollapsed ? 'px-2 items-center' : ''}`}>
            <div className={`bg-white rounded-2xl shadow-xs flex items-center justify-center ${isSidebarCollapsed ? 'w-11 h-11 p-1' : 'px-3 py-2'}`}>
              {isSidebarCollapsed ? (
                <Link to="/" title="TripByGenie Home" className="font-extrabold text-[#485264] text-base tracking-tighter font-display">
                  TG<span className="text-[#2563EB]">.</span>
                </Link>
              ) : (
                <BrandLogo size="md" to="/" />
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] uppercase font-bold text-[#55C9BD] tracking-wider block text-center truncate">
                {role === 'admin'
                  ? 'Super Administrator'
                  : role === 'manager'
                    ? 'Operations Manager'
                    : role === 'staff' || role === 'sales'
                      ? 'Staff Operations'
                      : role === 'operations'
                        ? 'Operations & Logistics'
                        : role === 'agent'
                          ? 'B2B Wholesale Portal'
                          : 'Customer Account'}
              </span>
            )}
          </div>

          {/* Current Agency Capsule */}
          <div className={`py-3 bg-[#3B4353]/70 border-b border-white/10 flex items-center text-xs shrink-0 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            {isSidebarCollapsed ? (
              <div title={`${agency?.name || 'Travel Genie'} (${agency?.currency || 'INR'})`} className="flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#55C9BD]" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                  <span className="font-semibold text-white/90 truncate">
                    {agency?.name || 'Travel Genie Holidays'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2563EB]/30 text-blue-300 border border-blue-500/30 shrink-0">
                  {agency?.currency || 'INR'}
                </span>
              </>
            )}
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-3 flex-1 min-h-0 overflow-y-auto space-y-1 overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
            {isManagerOrAdmin ? (
              <div className="space-y-3">
                {/* Top Management Core Links */}
                <div className="space-y-1">
                  {managementTopLinks.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    if (isSidebarCollapsed) {
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={item.name}
                          className={`flex items-center justify-center w-full py-2.5 rounded-xl transition-all relative group ${isActive
                              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                          {item.badge && (
                            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#55C9BD] ring-2 ring-[#485264]" />
                          )}
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/25'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#55C9BD]'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#2563EB]/20 text-blue-300'
                            }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Collapsible Dropdown Sections: Staff, Agents, Customers, Settings */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2 block">
                      Management Sections
                    </span>
                  )}

                  {managementGroups.map((sec) => {
                    const isOpen = managementDropdowns[sec.id];
                    const SectionIcon = sec.icon;
                    const isAnyChildActive = sec.items.some((i) => {
                      if (i.path.includes('?')) {
                        return location.pathname + location.search === i.path;
                      }
                      return location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path));
                    });

                    if (isSidebarCollapsed) {
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            setIsSidebarCollapsed(false);
                            toggleManagementDropdown(sec.id);
                          }}
                          title={`${sec.name} (${sec.badge})`}
                          className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer relative group ${isAnyChildActive
                              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                              : 'hover:bg-white/10 text-slate-300'
                            }`}
                        >
                          <SectionIcon className={`w-5 h-5 ${isAnyChildActive ? 'text-white' : sec.color}`} />
                        </button>
                      );
                    }

                    return (
                      <div key={sec.id} className="rounded-xl overflow-hidden bg-[#3B4353]/60 border border-white/10">
                        {/* Section Header Button with Dropdown arrow */}
                        <button
                          type="button"
                          onClick={() => toggleManagementDropdown(sec.id)}
                          className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${isAnyChildActive
                              ? 'bg-white/15 text-white'
                              : 'hover:bg-white/10 text-white/90'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <SectionIcon className={`w-4 h-4 ${sec.color}`} />
                            <span>{sec.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${sec.badgeColor}`}>
                              {sec.badge}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                }`}
                            />
                          </div>
                        </button>

                        {/* Dropdown Items */}
                        {isOpen && (
                          <div className="p-1 space-y-0.5 bg-[#343B49]/80 border-t border-white/10">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.path.includes('?')
                                ? location.pathname + location.search === sub.path
                                : location.pathname === sub.path && !location.search;
                              const SubIcon = sub.icon;
                              return (
                                <Link
                                  key={sub.path}
                                  to={sub.path}
                                  className={`flex items-center justify-between pl-4 pr-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${isSubActive
                                      ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="truncate">{sub.name}</span>
                                  </div>
                                  {sub.badge && (
                                    <span className={`text-[9px] px-1 rounded font-bold shrink-0 ${isSubActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                                      }`}>
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Reports Link */}
                <div className="pt-2 border-t border-white/10 space-y-1">
                  {managementBottomLinks.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    if (isSidebarCollapsed) {
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={item.name}
                          className={`flex items-center justify-center w-full py-2.5 rounded-xl transition-all relative group ${isActive
                              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/25'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#55C9BD]'}`} />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                if (isSidebarCollapsed) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.name}
                      className={`flex items-center justify-center w-full py-2.5 rounded-xl transition-all relative group ${isActive
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                      {item.badge && (
                        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#55C9BD] ring-2 ring-[#485264]" />
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                        ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/25'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#55C9BD]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#2563EB]/20 text-blue-300'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </nav>

          {/* Footer: User profile & quick sign out */}
          <div className={`p-4 border-t border-white/10 bg-[#3B4353] shrink-0 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 px-2' : ''}`}>
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2.5 w-full">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.name}
                  title={`${user?.name} (${user?.role})`}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <button
                  onClick={() => setIsSignOutConfirmOpen(true)}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      title="Change Password"
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsSignOutConfirmOpen(true)}
                      title="Sign Out"
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Link
                  to="/"
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#55C9BD] hover:text-white pt-2 border-t border-white/5 transition-colors"
                >
                  <span>Visit Public Travel Site</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
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
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#17648A] to-[#485264] text-white hover:opacity-90 text-xs font-bold transition-all shadow-sm"
                >
                  <Globe2 className="w-3.5 h-3.5 text-[#55C9BD]" />
                  <span>Public Website</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Link>

                {/* Quick Role Switcher Pill - EXCLUSIVELY AVAILABLE FOR ADMIN SESSION */}
                {(isAdminSession || role === 'admin') && (
                  <div className="hidden xl:flex items-center gap-1 bg-[#F8F1E7] p-1 rounded-xl border border-[#EFE7DA] text-xs">
                    <span className="text-[10px] font-bold text-[#17648A] px-1.5 uppercase tracking-wider">Switch Role:</span>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('admin')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'admin' ? 'bg-[#485264] text-white shadow-xs' : 'text-[#485264] hover:bg-white'
                        }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('manager')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'manager' ? 'bg-purple-700 text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                        }`}
                    >
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('staff')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'staff' || role === 'sales' ? 'bg-teal-700 text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                        }`}
                    >
                      Sales
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('operations')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'operations' ? 'bg-blue-700 text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                        }`}
                    >
                      Operations
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('agent')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'agent' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                        }`}
                    >
                      Agent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('customer')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${role === 'customer' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#082C43] hover:bg-white'
                        }`}
                    >
                      Customer
                    </button>
                  </div>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-[#082C43] hover:bg-[#F8F1E7] transition-colors cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#2563EB] rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {/* Notification Popover */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#EFE7DA] p-4 z-40 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DA]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#082C43]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2563EB] text-white">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllNotifications}
                              className="text-xs text-[#2563EB] hover:underline cursor-pointer font-medium"
                            >
                              Mark all as read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Close notifications"
                            aria-label="Close notifications"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center text-slate-400 py-6">
                            No notifications yet.
                          </p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => setSelectedNotification(n)}
                              className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer relative group ${n.is_read
                                  ? 'bg-white border-[#EFE7DA]/60 text-slate-600 hover:border-[#17648A]/40 hover:bg-[#F8F1E7]/20'
                                  : 'bg-[#F8F1E7] border-[#17648A]/30 text-[#082C43] font-medium hover:border-[#17648A]/60'
                                }`}
                            >
                              <div className="font-bold flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {!n.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                                  )}
                                  <span className="truncate">{n.title}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(n.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all ml-1 cursor-pointer"
                                    title="Delete notification"
                                    aria-label="Delete notification"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-2">
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
              <main className="p-3 sm:p-5 lg:p-6 flex-1 w-full min-w-0 max-w-[1700px] mx-auto overflow-x-hidden">
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
                className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div
                className="relative w-80 max-w-[85vw] h-full bg-[#485264] text-white flex flex-col z-50 p-4 shadow-2xl overscroll-contain overflow-hidden"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
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
                <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between shrink-0">
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
                          : role === 'manager'
                            ? 'Operations Manager'
                            : role === 'staff' || role === 'sales'
                              ? 'Staff Operations'
                              : role === 'operations'
                                ? 'Operations & Logistics'
                                : role === 'agent'
                                  ? 'B2B Partner'
                                  : 'Traveler'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2563EB]/40 text-blue-200 border border-blue-500/30 shrink-0 uppercase">
                    {role}
                  </span>
                </div>

                {/* Quick Role Switcher (Mobile testing helper - visible for admin session) */}
                {(isAdminSession || role === 'admin') && (
                  <div className="mb-2 p-2 rounded-xl bg-[#3B4353]/70 border border-white/10 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#55C9BD] block mb-1.5">
                      Switch Portal Role:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          handleRoleSwitch('admin');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'admin'
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-white/90'
                          }`}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          handleRoleSwitch('manager');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'manager'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-white/90'
                          }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Manager</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          handleRoleSwitch('staff');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'staff' || role === 'sales'
                            ? 'bg-teal-600 text-white shadow-xs'
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
                          handleRoleSwitch('operations');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'operations'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-white/90'
                          }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Logistics</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          handleRoleSwitch('agent');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'agent'
                            ? 'bg-amber-500 text-white shadow-xs'
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
                          handleRoleSwitch('customer');
                        }}
                        className={`p-2 rounded-lg font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${role === 'customer'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-white/90'
                          }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Customer</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <nav className="py-2 space-y-2 flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {isManagerOrAdmin ? (
                    <div className="space-y-2">
                      {/* Top Core Links */}
                      <div className="space-y-1">
                        {managementTopLinks.map((item) => {
                          const isActive = location.pathname === item.path;
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileSidebarOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                                  : 'text-white/80 hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-2.5">
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
                      </div>

                      {/* Grouped Management Accordions */}
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        {managementGroups.map((sec) => {
                          const isOpen = managementDropdowns[sec.id];
                          const SectionIcon = sec.icon;
                          const isAnyChildActive = sec.items.some((i) => {
                            if (i.path.includes('?')) {
                              return location.pathname + location.search === i.path;
                            }
                            return location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path));
                          });

                          return (
                            <div key={sec.id} className="rounded-xl overflow-hidden bg-[#3B4353]/60 border border-white/10">
                              <button
                                type="button"
                                onClick={() => toggleManagementDropdown(sec.id)}
                                className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${isAnyChildActive ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-white/90'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <SectionIcon className={`w-4 h-4 ${sec.color}`} />
                                  <span>{sec.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${sec.badgeColor}`}>
                                    {sec.badge}
                                  </span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              {isOpen && (
                                <div className="p-1 space-y-0.5 bg-[#343B49]/80 border-t border-white/10">
                                  {sec.items.map((sub) => {
                                    const isSubActive = sub.path.includes('?')
                                      ? location.pathname + location.search === sub.path
                                      : location.pathname === sub.path && !location.search;
                                    const SubIcon = sub.icon;
                                    return (
                                      <Link
                                        key={sub.path}
                                        to={sub.path}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={`flex items-center justify-between pl-4 pr-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${isSubActive
                                            ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                          }`}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                          <span className="truncate">{sub.name}</span>
                                        </div>
                                        {sub.badge && (
                                          <span className={`text-[9px] px-1 rounded font-bold shrink-0 ${isSubActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                                            }`}>
                                            {sub.badge}
                                          </span>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Reports Link */}
                      <div className="pt-2 border-t border-white/10">
                        {managementBottomLinks.map((item) => {
                          const isActive = location.pathname === item.path;
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileSidebarOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                                  : 'text-white/80 hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4" />
                                <span>{item.name}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    navLinks.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
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
                    })
                  )}
                </nav>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/10 space-y-2 shrink-0">
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

          {/* Specific Notification Details Popup Modal */}
          {selectedNotification && (
            <Modal
              isOpen={!!selectedNotification}
              onClose={() => setSelectedNotification(null)}
              title={selectedNotification.title}
              subtitle={new Date(selectedNotification.created_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
              maxWidth="md"
            >
              <div className="space-y-4 text-xs">
                {/* Message Body */}
                <div className="p-4 rounded-xl bg-[#F8F1E7]/40 border border-[#EFE7DA] text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>

                {/* Action Buttons: Mark as Read & Delete Notification */}
                <div className="flex items-center justify-between pt-3 border-t border-[#EFE7DA]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    onClick={() => handleDeleteNotification(selectedNotification.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Message
                  </Button>

                  <div className="flex items-center gap-2">
                    {!selectedNotification.is_read ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkSingleAsRead(selectedNotification.id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Mark as Read
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Marked as Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}

          <ChangePasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            userRole={role ? role.toUpperCase() : undefined}
          />
        </div>
        );
};
