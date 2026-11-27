import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Users,
  Plus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  LogIn,
  Building2,
  Phone,
  Mail,
  User as UserIcon,
  ChevronDown,
  Filter,
  Layers,
  RefreshCw,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, UserRole } from '../../types';
import {
  SALES_DEPARTMENT_OPTIONS,
  OPERATIONS_DEPARTMENT_OPTIONS,
  generateNextEmployeeId,
  generateTemporaryPassword
} from '../../utils/leadEligibility';

const PHONE_EXTENSIONS = [
  { code: '+91', country: 'IN (+91)' },
  { code: '+1', country: 'US (+1)' },
  { code: '+44', country: 'UK (+44)' },
  { code: '+971', country: 'UAE (+971)' },
  { code: '+65', country: 'SG (+65)' },
  { code: '+61', country: 'AU (+61)' },
  { code: '+966', country: 'SA (+966)' },
  { code: '+60', country: 'MY (+60)' },
  { code: '+66', country: 'TH (+66)' },
  { code: '+49', country: 'DE (+49)' },
  { code: '+33', country: 'FR (+33)' }
];

export const AdminUsers: React.FC = () => {
  const { demoLogin, getRoleDashboardPath, user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'staff' | 'operations' | 'agent' | 'customer'>('all');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close role dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.role-filter-dropdown')) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRoleDropdownOpen]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Creation
  const [formData, setFormData] = useState({
    role: 'sales' as 'manager' | 'staff' | 'sales' | 'operations' | 'agent' | 'customer',
    name: '',
    email: '',
    phoneExtension: '+91',
    phone: '',
    password: '',
    employee_id: 'TBG_SAL_001',
    agency_id: 'agency_travel_genie',
    department: 'Holidays & International',
    departments: ['Holidays & International'] as string[],
    designation: 'Sales',
    company_name: '',
    discount_pct: 12,
    address: ''
  });

  // Form State for Editing
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager' as UserRole,
    status: 'active' as 'active' | 'inactive',
    password: ''
  });

  useEffect(() => {
    loadUsers();
    loadAgencies();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      error(err.message || 'Failed to load system users.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const data = await api.getAgencies();
      setAgencies(data);
    } catch {
      // ignore
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchId = (u.display_id || u.id)?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchId || matchRole;
    }
    return true;
  });

  // Counts
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const staffCount = users.filter((u) => u.role === 'staff' || u.role === 'sales').length;
  const operationsCount = users.filter((u) => u.role === 'operations').length;
  const agentCount = users.filter((u) => u.role === 'agent').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const totalCount = users.length;

  const getNextIdForRole = (targetRole: string) => {
    if (targetRole === 'sales' || targetRole === 'staff') {
      return generateNextEmployeeId('Sales', users);
    }
    if (targetRole === 'operations') {
      return generateNextEmployeeId('Operations', users);
    }
    if (targetRole === 'manager') {
      const mgrCount = users.filter((u) => u.role === 'manager').length + 1;
      return `MGR-2026-${String(mgrCount).padStart(3, '0')}`;
    }
    if (targetRole === 'agent') {
      const agtCount = users.filter((u) => u.role === 'agent').length + 1;
      return `AGT-2026-${String(agtCount).padStart(3, '0')}`;
    }
    if (targetRole === 'customer') {
      const cusCount = users.filter((u) => u.role === 'customer').length + 1;
      return `CUS-2026-${String(cusCount).padStart(3, '0')}`;
    }
    return `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleOpenCreateModal = () => {
    const initialRole = 'sales';
    const nextId = getNextIdForRole(initialRole);
    const nextPass = generateTemporaryPassword();
    setFormData({
      role: initialRole,
      name: '',
      email: '',
      phoneExtension: '+91',
      phone: '',
      password: nextPass,
      employee_id: nextId,
      designation: 'Sales',
      departments: ['Holidays & International'],
      department: 'Holidays & International',
      agency_id: 'agency_travel_genie',
      company_name: '',
      discount_pct: 12,
      address: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleRoleChange = (newRole: 'manager' | 'sales' | 'operations' | 'agent' | 'customer') => {
    const nextId = getNextIdForRole(newRole);
    const nextPass = generateTemporaryPassword();
    const defaultDesig =
      newRole === 'sales' ? 'Sales' :
      newRole === 'operations' ? 'Operations' :
      newRole === 'manager' ? 'Operations Manager' :
      newRole === 'agent' ? 'B2B Travel Partner' : 'Traveler';
    const defaultDepts =
      newRole === 'operations' ? ['Travel & Transportation Operations'] :
      ['Holidays & International'];
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      employee_id: nextId,
      password: nextPass,
      designation: defaultDesig,
      departments: defaultDepts,
      department: defaultDepts.join(', ')
    }));
  };

  const handleRegeneratePassword = () => {
    const newPass = generateTemporaryPassword();
    setFormData((prev) => ({ ...prev, password: newPass }));
    success('New temporary password generated.');
  };

  const toggleDepartment = (dept: string) => {
    setFormData((prev) => {
      const exists = prev.departments.includes(dept);
      const next = exists
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept];
      return {
        ...prev,
        departments: next.length > 0 ? next : [dept],
        department: next.join(', ')
      };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error('Please complete Name, Email, and Password.');
      return;
    }
    const formattedPhone = formData.phone.trim()
      ? `${formData.phoneExtension} ${formData.phone.trim()}`
      : '';
    setIsSubmitting(true);
    try {
      const res = await api.createAdminUser({
        ...formData,
        phone: formattedPhone
      });
      const roleName =
        formData.role === 'customer'
          ? 'Customer'
          : formData.role === 'agent'
          ? 'B2B Agent'
          : formData.role === 'manager'
          ? 'Operations Manager'
          : formData.role === 'operations'
          ? 'Operations Staff'
          : 'Sales Staff';
      success(
        formData.role === 'customer'
          ? `Successfully created Customer account for ${formData.name}! Welcoming email link dispatched.`
          : `Successfully created ${roleName} account for ${formData.name}! Onboarding invitation email link dispatched.`
      );
      setIsCreateModalOpen(false);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.updateAdminUser(selectedUser.id, editFormData);
      success(`Updated user ${editFormData.name} successfully.`);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin' && user.email === 'admin@travelgenie.com') {
      error('Primary Super Administrator account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }
    try {
      await api.deleteAdminUser(user.id);
      success(`User ${user.name} deleted successfully.`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAdminUser(user.id, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      success(`User ${user.name} is now ${nextStatus}.`);
    } catch (err: any) {
      error(err.message || 'Failed to update status.');
    }
  };

  const handleSwitchToUser = async (targetUser: User) => {
    try {
      await demoLogin(targetUser.role);
      success(`Switched session to ${targetUser.role.toUpperCase()} (${targetUser.name}).`);
      window.location.href = getRoleDashboardPath(targetUser.role);
    } catch (err: any) {
      error(err.message || 'Failed to switch user.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF795C]/15 text-[#FF795C] border border-[#FF795C]/30">
            <Shield className="w-3 h-3" />
            Super Admin
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 border border-purple-500/30">
            <ShieldCheck className="w-3 h-3" />
            Manager
          </span>
        );
      case 'staff':
      case 'sales':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#55C9BD]/20 text-teal-800 border border-[#55C9BD]/40">
            <UserCheck className="w-3 h-3" />
            Sales Executive
          </span>
        );
      case 'operations':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 border border-blue-500/30">
            <Building2 className="w-3 h-3" />
            Operations Exec
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
            <Briefcase className="w-3 h-3" />
            B2B Agent
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
            <UserIcon className="w-3 h-3" />
            Customer
          </span>
        );
    }
  };

  return (
    <DashboardLayout
      title="System Roles & ID Management"
      subtitle="Super Admin governance: Create, allocate, and oversee Manager, Staff, Agent, and Customer IDs."
      actions={
        <Button
          variant="primary"
          size="sm"
          className="shadow-md shadow-[#FF795C]/25 text-xs font-bold whitespace-nowrap shrink-0 px-3.5 py-2 inline-flex items-center gap-1.5"
          onClick={handleOpenCreateModal}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Create New User / ID</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Top Role Statistics Capsules */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total System IDs</span>
              <KeyRound className="w-4 h-4 text-[#082C43]" />
            </div>
            <div className="text-2xl font-black text-[#082C43] font-display">{totalCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">All accounts combined</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between text-purple-600 mb-1">
              <span className="text-xs font-semibold">Managers</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-900 font-display">{managerCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Operations & catalog</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between text-teal-600 mb-1">
              <span className="text-xs font-semibold">Staff Specialists</span>
              <UserCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-teal-900 font-display">{staffCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Assigned customer leads</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-semibold">B2B Agents</span>
              <Briefcase className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900 font-display">{agentCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Wholesale partners</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-semibold">Customers</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900 font-display">{customerCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Direct holiday travelers</span>
          </div>
        </div>

        {/* Filter Dropdown and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Role Filter Dropdown */}
          <div className="relative role-filter-dropdown">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] hover:bg-[#F8F1E7]/60 text-xs font-bold text-[#082C43] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#17648A]" />
                <span className="text-slate-400 font-medium">Role:</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                  roleFilter === 'all'
                    ? 'bg-[#082C43] text-white'
                    : roleFilter === 'manager'
                    ? 'bg-purple-100 text-purple-800'
                    : roleFilter === 'staff'
                    ? 'bg-teal-100 text-teal-800'
                    : roleFilter === 'operations'
                    ? 'bg-blue-100 text-blue-800'
                    : roleFilter === 'agent'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {roleFilter === 'all' && `All Roles (${totalCount})`}
                  {roleFilter === 'manager' && `Managers (${managerCount})`}
                  {roleFilter === 'staff' && `Sales Execs (${staffCount})`}
                  {roleFilter === 'operations' && `Operations (${operationsCount})`}
                  {roleFilter === 'agent' && `Agents (${agentCount})`}
                  {roleFilter === 'customer' && `Customers (${customerCount})`}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EFE7DA] p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#EFE7DA]/60 mb-1">
                  Filter by User Role
                </div>
                {[
                  { id: 'all', label: 'All Roles', count: totalCount, badgeClass: 'bg-[#082C43] text-white', dot: 'bg-[#082C43]' },
                  { id: 'manager', label: 'Managers', count: managerCount, badgeClass: 'bg-purple-100 text-purple-800', dot: 'bg-purple-600' },
                  { id: 'staff', label: 'Sales Execs', count: staffCount, badgeClass: 'bg-teal-100 text-teal-800', dot: 'bg-teal-600' },
                  { id: 'operations', label: 'Operations', count: operationsCount, badgeClass: 'bg-blue-100 text-blue-800', dot: 'bg-blue-600' },
                  { id: 'agent', label: 'Agents', count: agentCount, badgeClass: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600' },
                  { id: 'customer', label: 'Customers', count: customerCount, badgeClass: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRoleFilter(item.id as any);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      roleFilter === item.id
                        ? 'bg-[#F8F1E7] text-[#082C43] font-bold'
                        : 'hover:bg-[#F8F1E7]/50 text-slate-600 hover:text-[#082C43]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${item.badgeClass}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/30 focus:border-[#FF795C]"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 rounded-full border-3 border-[#FF795C] border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading system users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <KeyRound className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-[#082C43]">No users matching the criteria</p>
              <p className="text-xs text-slate-400">Try adjusting your role filter or search keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F1E7]/70 text-[#082C43] font-bold uppercase tracking-wider text-[10px] border-b border-[#EFE7DA]">
                  <tr>
                    <th className="py-3 px-4">User & Display ID</th>
                    <th className="py-3 px-4">Access Role</th>
                    <th className="py-3 px-4">Email & Phone</th>
                    <th className="py-3 px-4">Agency Affiliation</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]/60">
                  {filteredUsers.map((u) => {
                    const displayId = u.display_id || (u.id.startsWith('usr_') ? u.id.toUpperCase() : `ID-${u.id.slice(0, 6)}`);
                    const agencyName = agencies.find((a) => a.id === u.agency_id)?.name || 'Travel Genie Holidays';
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#EFE7DA] shrink-0"
                            />
                            <div>
                              <div className="font-bold text-[#082C43] flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono font-semibold text-[#17648A] bg-[#17648A]/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {displayId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getRoleBadge(u.role)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-slate-700">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                            <span className="font-medium truncate max-w-[150px]">{agencyName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Deactivated
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleSwitchToUser(u)}
                              className="p-1.5 rounded-lg border border-[#EFE7DA] bg-white hover:bg-[#F8F1E7] text-[#082C43] hover:text-[#FF795C] transition-colors"
                              title={`Switch / Login as ${u.name}`}
                            >
                              <LogIn className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setEditFormData({
                                  name: u.name,
                                  email: u.email,
                                  phone: u.phone || '',
                                  role: u.role,
                                  status: u.status,
                                  password: ''
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-[#EFE7DA] bg-white hover:bg-[#F8F1E7] text-[#082C43] hover:text-[#55C9BD] transition-colors"
                              title="Edit User details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW USER / ID MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User / ID (Super Admin)"
        subtitle="Designation determines dashboard access. Credentials & invitation link are automatically generated and dispatched."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          {/* Role Selection Tabs */}
          <div>
            <label className="font-bold text-[#082C43] block mb-1.5">
              Select ID Role to Provision:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('manager')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'manager'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Manager ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: MGR-xxxx</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('sales')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'sales' || formData.role === 'staff'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  Sales ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: TBG_SAL</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('operations')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'operations'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Operations ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: TBG_OPE</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('agent')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'agent'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  Agent ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: AGT-xxxx</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'customer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  Customer ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: CUS-xxxx</span>
              </button>
            </div>
          </div>

          {/* Row 1: Full Name & Corporate / Login Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                {formData.role === 'customer' ? 'Customer Full Name *' : 'Employee Full Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={formData.role === 'customer' ? 'e.g. Anand Varma' : 'e.g. Rahul Verma'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
              />
            </div>
            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                {formData.role === 'customer' ? 'Customer Email (Login ID) *' : 'Corporate Email *'}
              </label>
              <input
                type="email"
                required
                placeholder={formData.role === 'customer' ? 'anand@gmail.com' : 'rahul.staff@travelgenie.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
              />
            </div>
          </div>

          {/* Row 2: Mobile Number (with Country select) & ID Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Mobile Number *</label>
              <div className="flex gap-1.5">
                <select
                  value={formData.phoneExtension}
                  onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
                  className="w-24 p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold text-xs text-[#082C43] focus:outline-none shrink-0 cursor-pointer"
                >
                  {PHONE_EXTENSIONS.map((ext) => (
                    <option key={ext.code} value={ext.code}>
                      {ext.country}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s-]/g, '');
                    setFormData({ ...formData, phone: val });
                  }}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                {formData.role === 'customer'
                  ? 'Customer ID Code'
                  : formData.role === 'agent'
                  ? 'Agent Commercial ID'
                  : 'Employee ID Code'}
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono font-bold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                Auto-generated unique code (can be customized)
              </span>
            </div>
          </div>

          {/* Row 3: Temporary Password & Designation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#082C43]">
                  Temporary Login Password *
                </label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-[10px] font-semibold text-[#17648A] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Generate another password"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={formData.password}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/40 font-mono font-bold text-xs text-[#082C43] select-all cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                Auto-generated & encrypted on save
              </span>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                Designation *
              </label>
              {formData.role === 'sales' || formData.role === 'operations' || formData.role === 'staff' ? (
                <select
                  value={formData.designation}
                  onChange={(e) => {
                    const desig = e.target.value;
                    const isOps = desig === 'Operations';
                    setFormData((prev) => ({
                      ...prev,
                      designation: desig,
                      role: isOps ? 'operations' : 'sales',
                      employee_id: generateNextEmployeeId(isOps ? 'Operations' : 'Sales', users),
                      departments: isOps ? ['Travel & Transportation Operations'] : ['Holidays & International']
                    }));
                  }}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none cursor-pointer"
                >
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              ) : formData.role === 'manager' ? (
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none cursor-pointer"
                >
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Sales & Business Manager">Sales & Business Manager</option>
                  <option value="Branch Operations Lead">Branch Operations Lead</option>
                </select>
              ) : formData.role === 'agent' ? (
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. B2B Travel Partner"
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Traveler / Guest"
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none"
                />
              )}
              <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                {formData.role === 'sales' || formData.role === 'staff'
                  ? 'Sales Dashboard Access'
                  : formData.role === 'operations'
                  ? 'Operations Dashboard Access'
                  : formData.role === 'manager'
                  ? 'Manager Operations Access'
                  : formData.role === 'agent'
                  ? 'B2B Wholesale Portal Access'
                  : 'Customer Travel Portal Access'}
              </span>
            </div>
          </div>

          {/* Row 4: Department Multi-Select (for staff, sales, operations, manager) */}
          {(formData.role === 'sales' || formData.role === 'operations' || formData.role === 'staff' || formData.role === 'manager') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#082C43] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#17648A]" />
                  Department (Multi-Select) *
                </label>
                <span className="text-[10px] font-bold text-[#17648A] bg-[#17648A]/10 px-2 py-0.5 rounded-full">
                  {formData.departments.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FFFDF8] rounded-xl border border-[#EFE7DA]">
                {(formData.role === 'operations' ? OPERATIONS_DEPARTMENT_OPTIONS : SALES_DEPARTMENT_OPTIONS).map((dept) => {
                  const isSelected = formData.departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#17648A] text-white border-[#17648A] shadow-xs'
                          : 'bg-white text-slate-600 border-[#EFE7DA] hover:border-[#17648A]/40'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] shrink-0 ${
                          isSelected ? 'bg-white text-[#17648A] border-white font-bold' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="truncate">{dept}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Specific Fields */}
          {formData.role === 'agent' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  B2B Agency / Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Travels Pvt Ltd"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43]"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Wholesale Discount (%) *
                </label>
                <input
                  type="number"
                  placeholder="12"
                  value={formData.discount_pct}
                  onChange={(e) => setFormData({ ...formData, discount_pct: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43]"
                  required
                />
              </div>
            </div>
          )}

          {/* Customer Specific Fields */}
          {formData.role === 'customer' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Holiday Preference / Travel Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Family Tours, Beach & Adventure"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Emergency Contact / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43]"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE7DA]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Account & Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title={`Edit User Account (${selectedUser?.name})`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Direct Phone Number
            </label>
            <input
              type="text"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Role Classification
              </label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              >
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="agent">Agent</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Account Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Reset Password (leave empty to keep current)
            </label>
            <input
              type="password"
              placeholder="New password..."
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE7DA]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
