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
  Filter
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, UserRole } from '../../types';

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
    role: 'manager' as 'manager' | 'staff' | 'operations' | 'agent' | 'customer',
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    agency_id: 'agency_travel_genie',
    department: 'Operations & Logistics',
    designation: 'Senior Tour Consultant',
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error('Please complete Name, Email, and Password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createAdminUser(formData);
      success(`Successfully created ${formData.role.toUpperCase()} account for ${formData.name}!`);
      setIsCreateModalOpen(false);
      setFormData({
        role: 'manager',
        name: '',
        email: '',
        phone: '',
        password: 'password123',
        agency_id: 'agency_travel_genie',
        department: 'Operations & Catalog Management',
        designation: 'Senior Tour Consultant',
        company_name: '',
        discount_pct: 12,
        address: ''
      });
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
          onClick={() => setIsCreateModalOpen(true)}
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
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Role Selection Tabs */}
          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1.5">
              Select ID Role to Provision:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'manager' })}
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
                onClick={() => setFormData({ ...formData, role: 'staff' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'staff'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20'
                    : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  Sales ID
                </div>
                <span className="text-[10px] text-slate-500 block">Prefix: SLS-xxxx</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'operations' })}
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
                <span className="text-[10px] text-slate-500 block">Prefix: OPS-xxxx</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'agent' })}
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
                onClick={() => setFormData({ ...formData, role: 'customer' })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Varma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Email Address (Login ID) *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. anand@travelgenie.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Direct Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 99404 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Initial Account Password *
              </label>
              <input
                type="text"
                required
                placeholder="password123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/30 font-mono"
              />
            </div>
          </div>

          {/* Role specific dynamic fields */}
          {formData.role === 'staff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[#EFE7DA]">
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  Staff Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Holiday Specialist"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. South India & International"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>
          )}

          {formData.role === 'agent' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[#EFE7DA]">
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  B2B Agency / Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Travels Pvt Ltd"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  Wholesale Discount (%)
                </label>
                <input
                  type="number"
                  placeholder="12"
                  value={formData.discount_pct}
                  onChange={(e) => setFormData({ ...formData, discount_pct: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>
          )}

          {formData.role === 'manager' && (
            <div className="pt-2 border-t border-[#EFE7DA]">
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Managerial Portfolio / Division
              </label>
              <input
                type="text"
                placeholder="e.g. Operations & Catalog Lead"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE7DA]">
            <Button
              type="button"
              variant="outline"
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
              Activate & Issue ID
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
