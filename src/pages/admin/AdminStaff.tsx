import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Check,
  Layers,
  Briefcase,
  RefreshCw,
  Copy,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Pencil,
  UserX,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Compass,
  Calendar,
  ArrowUpRight,
  Clock,
  Trash2
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  DEPARTMENT_OPTIONS,
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

export const AdminStaff: React.FC = () => {
  const { success, error } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provisionedStaff, setProvisionedStaff] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneExtension: '+91',
    phone: '',
    designation: 'Sales' as 'Sales' | 'Operations',
    departments: ['Holidays & International'] as string[],
    password: '',
    employee_id: 'TBG_SAL_001'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phoneExtension: '+91',
    phone: '',
    designation: 'Sales' as 'Sales' | 'Operations',
    departments: [] as string[],
    status: 'active' as 'active' | 'inactive',
    employee_id: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Deactivation 2-step flow state
  const [deactivateStep, setDeactivateStep] = useState<1 | 2 | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('Temporary Leave / Suspension');
  const [deactivateConfirmed, setDeactivateConfirmed] = useState(false);
  const [deletePermanently, setDeletePermanently] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Role Filter state (Sales vs Operations dropdown filter)
  const [roleFilter, setRoleFilter] = useState<'sales' | 'operations'>('sales');

  // Employee Analytics Dashboard State
  const [analyticsStaff, setAnalyticsStaff] = useState<any | null>(null);
  const [staffLeads, setStaffLeads] = useState<any[]>([]);
  const [staffBookings, setStaffBookings] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStaff();
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    const nextId = generateNextEmployeeId('Sales', staff);
    const nextPass = generateTemporaryPassword();
    setFormData({
      name: '',
      email: '',
      phoneExtension: '+91',
      phone: '',
      designation: 'Sales',
      departments: ['Holidays & International'],
      password: nextPass,
      employee_id: nextId
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateField = (field: string, val: any): string => {
    let err = '';
    const trimmed = typeof val === 'string' ? val.trim() : '';

    if (field === 'name') {
      if (!trimmed) {
        err = 'Employee full name is required';
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (/^\d+$/.test(trimmed)) {
        err = 'Name cannot be only numbers';
      } else if (!/[a-zA-Z]/.test(trimmed)) {
        err = 'Name must contain at least one letter';
      } else if (/[^a-zA-Z\s.]/.test(trimmed)) {
        err = 'Name cannot contain special characters or numbers';
      }
    } else if (field === 'email') {
      if (!trimmed) {
        err = 'Corporate email is required';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'Please enter a valid corporate email (e.g. name@domain.com)';
      }
    } else if (field === 'phone') {
      if (!trimmed) {
        err = 'Mobile number is required';
      } else {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length < 10) {
          err = 'Mobile number must contain at least 10 digits';
        }
      }
    } else if (field === 'departments') {
      if (!val || val.length === 0) {
        err = 'Please select at least one department';
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
    return err;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nErr = validateField('name', formData.name);
    if (nErr) newErrors.name = nErr;
    const eErr = validateField('email', formData.email);
    if (eErr) newErrors.email = eErr;
    const pErr = validateField('phone', formData.phone);
    if (pErr) newErrors.phone = pErr;
    const dErr = validateField('departments', formData.departments);
    if (dErr) newErrors.departments = dErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDesignationChange = (newDesig: 'Sales' | 'Operations') => {
    const nextId = generateNextEmployeeId(newDesig, staff);
    const newDepts =
      newDesig === 'Operations'
        ? ['Travel & Transportation Operations']
        : ['Holidays & International'];
    setFormData((prev) => ({
      ...prev,
      designation: newDesig,
      employee_id: nextId,
      departments: newDepts
    }));
    validateField('departments', newDepts);
  };

  const handleRegeneratePassword = () => {
    const newPass = generateTemporaryPassword();
    setFormData((prev) => ({ ...prev, password: newPass }));
    success('New temporary password generated.');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      error('Please fix the errors before provisioning staff.');
      return;
    }

    const roleType = formData.designation.toLowerCase() as 'sales' | 'operations';
    const formattedPhone = formData.phone.trim() ? `${formData.phoneExtension} ${formData.phone.trim()}` : '';

    setIsSubmitting(true);
    try {
      const res = await api.createAdminStaff({
        ...formData,
        phone: formattedPhone,
        role: roleType,
        role_type: roleType,
        designation: formData.designation,
        designations: [formData.designation],
        department: formData.departments.join(', '),
        departments: formData.departments
      });

      const effectiveEmpId = res?.profile?.employee_id || formData.employee_id;
      const effectivePass = res?.temporary_password || formData.password;
      const effectiveLink = res?.invitation_link || res?.login_link || `${window.location.origin}/staff-login?email=${encodeURIComponent(formData.email)}&role=${roleType}`;

      setProvisionedStaff({
        name: formData.name,
        email: formData.email,
        employee_id: effectiveEmpId,
        designation: formData.designation,
        password: effectivePass,
        invitation_link: effectiveLink
      });

      success(`Staff invitation dispatched to ${formData.email}. Account is pending onboarding.`);
      setIsModalOpen(false);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStaffStatus = async (staffMember: any) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAdminStaff(staffMember.id, { status: newStatus });
      success(`Staff account ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status.');
    }
  };

  const handleOpenEditModal = (staffMember: any) => {
    setEditingStaff(staffMember);
    const profile = staffMember.profile || {};
    const isOps =
      staffMember.role === 'operations' ||
      profile.role_type === 'operations' ||
      (profile.designation && profile.designation.toLowerCase().includes('operation')) ||
      (Array.isArray(profile.designations) &&
        profile.designations.some((d: string) => d.toLowerCase().includes('operation')));

    const desig: 'Sales' | 'Operations' = isOps ? 'Operations' : 'Sales';
    const depts: string[] =
      Array.isArray(profile.departments) && profile.departments.length > 0
        ? profile.departments
        : profile.department
          ? profile.department.split(',').map((x: string) => x.trim())
          : [isOps ? 'Travel & Transportation Operations' : 'Holidays & International'];

    let initialExtension = '+91';
    let initialPhone = staffMember.phone || '';
    const matchedExt = PHONE_EXTENSIONS.find((ext) => initialPhone.startsWith(ext.code));
    if (matchedExt) {
      initialExtension = matchedExt.code;
      initialPhone = initialPhone.slice(matchedExt.code.length).trim();
    }

    setEditFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      phoneExtension: initialExtension,
      phone: initialPhone,
      designation: desig,
      departments: depts,
      status: (staffMember.status || 'active') as 'active' | 'inactive',
      employee_id: profile?.employee_id || staffMember.display_id || (isOps ? 'TBG_OPE_001' : 'TBG_SAL_001')
    });
    setEditErrors({});
  };

  const handleEditDesignationChange = (newDesig: 'Sales' | 'Operations') => {
    setEditFormData((prev) => ({
      ...prev,
      designation: newDesig,
      departments:
        newDesig === 'Operations'
          ? ['Travel & Transportation Operations']
          : ['Holidays & International']
    }));
  };

  const toggleEditDepartment = (dept: string) => {
    setEditFormData((prev) => {
      const exists = prev.departments.includes(dept);
      const next = exists ? prev.departments.filter((d) => d !== dept) : [...prev.departments, dept];
      return { ...prev, departments: next };
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const newErrors: Record<string, string> = {};
    const trimmedName = editFormData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Employee full name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (/^\d+$/.test(trimmedName)) {
      newErrors.name = 'Name cannot be only numbers';
    } else if (/[^a-zA-Z\s.]/.test(trimmedName)) {
      newErrors.name = 'Name cannot contain special characters or numbers';
    }

    if (editFormData.phone.trim()) {
      const digits = editFormData.phone.trim().replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone = 'Mobile number must contain at least 10 digits';
      }
    }

    if (editFormData.departments.length === 0) {
      newErrors.departments = 'Please select at least one department';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      error('Please fix the errors before saving.');
      return;
    }

    const roleType = editFormData.designation.toLowerCase() as 'sales' | 'operations';
    const formattedPhone = editFormData.phone.trim() ? `${editFormData.phoneExtension} ${editFormData.phone.trim()}` : '';

    setIsUpdating(true);
    try {
      await api.updateAdminStaff(editingStaff.id, {
        name: trimmedName,
        phone: formattedPhone,
        employee_id: editFormData.employee_id,
        status: editFormData.status,
        role: roleType,
        role_type: roleType,
        designation: editFormData.designation,
        designations: [editFormData.designation],
        department: editFormData.departments.join(', '),
        departments: editFormData.departments
      });

      success('Staff details, role, and department access updated successfully!');
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to update staff member.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExecuteDeactivation = async () => {
    if (!editingStaff) return;
    setIsDeactivating(true);
    try {
      if (deletePermanently) {
        await api.deleteAdminStaff(editingStaff.id);
        success(`Staff member ${editingStaff.name} has been permanently removed from the staff directory.`);
      } else {
        await api.updateAdminStaff(editingStaff.id, {
          status: 'inactive'
        });
        success(`Staff account for ${editingStaff.name} has been successfully deactivated.`);
      }
      setDeactivateStep(null);
      setDeletePermanently(false);
      setDeactivateConfirmed(false);
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to process staff deactivation/removal.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeletePendingStaff = async (staffMember: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${staffMember.name} from the database?`)) {
      return;
    }
    try {
      await api.deleteAdminStaff(staffMember.id);
      success(`Staff member ${staffMember.name} has been permanently deleted from the database.`);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to permanently delete staff member.');
    }
  };

  const handleDirectActivate = async () => {
    if (!editingStaff) return;
    try {
      await api.updateAdminStaff(editingStaff.id, {
        status: 'active'
      });
      success(`Staff account for ${editingStaff.name} has been activated.`);
      setEditingStaff((prev: any) => prev ? { ...prev, status: 'active' } : null);
      setEditFormData((prev) => ({ ...prev, status: 'active' }));
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to activate staff account.');
    }
  };

  const isStaffOps = (s: any) => {
    const profile = s.profile || {};
    return (
      s.role === 'operations' ||
      profile.role_type === 'operations' ||
      (profile.designation && profile.designation.toLowerCase().includes('operation')) ||
      (Array.isArray(profile.designations) &&
        profile.designations.some((d: string) => d.toLowerCase().includes('operation')))
    );
  };

  const handleOpenAnalytics = async (staffMember: any) => {
    setAnalyticsStaff(staffMember);
    setIsLoadingAnalytics(true);
    try {
      const [leads, bookings] = await Promise.all([
        api.getAdminLeads().catch(() => []),
        api.getAdminBookings().catch(() => [])
      ]);

      const myLeads = (Array.isArray(leads) ? leads : []).filter(
        (l: any) =>
          l.assigned_staff_id === staffMember.id ||
          l.assigned_to === staffMember.name ||
          l.assigned_to === staffMember.id
      );

      const myBookings = (Array.isArray(bookings) ? bookings : []).filter(
        (b: any) =>
          b.assigned_staff_id === staffMember.id ||
          b.consultant_name === staffMember.name
      );

      setStaffLeads(myLeads);
      setStaffBookings(myBookings);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const toggleDepartment = (dept: string) => {
    setFormData((prev) => {
      const exists = prev.departments.includes(dept);
      const next = exists ? prev.departments.filter((d) => d !== dept) : [...prev.departments, dept];
      validateField('departments', next);
      return { ...prev, departments: next };
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success(`${label} copied to clipboard!`);
  };

  const copyAllCredentials = () => {
    if (!provisionedStaff) return;
    const summary = `Trip by Genie - Staff Account Credentials
Employee: ${provisionedStaff.name}
Employee ID: ${provisionedStaff.employee_id}
Designation: ${provisionedStaff.designation}
Email: ${provisionedStaff.email}
Temporary Password: ${provisionedStaff.password}
Access & Login Link: ${provisionedStaff.invitation_link}`;
    navigator.clipboard.writeText(summary);
    success('Complete credentials and invitation link copied to clipboard!');
  };

  return (
    <DashboardLayout
      title="Staff & Consultant Management"
      subtitle="Provision employee accounts, assign Sales/Operations designation for dashboard access, and configure department eligibility."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Staff Member
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          {/* Header with Title & Dropdown Filter for Sales vs Operations */}
          <div className="p-4 border-b border-[#EFE7DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8F1E7]/25">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
                  {roleFilter === 'sales' ? 'Sales Team' : 'Operations Team'}
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#17648A]/10 text-[#17648A]">
                  {staff.filter((s) => (roleFilter === 'sales' ? !isStaffOps(s) : isStaffOps(s))).length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click on any employee to open their live performance analytics dashboard.
              </p>
            </div>

            {/* Dropdown to select between sales and operations staffs */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#082C43] shrink-0">Filter Team:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'sales' | 'operations')}
                className="px-3 py-1.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold text-xs text-[#082C43] focus:outline-none cursor-pointer"
              >
                <option value="sales">Sales Staff ({staff.filter((s) => !isStaffOps(s)).length})</option>
                <option value="operations">Operations Staff ({staff.filter((s) => isStaffOps(s)).length})</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Departments</th>
                  <th className="py-3 px-4">Workload</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {staff
                  .filter((s) => (roleFilter === 'sales' ? !isStaffOps(s) : isStaffOps(s)))
                  .map((s) => {
                    const profile = s.profile || {};
                    const isOps = isStaffOps(s);

                    const depts: string[] =
                      Array.isArray(profile.departments) && profile.departments.length > 0
                        ? profile.departments
                        : profile.department
                          ? profile.department.split(',').map((x: string) => x.trim())
                          : [isOps ? 'Travel & Transportation Operations' : 'Holidays & International'];

                    const displayDesignation = isOps ? 'Operations' : 'Sales';
                    const displayEmpId = profile?.employee_id || s.display_id || (isOps ? 'TBG_OPE_001' : 'TBG_SAL_001');

                    const statusStr = (s.status || s.account_status || s.profile?.status || '').toLowerCase();
                    const isPending =
                      statusStr === 'pending' ||
                      statusStr === 'pending_activation' ||
                      statusStr === 'invitation_sent' ||
                      statusStr === 'invited' ||
                      (s.account_status && s.account_status.toLowerCase() === 'invitation_sent') ||
                      (s.activation_status && s.activation_status.toLowerCase() === 'invitation_sent') ||
                      (s.profile?.status && s.profile.status.toLowerCase() === 'pending');

                    return (
                      <tr key={s.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                        {/* Employee Column - Profile picture removed; click opens analytics */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => !isPending && handleOpenAnalytics(s)}
                            className={`text-left block ${
                              isPending ? 'cursor-not-allowed opacity-75' : 'group cursor-pointer'
                            }`}
                            title={isPending ? 'Awaiting staff onboarding' : 'Click to view full analytics dashboard'}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-xs transition-colors ${
                                isPending ? 'text-slate-600' : 'text-[#082C43] group-hover:text-[#17648A] group-hover:underline'
                              }`}>
                                {s.name}
                              </span>
                              <BarChart3 className={`w-3.5 h-3.5 transition-colors ${
                                isPending ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#17648A]'
                              }`} />
                            </div>
                            <span className="text-[11px] text-slate-500 block">{s.email}</span>
                            {s.phone && (
                              <span className="text-[10px] text-slate-400 font-mono block">{s.phone}</span>
                            )}
                          </button>
                        </td>

                        {/* Employee ID */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#17648A] bg-[#17648A]/10 px-2.5 py-1 rounded-md text-[11px]">
                            {displayEmpId}
                          </span>
                        </td>

                        {/* Designation & Access */}
                        <td className="py-3.5 px-4">
                          {isOps ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              Operations Dashboard
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Sales Dashboard
                            </span>
                          )}
                          <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                            Designation: {displayDesignation}
                          </span>
                        </td>

                        {/* Departments */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {depts.map((d: string) => (
                              <span
                                key={d}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${d.toLowerCase().includes('international')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : d.toLowerCase().includes('domestic')
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : d.toLowerCase().includes('operations') || d.toLowerCase().includes('transport')
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Performance Workload: Active Leads & Closed Bookings */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#082C43] bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {s.assignedLeadsCount || 0} Active
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              {s.convertedLeadsCount || 0} Closed
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              Pending
                            </span>
                          ) : statusStr === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => !isPending && handleOpenAnalytics(s)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isPending
                                  ? 'text-slate-400 bg-slate-100/60 opacity-50 cursor-not-allowed border border-dashed border-slate-300'
                                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer'
                              }`}
                              title={isPending ? 'Action disabled: Awaiting staff onboarding' : 'View Performance Analytics'}
                            >
                              <BarChart3 className={`w-3.5 h-3.5 ${isPending ? 'text-slate-400' : 'text-[#17648A]'}`} />
                              Analytics
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => !isPending && handleOpenEditModal(s)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isPending
                                  ? 'text-slate-400 bg-slate-100/60 opacity-50 cursor-not-allowed border border-dashed border-slate-300'
                                  : 'text-[#17648A] bg-[#17648A]/10 hover:bg-[#17648A]/20 cursor-pointer'
                              }`}
                              title={isPending ? 'Action disabled: Awaiting staff onboarding' : 'Edit Staff Account'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleDeletePendingStaff(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                                title="Permanently delete this pending staff member from database"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                Delete
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
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Staff Account"
          subtitle="Designation determines dashboard access. Credentials & invitation link are automatically generated and dispatched."
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
            {/* Row 1: Full Name & Corporate Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    validateField('name', e.target.value);
                  }}
                  className={`w-full p-2 rounded-xl border bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  placeholder="rahul.staff@travelgenie.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateField('email', e.target.value);
                  }}
                  className={`w-full p-2 rounded-xl border bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors ${errors.email ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                    }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Row 2: Mobile Number (with Extension) & Employee ID Code */}
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
                      validateField('phone', val);
                    }}
                    className={`w-full p-2 rounded-xl border bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors ${errors.phone ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                      }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee ID Code</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="e.g. TBG_SAL_005"
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono font-bold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Auto-generated unique code (can be customized)
                </span>
              </div>
            </div>

            {/* Row 3: Password (Left) & Designation (Right) - Smaller size & side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Temporary Login Password *
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.password}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/40 font-mono font-bold text-xs text-[#082C43] cursor-not-allowed select-all"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Auto-generated & encrypted on save
                </span>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Designation *
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => handleDesignationChange(e.target.value as 'Sales' | 'Operations')}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none cursor-pointer"
                >
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  {formData.designation === 'Sales' ? 'Sales Dashboard Access' : 'Operations Dashboard Access'}
                </span>
              </div>
            </div>

            {/* Row 4: Department Multi-Select */}
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
              <div
                className={`grid grid-cols-2 gap-2 p-2.5 bg-[#FFFDF8] rounded-xl border transition-colors ${errors.departments ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                  }`}
              >
                {(formData.designation === 'Operations' ? OPERATIONS_DEPARTMENT_OPTIONS : SALES_DEPARTMENT_OPTIONS).map((dept) => {
                  const isSelected = formData.departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-all border cursor-pointer ${isSelected
                        ? 'bg-[#17648A] text-white border-[#17648A] shadow-xs'
                        : 'bg-white text-slate-600 border-[#EFE7DA] hover:border-[#17648A]/40'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] shrink-0 ${isSelected ? 'bg-white text-[#17648A] border-white font-bold' : 'border-slate-300 bg-white'
                          }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="truncate">{dept}</span>
                    </button>
                  );
                })}
              </div>
              {errors.departments && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{errors.departments}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Create Staff Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <Modal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title="Edit Staff Member"
          subtitle={`Update employee role, dashboard designation, department eligibility, and account status for ${editingStaff.name}.`}
          maxWidth="2xl"
        >
          <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
            {/* Row 1: Full Name & Corporate Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={`w-full p-2 rounded-xl border bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors ${editErrors.name ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                    }`}
                />
                {editErrors.name && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{editErrors.name}</p>
                )}
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Corporate Email</label>
                <input
                  type="email"
                  readOnly
                  value={editFormData.email}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/40 font-semibold text-xs text-slate-500 cursor-not-allowed select-all"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Corporate login username (fixed)
                </span>
              </div>
            </div>

            {/* Row 2: Mobile Number (with Extension) & Employee ID Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Mobile Number</label>
                <div className="flex gap-1.5">
                  <select
                    value={editFormData.phoneExtension}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneExtension: e.target.value })}
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
                    value={editFormData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d\s-]/g, '');
                      setEditFormData({ ...editFormData, phone: val });
                    }}
                    className={`w-full p-2 rounded-xl border bg-[#FFFDF8] font-semibold text-xs text-[#082C43] transition-colors ${editErrors.phone ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                      }`}
                  />
                </div>
                {editErrors.phone && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{editErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee ID Code</label>
                <input
                  type="text"
                  value={editFormData.employee_id}
                  onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })}
                  placeholder="e.g. TBG_SAL_001"
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono font-bold text-xs text-[#082C43] transition-colors focus:outline-none focus:border-[#17648A]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Assigned unique staff identifier
                </span>
              </div>
            </div>

            {/* Row 3: Role & Designation Access (Left) & Account Status (Right) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Designation & Role Access *
                </label>
                <select
                  value={editFormData.designation}
                  onChange={(e) => handleEditDesignationChange(e.target.value as 'Sales' | 'Operations')}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none cursor-pointer"
                >
                  <option value="Sales">Sales (Sales Dashboard Access)</option>
                  <option value="Operations">Operations (Operations Dashboard Access)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  {editFormData.designation === 'Sales' ? 'Can handle holiday, honeymoon & group tours' : 'Can handle ticketing, transport & vehicle execution'}
                </span>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Account Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'inactive' })}
                  className={`w-full p-2 rounded-xl border font-bold text-xs focus:outline-none cursor-pointer ${editFormData.status === 'active'
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                    : 'border-rose-300 bg-rose-50/50 text-rose-800'
                    }`}
                >
                  <option value="active">Active (Can log in & handle leads)</option>
                  <option value="inactive">Inactive / Deactivated (Access paused)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Toggle staff active or deactivated status
                </span>
              </div>
            </div>

            {/* Row 4: Department Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#082C43] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#17648A]" />
                  Department (Multi-Select) *
                </label>
                <span className="text-[10px] font-bold text-[#17648A] bg-[#17648A]/10 px-2 py-0.5 rounded-full">
                  {editFormData.departments.length} selected
                </span>
              </div>
              <div
                className={`grid grid-cols-2 gap-2 p-2.5 bg-[#FFFDF8] rounded-xl border transition-colors ${editErrors.departments ? 'border-red-400 bg-red-50/20' : 'border-[#EFE7DA]'
                  }`}
              >
                {(editFormData.designation === 'Operations' ? OPERATIONS_DEPARTMENT_OPTIONS : SALES_DEPARTMENT_OPTIONS).map((dept) => {
                  const isSelected = editFormData.departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleEditDepartment(dept)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-all border cursor-pointer ${isSelected
                        ? 'bg-[#17648A] text-white border-[#17648A] shadow-xs'
                        : 'bg-white text-slate-600 border-[#EFE7DA] hover:border-[#17648A]/40'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] shrink-0 ${isSelected ? 'bg-white text-[#17648A] border-white font-bold' : 'border-slate-300 bg-white'
                          }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="truncate">{dept}</span>
                    </button>
                  );
                })}
              </div>
              {editErrors.departments && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{editErrors.departments}</p>
              )}
            </div>

            <div className="pt-3 border-t border-[#EFE7DA] flex items-center justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingStaff(null)}>
                Cancel
              </Button>
              {editingStaff.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateStep(1);
                    setDeactivateReason('Temporary Leave / Suspension');
                    setDeactivateConfirmed(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 bg-rose-50/70 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDirectActivate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Activate
                </button>
              )}
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2-Step Deactivation Confirmation Modal */}
      {deactivateStep !== null && editingStaff && (
        <Modal
          isOpen={deactivateStep !== null}
          onClose={() => setDeactivateStep(null)}
          title="Deactivate Staff Account"
          subtitle={`Two-step authorization required to suspend account access for ${editingStaff.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DA]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${deactivateStep === 1
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-rose-700'
                    }`}
                >
                  1
                </span>
                <span
                  className={`font-bold ${deactivateStep === 1 ? 'text-rose-900' : 'text-slate-500'
                    }`}
                >
                  Review Impact & Reason
                </span>
              </div>
              <span className="text-slate-300 font-bold">&rarr;</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${deactivateStep === 2
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  2
                </span>
                <span
                  className={`font-bold ${deactivateStep === 2 ? 'text-rose-900' : 'text-slate-400'
                    }`}
                >
                  Final Confirmation
                </span>
              </div>
            </div>

            {/* STEP 1: Impact Notice & Reason */}
            {deactivateStep === 1 && (
              <div className="space-y-3.5">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block text-xs font-bold">Step 1: Impact Notice</strong>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Deactivating <strong className="text-black">{editingStaff.name}</strong> ({editingStaff.email}) will immediately terminate active login sessions and suspend automated lead allocation.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#EFE7DA] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Employee ID:</span>
                    <span className="font-mono font-bold text-[#082C43]">
                      {editingStaff.profile?.employee_id || editingStaff.display_id || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Role & Access:</span>
                    <span className="font-bold text-[#082C43] capitalize">
                      {editingStaff.role} Dashboard
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Active Leads:</span>
                    <span className="font-bold text-[#17648A]">
                      {editingStaff.assignedLeadsCount || 0} Leads
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">
                    Select Deactivation Reason *
                  </label>
                  <select
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs text-[#082C43] focus:outline-none cursor-pointer"
                  >
                    <option value="Temporary Leave / Suspension">Temporary Leave / Suspension</option>
                    <option value="Resignation / Offboarding">Resignation / Offboarding</option>
                    <option value="Department Transfer / Reorganization">Department Transfer / Reorganization</option>
                    <option value="Security / Compliance Hold">Security / Compliance Hold</option>
                    <option value="Other Administrative Action">Other Administrative Action</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE7DA]">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeactivateStep(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setDeactivateStep(2)}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Proceed to Step 2 &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Final Authorization & Execution */}
            {deactivateStep === 2 && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <strong className="text-xs font-bold text-rose-950">
                      Step 2: Please Authorize Deactivation
                    </strong>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    You are confirming the deactivation of <strong>{editingStaff.name}</strong> for the reason: <em className="font-semibold text-rose-950">"{deactivateReason}"</em>.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] cursor-pointer hover:bg-rose-50/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={deactivateConfirmed}
                    onChange={(e) => setDeactivateConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-[#082C43] leading-snug">
                    I confirm that I want to deactivate this account and revoke portal access immediately.
                  </span>
                </label>

                {/* Second Checkbox: Permanent Removal Option */}
                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${deletePermanently
                  ? 'border-red-400 bg-red-50/60 shadow-xs'
                  : 'border-[#EFE7DA] bg-[#FFFDF8] hover:bg-rose-50/20'
                  }`}>
                  <input
                    type="checkbox"
                    checked={deletePermanently}
                    onChange={(e) => setDeletePermanently(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-red-950 block leading-snug">
                      Remove from the staff list permanently
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Check this to permanently delete this employee from the staff directory and account register instead of keeping an inactive record.
                    </span>
                  </div>
                </label>

                <div className="pt-2 flex justify-between gap-2 border-t border-[#EFE7DA]">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeactivateStep(1)}>
                    &larr; Back to Step 1
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setDeactivateStep(null);
                      setDeletePermanently(false);
                      setDeactivateConfirmed(false);
                    }}>
                      Cancel
                    </Button>
                    <button
                      type="button"
                      disabled={!deactivateConfirmed || isDeactivating}
                      onClick={handleExecuteDeactivation}
                      className={`px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${deletePermanently ? 'bg-red-700 hover:bg-red-800' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                    >
                      {isDeactivating
                        ? (deletePermanently ? 'Removing...' : 'Deactivating...')
                        : (deletePermanently ? 'Confirm & Remove Permanently' : 'Confirm & Deactivate')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Account Created & Invitation Dispatched Success Modal */}
      {provisionedStaff && (
        <Modal
          isOpen={!!provisionedStaff}
          onClose={() => setProvisionedStaff(null)}
          title="Staff Invitation Dispatched"
          subtitle={`An onboarding invitation email with login credentials and secure link has been sent to ${provisionedStaff.email}.`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm">Status: Pending Onboarding</strong>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  The employee account has been created with <strong>Pending</strong> status. An official onboarding invitation link and temporary credentials have been sent to{' '}
                  <strong className="underline">{provisionedStaff.email}</strong>. Once the staff member onboards and logs in, their status will automatically become <strong>Active</strong>.
                </p>
              </div>
            </div>

            <div className="bg-[#FFFDF8] border border-[#EFE7DA] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-[#082C43]">{provisionedStaff.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
                <span className="text-slate-500">Employee ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#17648A] bg-[#17648A]/10 px-2 py-0.5 rounded">
                    {provisionedStaff.employee_id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(provisionedStaff.employee_id, 'Employee ID')}
                    className="p-1 hover:text-[#17648A] cursor-pointer"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
                <span className="text-slate-500">Designation & Access:</span>
                <span className="font-bold text-[#082C43]">
                  {provisionedStaff.designation} (
                  {provisionedStaff.designation === 'Operations' ? 'Operations Dashboard' : 'Sales Dashboard'})
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
                <span className="text-slate-500">Temporary Password:</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {provisionedStaff.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(provisionedStaff.password, 'Password')}
                    className="p-1 hover:text-purple-700 cursor-pointer"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Staff Workspace Login Link:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={provisionedStaff.invitation_link}
                    className="w-full p-2 text-[11px] font-mono bg-slate-50 border border-[#EFE7DA] rounded-lg text-slate-700 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(provisionedStaff.invitation_link, 'Invitation link')}
                    className="p-2 border border-[#EFE7DA] rounded-lg hover:bg-slate-50 cursor-pointer shrink-0 font-semibold"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyAllCredentials}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Details
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => setProvisionedStaff(null)}>
                OK
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Employee Analytics Dashboard Modal */}
      {analyticsStaff && (
        <Modal
          isOpen={!!analyticsStaff}
          onClose={() => setAnalyticsStaff(null)}
          title="Staff Performance & Analytics"
          subtitle={`Detailed performance metrics, conversion pipeline, and operational data for ${analyticsStaff.name}`}
          maxWidth="3xl"
        >
          {(() => {
            const profile = analyticsStaff.profile || {};
            const isOps = isStaffOps(analyticsStaff);
            const displayDesignation = isOps ? 'Operations' : 'Sales';
            const displayEmpId = profile?.employee_id || analyticsStaff.display_id || (isOps ? 'TBG_OPE_001' : 'TBG_SAL_001');

            const totalLeads = Math.max(analyticsStaff.assignedLeadsCount || 0, staffLeads.length);
            const convertedCount = Math.max(
              analyticsStaff.convertedLeadsCount || 0,
              staffLeads.filter((l) => l.status === 'Converted' || l.status === 'Won').length
            );
            const activeLeads = Math.max(0, totalLeads - convertedCount);
            const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : (convertedCount > 0 ? 100 : 0);
            const totalRevenue = staffBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

            const depts: string[] =
              Array.isArray(profile.departments) && profile.departments.length > 0
                ? profile.departments
                : profile.department
                  ? profile.department.split(',').map((x: string) => x.trim())
                  : [isOps ? 'Travel & Transportation Operations' : 'Holidays & International'];

            const uniqueDestinations = Array.from(
              new Set(
                staffLeads
                  .map((l) => l.destination || l.package_title)
                  .concat(staffBookings.map((b) => b.destination || b.package_title))
                  .filter(Boolean)
              )
            );

            return (
              <div className="space-y-4 text-xs">
                {/* Profile Summary Card */}
                <div className="p-3.5 bg-[#FFFDF8] border border-[#EFE7DA] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#082C43]">{analyticsStaff.name}</h4>
                      <span className="font-mono font-bold text-[#17648A] bg-[#17648A]/10 px-2 py-0.5 rounded text-[11px]">
                        {displayEmpId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${analyticsStaff.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${analyticsStaff.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        {analyticsStaff.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span>{analyticsStaff.email}</span>
                      {analyticsStaff.phone && <span>• {analyticsStaff.phone}</span>}
                      <span>• {displayDesignation} Team</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOps ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Operations Dashboard Access
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Sales Dashboard Access
                      </span>
                    )}
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-[11px]">Assigned Inquiries</span>
                      <Activity className="w-3.5 h-3.5 text-[#17648A]" />
                    </div>
                    <div className="text-xl font-bold text-[#082C43]">{totalLeads}</div>
                    <span className="text-[10px] text-slate-400">Total inquiries handled</span>
                  </div>

                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-[11px]">Active Pipeline</span>
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-600">{activeLeads}</div>
                    <span className="text-[10px] text-slate-400">In-progress follow-ups</span>
                  </div>

                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-[11px]">Conversions</span>
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-700">{convertedCount}</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">{conversionRate}% win rate</span>
                  </div>

                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-[11px]">Gross Handled Value</span>
                      <DollarSign className="w-3.5 h-3.5 text-[#17648A]" />
                    </div>
                    <div className="text-xl font-bold text-[#082C43]">
                      ₹{totalRevenue > 0 ? totalRevenue.toLocaleString('en-IN') : '0'}
                    </div>
                    <span className="text-[10px] text-slate-400">Confirmed trip bookings</span>
                  </div>
                </div>

                {/* Performance & Lead Distribution Breakdown */}
                <div className="p-3.5 bg-[#FFFDF8] border border-[#EFE7DA] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#082C43] font-bold">Conversion Pipeline Health</strong>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {conversionRate}% Conversion Rate
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Converted: ${convertedCount}`}
                    />
                    <div
                      style={{ width: `${totalLeads > 0 ? (activeLeads / totalLeads) * 100 : 0}%` }}
                      className="bg-amber-400 h-full"
                      title={`Active: ${activeLeads}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Converted Bookings ({convertedCount})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Active / Follow-up ({activeLeads})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      Total Leads ({totalLeads})
                    </span>
                  </div>
                </div>

                {/* Department Eligibility & Destinations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl space-y-2">
                    <strong className="block text-[#082C43] font-bold">
                      Department Eligibility & Scope
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {depts.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-[#17648A]/10 text-[#17648A] border border-[#17648A]/20"
                        >
                          ✓ {d}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {isOps
                        ? 'Authorized for transport, vehicle dispatch, flight & ticketing operations.'
                        : 'Authorized to receive traveler holiday packages, honeymoons, and custom inquiries.'}
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-[#EFE7DA] rounded-xl space-y-2">
                    <strong className="block text-[#082C43] font-bold">
                      Top Destinations Handled
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueDestinations.length > 0 ? (
                        uniqueDestinations.map((dest: any) => (
                          <span
                            key={dest}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            📍 {dest}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Assigned to general {isOps ? 'operational routes' : 'holiday destinations'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Assigned Leads Table */}
                <div className="border border-[#EFE7DA] rounded-xl overflow-hidden bg-white">
                  <div className="p-2.5 bg-[#F8F1E7]/40 border-b border-[#EFE7DA] flex items-center justify-between">
                    <strong className="text-[#082C43] font-bold text-xs">
                      Recent Assigned Enquiries ({staffLeads.length})
                    </strong>
                    <span className="text-[10px] text-slate-400">Latest pipeline assignments</span>
                  </div>
                  {isLoadingAnalytics ? (
                    <div className="p-4 text-center text-slate-500">Loading analytics records...</div>
                  ) : staffLeads.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No active leads currently in queue. Manager can allocate leads from the Leads & Enquiries tab.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Lead ID</th>
                            <th className="py-2 px-3">Customer</th>
                            <th className="py-2 px-3">Destination</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {staffLeads.slice(0, 5).map((l: any) => (
                            <tr key={l.id} className="hover:bg-slate-50/60">
                              <td className="py-1.5 px-3 font-mono font-bold text-[#17648A]">{l.id}</td>
                              <td className="py-1.5 px-3 font-semibold text-[#082C43]">{l.customer_name || l.name}</td>
                              <td className="py-1.5 px-3 text-slate-600">{l.destination || 'Custom Tour'}</td>
                              <td className="py-1.5 px-3">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {l.status || 'Assigned'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DA]">
                  <button
                    type="button"
                    onClick={() => {
                      const staffToEdit = analyticsStaff;
                      setAnalyticsStaff(null);
                      handleOpenEditModal(staffToEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#17648A]/30 text-[#17648A] hover:bg-[#17648A]/10 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Staff Profile & Role
                  </button>

                  <Button type="button" variant="primary" size="sm" onClick={() => setAnalyticsStaff(null)}>
                    Close Analytics
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </DashboardLayout>
  );
};
