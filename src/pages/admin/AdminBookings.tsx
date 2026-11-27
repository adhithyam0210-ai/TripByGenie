import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  DollarSign,
  Users,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  UserPlus,
  Send,
  Mail,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  RefreshCw,
  MessageCircle,
  Eye,
  UserCheck,
  EyeOff,
  Building2,
  User,
  Layers,
  Search,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminBookings: React.FC = () => {
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Customer Login Creation Setup Modal
  const [isLoginSetupModalOpen, setIsLoginSetupModalOpen] = useState(false);
  const [selectedBookingForLogin, setSelectedBookingForLogin] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: '',
    tempPassword: ''
  });

  // Customer Account Invitation Modal
  const [invitationModalData, setInvitationModalData] = useState<{
    isOpen: boolean;
    customerId: string;
    customerName: string;
    email: string;
    tempPassword?: string;
    bookingNumber: string;
    activationLink: string;
    loginUrl?: string;
  } | null>(null);

  const generateTempPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Genie@${randomDigits}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    success('Activation link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyFullCredentials = () => {
    if (!invitationModalData) return;
    const credText = `*Trip by Genie - Customer Portal Credentials*\n\nCustomer: ${invitationModalData.customerName}\nBooking: #${invitationModalData.bookingNumber}\nCustomer ID: ${invitationModalData.customerId}\nLogin ID: ${invitationModalData.email}\nTemporary Password: ${invitationModalData.tempPassword || 'Provided via link'}\nPortal Login URL: ${invitationModalData.activationLink || invitationModalData.loginUrl}\n\nPlease sign in to view your itinerary, travel vouchers, and balance schedule.`;
    navigator.clipboard.writeText(credText);
    setCopiedCredentials(true);
    success('Full credentials copied to clipboard!');
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  // View Booking Details Modal - Manager has View-Only access to payments

  // View Booking Details Modal
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  // Table Segment View Selector (B2C Customers, B2B Partners, All)
  const [tableView, setTableView] = useState<'b2c' | 'b2b' | 'all'>('b2c');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('partial');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminBookings();
      setBookings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlushBookings = async () => {
    if (!confirm('Are you sure you want to flush all test and dummy bookings? This will reset the booking register cleanly.')) return;
    try {
      setIsProcessingAction(true);
      await api.flushBookings();
      success('All test bookings have been flushed clean.');
      setSelectedBooking(null);
      setSelectedBookingForLogin(null);
      loadBookings();
    } catch (err: any) {
      error(err.message || 'Failed to flush bookings.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const b2cBookings = useMemo(() => {
    return bookings.filter((b) => !b.agent_id && (b as any).booking_type !== 'B2B' && !b.booking_number?.startsWith('B2B'));
  }, [bookings]);

  const b2bBookings = useMemo(() => {
    return bookings.filter((b) => !!b.agent_id || (b as any).booking_type === 'B2B' || b.booking_number?.startsWith('B2B'));
  }, [bookings]);

  const currentList = useMemo(() => {
    let list = tableView === 'b2c' ? b2cBookings : tableView === 'b2b' ? b2bBookings : bookings;

    if (statusFilter === 'partial') {
      list = list.filter((b) => {
        const ps = (b.payment_status || '').toLowerCase();
        const bs = (b.booking_status || '').toLowerCase();
        // Partially paid means it should be known as confirmed
        return (
          ps.includes('partial') ||
          ps === 'payment_pending' ||
          ps === 'pending' ||
          bs.includes('confirm') ||
          (Number(b.advance_amount) > 0 && Number(b.balance_amount) > 0)
        );
      });
    } else if (statusFilter === 'paid') {
      list = list.filter((b) => {
        const ps = (b.payment_status || '').toLowerCase();
        const bs = (b.booking_status || '').toLowerCase();
        return (
          ps === 'paid' ||
          bs === 'completed' ||
          (Number(b.balance_amount) === 0 && Number(b.advance_amount) > 0)
        );
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) =>
        (b.booking_number && b.booking_number.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.customer_email && b.customer_email.toLowerCase().includes(q)) ||
        (b.package_title && b.package_title.toLowerCase().includes(q)) ||
        ((b as any).customer_phone && String((b as any).customer_phone).includes(q)) ||
        ((b as any).special_requests && (b as any).special_requests.toLowerCase().includes(q))
      );
    }

    return list;
  }, [tableView, b2cBookings, b2bBookings, bookings, statusFilter, search]);

  const handleOpenView = (b: Booking) => {
    const normBookingNumber = b.booking_number || (b as any).booking_reference || b.id || 'BK-2026';
    const normId = b.id || (b as any).booking_reference || normBookingNumber;
    const normStatus = b.booking_status || (b as any).status || 'Confirmed';
    const normPayment = b.payment_status || ((b as any).payment_status === 'PARTIALLY_PAID' ? 'Partial' : (b as any).payment_status === 'PAID' ? 'Paid' : 'Pending');
    const tot = Number(b.total_amount || 0);
    const adv = Number(b.advance_amount ?? 0);
    const bal = b.balance_amount !== undefined
      ? Number(b.balance_amount)
      : ((b as any).balance_due !== undefined
        ? Number((b as any).balance_due)
        : Math.max(0, tot - adv));

    const normalizedBooking = {
      ...b,
      id: normId,
      booking_number: normBookingNumber,
      booking_status: normStatus,
      payment_status: normPayment,
      total_amount: tot,
      advance_amount: adv,
      balance_amount: bal,
      assigned_staff_name: (b as any).assigned_staff_name || (b as any).sales_executive_name || null,
      assigned_staff_department: (b as any).assigned_staff_department || null,
      assigned_team: (b as any).assigned_team || null
    };

    setViewBooking(normalizedBooking);
  };

  const handleOpenLoginSetup = (b: any) => {
    const normBookingNumber = b.booking_number || b.booking_reference || b.id || 'BK-2026';
    const norm = {
      ...b,
      id: b.id || b.booking_reference || normBookingNumber,
      booking_number: normBookingNumber
    };
    setSelectedBookingForLogin(norm);
    setLoginForm({
      name: b.customer_name || '',
      email: b.customer_email || '',
      tempPassword: generateTempPassword()
    });
    setIsLoginSetupModalOpen(true);
  };

  const handleConfirmCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForLogin) return;

    try {
      setIsProcessingAction(true);
      const res = await api.createCustomerAccount({
        booking_id: selectedBookingForLogin.id || selectedBookingForLogin.booking_number,
        name: loginForm.name,
        email: loginForm.email,
        temp_password: loginForm.tempPassword
      });
      success(res.message || `Customer login created with ID: ${res.customer_id}`);
      setIsLoginSetupModalOpen(false);
      loadBookings();
      setInvitationModalData({
        isOpen: true,
        customerId: res.customer_id || selectedBookingForLogin.customer_code || 'CUS-2026-0001',
        customerName: loginForm.name,
        email: loginForm.email,
        tempPassword: res.temp_password || loginForm.tempPassword,
        bookingNumber: selectedBookingForLogin.booking_number || (selectedBookingForLogin as any).booking_reference || selectedBookingForLogin.id,
        activationLink: res.activation_link || `${window.location.origin}/login?email=${encodeURIComponent(loginForm.email)}`,
        loginUrl: res.login_url || `${window.location.origin}/login?email=${encodeURIComponent(loginForm.email)}`
      });
    } catch (err: any) {
      error(err.message || 'Failed to create customer login.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleResendInvitation = async (b: any) => {
    try {
      setIsProcessingAction(true);
      const targetId = b.id || b.booking_number || b.booking_reference;
      const res = await api.resendCustomerInvitation({ booking_id: targetId, email: b.customer_email });
      success(res.message || `Activation invitation resent to ${b.customer_email}.`);
      loadBookings();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id || b.customer_code || 'CUS-2026-0001',
          customerName: b.customer_name,
          email: b.customer_email,
          tempPassword: b.temp_password,
          bookingNumber: b.booking_number || b.booking_reference || targetId,
          activationLink: res.activation_link,
          loginUrl: `${window.location.origin}/login?email=${encodeURIComponent(b.customer_email)}`
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to resend invitation.');
    } finally {
      setIsProcessingAction(false);
    }
  };



  return (
    <DashboardLayout
      title="Booking & Departure Operations"
      subtitle="Manage traveler reservations, agent wholesale bookings, payment collections, and trip statuses."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFlushBookings}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Flush Bookings
          </Button>
        </div>
      }
    >
            <div className="space-y-5 w-full min-w-0">
              {/* Table Selector & Controls Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs w-full min-w-0">
                {/* Dropdown Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#17648A] uppercase tracking-wider whitespace-nowrap">
                    Choose Table:
                  </span>
                  <div className="relative">
                    <select
                      value={tableView}
                      onChange={(e) => setTableView(e.target.value as any)}
                      className="pl-3 pr-8 py-2 rounded-xl border-2 border-[#17648A]/30 bg-[#F8F1E7]/60 font-bold text-[#082C43] text-xs focus:outline-none focus:border-[#17648A] cursor-pointer appearance-none shadow-xs"
                    >
                      <option value="b2c">B2C Direct Customer Bookings ({b2cBookings.length})</option>
                      <option value="b2b">B2B Wholesale Partner Bookings ({b2bBookings.length})</option>
                      <option value="all">Master Register - All Bookings ({bookings.length})</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#17648A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Search & Status Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search booking #, name, tour..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs focus:outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-semibold cursor-pointer"
                  >
                    <option value="partial">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

        {/* Bookings Table Card with Self-Contained Horizontal Scroll */}
                            <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden w-full min-w-0">
                              <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between bg-gradient-to-r from-[#FFFDF8] to-[#F8F1E7]/40">
                                <div>
                                  <h3 className="text-sm font-bold text-[#082C43] uppercase tracking-wider flex items-center gap-2">
                                    <span>
                                      {tableView === 'b2c'
                                        ? `B2C Direct Customer Bookings(${ currentList.length })`
                                        : tableView === 'b2b'
                                          ? `B2B Wholesale Partner Bookings(${ currentList.length })`
                                          : `Master Booking Register(${ currentList.length })`}
                                    </span>
                                  </h3>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {tableView === 'b2c'
                                      ? 'Consumer holiday reservations, personalized itineraries, advance receipts & customer portal provisioning.'
                                      : tableView === 'b2b'
                                        ? 'Travel agent wholesale allocations, partner margin ledgers, passenger lists & service vouchers.'
                                        : 'Consolidated operational registry across all retail and wholesale travel bookings.'}
                                  </p>
                                </div>
                              </div>

                              <div className="overflow-x-auto w-full min-w-0" style={{ scrollbarWidth: 'thin' }}>
                                {tableView === 'b2c' ? (
                                  /* ======================================================== */
                                  /* B2C DIRECT CUSTOMER TABLE                                */
                                  /* ======================================================== */
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-[#F8F1E7]/80 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                                      <tr>
                                        <th className="py-2.5 px-3">Customer Details</th>
                                        <th className="py-2.5 px-3">Tour Package</th>
                                        <th className="py-2.5 px-3">Departure Date</th>
                                        <th className="py-2.5 px-3">Payment</th>
                                        <th className="py-2.5 px-3">Customer Portal</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EFE7DA]">
                                      {currentList.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="py-12 text-center text-slate-400">
                                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <span className="font-semibold block text-slate-600 text-sm">No Bookings Found</span>
                                            <span className="text-xs text-slate-400">
                                              No customer bookings matching the selected filter criteria.
                                            </span>
                                          </td>
                                        </tr>
                                      ) : (
                                        currentList.map((b) => (
                                          <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                                            <td className="py-3 px-3">
                                              <span className="text-[10px] text-[#FF795C] font-mono font-bold block">
                                                {b.booking_number || (b as any).booking_reference || b.id}
                                              </span>
                                              <strong
                                                onClick={() => handleOpenView(b)}
                                                className="text-[#082C43] block truncate max-w-[200px] cursor-pointer hover:underline"
                                                title="Click to view customer & assignment details"
                                              >
                                                {b.customer_name}
                                              </strong>
                                              <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                                                {b.customer_email || (b as any).customer_phone || 'Direct Customer'}
                                              </span>
                                              {(b.assigned_staff_name || (b as any).sales_executive_name) && (
                                                <span className="text-[10px] text-slate-500 block truncate max-w-[200px] mt-0.5">
                                                  <span className="text-slate-400">Assigned:</span> <span className="font-semibold text-slate-700">{b.assigned_staff_name || (b as any).sales_executive_name}</span>
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-[#17648A] max-w-[200px] truncate">
                                              {b.package_title || (b as any).interested_destination || 'Custom Tour'}
                                            </td>
                                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                              {b.travel_start_date || 'Flexible'}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                              <StatusBadge status={b.payment_status} />
                                              {b.advance_amount !== undefined && Number(b.advance_amount) > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                                  ₹{Number(b.advance_amount).toLocaleString('en-IN')} paid
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                              {(!b.customer_account_status || b.customer_account_status === 'NOT_CREATED') ? (
                                                <button
                                                  onClick={() => handleOpenLoginSetup(b)}
                                                  disabled={
                                                    isProcessingAction ||
                                                    !(b.booking_status === 'Confirmed' || b.booking_status === 'BOOKING_CONFIRMED' || b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID' || b.payment_status === 'Partial' || b.payment_status === 'Paid' || Number(b.advance_amount) > 0)
                                                  }
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#082C43] hover:bg-[#17648A] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                                  title="Create customer login ID & temporary password"
                                                >
                                                  <UserPlus className="w-3 h-3 text-[#55C9BD]" />
                                                  <span>Create Login</span>
                                                </button>
                                              ) : b.customer_account_status === 'INVITATION_SENT' ? (
                                                <button
                                                  onClick={() => handleResendInvitation(b)}
                                                  disabled={isProcessingAction}
                                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer whitespace-nowrap"
                                                  title="Resend login credentials"
                                                >
                                                  <Send className="w-3 h-3 text-amber-700" />
                                                  <span>Resend Invite</span>
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleOpenLoginSetup(b)}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                                  title="Active customer portal. Click to view credentials"
                                                >
                                                  <CheckCircle2 className="w-3 h-3" />
                                                  <span>Active Portal</span>
                                                </button>
                                              )}
                                            </td>
                                            <td className="py-3 px-3 text-right whitespace-nowrap">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  onClick={() => handleOpenView(b)}
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-[#17648A] bg-slate-50 hover:bg-[#F8F1E7] border border-slate-200 rounded-lg cursor-pointer transition-colors font-semibold text-[11px]"
                                                  title="View Booking Details (Read-Only)"
                                                >
                                                  <Eye className="w-3.5 h-3.5 text-[#17648A]" />
                                                  <span>View</span>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                              ) : tableView === 'b2b' ? (
                                  /* ======================================================== */
                                  /* B2B WHOLESALE AGENT TABLE                                */
                                  /* ======================================================== */
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-[#F8F1E7]/80 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                                      <tr>
                                        <th className="py-2.5 px-3">B2B Wholesale Partner</th>
                                        <th className="py-2.5 px-3">Lead Passenger</th>
                                        <th className="py-2.5 px-3">Tour Package</th>
                                        <th className="py-2.5 px-3">Departure Date</th>
                                        <th className="py-2.5 px-3">Payment</th>
                                        <th className="py-2.5 px-3">Voucher Status</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EFE7DA]">
                                      {currentList.length === 0 ? (
                                        <tr>
                                          <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <span className="font-semibold block text-slate-600 text-sm">No B2B Wholesale Bookings Found</span>
                                            <span className="text-xs text-slate-400">
                                              When wholesale travel agents reserve packages, bookings will be tracked here.
                                            </span>
                                          </td>
                                        </tr>
                                      ) : (
                                        currentList.map((b) => (
                                          <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                                            <td className="py-3 px-3">
                                              <span className="text-[10px] text-[#FF795C] font-mono font-bold block">
                                                {b.booking_number || (b as any).booking_reference || b.id}
                                              </span>
                                              <div className="flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                  B2B
                                                </span>
                                                <strong className="text-[#082C43] truncate max-w-[160px]">
                                                  {(b as any).agent_company || 'GlobeTrotters Partner'}
                                                </strong>
                                              </div>
                                              <span className="text-[11px] text-slate-500 block truncate max-w-[180px] mt-0.5">
                                                {b.customer_email || 'partner@globetrotters.com'}
                                              </span>
                                            </td>
                                            <td className="py-3 px-3">
                                              <strong
                                                onClick={() => handleOpenView(b)}
                                                className="text-slate-800 block truncate max-w-[160px] cursor-pointer hover:underline"
                                              >
                                                {b.customer_name}
                                              </strong>
                                              <span className="text-[10px] text-slate-400">End Passenger</span>
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-[#17648A] max-w-[180px] truncate">
                                              {b.package_title}
                                            </td>
                                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                              {b.travel_start_date || 'Flexible'}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                              <StatusBadge status={b.payment_status} />
                                              {b.advance_amount !== undefined && Number(b.advance_amount) > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                                  ₹{Number(b.advance_amount).toLocaleString('en-IN')} dep
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                <Check className="w-3 h-3" />
                                                <span>Voucher Active</span>
                                              </span>
                                            </td>
                                            <td className="py-3 px-3 text-right whitespace-nowrap">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  onClick={() => handleOpenView(b)}
                                                  className="p-1.5 text-slate-500 hover:text-[#17648A] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                  title="View Complete Details"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleOpenEdit(b)}
                                                  className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                  title="Update B2B Reservation & Ledger"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                ) : (
                                  /* ======================================================== */
                                  /* ALL BOOKINGS (MASTER REGISTER)                           */
                                  /* ======================================================== */
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-[#F8F1E7]/80 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                                      <tr>
                                        <th className="py-2.5 px-3">Type & Booking</th>
                                        <th className="py-2.5 px-3">Customer / Partner</th>
                                        <th className="py-2.5 px-3">Package</th>
                                        <th className="py-2.5 px-3">Departure Date</th>
                                        <th className="py-2.5 px-3">Payment</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EFE7DA]">
                                      {currentList.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="py-12 text-center text-slate-400">
                                            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <span className="font-semibold block text-slate-600 text-sm">No Bookings Recorded</span>
                                            <span className="text-xs text-slate-400">All direct retail and B2B partner bookings will appear here.</span>
                                          </td>
                                        </tr>
                                      ) : (
                                        currentList.map((b) => {
                                          const isB2B = !!b.agent_id || (b as any).booking_type === 'B2B' || b.booking_number?.startsWith('B2B');
                                          return (
                                            <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                                              <td className="py-3 px-3 whitespace-nowrap">
                                                <span
                                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    isB2B
                                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                      : 'bg-teal-50 text-teal-800 border-teal-200'
                                                  }`}
                                                >
                                                  {isB2B ? 'B2B Partner' : 'B2C Direct'}
                                                </span>
                                                <span className="text-[10px] text-[#082C43] font-mono font-bold block mt-1">
                                                  {b.booking_number || (b as any).booking_reference || b.id}
                                                </span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <strong
                                                  onClick={() => handleOpenView(b)}
                                                  className="text-[#082C43] block truncate max-w-[180px] cursor-pointer hover:underline"
                                                  title="Click to view customer & assignment details"
                                                >
                                                  {b.customer_name}
                                                </strong>
                                                <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                                                  {b.customer_email}
                                                </span>
                                                {(b.assigned_staff_name || (b as any).sales_executive_name) && (
                                                  <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mt-0.5">
                                                    <span className="text-slate-400">Assigned:</span> <span className="font-semibold text-slate-700">{b.assigned_staff_name || (b as any).sales_executive_name}</span>
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-3 px-3 font-semibold text-[#17648A] max-w-[180px] truncate">
                                                {b.package_title}
                                              </td>
                                              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                                {b.travel_start_date || 'Flexible'}
                                              </td>
                                              <td className="py-3 px-3 whitespace-nowrap">
                                                <StatusBadge status={b.payment_status} />
                                                {b.advance_amount !== undefined && Number(b.advance_amount) > 0 && (
                                                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                                    ₹{Number(b.advance_amount).toLocaleString('en-IN')} paid
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                  <button
                                                    onClick={() => handleOpenView(b)}
                                                    className="p-1.5 text-slate-500 hover:text-[#17648A] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                    title="View Complete Details"
                                                  >
                                                    <Eye className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenEdit(b)}
                                                    className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                    title="Update Booking & Payment Status"
                                                  >
                                                    <Edit2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </div>



        {/* Manager Customer Login Setup Modal */}
        {isLoginSetupModalOpen && selectedBookingForLogin && (
          <Modal
            isOpen={isLoginSetupModalOpen}
            onClose={() => setIsLoginSetupModalOpen(false)}
            title="Create Customer Login Credentials"
            subtitle={`Booking #${ selectedBookingForLogin.booking_number || (selectedBookingForLogin as any).booking_reference || selectedBookingForLogin.id || 'BK-2026' } • ${ selectedBookingForLogin.package_title || selectedBookingForLogin.destination || 'Tour Package' } `}
          >
            <form onSubmit={handleConfirmCreateLogin} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8F1E7]/70 border border-[#EFE7DA] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Booking Status</span>
                  <span className="font-bold text-[#082C43]">{selectedBookingForLogin.booking_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Advance Paid</span>
                  <span className="font-bold text-emerald-700">₹{selectedBookingForLogin.advance_amount?.toLocaleString('en-IN')}</span>
                </div>
                {selectedBookingForLogin.payment_proof && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Payment Proof</span>
                    <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {selectedBookingForLogin.payment_proof}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#082C43]">Customer Full Name *</label>
                  <span className="text-[10px] text-slate-500 font-medium">From Enquiry Form</span>
                </div>
                <input
                  type="text"
                  required
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#082C43]">Customer Login ID (Email) *</label>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ From Enquiry Form
                  </span>
                </div>
                <input
                  type="email"
                  required
                  readOnly
                  value={loginForm.email}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-700 text-xs cursor-not-allowed select-all"
                  title="Directly derived from the customer's submitted enquiry form"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Customer login ID is strictly set to the email used in the enquiry form.</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#082C43]">Temporary Password *</label>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, tempPassword: generateTempPassword() })}
                    className="text-[11px] text-[#17648A] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.tempPassword}
                    onChange={(e) => setLoginForm({ ...loginForm, tempPassword: e.target.value })}
                    className="w-full p-2.5 pr-10 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Pre-generated secure password. Customer will be invited to reset it upon login.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE7DA]">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsLoginSetupModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isProcessingAction}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  {isProcessingAction ? 'Creating...' : 'Create Login & Send Invite'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Customer Account Invitation Ready Modal */}
        {invitationModalData?.isOpen && (
          <Modal
            isOpen={invitationModalData.isOpen}
            onClose={() => setInvitationModalData(null)}
            title="Customer Account Credentials Ready"
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-emerald-950 text-sm">Customer Login Successfully Created!</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Login ID and temporary credentials have been generated for <strong>{invitationModalData.customerName}</strong> for Booking <strong>#{invitationModalData.bookingNumber}</strong>.
                </p>
              </div>

              {/* Credentials Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span className="font-medium">Customer ID:</span>
                  <span className="font-mono font-bold text-[#082C43] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {invitationModalData.customerId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span className="font-medium">Login ID (Email):</span>
                  <span className="font-mono font-bold text-[#082C43] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {invitationModalData.email}
                  </span>
                </div>
                {invitationModalData.tempPassword && (
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span className="font-medium">Temporary Password:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {invitationModalData.tempPassword}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span className="font-medium">Booking Reference:</span>
                  <span className="font-mono text-slate-700">{invitationModalData.bookingNumber}</span>
                </div>
              </div>

              {/* Direct Invitation Link */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Customer Portal Login Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationModalData.activationLink || invitationModalData.loginUrl}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] text-slate-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(invitationModalData.activationLink || invitationModalData.loginUrl || '')}
                    className="px-3.5 py-2.5 bg-[#17648A] hover:bg-[#082C43] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors shadow-sm"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Quick Share Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyFullCredentials}
                  className="p-2.5 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7] hover:bg-[#ebdcc7] text-[#082C43] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedCredentials ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#17648A]" />}
                  <span>{copiedCredentials ? 'Copied All!' : 'Copy Credentials'}</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
    `*Trip by Genie - Customer Portal Credentials*\n\nHello ${invitationModalData.customerName},\n\nYour Trip by Genie customer portal account is ready!\n\nBooking: #${invitationModalData.bookingNumber}\nLogin ID: ${invitationModalData.email}\nTemporary Password: ${invitationModalData.tempPassword || 'Set via link'}\nLogin Link: ${invitationModalData.activationLink || invitationModalData.loginUrl}\n\nPlease sign in to access your itinerary and trip documents.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DA]">
                <a
                  href={invitationModalData.activationLink || invitationModalData.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#17648A] hover:underline font-bold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Portal Login in New Tab
                </a>
                <Button type="button" variant="primary" size="sm" onClick={() => setInvitationModalData(null)}>
                  Done
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* View Booking Details Popup Modal */}
        {viewBooking && (
          <Modal
            isOpen={!!viewBooking}
            onClose={() => setViewBooking(null)}
            title={`Booking #${viewBooking.booking_number || viewBooking.id}`}
            subtitle={`Customer: ${viewBooking.customer_name} • Tour: ${viewBooking.package_title || 'Custom Tour'}`}
            maxWidth="2xl"
          >
            <div className="space-y-4 text-xs">
              {/* Status Header */}
              <div className="p-3 bg-[#F8F1E7]/70 border border-[#EFE7DA] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Trip Status</span>
                  <StatusBadge status={viewBooking.booking_status} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Status</span>
                  <StatusBadge status={viewBooking.payment_status} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer Portal</span>
                  <span className="font-semibold text-slate-700">
                    {viewBooking.customer_account_status === 'ACTIVE'
                      ? 'Active Portal'
                      : viewBooking.customer_account_status === 'INVITATION_SENT'
                      ? 'Invitation Sent'
                      : 'Not Created'}
                  </span>
                </div>
              </div>

              {/* Assigned Staff & Consultant Card */}
              <div className="p-3 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/70 border border-blue-200/90 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#17648A] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-700 uppercase font-extrabold tracking-wider">
                        Assigned To (Staff / Consultant)
                      </span>
                      {viewBooking.assigned_staff_name && viewBooking.assigned_staff_name !== 'Unassigned' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Active Consultant
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <strong className="text-[#082C43] text-sm block mt-0.5">
                      {viewBooking.assigned_staff_name || (viewBooking as any).sales_executive_name || 'Unassigned / Direct Booking'}
                    </strong>
                    {viewBooking.assigned_staff_department && (
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Department: <span className="font-semibold text-slate-800">{viewBooking.assigned_staff_department}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Staff Team Roster if assigned */}
              {viewBooking.assigned_team && viewBooking.assigned_team.length > 1 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Assigned Department Team Members:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewBooking.assigned_team.map((m: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#082C43] block">{m.staff_name}</span>
                          <span className="text-[10px] text-slate-500">{Array.isArray(m.departments) ? m.departments.join(', ') : m.departments}</span>
                        </div>
                        {m.is_primary ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Primary Owner</span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Supporting</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer & Tour Information Grid */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Name</span>
                  <strong className="text-[#082C43] text-sm">{viewBooking.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-mono">{viewBooking.customer_email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-mono">{(viewBooking as any).customer_phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tour Package</span>
                  <span className="font-semibold text-[#17648A]">{viewBooking.package_title || 'Custom Tour'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Departure / Travel Date</span>
                  <span className="font-semibold">{viewBooking.travel_start_date || 'Flexible'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Travelers Count</span>
                  <span className="font-semibold">{viewBooking.travelers_count || 2} Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Consultant</span>
                  <span className="font-bold text-[#082C43]">
                    {viewBooking.assigned_staff_name || (viewBooking as any).sales_executive_name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-semibold text-slate-700">
                    {viewBooking.assigned_staff_department || 'General Sales'}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3.5 bg-white border border-[#EFE7DA] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#082C43] uppercase tracking-wider">
                    Financial Breakdown & Payments
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    View Only • Managed by assigned sales staff
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Package Price</span>
                    <span className="font-extrabold text-sm text-[#082C43]">
                      ₹{viewBooking.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Advance Paid</span>
                    <span className="font-extrabold text-sm text-emerald-700">
                      ₹{viewBooking.advance_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="text-[10px] text-rose-500 uppercase font-bold block">Balance Due</span>
                    <span className="font-extrabold text-sm text-[#FF795C]">
                      ₹{viewBooking.balance_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {(viewBooking as any).payment_proof && (
                  <div className="mt-3 pt-2.5 border-t border-[#EFE7DA] flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Payment Evidence / Reference:</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {(viewBooking as any).payment_proof}
                    </span>
                  </div>
                )}
              </div>

              {/* Special Requests or Notes */}
              {((viewBooking as any).special_requests || (viewBooking as any).notes) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Special Requests & Inclusions:</span>
                  <p>{(viewBooking as any).special_requests || (viewBooking as any).notes}</p>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-[#EFE7DA]">
                <div className="flex items-center gap-2">
                  {(!viewBooking.customer_account_status || viewBooking.customer_account_status === 'NOT_CREATED') ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const b = viewBooking;
                        setViewBooking(null);
                        handleOpenLoginSetup(b);
                      }}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Create Customer Login
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const b = viewBooking;
                        setViewBooking(null);
                        handleOpenLoginSetup(b);
                      }}
                      leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                    >
                      View / Reset Credentials
                    </Button>
                  )}

                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

    </DashboardLayout>
  );
};
