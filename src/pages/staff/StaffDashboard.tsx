import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Calendar,
  PhoneCall,
  CheckCircle,
  Phone,
  Mail,
  Send,
  AlertTriangle,
  ArrowRight,
  Upload,
  Paperclip,
  File,
  X,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ActivityLogList } from '../../components/common/ActivityLogList';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getGmailComposeUrl, openGmailCompose } from '../../utils/mail';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected lead for centered Manage Modal popup
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);

  // Action Modals inside Follow-up flow
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

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dash, followData] = await Promise.all([
        api.getStaffDashboard().catch(() => null),
        api.getStaffFollowUps().catch(() => [])
      ]);
      setDashboardData(dash);
      setFollowUps(followData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLead = async (lead: Lead) => {
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
      loadData();
      handleOpenLead({ ...selectedLead, status: newStatus as any, follow_up_date: followUpDate });
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
      loadData();
      handleOpenLead({ ...selectedLead, status: 'Quotation Sent' });
    } catch (err: any) {
      error(err.message || 'Failed to send quotation.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.convertLeadToBooking(selectedLead.id, convertForm);
      success(`Lead converted! Confirmed booking has been registered with payment proof recorded.`);
      setIsConvertModalOpen(false);
      loadData();
      setSelectedLead(null);
    } catch (err: any) {
      error(err.message || 'Failed to convert lead.');
    }
  };

  // Filter Active (Not Converted / Cancelled / Lost)
  const activeFollowUps = followUps.filter((f) => {
    const s = (f.status || '').toLowerCase();
    return s !== 'converted' && s !== 'lost' && s !== 'cancelled' && s !== 'completed';
  });

  // 1. Due Today (Scheduled for today)
  const dueToday = activeFollowUps.filter((f) => {
    const d = (f.follow_up_date || '').slice(0, 10);
    return d === todayStr;
  });

  // 2. Missed Follow-ups (Scheduled in the past, staff missed updating status)
  const missedFollowUps = activeFollowUps.filter((f) => {
    const d = (f.follow_up_date || '').slice(0, 10);
    return d && d < todayStr;
  });

  // 3. Upcoming Follow-ups (Present and future days only: tomorrow onwards)
  const upcoming = activeFollowUps
    .filter((f) => {
      const d = (f.follow_up_date || '').slice(0, 10);
      return d && d > todayStr;
    })
    .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''));

  if (isLoading) {
    return (
      <DashboardLayout title="Sales Overview" subtitle="Loading consultant dashboard...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    my_leads: followUps.length,
    new_leads: followUps.filter((l) => l.status === 'Assigned' || l.status === 'New').length,
    follow_ups_due: dueToday.length + missedFollowUps.length,
    quotations_sent: followUps.filter((l) => l.status === 'Quotation Sent').length,
    converted_leads: followUps.filter((l) => l.status === 'Converted').length
  };

  return (
    <DashboardLayout
      title={`Sales Overview • ${user?.name || 'Consultant'}`}
      subtitle="Prioritize client calls, follow-up agenda, customized quotations, and booking conversions."
      actions={
        <Link to="/staff/leads">
          <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
            Open Leads CRM
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Assigned Leads"
            value={stats.my_leads}
            subtitle="My active pipeline"
            icon={<Users className="w-5 h-5" />}
            accentColor="navy"
          />
          <StatCard
            title="Fresh Inquiries"
            value={stats.new_leads}
            subtitle="Needs initial contact"
            icon={<PhoneCall className="w-5 h-5" />}
            accentColor="coral"
          />
          <StatCard
            title="Follow-ups Due"
            value={stats.follow_ups_due}
            subtitle="Scheduled for today & past"
            icon={<Clock className="w-5 h-5" />}
            accentColor="amber"
          />
          <StatCard
            title="Quotes Dispatched"
            value={stats.quotations_sent}
            subtitle="Active proposals"
            icon={<FileText className="w-5 h-5" />}
            accentColor="turquoise"
          />
          <StatCard
            title="Converted Trips"
            value={stats.converted_leads}
            subtitle="Confirmed bookings"
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="emerald"
          />
        </div>

        {/* Scheduled Follow-up Agenda Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-1 border-b border-[#EFE7DA]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF795C]" />
              <h2 className="text-base sm:text-lg font-bold text-[#082C43] font-display">
                Scheduled Follow-up Agenda
              </h2>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Prioritize client calls and reminders to maximize lead conversion rates.
            </span>
          </div>

          {/* Top Tables: Due Today & Missed Follow-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Due Today Small Table */}
            <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3.5 border-b border-[#EFE7DA] bg-[#F8F1E7]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
                      Due Today ({dueToday.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F1E7]/40 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                      <tr>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Destination</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE7DA]">
                      {dueToday.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1 opacity-70" />
                            <span>No follow-ups due today.</span>
                          </td>
                        </tr>
                      ) : (
                        dueToday.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-[#082C43] block">{lead.customer_name}</span>
                              <span className="text-[11px] text-slate-500">{lead.customer_phone}</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#17648A]">
                              {lead.interested_destination}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 text-xs">
                              {lead.status === 'Assigned' ? 'New Assigned' : lead.status}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-[11px] py-1 px-2.5"
                                onClick={() => handleOpenLead(lead)}
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

            {/* Missed Follow-ups Small Table */}
            <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3.5 border-b border-[#EFE7DA] bg-[#F8F1E7]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
                      Missed Follow-ups ({missedFollowUps.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Action Needed
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F1E7]/40 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                      <tr>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Destination</th>
                        <th className="py-2.5 px-3">Scheduled Date</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE7DA]">
                      {missedFollowUps.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1 opacity-70" />
                            <span>No missed follow-ups. All up to date!</span>
                          </td>
                        </tr>
                      ) : (
                        missedFollowUps.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-[#082C43] block">{lead.customer_name}</span>
                              <span className="text-[11px] text-slate-500">{lead.customer_phone}</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#17648A]">
                              {lead.interested_destination}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#082C43] text-xs">
                              {lead.follow_up_date}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-[11px] py-1 px-2.5"
                                onClick={() => handleOpenLead(lead)}
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
          </div>

          {/* Upcoming Follow-ups (Present and Future Days Only) */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#17648A]" />
                <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
                  Upcoming Follow-ups ({upcoming.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Future Scheduled Calls & Reminders
              </span>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                  <tr>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {upcoming.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No upcoming future follow-ups scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    upcoming.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#082C43]">
                          {u.follow_up_date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#082C43] block">{u.customer_name}</span>
                          <span className="text-[11px] text-slate-500">{u.customer_phone}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#17648A]">
                          {u.interested_destination}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 text-xs">
                          {u.status === 'Assigned' ? 'New Assigned' : u.status}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px]"
                            onClick={() => handleOpenLead(u)}
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
                {selectedLead.follow_up_date && (
                  <span className="text-[11px] text-slate-400 ml-2">
                    (Follow-up: {selectedLead.follow_up_date})
                  </span>
                )}
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
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsUpdateStatusModalOpen(true)}
              >
                Update Status
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Send Quote
              </Button>
              <Button
                variant="turquoise"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsConvertModalOpen(true)}
              >
                Convert Booking
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
                min={todayStr}
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

      {/* Prepare Quotation Modal */}
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

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsQuoteModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSendingQuote}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
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
                <label className="font-bold text-[#082C43] block mb-1">Payment Method</label>
                <select
                  value={convertForm.payment_method}
                  onChange={(e) => setConvertForm({ ...convertForm, payment_method: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="UPI">UPI Transfer</option>
                  <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash Receipt</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/2026/982181"
                  value={convertForm.payment_proof}
                  onChange={(e) => setConvertForm({ ...convertForm, payment_proof: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Confirmed Trip Start Date</label>
              <input
                type="date"
                min={todayStr}
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
    </DashboardLayout>
  );
};
