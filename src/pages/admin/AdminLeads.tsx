import React, { useState, useEffect } from 'react';
import {
  Users,
  Inbox,
  FileText,
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
  Filter,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Globe,
  Car,
  ClipboardList
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { ActivityLogList } from '../../components/common/ActivityLogList';
import { api } from '../../services/api';
import { Lead, User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getTodayIST } from '../../utils/dateValidation';
import {
  getLeadEnquiryType,
  checkStaffLeadEligibility,
  checkStaffBatchEligibility
} from '../../utils/leadEligibility';

export const AdminLeads: React.FC = () => {
  const { success, error } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('New');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const [modalSelectedStaffId, setModalSelectedStaffId] = useState<string>('');
  const [isAssigningFromModal, setIsAssigningFromModal] = useState<boolean>(false);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLeadMode, setCreateLeadMode] = useState<'manual' | 'paste'>('manual');
  const [rawLeadText, setRawLeadText] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);
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

  const parseDateToISO = (dateStr: string): string => {
    if (!dateStr) return '';
    const cleaned = dateStr.trim().replace(/(?:st|nd|rd|th),?/i, '').replace(/[.]/g, '/');
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

    const monthNames: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };

    // Match "28 Jan 2027" or "28-Jan-2027"
    const dmyWord = cleaned.match(/^(\d{1,2})[\s-]+([a-zA-Z]+)[\s-]+(\d{4})$/);
    if (dmyWord) {
      const day = dmyWord[1].padStart(2, '0');
      const mName = dmyWord[2].toLowerCase();
      const m = monthNames[mName];
      if (m) return `${dmyWord[3]}-${m}-${day}`;
    }

    // Match "Jan 28 2027" or "Jan 28, 2027"
    const mdyWord = cleaned.match(/^([a-zA-Z]+)[\s-]+(\d{1,2}),?[\s-]+(\d{4})$/);
    if (mdyWord) {
      const day = mdyWord[2].padStart(2, '0');
      const mName = mdyWord[1].toLowerCase();
      const m = monthNames[mName];
      if (m) return `${mdyWord[3]}-${m}-${day}`;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmy = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    return '';
  };

  const parseLeadText = (raw: string) => {
    if (!raw.trim()) {
      setParseSuccess(false);
      return;
    }

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const getVal = (regex: RegExp) => {
      for (const l of lines) {
        const m = l.match(regex);
        if (m && m[1]) return m[1].trim();
      }
      return '';
    };

    const name = getVal(/^(?:Name|Customer Name|Client Name|Traveler Name|Lead Name)\s*[:=-]\s*(.+)$/i);
    const phone =
      getVal(/^(?:Mobile No|Mobile Number|Mobile|Phone No|Phone Number|Phone|Contact No|Contact|WhatsApp)\s*[:=-]\s*(.+)$/i) ||
      raw.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[6-9]\d{9}|[6-9]\d{9}/)?.[0] ||
      '';
    const email =
      getVal(/^(?:Email|Email Id|Email Address|Mail)\s*[:=-]\s*(.+)$/i) ||
      raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)?.[1] ||
      '';

    const toCity = getVal(/^(?:To City|Destination|Traveling To|Travel To|Place)\s*[:=-]\s*(.+)$/i);
    const packageName = getVal(/^(?:Package Name|Package|Tour Package)\s*[:=-]\s*(.+)$/i);
    const destination = toCity || packageName || '';

    const fromCity = getVal(/^(?:From City|Departure City|Origin|From|Departing From)\s*[:=-]\s*(.+)$/i);
    const depDateRaw = getVal(/^(?:Departure Date|Travel Date|Start Date|Journey Date|Date of Travel|Date)\s*[:=-]\s*(.+)$/i);

    let travelers = 2;
    const travStr = getVal(/^(?:No of Travellers|No of Travelers|Travelers|Travellers|Total Pax|Pax|Guests)\s*[:=-]\s*(\d+)/i);
    if (travStr) {
      travelers = parseInt(travStr, 10);
    } else {
      const adults = parseInt(getVal(/^Adults?\s*[:=-]\s*(\d+)/i) || '0', 10);
      const child = parseInt(getVal(/^Child(?:ren)?\s*[:=-]\s*(\d+)/i) || '0', 10);
      if (adults > 0) travelers = adults + child;
    }

    const isoDate = parseDateToISO(depDateRaw);
    let validTravelDate = '';
    const today = getTodayIST();
    if (isoDate && isoDate >= today) {
      validTravelDate = isoDate;
    }

    const notesParts: string[] = [];
    if (fromCity) notesParts.push(`From: ${fromCity}`);
    const nights = getVal(/^(?:No OF Nights|Nights|Duration)\s*[:=-]\s*(.+)$/i);
    if (nights) notesParts.push(`Duration: ${nights}`);
    const property = getVal(/^(?:Property|Hotel Category|Hotel Rating|Hotel)\s*[:=-]\s*(.+)$/i);
    if (property) notesParts.push(`Hotel: ${property}`);
    const tickets = getVal(/^(?:Tickets Booked|Flight Booked|Tickets)\s*[:=-]\s*(.+)$/i);
    if (tickets) notesParts.push(`Tickets Booked: ${tickets}`);
    const bookingIn = getVal(/^(?:Booking In|Booking Urgency|Timeframe)\s*[:=-]\s*(.+)$/i);
    if (bookingIn) notesParts.push(`Booking Timeline: ${bookingIn}`);
    let reqs = getVal(/^(?:Requirements|Special Requirements|Notes|Remarks|Message|Comments)\s*[:=-]\s*(.+)$/i);
    if (reqs) {
      reqs = reqs.replace(/(?:\[|\()?\d{1,2}:\d{2}\s*(?:am|pm)?(?:\]|\))?$/i, '').trim();
      notesParts.push(`Requirements: ${reqs}`);
    }
    if (depDateRaw && (!isoDate || isoDate < today)) {
      notesParts.push(`Original Travel Date: ${depDateRaw}`);
    }

    setCreateForm((prev) => ({
      ...prev,
      customer_name: name || prev.customer_name,
      customer_phone: phone || prev.customer_phone,
      customer_email: email || prev.customer_email,
      interested_destination: destination || prev.interested_destination,
      travel_date: validTravelDate || prev.travel_date,
      travelers_count: travelers || prev.travelers_count,
      lead_source: 'WhatsApp / Quick Paste',
      notes: notesParts.join(' | ') || prev.notes
    }));
    setParseSuccess(true);
  };

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
      const rawList = res.data || res.leads || (Array.isArray(res) ? res : []);
      const normalizedList: Lead[] = rawList.map((l: any) => ({
        ...l,
        customer_name: l.customer_name || l.name || 'Traveler',
        customer_email: l.customer_email || l.email || '',
        customer_phone: l.customer_phone || l.phone || '',
        interested_destination: l.interested_destination || l.destination || 'Custom Tour',
        departure_city: l.departure_city || l.city || '',
        travel_date: l.travel_date || l.departure_date || '',
        travelers_count: Number(l.travelers_count) || ((Number(l.adults) || 2) + (Number(l.children) || 0)),
        budget: l.budget || 'Comfort',
        lead_source: l.lead_source || l.source || 'Website Enquiry',
        status: l.status || 'New',
        assigned_staff_id: l.assigned_staff_id || null,
        assigned_staff_name: l.assigned_staff_name || (l.assigned_staff_id ? 'Assigned' : 'Unassigned'),
        created_at: l.created_at || new Date().toISOString()
      }));
      setLeads(normalizedList);
      setTotalPages(res.totalPages || Math.ceil(normalizedList.length / 15) || 1);
      setTotalLeads(res.total ?? normalizedList.length);
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
    setModalSelectedStaffId(lead.assigned_staff_id || '');
    try {
      const details = await api.getAdminLeadDetails(lead.id);
      setLeadDetails(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmLeadAssign = async () => {
    if (!selectedLead) return;

    if (!modalSelectedStaffId) {
      // Unassign lead
      setIsAssigningFromModal(true);
      try {
        await api.assignLeads({
          lead_ids: [selectedLead.id],
          staff_id: '',
          notes: 'Unassigned via lead details modal.'
        });
        success('Lead unassigned successfully.');
        setSelectedLead(null);
        setLeadDetails(null);
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? { ...l, assigned_staff_id: null, assigned_staff_name: 'Unassigned', status: 'New' }
              : l
          )
        );
        loadLeads();
      } catch (err: any) {
        error(err.message || 'Failed to unassign lead.');
      } finally {
        setIsAssigningFromModal(false);
      }
      return;
    }

    const assignedStaff = staffList.find((s) => s.id === modalSelectedStaffId);
    if (assignedStaff) {
      const check = checkStaffLeadEligibility(assignedStaff, selectedLead);
      if (!check.eligible) {
        error(check.reason || 'Staff member is not eligible for this enquiry.');
        return;
      }
    }

    setIsAssigningFromModal(true);
    try {
      await api.assignLeads({
        lead_ids: [selectedLead.id],
        staff_id: modalSelectedStaffId,
        notes: 'Assigned via lead details modal.'
      });
      const assignedName = assignedStaff ? assignedStaff.name : 'Unassigned';
      success(`Lead successfully assigned to ${assignedName}!`);
      // Close the modal immediately so it does not stay open
      setSelectedLead(null);
      setLeadDetails(null);
      // Optimistically update the lead in the table
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? { ...l, assigned_staff_id: modalSelectedStaffId, assigned_staff_name: assignedName, status: 'Assigned' }
            : l
        )
      );
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to assign lead.');
    } finally {
      setIsAssigningFromModal(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeadIds.length === 0) {
      error('Please select at least one lead to assign.');
      return;
    }

    if (assignStaffId) {
      const targetStaff = staffList.find((s) => s.id === assignStaffId);
      const targetLeads = leads.filter((l) => selectedLeadIds.includes(l.id));
      if (targetStaff && targetLeads.length > 0) {
        const check = checkStaffBatchEligibility(targetStaff, targetLeads);
        if (!check.eligible) {
          error(check.reason || 'Selected staff is not eligible for these enquiries.');
          return;
        }
      }
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

    if (createForm.assigned_staff_id) {
      const targetStaff = staffList.find((s) => s.id === createForm.assigned_staff_id);
      if (targetStaff) {
        const check = checkStaffLeadEligibility(targetStaff, {
          interested_destination: createForm.interested_destination,
          notes: createForm.notes
        });
        if (!check.eligible) {
          error(check.reason || 'Selected staff is not eligible for this enquiry.');
          return;
        }
      }
    }

    try {
      await api.createAdminLead(createForm);
      success('Direct lead created successfully!');
      setIsCreateModalOpen(false);
      setCreateLeadMode('manual');
      setRawLeadText('');
      setParseSuccess(false);
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
      // Optimistically remove from state so the item disappears immediately
      setLeads((prev) => prev.filter((item) => item.id !== id));
      setTotalLeads((prev) => Math.max(0, prev - 1));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
        setLeadDetails(null);
      }
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id));

      await api.deleteAdminLead(id);
      success('Lead deleted successfully.');
      loadLeads();
    } catch (err: any) {
      error(err.message || 'Failed to delete lead.');
      loadLeads();
    }
  };

  const handleFlushLeads = async () => {
    if (!confirm('Are you sure you want to flush all test leads? This will reset the leads pipeline cleanly.')) return;
    try {
      localStorage.removeItem('tg_local_leads');
      await api.flushLeads();
      success('All test leads have been flushed clean.');
      setSelectedLead(null);
      setSelectedLeadIds([]);
      setLeads([]);
      setTotalLeads(0);
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
        {/* Filters and Search Bar (Sticky so scrolling down keeps it accessible) */}
        <div className="sticky top-[58px] sm:top-[64px] z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#EFE7DA] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 text-xs transition-all">
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
              <option value="all">All Enquiries & Leads</option>
              <option value="New">New Enquiries</option>
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
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden transition-all flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Leads: {totalLeads}</span>
            </div>

            {/* Scrollable Table View - only the table body scrolls, pinned header */}
            <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
              <table className="w-full text-xs text-left relative">
                <thead className="sticky top-0 bg-[#F8F1E7] text-[#173247] uppercase font-bold border-b border-[#EFE7DA] z-10 shadow-xs">
                  <tr>
                    <th className="py-3 px-3">Lead / Client</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Assigned Staff</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 px-4 text-center">
                        {statusFilter === 'New' ? (
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#17648A] border border-sky-100 flex items-center justify-center mx-auto shadow-xs">
                              <Inbox className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-[#082C43] font-display">
                                No New Enquiries
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                All customer enquiries submitted through the travel website have been assigned to consultants. New visitor tour inquiries and custom trip requests will appear here automatically in real time.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto shadow-xs">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-[#082C43] font-display">
                                No {statusFilter} Leads Found
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                There are currently no leads in the "{statusFilter}" stage matching your active filter criteria.
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    leads.map((l) => {
                      const isSelected = selectedLead?.id === l.id;

                      return (
                        <tr
                          key={l.id}
                          className={`transition-colors ${isSelected ? 'bg-[#FF795C]/10 font-medium' : 'hover:bg-[#F8F1E7]/30'
                            }`}
                        >
                          <td
                            className="py-3 px-3 cursor-pointer"
                            onClick={() => handleSelectLeadDetail(l)}
                          >
                            {(l as any).enquiry_id && (
                              <span className="text-[10px] text-[#FF795C] font-mono font-bold block">
                                {(l as any).enquiry_id}
                              </span>
                            )}
                            <strong className="text-[#082C43] block">{l.customer_name || (l as any).name || 'Traveler'}</strong>
                            <span className="text-[11px] text-slate-500">{l.customer_phone || l.customer_email || (l as any).phone || (l as any).email || 'No contact info'}</span>
                          </td>
                          <td
                            className="py-3 px-3 font-semibold text-[#17648A] cursor-pointer"
                            onClick={() => handleSelectLeadDetail(l)}
                          >
                            {l.interested_destination || (l as any).destination || 'Custom Tour'}
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
                            <StatusBadge status={l.status || 'New'} />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
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

        {/* Lead Detail & Timeline Centered Popup Modal */}
        {selectedLead && (
          <Modal
            isOpen={!!selectedLead}
            onClose={() => setSelectedLead(null)}
            title={`Lead Details • ${selectedLead.customer_name || (selectedLead as any).name || 'Traveler'}`}
            maxWidth="2xl"
          >
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DA]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#082C43] font-display">
                      {selectedLead.customer_name || (selectedLead as any).name || 'Traveler'}
                    </h3>
                    <StatusBadge status={selectedLead.status || 'New'} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedLead as any).enquiry_id ? `Enquiry #${(selectedLead as any).enquiry_id} • ` : ''}Lead #{selectedLead.id} • Source: {selectedLead.lead_source || (selectedLead as any).source || 'Website'}
                  </p>
                </div>
              </div>

              {/* Lead Parameters */}
              <div className="p-4 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA] text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#173247]">
                <div><strong>Email:</strong> {selectedLead.customer_email || (selectedLead as any).email || 'Not provided'}</div>
                <div><strong>Phone:</strong> {selectedLead.customer_phone || (selectedLead as any).phone || 'Not provided'}</div>
                <div><strong>Destination:</strong> {selectedLead.interested_destination || (selectedLead as any).destination || 'Custom Tour'}</div>
                <div><strong>Travel Date:</strong> {selectedLead.travel_date || (selectedLead as any).departure_date || 'Flexible'}</div>
                <div><strong>Travelers:</strong> {selectedLead.travelers_count || 2} Guests</div>
                <div><strong>Budget:</strong> {selectedLead.budget || 'Comfort'}</div>
                <div className="sm:col-span-2"><strong>Assigned Consultant:</strong> {selectedLead.assigned_staff_name || 'Unassigned'}</div>
                {(selectedLead.notes || (selectedLead as any).additional_requirements) && (
                  <div className="sm:col-span-2 pt-2 border-t border-[#EFE7DA] text-slate-600">
                    <strong>Notes:</strong> {selectedLead.notes || (selectedLead as any).additional_requirements}
                  </div>
                )}
              </div>

              {/* Lead Assignment / Reassignment */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#082C43]">
                    {selectedLead.assigned_staff_id ? 'Reassign Lead:' : 'Assign Lead:'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#17648A] uppercase">
                    {getLeadEnquiryType(selectedLead)} Enquiry
                  </span>
                </div>
                <select
                  value={modalSelectedStaffId}
                  onChange={(e) => setModalSelectedStaffId(e.target.value)}
                  className="p-2 rounded-lg border border-[#EFE7DA] bg-white font-semibold text-xs text-[#082C43]"
                >
                  <option value="">-- Unassigned --</option>
                  {staffList.map((s) => {
                    const check = checkStaffLeadEligibility(s, selectedLead);
                    return (
                      <option key={s.id} value={s.id} disabled={!check.eligible}>
                        {check.eligible ? '✓ ' : '✕ '} {s.name} ({s.profile?.role_type === 'operations' || s.role === 'operations' ? 'Ops' : 'Sales'} • {s.profile?.department || s.department || 'General'})
                        {!check.eligible ? ` [Ineligible]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Activity History Timeline */}
              <ActivityLogList
                activities={leadDetails?.activities}
                title="Activity & Audit Trail:"
                emptyText="No recorded activity on this enquiry yet."
              />

              <div className="pt-3 border-t border-[#EFE7DA] flex items-center justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmLeadAssign}
                  isLoading={isAssigningFromModal}
                  className="bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold"
                >
                  Confirm Assignment
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>

      {/* Bulk / Single Lead Assignment Modal */}
      {isAssignModalOpen && (() => {
        const selectedLeads = leads.filter((l) => selectedLeadIds.includes(l.id));
        const leadTypes = Array.from(new Set(selectedLeads.map((l) => getLeadEnquiryType(l))));
        const selectedStaffObj = staffList.find((s) => s.id === assignStaffId);
        const selectedStaffEligibility = selectedStaffObj ? checkStaffBatchEligibility(selectedStaffObj, selectedLeads) : null;

        return (
          <Modal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            title={`Assign ${selectedLeadIds.length} Lead(s) to Staff Member`}
            subtitle="Smart assignment enforces departmental credentials and role-specific access rules."
            maxWidth="lg"
          >
            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              {/* Lead Context & Policy Notice Banner */}
              <div className="p-3 bg-[#F8F1E7]/50 rounded-xl border border-[#EFE7DA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#082C43] uppercase text-[11px] tracking-wider">
                    Enquiry Scope & Constraints
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {leadTypes.map((t) => (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${t === 'international'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : t === 'travels'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                      >
                        {t === 'international' ? '🌍 International Package' : t === 'travels' ? '🚗 Travels & Transport' : '🏔️ Domestic Tour'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
                  {leadTypes.includes('international') && (
                    <p className="text-blue-700">
                      • <strong>International Package Policy:</strong> Can ONLY be assigned to staff in <em>Holidays & International</em>. Staff assigned strictly to domestic tours cannot accept this enquiry.
                    </p>
                  )}
                  {leadTypes.includes('travels') && (
                    <p className="text-purple-700">
                      • <strong>Travels Enquiry Policy:</strong> Operations staff manage cab rentals, tempo travels, and vehicle logistics.
                    </p>
                  )}
                  {!leadTypes.includes('travels') && (
                    <p className="text-slate-500">
                      • <strong>Operations Staff Restriction:</strong> Operations staff can ONLY be assigned to travels and logistics enquiries.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Select Staff Member *</label>
                <select
                  required
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none font-semibold text-xs text-[#082C43]"
                >
                  <option value="">-- Select Eligible Staff Member --</option>
                  {staffList.map((s: any) => {
                    const check = checkStaffBatchEligibility(s, selectedLeads);
                    const isOps = s.role === 'operations' || s.profile?.role_type === 'operations';
                    return (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={!check.eligible}
                        className={!check.eligible ? 'text-slate-400 bg-slate-100' : 'text-[#082C43] font-semibold'}
                      >
                        {check.eligible ? '✓ ' : '✕ [Ineligible] '}
                        {s.name} • {isOps ? 'Operations' : 'Sales'} • {s.profile?.department || s.department || 'Travel Desk'}
                        {!check.eligible ? ` (${check.badgeLabel})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Dynamic Eligibility Feedback Box */}
              {selectedStaffObj && (
                selectedStaffEligibility?.eligible ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-xs">Eligible for Lead Allocation</strong>
                      <span className="text-[11px] text-emerald-700 leading-normal">
                        {selectedStaffObj.name} holds all verified credentials required to manage this enquiry.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-xs">Assignment Restricted by Policy</strong>
                      <span className="text-[11px] text-rose-700 leading-normal">
                        {selectedStaffEligibility?.reason}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Assignment Directive / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Priority lead, contact client immediately on WhatsApp..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!assignStaffId || (selectedStaffEligibility !== null && !selectedStaffEligibility.eligible)}
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Create Direct Lead Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setParseSuccess(false);
            setRawLeadText('');
          }}
          title="Create New Direct Lead"
          subtitle="Manually enter phone inquiries, walk-ins, or paste unstructured lead text."
          maxWidth="2xl"
        >
          {/* Mode Selector Tabs */}
          <div className="flex border-b border-[#EFE7DA] mb-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCreateLeadMode('manual')}
              className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                createLeadMode === 'manual'
                  ? 'border-[#FF795C] text-[#FF795C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Option 1: Manual Form
            </button>
            <button
              type="button"
              onClick={() => setCreateLeadMode('paste')}
              className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                createLeadMode === 'paste'
                  ? 'border-[#0070E0] text-[#0070E0]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Option 2: Smart Paste Parser
            </button>
          </div>

          <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
            {/* Option 2: Smart Paste Area */}
            {createLeadMode === 'paste' && (
              <div className="p-3.5 rounded-2xl bg-[#F0F6FF] border border-blue-200/80 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#082C43] text-xs">
                    Paste Here
                  </span>
                  {rawLeadText && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawLeadText('');
                        setParseSuccess(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-500 font-semibold cursor-pointer"
                    >
                      Clear Text
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  placeholder="Paste lead details here..."
                  value={rawLeadText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setRawLeadText(text);
                    if (text.trim()) {
                      parseLeadText(text);
                    } else {
                      setParseSuccess(false);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-blue-200 bg-white font-mono text-[11px] resize-y focus:outline-none focus:border-[#0070E0]"
                />

                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-[11px] text-slate-500">
                    Instantly extracts Name, Phone, Email, Destination, Date, Pax, and Notes.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs bg-white text-[#0070E0] border-[#0070E0]/30 hover:bg-[#0070E0]/10"
                    onClick={() => parseLeadText(rawLeadText)}
                  >
                    ⚡ Extract Details
                  </Button>
                </div>

                {parseSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lead details extracted successfully! Verify the fields below and select assigned staff.</span>
                  </div>
                )}
              </div>
            )}

            {/* Structured Fields: Visible in both options */}
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
                  placeholder="e.g. Kashmir, Switzerland, Cab Rental"
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
                  min={getTodayIST()}
                  value={createForm.travel_date}
                  onChange={(e) => setCreateForm({ ...createForm, travel_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Travelers (Pax)</label>
                <input
                  type="number"
                  min={1}
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
                  {staffList.map((s) => {
                    const check = checkStaffLeadEligibility(s, {
                      interested_destination: createForm.interested_destination,
                      notes: createForm.notes
                    });
                    return (
                      <option key={s.id} value={s.id} disabled={!check.eligible}>
                        {check.eligible ? '✓ ' : '✕ '} {s.name} ({s.profile?.role_type === 'operations' || s.role === 'operations' ? 'Ops' : 'Sales'})
                        {!check.eligible ? ' [Ineligible]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Inquiry Details & Notes</label>
              <textarea
                rows={3}
                placeholder="Walk-in inquiry at Bengaluru office, WhatsApp requirements, or custom notes..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE7DA]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setParseSuccess(false);
                  setRawLeadText('');
                }}
              >
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
