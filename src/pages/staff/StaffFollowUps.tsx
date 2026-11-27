import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StaffFollowUps: React.FC = () => {
  const { success, error } = useToast();
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
  const [quoteItems, setQuoteItems] = useState<{ description: string; amount: number }[]>([
    { description: 'Hotel Accommodation & Meals', amount: 80000 },
    { description: 'Private AC Sightseeing Transfers', amount: 25000 },
    { description: 'Entry Tickets & Excursions', amount: 15000 }
  ]);
  const [quoteDiscount, setQuoteDiscount] = useState(5000);
  const [quoteNotes, setQuoteNotes] = useState('Includes 5% GST and complimentary airport meet & greet.');

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
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStaffFollowUps();
      setFollowUps(data || []);
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
      loadFollowUps();
      handleOpenLead({ ...selectedLead, status: newStatus as any, follow_up_date: followUpDate });
    } catch (err: any) {
      error(err.message || 'Failed to update lead status');
    }
  };

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const total = quoteItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) - Number(quoteDiscount);
      await api.sendStaffQuotation({
        lead_id: selectedLead.id,
        items: quoteItems,
        discount: quoteDiscount,
        total_amount: total,
        notes: quoteNotes
      });
      success(`Quotation successfully dispatched to ${selectedLead.customer_name}.`);
      setIsQuoteModalOpen(false);
      loadFollowUps();
      handleOpenLead({ ...selectedLead, status: 'Quotation Sent' });
    } catch (err: any) {
      error(err.message || 'Failed to send quotation.');
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.convertLeadToBooking(selectedLead.id, convertForm);
      success(`Lead converted! Confirmed booking has been registered with payment proof recorded.`);
      setIsConvertModalOpen(false);
      loadFollowUps();
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

  return (
    <DashboardLayout
      title="Scheduled Follow-up Agenda"
      subtitle="Prioritize client calls and reminders to maximize lead conversion rates."
    >
      <div className="space-y-6">
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

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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
                    <td colSpan={5} className="py-12 text-center text-slate-400">
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
                  href={`mailto:${selectedLead.customer_email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100"
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
            <div className="pt-3 border-t border-[#EFE7DA]">
              <span className="text-xs font-bold text-[#082C43] block mb-2">
                Activity & Communication Log:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leadDetails?.activities?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No notes logged yet.</p>
                ) : (
                  leadDetails?.activities?.map((act: any) => (
                    <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-[#082C43] block">{act.description}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                <option value="Converted">Converted to Booking</option>
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
      {isQuoteModalOpen && (
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          title="Prepare & Dispatch Travel Quotation"
          subtitle={`Dispatched directly to ${selectedLead?.customer_name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSendQuotation} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Itemized Line Items</label>
              <div className="space-y-2">
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].description = e.target.value;
                        setQuoteItems(copy);
                      }}
                      className="flex-1 p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].amount = Number(e.target.value);
                        setQuoteItems(copy);
                      }}
                      className="w-28 p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Promotional Discount (₹)</label>
                <input
                  type="number"
                  value={quoteDiscount}
                  onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-right">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Final Quote</span>
                <span className="text-base font-extrabold text-emerald-950">
                  ₹{(quoteItems.reduce((s, i) => s + Number(i.amount || 0), 0) - Number(quoteDiscount)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Inclusions / Validity Notes</label>
              <textarea
                rows={2}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsQuoteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Dispatch Quotation
              </Button>
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
