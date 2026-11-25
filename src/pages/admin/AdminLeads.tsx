import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  Calendar,
  Clock,
  Trash2,
  Phone,
  Mail,
  ChevronDown,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { api } from '../../services/api';
import { Lead, User } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminLeads: React.FC = () => {
  const { success, error } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    interested_destination: '',
    travel_date: '',
    travelers_count: 2,
    budget: '₹50,000 - ₹1,00,000',
    lead_source: 'Direct Admin Entry',
    assigned_staff_id: '',
    notes: ''
  });

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [page, statusFilter, staffFilter, sourceFilter]);

  const loadStaff = async () => {
    try {
      const data = await api.getAdminStaff();
      setStaffList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminLeads({
        page,
        limit: 15,
        status: statusFilter,
        staff_id: staffFilter,
        source: sourceFilter,
        search
      });
      const leadsList = res.data || res.leads || (Array.isArray(res) ? res : []);
      setLeads(leadsList);
      setTotalPages(res.totalPages || Math.ceil(leadsList.length / 15) || 1);
      setTotalLeads(res.total ?? leadsList.length);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLeads();
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const handleSelectLeadDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      const details = await api.getAdminLeadDetails(lead.id);
      setLeadDetails(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeadIds.length === 0) {
      error('Please select at least one lead to assign.');
      return;
    }

    try {
      await api.assignLeads({
        lead_ids: selectedLeadIds,
        staff_id: assignStaffId,
        notes: assignNotes
      });

      success(`Successfully assigned ${selectedLeadIds.length} lead(s)!`);
      setIsAssignModalOpen(false);
      setSelectedLeadIds([]);
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to assign leads.');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.customer_name) {
      error('Customer name is required.');
      return;
    }

    try {
      await api.createAdminLead(createForm);
      success('Direct lead created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        interested_destination: '',
        travel_date: '',
        travelers_count: 2,
        budget: '₹50,000 - ₹1,00,000',
        lead_source: 'Direct Admin Entry',
        assigned_staff_id: '',
        notes: ''
      });
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to create lead.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteAdminLead(id);
      success('Lead deleted successfully.');
      if (selectedLead?.id === id) setSelectedLead(null);
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to delete lead.');
    }
  };

  const handleFlushLeads = async () => {
    if (!confirm('Are you sure you want to flush all test leads? This will reset the leads pipeline cleanly.')) return;
    try {
      await api.flushLeads();
      success('All test leads have been flushed clean.');
      setSelectedLead(null);
      setSelectedLeadIds([]);
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to flush leads.');
    }
  };

  return (
    <DashboardLayout
      title="Lead & Inquiry Management"
      subtitle="Complete pipeline oversight, bulk consultant assignment, and client communication timelines."
      actions={
        <div className="flex items-center gap-2">
          {selectedLeadIds.length > 0 && (
            <Button
              variant="turquoise"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Assign Selected ({selectedLeadIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFlushLeads}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Flush Leads
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Direct Lead
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] focus:outline-none focus:border-[#FF795C] font-semibold"
            />
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] font-semibold text-[#082C43] focus:outline-none"
            >
              <option value="all">All Pipeline Stages</option>
              <option value="New">New Enquiries</option>
              <option value="Unassigned">Unassigned Leads</option>
              <option value="Assigned">Assigned Leads</option>
              <option value="Contacted">Contacted Leads</option>
              <option value="Qualified">Qualified Leads</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Customer Confirmed">Customer Confirmed</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Converted">Converted Leads</option>
              <option value="Lost">Lost Leads</option>
            </select>

            <select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] font-semibold text-[#082C43] focus:outline-none"
            >
              <option value="all">All Consultants</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] font-semibold text-[#082C43] focus:outline-none"
            >
              <option value="all">All Lead Sources</option>
              <option value="Website Enquiry">Website Enquiry</option>
              <option value="Customized Trip Form">Customized Trip Form</option>
              <option value="Package Booking">Package Booking</option>
              <option value="Agent Referral">Agent Referral</option>
              <option value="Direct Admin Entry">Direct Admin</option>
              <option value="Contact Form">Contact Form</option>
            </select>
          </div>
        </div>

        {/* Master Table and Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table */}
          <div className={`${selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden transition-all flex flex-col justify-between`}>
            <div>
              <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-[#082C43] font-bold cursor-pointer"
                  >
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-[#FF795C]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Select All</span>
                  </button>
                  <span>•</span>
                  <span>Total Leads: {totalLeads}</span>
                </div>

                {selectedLeadIds.length > 0 && (
                  <span className="text-[#FF795C] font-bold">
                    {selectedLeadIds.length} lead(s) selected
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F1E7] text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                    <tr>
                      <th className="py-3 px-3 w-8"></th>
                      <th className="py-3 px-3">Lead / Client</th>
                      <th className="py-3 px-3">Destination</th>
                      <th className="py-3 px-3">Assigned Staff</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Source</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DA]">
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No leads matching the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      leads.map((l) => {
                        const isChecked = selectedLeadIds.includes(l.id);
                        const isSelected = selectedLead?.id === l.id;

                        return (
                          <tr
                            key={l.id}
                            className={`transition-colors ${
                              isSelected ? 'bg-[#FF795C]/10 font-medium' : 'hover:bg-[#F8F1E7]/30'
                            }`}
                          >
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectLead(l.id)}
                                className="rounded text-[#FF795C] focus:ring-[#FF795C] cursor-pointer"
                              />
                            </td>
                            <td
                              className="py-3 px-3 cursor-pointer"
                              onClick={() => handleSelectLeadDetail(l)}
                            >
                              {(l as any).enquiry_id && (
                                <span className="text-[10px] text-[#FF795C] font-mono font-bold block">
                                  {(l as any).enquiry_id}
                                </span>
                              )}
                              <strong className="text-[#082C43] block">{l.customer_name}</strong>
                              <span className="text-[11px] text-slate-500">{l.customer_phone || l.customer_email}</span>
                            </td>
                            <td
                              className="py-3 px-3 font-semibold text-[#17648A] cursor-pointer"
                              onClick={() => handleSelectLeadDetail(l)}
                            >
                              {l.interested_destination}
                            </td>
                            <td className="py-3 px-3">
                              {l.assigned_staff_name ? (
                                <span className="font-semibold text-slate-700">{l.assigned_staff_name}</span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={l.status} />
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {l.lead_source}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="text-xs text-[#17648A] border-[#17648A]/30 hover:bg-[#17648A]/10 font-bold"
                                  onClick={() => {
                                    setSelectedLeadIds([l.id]);
                                    setIsAssignModalOpen(true);
                                  }}
                                >
                                  Assign
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleSelectLeadDetail(l)}
                                >
                                  View
                                </Button>
                                <button
                                  onClick={() => handleDeleteLead(l.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalLeads}
              pageSize={15}
            />
          </div>

          {/* Lead Detail & Timeline Sidebar */}
          {selectedLead && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE7DA] shadow-xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-[#EFE7DA]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#082C43] font-display">
                        {selectedLead.customer_name}
                      </h3>
                      <StatusBadge status={selectedLead.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedLead as any).enquiry_id ? `Enquiry #${(selectedLead as any).enquiry_id} • ` : ''}Lead #{selectedLead.id} • Source: {selectedLead.lead_source}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-xs text-slate-400 hover:text-[#082C43] cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Lead Parameters */}
                <div className="p-3.5 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] text-xs space-y-1.5 text-[#173247]">
                  <div><strong>Email:</strong> {selectedLead.customer_email || 'Not provided'}</div>
                  <div><strong>Phone:</strong> {selectedLead.customer_phone || 'Not provided'}</div>
                  <div><strong>Destination:</strong> {selectedLead.interested_destination}</div>
                  <div><strong>Travel Date:</strong> {selectedLead.travel_date || 'Flexible'}</div>
                  <div><strong>Travelers:</strong> {selectedLead.travelers_count} Guests</div>
                  <div><strong>Budget:</strong> {selectedLead.budget}</div>
                  <div><strong>Assigned Consultant:</strong> {selectedLead.assigned_staff_name || 'Unassigned'}</div>
                  {selectedLead.notes && (
                    <div className="pt-1.5 border-t border-[#EFE7DA] text-slate-600">
                      <strong>Notes:</strong> {selectedLead.notes}
                    </div>
                  )}
                </div>

                {/* Quick Reassignment from Drawer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-bold text-[#082C43]">Reassign Lead:</span>
                  <select
                    value={selectedLead.assigned_staff_id || ''}
                    onChange={async (e) => {
                      const staffId = e.target.value;
                      await api.assignLeads({
                        lead_ids: [selectedLead.id],
                        staff_id: staffId,
                        notes: 'Reassigned via lead drawer.'
                      });
                      success('Lead reassigned.');
                      loadLeads();
                      handleSelectLeadDetail({
                        ...selectedLead,
                        assigned_staff_id: staffId,
                        assigned_staff_name: staffList.find((s) => s.id === staffId)?.name || 'Unassigned'
                      });
                    }}
                    className="p-1.5 rounded-lg border border-[#EFE7DA] bg-white font-semibold text-xs"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email.split('@')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity History Timeline */}
                <div className="pt-2 border-t border-[#EFE7DA]">
                  <span className="text-xs font-bold text-[#082C43] block mb-2">
                    Activity & Audit Trail:
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {leadDetails?.activities?.map((act: any) => (
                      <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-semibold text-[#082C43] block">{act.description}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk / Single Lead Assignment Modal */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign ${selectedLeadIds.length} Lead(s) to Staff Consultant`}
          subtitle="Selected consultants receive immediate in-app notification."
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Select Travel Consultant *</label>
              <select
                required
                value={assignStaffId}
                onChange={(e) => setAssignStaffId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
              >
                <option value="">-- Select Staff Member --</option>
                {staffList.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} • {s.department || 'Travel Desk'} {s.assignedLeadsCount !== undefined ? `(${s.assignedLeadsCount} leads active)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Assignment Directive / Notes</label>
              <textarea
                rows={3}
                placeholder="Priority honeymoon lead, contact client immediately on WhatsApp..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<UserCheck className="w-3.5 h-3.5" />}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Direct Lead Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Direct Lead"
          subtitle="Manually enter phone inquiries, walk-ins, or executive referrals."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  value={createForm.customer_name}
                  onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={createForm.customer_phone}
                  onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={createForm.customer_email}
                  onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Interested Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Kashmir, Switzerland"
                  value={createForm.interested_destination}
                  onChange={(e) => setCreateForm({ ...createForm, interested_destination: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Travel Date</label>
                <input
                  type="date"
                  value={createForm.travel_date}
                  onChange={(e) => setCreateForm({ ...createForm, travel_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Travelers (Pax)</label>
                <input
                  type="number"
                  value={createForm.travelers_count}
                  onChange={(e) => setCreateForm({ ...createForm, travelers_count: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Assign Staff</label>
                <select
                  value={createForm.assigned_staff_id}
                  onChange={(e) => setCreateForm({ ...createForm, assigned_staff_id: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="">Leave Unassigned</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Inquiry Details & Notes</label>
              <textarea
                rows={2}
                placeholder="Walk-in inquiry at Bengaluru office..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Lead
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
