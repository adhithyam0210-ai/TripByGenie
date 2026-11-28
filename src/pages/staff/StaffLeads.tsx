import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Upload,
  Paperclip,
  File,
  X,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ActivityLogList } from '../../components/common/ActivityLogList';
import { api } from '../../services/api';
import { Lead, Quotation } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getTodayIST } from '../../utils/dateValidation';
import { getGmailComposeUrl, openGmailCompose } from '../../utils/mail';

export const StaffLeads: React.FC = () => {
  const { success, error } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const STATUS_TABS = ['New Assigned', 'Contacted', 'Follow-up Required', 'Quotation Sent', 'Converted', 'Lost'];
  const [statusFilter, setStatusFilter] = useState('New Assigned');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected lead for detail/action popup modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);

  // Action Modals
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Quotation Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSubject, setQuoteSubject] = useState('');
  const [quoteAmount, setQuoteAmount] = useState<number>(115000);
  const [quoteAdvanceAmount, setQuoteAdvanceAmount] = useState<number>(34500);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteFile, setQuoteFile] = useState<{
    name: string;
    size: number;
    type: string;
    data: string;
    previewUrl?: string;
  } | null>(null);
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  useEffect(() => {
    if (selectedLead && isQuoteModalOpen) {
      const dest = selectedLead.interested_destination || 'Holiday Trip';
      const name = selectedLead.customer_name || 'Valued Traveler';
      const pax = selectedLead.travelers_count || 2;
      const date = selectedLead.travel_date || 'Upcoming';

      setQuoteSubject(`Custom Travel Quotation: ${dest} Holiday Proposal`);

      const numBudget = Number(String(selectedLead.budget || '').replace(/[^0-9]/g, '')) || 115000;
      setQuoteAmount(numBudget);
      setQuoteAdvanceAmount(Math.round(numBudget * 0.3));

      const defaultBody = `Dear ${name},

Thank you for choosing Trip by Genie! We are delighted to share our customized quotation proposal for your upcoming travel to ${dest}.

Please find our official proposal document attached with this email.

Trip Summary:
• Destination: ${dest}
• Travel Date: ${date}
• Number of Guests: ${pax}
• Total Quoted Price: ₹${numBudget.toLocaleString('en-IN')}
• Required Advance (30%): ₹${Math.round(numBudget * 0.3).toLocaleString('en-IN')}

Includes standard hotel accommodations, verified sightseeing transfers, and 24/7 dedicated Genie on-trip concierge assistance.

Feel free to reply directly to this email or call us at +91 99404 63566 if you have any questions or customization requests.

Warm regards,
Trip by Genie Sales & Holiday Experience Team`;

      setQuoteNotes(defaultBody);
      setQuoteFile(null);
    }
  }, [selectedLead, isQuoteModalOpen]);

  // Conversion to Booking Modal
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({
    total_amount: 120000,
    advance_amount: 40000,
    payment_method: 'UPI',
    payment_proof: '',
    travel_start_date: '',
    special_requests: ''
  });

  // Customer Login Modal
  const [isCreateLoginModalOpen, setIsCreateLoginModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isCreatingLogin, setIsCreatingLogin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    customerId: string;
    email: string;
    password?: string;
    loginUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const apiStatus = statusFilter === 'New Assigned' ? 'Assigned' : statusFilter;
      let data = await api.getStaffLeads({ status: apiStatus });
      if (statusFilter === 'Converted') {
        data = data.filter((l: any) => {
          const isConverted = (l.status || '').toLowerCase().includes('convert');
          const hasAdvance =
            Number(l.advance_amount || 0) > 0 ||
            Number(l.advance_paid_amount || 0) > 0 ||
            l.advance_paid === true ||
            Boolean(l.conversion_request_id) ||
            Boolean(l.converted_booking_id) ||
            Boolean(l.booking_id);
          return isConverted && hasAdvance;
        });
      }
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setFollowUpDate(lead.follow_up_date || '');
    setStatusNote('');

    try {
      const details = await api.getStaffLeadDetails(lead.id);
      setLeadDetails(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.updateStaffLeadStatus(selectedLead.id, {
        status: newStatus,
        follow_up_date: followUpDate || null,
        notes: statusNote
      });

      success(`Updated lead #${selectedLead.id} status to ${newStatus}.`);
      setIsUpdateStatusModalOpen(false);
      loadLeads();
      handleSelectLead({ ...selectedLead, status: newStatus as any, follow_up_date: followUpDate });
    } catch (err: any) {
      error(err.message || 'Failed to update lead status');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      error('File size exceeds 15MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setQuoteFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        data: dataUrl,
        previewUrl: file.type.startsWith('image/') ? dataUrl : undefined
      });
      success(`Attached: "${file.name}"`);
    };
    reader.onerror = () => {
      error('Could not read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenInGmail = () => {
    if (!selectedLead) return;
    openGmailCompose(selectedLead.customer_email, quoteSubject, quoteNotes);
  };

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    if (!quoteAmount || quoteAmount <= 0) {
      error('Please enter a valid quoted total amount.');
      return;
    }

    setIsSendingQuote(true);
    try {
      await api.createQuotation({
        lead_id: selectedLead.id,
        package_title: quoteSubject || selectedLead.interested_destination,
        total_amount: Number(quoteAmount),
        required_advance_amount: Number(quoteAdvanceAmount),
        advance_percentage: quoteAmount > 0 ? Math.round((quoteAdvanceAmount / quoteAmount) * 100) : 30,
        notes: quoteNotes,
        attachment_name: quoteFile?.name || null,
        attachment_type: quoteFile?.type || null,
        attachment_data: quoteFile?.data || null
      });

      success(
        quoteFile
          ? `Quotation with attached file "${quoteFile.name}" dispatched to ${selectedLead.customer_email || 'client'}!`
          : `Quotation proposal dispatched to ${selectedLead.customer_email || 'client'}!`
      );
      setIsQuoteModalOpen(false);
      loadLeads();
      handleSelectLead(selectedLead);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch quotation.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    if (!convertForm.advance_amount || convertForm.advance_amount <= 0) {
      error('Please enter the advance payment amount received.');
      return;
    }

    if (!convertForm.payment_proof.trim()) {
      error('Please enter payment proof reference / UTR number.');
      return;
    }

    try {
      await api.convertLeadToBooking(selectedLead.id, convertForm);
      success(`Lead converted! Confirmed booking has been registered with payment proof recorded.`);
      setIsConvertModalOpen(false);
      loadLeads();
      handleSelectLead({ ...selectedLead, status: 'Converted' });
    } catch (err: any) {
      error(err.message || 'Failed to convert lead.');
    }
  };

  const handleOpenCreateLogin = (lead: Lead) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    setTempPassword(`Genie@${randomPin}`);
    setIsCreateLoginModalOpen(true);
  };

  const handleCreateCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsCreatingLogin(true);
    try {
      const res = await api.createCustomerLoginForLead(selectedLead.id, {
        temp_password: tempPassword.trim()
      });
      const customerCode = res?.customer_id || 'Active';
      const createdPw = tempPassword.trim();
      setCreatedCredentials({
        customerId: customerCode,
        email: selectedLead.customer_email || '',
        password: createdPw,
        loginUrl: `${window.location.origin}/login`
      });
      success(res?.message || `Customer credentials generated (ID: ${customerCode})! Login details sent to ${selectedLead.customer_email}.`);
      setIsCreateLoginModalOpen(false);
      const updatedLead = {
        ...selectedLead,
        customer_id: res?.customer_id || selectedLead.customer_id,
        customer_code: res?.customer_id || selectedLead.customer_code
      };
      setSelectedLead(updatedLead);
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to provision customer credentials.');
    } finally {
      setIsCreatingLogin(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.customer_name || '').toLowerCase().includes(q) ||
      (l.interested_destination || '').toLowerCase().includes(q) ||
      (l.customer_email || '').toLowerCase().includes(q) ||
      (l.customer_phone || '').includes(q)
    );
  });

  return (
    <DashboardLayout
      title="My Assigned Leads"
      subtitle="Exclusively displays inquiries assigned to you. Follow up with travelers, dispatch quotations, and convert bookings."
    >
      <div className="space-y-6">
        {/* Filters and Search Bar (Sticky so scrolling down keeps it accessible) */}
        <div className="sticky top-[58px] sm:top-[64px] z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#EFE7DA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by customer, phone, trip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] focus:outline-none focus:border-[#FF795C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-[#082C43] shrink-0">Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold text-xs text-[#082C43] focus:outline-none focus:border-[#17648A] cursor-pointer shadow-2xs"
            >
              {STATUS_TABS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Full-Width Leads Table */}
        <div className="w-full bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <span className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Assigned Inquiries ({filteredLeads.length})
            </span>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto relative">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#F8F1E7] text-[#173247] uppercase font-bold sticky top-0 z-10 shadow-xs">
                <tr className="bg-[#F8F1E7]">
                  <th className="py-3.5 px-4 bg-[#F8F1E7] whitespace-nowrap border-b border-[#EFE7DA]">Customer</th>
                  <th className="py-3.5 px-4 bg-[#F8F1E7] whitespace-nowrap border-b border-[#EFE7DA]">Destination</th>
                  <th className="py-3.5 px-4 bg-[#F8F1E7] whitespace-nowrap border-b border-[#EFE7DA]">Pax / Budget</th>
                  <th className="py-3.5 px-4 bg-[#F8F1E7] whitespace-nowrap border-b border-[#EFE7DA]">Status</th>
                  <th className="py-3.5 px-4 bg-[#F8F1E7] whitespace-nowrap border-b border-[#EFE7DA]">Follow-up</th>
                  <th className="py-3.5 px-4 bg-[#F8F1E7] text-right whitespace-nowrap border-b border-[#EFE7DA]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No assigned leads in this status category.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#F8F1E7]/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#082C43] block">{lead.customer_name}</span>
                        <span className="text-[11px] text-slate-500">{lead.customer_phone}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#17648A]">
                        {lead.interested_destination}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span>{lead.travelers_count} Pax</span>
                        <span className="block text-[11px] text-slate-400">{lead.budget}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-xs text-slate-700">
                          {lead.status === 'Assigned' ? 'New Assigned' : lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {lead.follow_up_date || 'None'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px]"
                          onClick={() => handleSelectLead(lead)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Centered Manage Lead Modal Popup */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={selectedLead.customer_name}
          subtitle={`Lead ID: #${selectedLead.id} • ${selectedLead.lead_source || 'Website Enquiry'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header Status & Quick Contact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE7DA]">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {selectedLead.status === 'Assigned' ? 'New Assigned' : selectedLead.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedLead.customer_phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Customer
                </a>
                <a
                  href={getGmailComposeUrl(
                    selectedLead.customer_email,
                    `Trip by Genie Inquiry - ${selectedLead.interested_destination || 'Travel Package'}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
                  title="Compose in Gmail"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Client
                </a>
              </div>
            </div>

            {/* Inquiry Details */}
            <div className="p-3.5 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] space-y-1.5 text-[#173247]">
              <div><strong>Interested Destination:</strong> {selectedLead.interested_destination}</div>
              <div><strong>Travel Date:</strong> {selectedLead.travel_date || 'Flexible'}</div>
              <div><strong>Number of Travelers:</strong> {selectedLead.travelers_count} Guests</div>
              <div><strong>Budget:</strong> {selectedLead.budget}</div>
              {selectedLead.notes && (
                <div className="pt-1.5 border-t border-[#EFE7DA] text-slate-600">
                  <strong>Client Requirements:</strong> {selectedLead.notes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 items-stretch">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full text-xs font-bold justify-center text-center"
                onClick={() => setIsUpdateStatusModalOpen(true)}
              >
                Update Status
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-10 w-full text-xs font-bold justify-center text-center"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Send Quote
              </Button>
              <Button
                variant="turquoise"
                size="sm"
                className="h-10 w-full text-xs font-bold justify-center text-center"
                onClick={() => setIsConvertModalOpen(true)}
              >
                Convert Booking
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-10 w-full text-xs font-bold justify-center text-center border-0"
                onClick={() => handleOpenCreateLogin(selectedLead)}
              >
                Create Login ID & Pass
              </Button>
            </div>

            {/* Communication & Activity Log */}
            <ActivityLogList
              activities={leadDetails?.activities}
              title="Activity & Communication Log:"
              emptyText="No notes logged yet."
            />
          </div>
        </Modal>
      )}

      {/* Update Status Modal */}
      {isUpdateStatusModalOpen && (
        <Modal
          isOpen={isUpdateStatusModalOpen}
          onClose={() => setIsUpdateStatusModalOpen(false)}
          title="Update Lead Progress & Follow-up"
          subtitle={`Lead #${selectedLead?.id} - ${selectedLead?.customer_name}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Lead Stage / Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
              >
                <option value="New Assigned">New Assigned</option>
                <option value="Contacted">Contacted (Called / Messaged)</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Lost">Lost / Dropped</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Next Follow-Up Date (Today or Future)</label>
              <input
                type="date"
                min={getTodayIST()}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Interaction Notes & Call Log</label>
              <textarea
                rows={3}
                placeholder="Spoke with client, requested 4-star stay in Munnar..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsUpdateStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Update
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Prepare & Dispatch Quotation Modal */}
      {isQuoteModalOpen && selectedLead && (
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          title="Prepare & Dispatch Travel Quotation"
          subtitle={`Dispatched directly to ${selectedLead.customer_name} (${selectedLead.customer_email || 'No email specified'})`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSendQuotation} className="space-y-4 text-xs">
            {/* Recipient Overview Banner */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-[#082C43] text-sm block">{selectedLead.customer_name}</span>
                <span className="text-[11px] text-blue-900 font-medium flex items-center gap-2">
                  <span>✉️ {selectedLead.customer_email || 'No email registered'}</span>
                  <span>📞 {selectedLead.customer_phone || 'No phone'}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Destination</span>
                <span className="font-extrabold text-[#082C43]">{selectedLead.interested_destination || 'Bespoke Package'}</span>
              </div>
            </div>

            {/* Quotation Subject & Total Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-[#082C43] block mb-1">Quotation Subject / Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={quoteSubject}
                  onChange={(e) => setQuoteSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-slate-800 focus:outline-none focus:border-[#0070E0]"
                  placeholder="e.g. Custom Travel Quotation for Vietnam (8N/9D)"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Total Quoted Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={quoteAmount}
                  onChange={(e) => {
                    const amt = Number(e.target.value);
                    setQuoteAmount(amt);
                    setQuoteAdvanceAmount(Math.round(amt * 0.3));
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-extrabold text-sm text-[#0070E0] focus:outline-none focus:border-[#0070E0]"
                  placeholder="e.g. 115000"
                />
              </div>
            </div>

            {/* Email Body / Quotation Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#082C43]">Quotation Message & Information Body *</label>
                <span className="text-[10px] text-slate-400">Pre-formatted with trip details • Fully editable</span>
              </div>
              <textarea
                rows={6}
                required
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Enter quotation details, inclusions, day-wise plan or personalized message..."
                className="w-full p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-sans text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-[#0070E0]"
              />
            </div>

            {/* Local Storage File Upload (Document or Image) */}
            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                Upload Quotation File from Local Storage (Document or Image)
              </label>

              {!quoteFile ? (
                <label className="border-2 border-dashed border-blue-200 hover:border-[#0070E0] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 bg-[#F8FAFC] hover:bg-blue-50/50 cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 text-[#0070E0] flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-[#082C43]">Click to browse files from your device</span>
                  <span className="text-[11px] text-slate-500">Supports PDF, Word Documents (.doc, .docx) & Images (PNG, JPG, WebP) up to 15MB</span>
                </label>
              ) : (
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    {quoteFile.previewUrl ? (
                      <img
                        src={quoteFile.previewUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-emerald-950 truncate">{quoteFile.name}</p>
                      <p className="text-[10px] text-emerald-700">
                        {(quoteFile.size / 1024 / 1024).toFixed(2)} MB • {quoteFile.type || 'Document'} • Attached
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuoteFile(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove attached file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#EFE7DA]">
              <button
                type="button"
                onClick={handleOpenInGmail}
                className="text-xs text-[#0070E0] hover:text-[#005bb8] hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer"
                title="Open pre-filled Gmail compose in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open & Send via Gmail Web
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsQuoteModalOpen(false)}
                  disabled={isSendingQuote}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSendingQuote}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold"
                >
                  Dispatch Quotation
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Convert to Confirmed Booking Modal */}
      {isConvertModalOpen && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title="Convert Lead to Confirmed Booking"
          subtitle="Generates an official booking record, records advance payment, and notifies admin."
        >
          <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Total Package Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={convertForm.total_amount}
                  onChange={(e) => setConvertForm({ ...convertForm, total_amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Advance Received (Partial ₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={convertForm.advance_amount}
                  onChange={(e) => setConvertForm({ ...convertForm, advance_amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Method *</label>
                <select
                  required
                  value={convertForm.payment_method}
                  onChange={(e) => setConvertForm({ ...convertForm, payment_method: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash Deposit</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Proof / UTR Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI Ref #4892719283 / Txn ID"
                  value={convertForm.payment_proof}
                  onChange={(e) => setConvertForm({ ...convertForm, payment_proof: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Confirmed Departure Date</label>
              <input
                type="date"
                required
                min={getTodayIST()}
                value={convertForm.travel_start_date}
                onChange={(e) => setConvertForm({ ...convertForm, travel_start_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Special Room / Meal Requests</label>
              <textarea
                rows={2}
                value={convertForm.special_requests}
                onChange={(e) => setConvertForm({ ...convertForm, special_requests: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="turquoise" size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}>
                Confirm & Create Booking
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Customer Login & Send Invitation Link Modal */}
      {isCreateLoginModalOpen && selectedLead && (
        <Modal
          isOpen={isCreateLoginModalOpen}
          onClose={() => setIsCreateLoginModalOpen(false)}
          title="Create Customer Login & Dispatch Invitation"
          subtitle={`Provision official customer portal ID and password for ${selectedLead.customer_name}`}
        >
          <form onSubmit={handleCreateCustomerLogin} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0070E0]" />
                Customer Verification Approved
              </p>
              <p className="text-[11px] text-blue-800">
                As the assigned sales executive, if you feel this prospective client is a worthwhile customer, provision their credentials below. An official Customer ID, temporary password, and onboarding invitation link will be sent directly to <strong>{selectedLead.customer_email}</strong>.
              </p>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Customer Email Address</label>
              <input
                type="email"
                disabled
                value={selectedLead.customer_email || ''}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Temporary Portal Password *</label>
              <input
                type="text"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="e.g. Genie@4829"
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono text-sm font-bold text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">Customer can use this temporary password or change it inside their portal profile.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE7DA]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateLoginModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isCreatingLogin}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {isCreatingLogin ? 'Generating & Sending...' : 'Generate ID & Send Invitation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generated Credentials Success & Direct Copy Modal */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => {
            setCreatedCredentials(null);
            setCopied(false);
          }}
          title="Customer Credentials Provisioned"
          subtitle="Official customer account login details generated successfully"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Customer Account Active
              </p>
              <p className="text-[11px] text-emerald-800">
                You can copy these credentials and share them directly with the customer via WhatsApp, SMS, or phone if the customer did not receive the automated email.
              </p>
            </div>

            <div className="space-y-2.5 bg-[#F8F1E7]/40 p-3.5 rounded-xl border border-[#EFE7DA]">
              <div className="flex justify-between items-center py-1 border-b border-[#EFE7DA]/60">
                <span className="font-bold text-slate-500">Customer ID:</span>
                <span className="font-mono font-black text-sm text-[#0070E0] select-all">
                  {createdCredentials.customerId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#EFE7DA]/60">
                <span className="font-bold text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800 select-all">
                  {createdCredentials.email}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#EFE7DA]/60">
                <span className="font-bold text-slate-500">Temporary Password:</span>
                <span className="font-mono font-black text-sm text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 select-all">
                  {createdCredentials.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-slate-500">Login Portal:</span>
                <span className="font-mono text-[11px] text-slate-700 select-all">
                  {createdCredentials.loginUrl}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE7DA]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatedCredentials(null);
                  setCopied(false);
                }}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  const textToCopy = `TripByGenie Portal Credentials:\n\nCustomer ID: ${createdCredentials.customerId}\nEmail / Username: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\nLogin Portal: ${createdCredentials.loginUrl}`;
                  navigator.clipboard.writeText(textToCopy);
                  setCopied(true);
                  success('Credentials copied to clipboard!');
                  setTimeout(() => setCopied(false), 3000);
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
