import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Compass, 
  CheckCircle,
  Eye,
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Plus,
  KeyRound,
  ShieldCheck,
  FileText,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { openGmailCompose } from '../../utils/mail';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface CustomerItem {
  id: string;
  customer_id?: string;
  customer_code?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  profile?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    emergency_contact?: string;
    preferred_currency?: string;
  };
  bookingsCount: number;
  enquiriesCount: number;
  totalSpent: number;
  booking_id?: string;
  raw_booking_id?: string;
  advance_payment_status?: string;
  account_status?: string;
  activation_status?: string;
  active_invitation_link?: string;
  invitation_sent_date?: string;
  last_login?: string;
  can_create_login?: boolean;
}

export const AdminCustomers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Paid Customer Creation Modal state
  const [isCreatePaidModalOpen, setIsCreatePaidModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'existing'>('manual');
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    booking_id: '',
    name: '',
    email: '',
    phone: '',
    destination: '',
    total_amount: 150000,
    advance_amount: 45000,
    payment_method: 'UPI',
    payment_reference: '',
    travel_date: '',
    notes: ''
  });

  const [invitationModalData, setInvitationModalData] = useState<{
    isOpen: boolean;
    customerId: string;
    customerName: string;
    email: string;
    activationLink: string;
  } | null>(null);
  const { showToast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showToast('Activation link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminCustomers();
      setCustomers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await api.getAdminBookings();
      setAvailableBookings(data || []);
    } catch (err) {
      console.error('Failed to load bookings list:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    loadBookings();
    if (searchParams.get('action') === 'create-paid') {
      setIsCreatePaidModalOpen(true);
    }
  }, [searchParams]);

  const onSelectBooking = (bkId: string) => {
    const bk = availableBookings.find(b => b.id === bkId);
    if (bk) {
      setFormData({
        booking_id: bk.id,
        name: bk.customer_name || '',
        email: bk.customer_email || '',
        phone: bk.customer_phone || '',
        destination: bk.destination_name || '',
        total_amount: Number(bk.total_amount) || 0,
        advance_amount: Number(bk.advance_amount) || 0,
        payment_method: bk.advance_payment_method || 'UPI',
        payment_reference: bk.advance_payment_reference || '',
        travel_date: bk.departure_date ? bk.departure_date.slice(0, 10) : '',
        notes: bk.notes || ''
      });
    }
  };

  const handleCreatePaidCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMode === 'existing') {
      if (!formData.booking_id) {
        showToast('Please select a confirmed booking to generate the Customer ID.', 'error');
        return;
      }
    } else {
      if (!formData.name || !formData.email || !formData.phone) {
        showToast('Full Name, Email address, and Mobile number are required.', 'error');
        return;
      }
      if (Number(formData.advance_amount) <= 0) {
        showToast('Verified advance deposit must be greater than zero to generate a Customer ID.', 'error');
        return;
      }
    }

    try {
      setIsProcessing(true);
      const payload = createMode === 'existing'
        ? { booking_id: formData.booking_id }
        : {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            destination: formData.destination,
            total_amount: Number(formData.total_amount),
            advance_amount: Number(formData.advance_amount),
            payment_method: formData.payment_method,
            payment_reference: formData.payment_reference,
            travel_date: formData.travel_date,
            notes: formData.notes
          };

      const res = await api.createPaidCustomerAccount(payload);
      showToast(res.message || 'Paid customer account created successfully!', 'success');
      setIsCreatePaidModalOpen(false);
      setFormData({
        booking_id: '',
        name: '',
        email: '',
        phone: '',
        destination: '',
        total_amount: 150000,
        advance_amount: 45000,
        payment_method: 'UPI',
        payment_reference: '',
        travel_date: '',
        notes: ''
      });
      fetchCustomers();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id,
          customerName: formData.name || res.customer_name || 'Valued Customer',
          email: res.email || formData.email,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer account.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateLogin = async (c: CustomerItem) => {
    if (!c.raw_booking_id) {
      showToast('No confirmed booking reference found to create login for this traveler.', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const res = await api.createCustomerAccount({ booking_id: c.raw_booking_id });
      showToast(res.message || `Customer login created for ${c.email}!`, 'success');
      fetchCustomers();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id || c.customer_id || 'CUS-2026-0001',
          customerName: c.name,
          email: c.email,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer login.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendInvite = async (c: CustomerItem) => {
    try {
      setIsProcessing(true);
      const res = await api.resendCustomerInvitation({
        customer_id: c.customer_id || c.id,
        booking_id: c.raw_booking_id,
        email: c.email
      });
      showToast(res.message || `Activation invitation generated for ${c.email}.`, 'success');
      fetchCustomers();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id || c.customer_id || 'CUS-2026-0001',
          customerName: c.name,
          email: c.email,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invitation.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (c: CustomerItem, newStatus: string) => {
    try {
      setIsProcessing(true);
      await api.updateCustomerAccountStatus(c.id, { status: newStatus });
      showToast(`Customer account updated to ${newStatus}.`, 'success');
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update account status.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
      (c.booking_id && c.booking_id.toLowerCase().includes(q)) ||
      (c.profile?.city && c.profile.city.toLowerCase().includes(q))
    );

    if (statusFilter !== 'all') {
      const accSt = (c.account_status || '').toUpperCase();
      if (accSt !== statusFilter.toUpperCase()) return false;
    }

    return matchesSearch;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalBookingsAll = customers.reduce((sum, c) => sum + (c.bookingsCount || 0), 0);

  const exportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'City', 'Bookings Count', 'Enquiries Count', 'Total Spent (INR)', 'Status', 'Registered Date'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.profile?.city || ''}"`,
      c.bookingsCount,
      c.enquiriesCount,
      c.totalSpent,
      c.status,
      c.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory exported successfully!', 'success');
  };

  return (
    <DashboardLayout
      title="Customer Directory"
      subtitle="Manage your agency's direct clients, booking history, lifetime revenue, and traveler profiles."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreatePaidModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Paid Customer ID
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          icon={<Users className="w-5 h-5 text-brand-navy" />} 
          subtitle="Registered travelers"
        />
        <StatCard 
          title="Active Travelers" 
          value={customers.filter(c => c.status === 'active').length} 
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} 
          subtitle="Ready to book"
        />
        <StatCard 
          title="Total Lifetime Spent" 
          value={`₹${totalSpentAll.toLocaleString('en-IN')}`} 
          icon={<CreditCard className="w-5 h-5 text-brand-coral" />} 
          subtitle="Across all bookings"
        />
        <StatCard 
          title="Avg Bookings / User" 
          value={customers.length > 0 ? (totalBookingsAll / customers.length).toFixed(1) : '0'} 
          icon={<Compass className="w-5 h-5 text-brand-turquoise" />} 
          subtitle="Customer retention"
        />
      </div>

      {/* Search Bar & Status Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email, phone, booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 bg-gray-50 focus:outline-none"
          >
            <option value="all">All Account Statuses</option>
            <option value="NOT_CREATED">Not Created (Awaiting Action)</option>
            <option value="INVITATION_PENDING">Invitation Pending</option>
            <option value="INVITATION_SENT">Invitation Sent</option>
            <option value="ACTIVE">Active Travelers</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>

        <span className="text-xs text-gray-400 self-end md:self-center">
          Showing {filtered.length} of {customers.length} travelers
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-brand-cream/50 border-b border-gray-100 text-gray-500 font-medium text-xs">
                <th className="p-4">Customer ID / Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4 text-center">Advance Payment</th>
                <th className="p-4 text-center">Account Status</th>
                <th className="p-4 text-center">Activation</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-coral border-t-transparent animate-spin" />
                      Loading customer records...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-ivory/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy font-bold flex items-center justify-center text-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-dark">{c.name}</p>
                          <p className="text-xs font-mono font-bold text-[#FF795C]">
                            {c.customer_id || c.customer_code || 'Pending'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {c.booking_id || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        c.advance_payment_status === 'PAID' || c.advance_payment_status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.advance_payment_status === 'PARTIALLY_PAID' || c.advance_payment_status === 'Partial'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.advance_payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.account_status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.account_status === 'INVITATION_SENT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : c.account_status === 'SUSPENDED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {c.account_status || 'NOT_CREATED'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs text-slate-500">
                        {c.activation_status || 'NOT_ACTIVATED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* COPY INVITATION LINK */}
                        {c.account_status !== 'ACTIVE' && c.active_invitation_link && (
                          <button
                            onClick={() => copyToClipboard(c.active_invitation_link!)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all cursor-pointer whitespace-nowrap"
                            title="Copy secure activation link"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </button>
                        )}

                        {/* CREATE CUSTOMER LOGIN (Section 7) */}
                        {c.account_status === 'NOT_CREATED' && c.can_create_login && (
                          <button
                            onClick={() => handleCreateLogin(c)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#082C43] hover:bg-[#17648A] text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                            title="Generate Customer ID, secure activation token & email invitation"
                          >
                            <span>Create Login</span>
                          </button>
                        )}

                        {/* RESEND INVITATION */}
                        {c.account_status === 'INVITATION_SENT' && (
                          <button
                            onClick={() => handleResendInvite(c)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer whitespace-nowrap"
                            title="Resend single-use activation invitation"
                          >
                            <span>Resend Invite</span>
                          </button>
                        )}

                        {/* SUSPEND / REACTIVATE */}
                        {c.account_status === 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(c, 'SUSPENDED')}
                            disabled={isProcessing}
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer"
                            title="Suspend customer account"
                          >
                            Suspend
                          </button>
                        )}
                        {c.account_status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleToggleStatus(c, 'ACTIVE')}
                            disabled={isProcessing}
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer"
                            title="Reactivate customer account"
                          >
                            Reactivate
                          </button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(c)}
                          className="text-brand-ocean hover:text-brand-navy text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-navy text-white text-lg font-bold flex items-center justify-center">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-brand-dark">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-500">Registered {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Lifetime stats */}
              <div className="grid grid-cols-3 gap-2 bg-brand-cream/40 p-4 rounded-xl border border-brand-cream text-center">
                <div>
                  <p className="text-xs text-gray-500">Enquiries</p>
                  <p className="text-lg font-bold text-brand-navy">{selectedCustomer.enquiriesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedCustomer.bookingsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lifetime Spent</p>
                  <p className="text-lg font-bold text-brand-coral">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Email Address</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Phone Number</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">City / State</p>
                    <p className="font-medium text-brand-dark mt-0.5">
                      {selectedCustomer.profile?.city ? `${selectedCustomer.profile.city}, ${selectedCustomer.profile.state || 'India'}` : 'Not provided'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Preferred Currency</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.profile?.preferred_currency || 'INR (₹)'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedCustomer.profile?.emergency_contact && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                  <p className="text-xs font-semibold text-amber-800 uppercase">Emergency Contact</p>
                  <p className="text-amber-900 mt-0.5">{selectedCustomer.profile.emergency_contact}</p>
                </div>
              )}

              {/* Active Activation Link */}
              {selectedCustomer.account_status !== 'ACTIVE' && selectedCustomer.active_invitation_link && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-900 font-bold text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-700" />
                      Active Activation Link
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedCustomer.active_invitation_link!)}
                      className="text-xs text-sky-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </button>
                  </div>
                  <div className="p-2 bg-white rounded border border-sky-200 text-[11px] font-mono break-all text-slate-700 select-all">
                    {selectedCustomer.active_invitation_link}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    openGmailCompose(selectedCustomer.email, 'Trip by Genie Customer Inquiry');
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Paid Customer Modal */}
      {isCreatePaidModalOpen && (
        <Modal
          isOpen={isCreatePaidModalOpen}
          onClose={() => setIsCreatePaidModalOpen(false)}
          title="Onboard New Paid Customer & Generate Customer ID"
        >
          <form onSubmit={handleCreatePaidCustomer} className="space-y-4 text-xs">
            {/* Mode Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setCreateMode('manual')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  createMode === 'manual'
                    ? 'bg-white text-[#082C43] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Direct Customer & Payment Entry
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('existing')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  createMode === 'existing'
                    ? 'bg-white text-[#082C43] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Link Confirmed Booking ({availableBookings.filter(b => b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID' || Number(b.advance_amount) > 0).length})
              </button>
            </div>

            {createMode === 'existing' ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                  Select an existing confirmed booking with a verified advance deposit. The system will automatically create the customer login and unique Customer ID.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Confirmed Booking *</label>
                  <select
                    value={formData.booking_id}
                    onChange={(e) => onSelectBooking(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    required
                  >
                    <option value="">-- Choose a Confirmed Booking --</option>
                    {availableBookings
                      .filter(b => (b.booking_status === 'BOOKING_CONFIRMED' || b.booking_status === 'Confirmed') && (Number(b.advance_amount) > 0 || b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID'))
                      .map((bk) => (
                        <option key={bk.id} value={bk.id}>
                          {bk.booking_number} — {bk.customer_name} ({bk.destination_name || 'Trip'}) | Advance Paid: ₹{(bk.advance_amount || 0).toLocaleString('en-IN')}
                        </option>
                      ))}
                  </select>
                </div>

                {formData.booking_id && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Customer Name:</span>
                      <span className="font-bold text-[#082C43]">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Email:</span>
                      <span className="font-bold text-[#082C43]">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Mobile:</span>
                      <span className="text-slate-700">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Advance Deposit Verified:</span>
                      <span className="font-bold text-emerald-700">₹{Number(formData.advance_amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-emerald-900 text-[11px] leading-tight">
                    <strong>Advance Deposit Verification Required:</strong> New customer login accounts and Customer IDs are issued for paid customers who have paid a verified booking advance deposit.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tour Destination / Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 Days Switzerland Tour"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Trip Cost (₹)</label>
                    <input
                      type="number"
                      min="1000"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-bold mb-1">Advance Paid Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.advance_amount}
                      onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                      className="w-full bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 text-xs font-mono font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Method *</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Net Banking / NEFT">Net Banking / NEFT / RTGS</option>
                      <option value="Credit Card">Credit / Debit Card</option>
                      <option value="Razorpay">Razorpay Gateway</option>
                      <option value="Cash / Cheque">Cash / Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Reference / Txn ID</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-9876543210"
                      value={formData.payment_reference}
                      onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE7DA]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatePaidModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isProcessing}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                {isProcessing ? 'Generating ID & Account...' : 'Generate Customer ID & Create Login'}
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
          title="Customer Account Invitation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-emerald-950 text-sm">Customer Login Account Ready!</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                The customer account for <strong>{invitationModalData.customerName}</strong> has been created with Customer ID <strong>{invitationModalData.customerId}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Customer ID:</span>
                <span className="font-mono font-bold text-[#082C43] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {invitationModalData.customerId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Customer Email:</span>
                <span className="font-bold text-[#082C43]">{invitationModalData.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Single-Use Activation Link (Valid for 48 Hours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitationModalData.activationLink}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(invitationModalData.activationLink)}
                  className="px-3.5 py-2.5 bg-[#FF0000] hover:bg-[#D90000] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Direct Activation & SMTP Notice:</strong>
              <p className="mt-1">
                If SMTP email service is configured in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env</code>, an onboarding email has also been dispatched to <strong>{invitationModalData.email}</strong>.
                You can also share this link directly via WhatsApp or email with the customer.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DA]">
              <a
                href={invitationModalData.activationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#17648A] hover:underline font-bold text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Activation Page in New Tab
              </a>
              <Button type="button" variant="primary" size="sm" onClick={() => setInvitationModalData(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </DashboardLayout>
  );
};
