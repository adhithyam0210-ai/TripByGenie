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
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Lead, Quotation } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StaffLeads: React.FC = () => {
  const { success, error } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected lead for detail/action drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);

  // Action Modals
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
    travel_start_date: '',
    special_requests: ''
  });

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStaffLeads({ status: statusFilter });
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

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    const subtotal = quoteItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    try {
      await api.createQuotation({
        lead_id: selectedLead.id,
        items: quoteItems,
        total_amount: subtotal,
        discount: Number(quoteDiscount),
        notes: quoteNotes
      });

      success('Quotation generated and dispatched to client!');
      setIsQuoteModalOpen(false);
      loadLeads();
      handleSelectLead(selectedLead);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch quotation.');
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.convertLeadToBooking(selectedLead.id, convertForm);
      success(`Lead converted! Confirmed booking has been registered.`);
      setIsConvertModalOpen(false);
      loadLeads();
      handleSelectLead({ ...selectedLead, status: 'Converted' });
    } catch (err: any) {
      error(err.message || 'Failed to convert lead.');
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.customer_name.toLowerCase().includes(q) ||
      l.interested_destination.toLowerCase().includes(q) ||
      l.customer_email.toLowerCase().includes(q) ||
      l.customer_phone.includes(q)
    );
  });

  return (
    <DashboardLayout
      title="My Assigned Leads"
      subtitle="Exclusively displays inquiries assigned to you. Follow up with travelers, dispatch quotations, and convert bookings."
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none text-xs">
            {['all', 'New', 'Assigned', 'Contacted', 'Follow-up Required', 'Quotation Sent', 'Converted'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#082C43] text-white shadow-xs'
                    : 'bg-[#F8F1E7] text-[#173247] hover:bg-[#EFE7DA]'
                }`}
              >
                {st === 'all' ? 'All My Leads' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Leads Table */}
          <div className={`${selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden transition-all`}>
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
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLead?.id === lead.id;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#FF795C]/10 font-medium' : 'hover:bg-[#F8F1E7]/40'
                          }`}
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
                            <StatusBadge status={lead.status} />
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {lead.follow_up_date || 'None'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="outline" size="sm" className="text-[11px]">
                              Manage
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Detail & Actions Sidebar */}
          {selectedLead && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE7DA] shadow-lg p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#EFE7DA]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#082C43] font-display">
                        {selectedLead.customer_name}
                      </h3>
                      <StatusBadge status={selectedLead.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lead ID: #{selectedLead.id} • {selectedLead.lead_source}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-xs text-slate-400 hover:text-[#082C43] cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Contact Quick Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href={`tel:${selectedLead.customer_phone}`}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Customer
                  </a>
                  <a
                    href={`mailto:${selectedLead.customer_email}`}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Client
                  </a>
                </div>

                {/* Inquiry details */}
                <div className="p-3.5 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] text-xs space-y-1.5 text-[#173247]">
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

                {/* Actions: Update Status, Send Quote, Convert */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => setIsUpdateStatusModalOpen(true)}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => setIsQuoteModalOpen(true)}
                  >
                    Send Quote
                  </Button>
                  <Button
                    variant="turquoise"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => setIsConvertModalOpen(true)}
                  >
                    Convert Booking
                  </Button>
                </div>

                {/* Communication History Timeline */}
                <div className="pt-2 border-t border-[#EFE7DA]">
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
            </div>
          )}
        </div>
      </div>

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
              <label className="font-bold text-[#082C43] block mb-1">Next Follow-Up Date</label>
              <input
                type="date"
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
                  value={convertForm.total_amount}
                  onChange={(e) => setConvertForm({ ...convertForm, total_amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Advance Received (₹)</label>
                <input
                  type="number"
                  value={convertForm.advance_amount}
                  onChange={(e) => setConvertForm({ ...convertForm, advance_amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Confirmed Departure Date</label>
              <input
                type="date"
                required
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
