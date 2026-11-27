import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, TrendingUp, ShieldCheck, DollarSign, Building, Mail, RefreshCw, KeyRound, CheckCircle2, Clock, AlertCircle, Eye, Search, Filter, Copy, Check, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminAgents: React.FC = () => {
  const { success, error } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invitation_sent' | 'suspended'>('all');

  // Copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitationModalData, setInvitationModalData] = useState<{
    isOpen: boolean;
    agentId: string;
    agentName: string;
    companyName: string;
    email: string;
    activationLink: string;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    success('Activation link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Create Agent Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    business_address: '',
    gst_number: '',
    business_reg_number: '',
    contact_person: '',
    account_type: 'WHOLESALE',
    wholesale_discount_pct: 12,
    credit_limit: 500000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company_name || !formData.phone) {
      error('Please complete all required fields (Name, Agency, Email, Mobile).');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const isDuplicate = agents.some((a) => (a.email && a.email.trim().toLowerCase() === cleanEmail) || (a.user?.email && a.user.email.trim().toLowerCase() === cleanEmail));
    if (isDuplicate) {
      error(`An agent account with email '${cleanEmail}' already exists. Duplicate emails are not allowed.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createAdminAgent(formData);
      success(`B2B Agent registered! Generated Agent ID: ${res.agent_id}.`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        business_address: '',
        gst_number: '',
        business_reg_number: '',
        contact_person: '',
        account_type: 'WHOLESALE',
        wholesale_discount_pct: 12,
        credit_limit: 500000
      });
      loadAgents();
      if (res.invitation?.activation_link) {
        setInvitationModalData({
          isOpen: true,
          agentId: res.agent_id,
          agentName: formData.name,
          companyName: formData.company_name,
          email: formData.email,
          activationLink: res.invitation.activation_link
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = async (agent: any) => {
    try {
      const res = await api.resendAgentInvitation(agent.id);
      success(`Fresh invitation generated for ${agent.email}.`);
      loadAgents();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          agentId: agent.agent_id || res.agent_id,
          agentName: agent.name,
          companyName: agent.company_name,
          email: agent.email,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to resend invitation.');
    }
  };

  const handleToggleStatus = async (agent: any) => {
    const newStatus = agent.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAgentStatus(agent.id, newStatus, `Status updated by manager.`);
      success(`Agent account marked as ${newStatus.toUpperCase()}.`);
      loadAgents();
    } catch (err: any) {
      error(err.message || 'Failed to update agent status.');
    }
  };

  const handleResetAccess = async (agent: any) => {
    if (!window.confirm(`Reset access credentials for ${agent.name} (${agent.agent_id})? A new activation link will be generated.`)) {
      return;
    }
    try {
      const res = await api.resetAgentAccess(agent.id);
      success(`Access credentials reset for ${agent.email}.`);
      loadAgents();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          agentId: agent.agent_id,
          agentName: agent.name,
          companyName: agent.company_name,
          email: agent.email,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to reset agent access.');
    }
  };

  // Filtered agents
  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      (ag.name && ag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ag.company_name && ag.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ag.email && ag.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ag.agent_id && ag.agent_id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return ag.status === 'active';
    if (statusFilter === 'invitation_sent') return ag.invitation_status === 'INVITATION_SENT';
    if (statusFilter === 'suspended') return ag.status === 'suspended';

    return true;
  });

  return (
    <DashboardLayout
      title="B2B Travel Agent Partner Directory"
      subtitle="Manage wholesale travel agencies, issue unique B2B Agent IDs, manage wholesale pricing tiers, and monitor activation status."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create B2B Agent
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total B2B Agents</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display mt-1 block">{agents.length}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Active Partners</span>
            <span className="text-2xl font-extrabold text-emerald-700 font-display mt-1 block">
              {agents.filter(a => a.status === 'active').length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Invited / Pending</span>
            <span className="text-2xl font-extrabold text-amber-700 font-display mt-1 block">
              {agents.filter(a => a.invitation_status === 'INVITATION_SENT' || a.status === 'pending').length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] font-bold text-[#17648A] uppercase tracking-wider block">Total B2B Volume</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display mt-1 block">
              ₹{agents.reduce((sum, a) => sum + (a.totalPurchasedAmount || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#082C43] text-white shadow-xs'
                  : 'bg-[#F8F1E7]/50 text-slate-600 hover:bg-[#F8F1E7]'
              }`}
            >
              All ({agents.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F8F1E7]/50 text-slate-600 hover:bg-[#F8F1E7]'
              }`}
            >
              Active ({agents.filter(a => a.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('invitation_sent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'invitation_sent'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#F8F1E7]/50 text-slate-600 hover:bg-[#F8F1E7]'
              }`}
            >
              Invitation Sent ({agents.filter(a => a.invitation_status === 'INVITATION_SENT').length})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'suspended'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#F8F1E7]/50 text-slate-600 hover:bg-[#F8F1E7]'
              }`}
            >
              Suspended ({agents.filter(a => a.status === 'suspended').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Agent ID, agency, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Agency / Partner</th>
                  <th className="py-3 px-4">Agent ID</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Wholesale Tier</th>
                  <th className="py-3 px-4">Invitation Status</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Purchased Volume</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No B2B agent records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#082C43] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            B2B
                          </div>
                          <div>
                            <strong className="text-[#082C43] block">
                              {ag.company_name || ag.profile?.company_name || ag.name}
                            </strong>
                            <span className="text-[11px] text-slate-500">{ag.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-sky-50 text-[#17648A] px-2 py-0.5 rounded-md border border-sky-200">
                          {ag.agent_id || ag.profile?.agent_id || 'B2B-2026-0001'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#082C43] block">{ag.name}</span>
                        <span className="text-[11px] text-slate-500">{ag.phone || 'None'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block text-[11px]">
                            {ag.wholesale_discount_pct !== undefined ? ag.wholesale_discount_pct : (ag.profile?.wholesale_discount_pct || 12)}% Margin
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Limit: ₹{(ag.credit_limit || ag.profile?.credit_limit || 500000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            ag.invitation_status === 'ACTIVATED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ag.invitation_status === 'INVITATION_SENT'
                              ? 'bg-amber-100 text-amber-800'
                              : ag.invitation_status === 'INVITATION_EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ag.invitation_status === 'ACTIVATED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {ag.invitation_status === 'INVITATION_SENT' && <Clock className="w-2.5 h-2.5" />}
                          {ag.invitation_status || 'NOT_SENT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            ag.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ag.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ag.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                        ₹{(ag.totalPurchasedAmount || 0).toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          {ag.purchasesCount || 0} orders
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ag.invitation_status !== 'ACTIVATED' && ag.active_invitation_link && (
                            <button
                              onClick={() => copyToClipboard(ag.active_invitation_link)}
                              title="Copy Secure Activation Link"
                              className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold hover:bg-sky-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy Link
                            </button>
                          )}
                          {ag.invitation_status !== 'ACTIVATED' && (
                            <button
                              onClick={() => handleResendInvitation(ag)}
                              title="Resend Activation Invitation"
                              className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              Resend
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(ag)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              ag.status === 'active'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {ag.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setSelectedAgent(ag)}
                            title="View Agent Profile"
                            className="p-1 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register B2B Agent Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register External B2B Travel Agency Partner"
          subtitle="Generates unique Agent ID and automatically sends a secure activation invitation link."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#17648A]" />
                Automated Onboarding & Security
              </span>
              <p className="text-[11px] text-sky-800">
                A unique Agent ID (e.g. B2B-2026-0001) will be generated. The agent will receive an invitation email containing a secure single-use 48-hour activation link to establish their password.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Company / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Travel Solutions Pvt Ltd"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Agent Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Registered Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="agent@skylinetravel.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Business Address</label>
              <input
                type="text"
                placeholder="Suite 402, Trade Center, MG Road, Bengaluru"
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  placeholder="29AAAAA0000A1Z5"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Business Reg # (Optional)</label>
                <input
                  type="text"
                  placeholder="CIN / Reg No."
                  value={formData.business_reg_number}
                  onChange={(e) => setFormData({ ...formData, business_reg_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="WHOLESALE">Wholesale Partner</option>
                  <option value="CORPORATE">Corporate Partner</option>
                  <option value="RETAIL">Retail Sub-Agent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Wholesale Discount (%) *</label>
                <input
                  type="number"
                  min="5"
                  max="35"
                  required
                  value={formData.wholesale_discount_pct}
                  onChange={(e) => setFormData({ ...formData, wholesale_discount_pct: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard trade tier is 12% off public retail price.</span>
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Wholesale Credit Limit (₹)</label>
                <input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Register & Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Agent Details Modal */}
      {selectedAgent && (
        <Modal
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          title={`B2B Agent: ${selectedAgent.agent_id || 'B2B-2026-0001'}`}
          subtitle={selectedAgent.company_name || selectedAgent.name}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8F1E7]/50 rounded-xl border border-[#EFE7DA]">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Agent ID</span>
                <span className="font-mono font-bold text-[#17648A] text-sm block mt-0.5">
                  {selectedAgent.agent_id || 'B2B-2026-0001'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Status</span>
                <span className="font-bold capitalize text-slate-700 block mt-0.5">
                  {selectedAgent.status} ({selectedAgent.invitation_status})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Person</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{selectedAgent.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Email Address</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{selectedAgent.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Phone</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{selectedAgent.phone || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">GST Number</span>
                <span className="font-mono font-bold text-slate-700 block mt-0.5">{selectedAgent.gst_number || 'Unregistered'}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#EFE7DA] space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Business Address</span>
              <p className="text-slate-700">{selectedAgent.business_address || 'No address provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 text-[10px] uppercase font-bold block">Wholesale Margin</span>
                <span className="text-lg font-extrabold text-emerald-800 block mt-0.5">
                  {selectedAgent.wholesale_discount_pct || 12}% Net Trade
                </span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-sky-700 text-[10px] uppercase font-bold block">Wholesale Credit Limit</span>
                <span className="text-lg font-extrabold text-sky-800 font-mono block mt-0.5">
                  ₹{(selectedAgent.credit_limit || 500000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {selectedAgent.invitation_status !== 'ACTIVATED' && selectedAgent.active_invitation_link && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-900 font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Active Account Activation Link
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedAgent.active_invitation_link)}
                    className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200 text-[11px] font-mono break-all text-slate-700 select-all">
                  {selectedAgent.active_invitation_link}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DA]">
              <button
                onClick={() => handleResetAccess(selectedAgent)}
                className="text-amber-700 hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Reset Credentials
              </button>
              <Button type="button" variant="primary" size="sm" onClick={() => setSelectedAgent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Account Invitation Ready Modal */}
      {invitationModalData?.isOpen && (
        <Modal
          isOpen={invitationModalData.isOpen}
          onClose={() => setInvitationModalData(null)}
          title="B2B Agent Account Invitation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-emerald-950 text-sm">Account & Activation Link Ready!</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                The B2B partner account for <strong>{invitationModalData.companyName}</strong> has been configured with unique Agent ID <strong>{invitationModalData.agentId}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Unique Agent ID:</span>
                <span className="font-mono font-bold text-[#082C43] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {invitationModalData.agentId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Partner Email:</span>
                <span className="font-bold text-[#082C43]">{invitationModalData.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Contact Person:</span>
                <span className="text-slate-800">{invitationModalData.agentName}</span>
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
              <strong>Direct Activation & Real Email Dispatch:</strong>
              <p className="mt-1">
                If SMTP email credentials (e.g. Gmail App Password) are set up in your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> file, an invitation email has also been delivered to <strong>{invitationModalData.email}</strong>.
                You can also copy this link and send it directly to the agent via WhatsApp or email.
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
    </DashboardLayout>
  );
};
