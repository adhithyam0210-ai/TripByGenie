import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, TrendingUp, ShieldCheck, DollarSign, Building } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminAgents: React.FC = () => {
  const { success, error } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Agent Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    wholesale_discount_pct: 12,
    credit_limit: 500000,
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!formData.name || !formData.email || !formData.company_name || !formData.password) {
      error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAdminAgent(formData);
      success('B2B Travel Agent account registered!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        wholesale_discount_pct: 12,
        credit_limit: 500000,
        password: ''
      });
      loadAgents();
    } catch (err: any) {
      error(err.message || 'Failed to create agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAgentStatus = async (agent: any) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAdminAgent(agent.id, { status: newStatus });
      success(`Agent account ${newStatus}.`);
      loadAgents();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status.');
    }
  };

  return (
    <DashboardLayout
      title="B2B Travel Agent Partner Directory"
      subtitle="Manage external wholesale travel agents, set customized wholesale discount tiers, and track B2B sales volume."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Register B2B Agent
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Wholesale Partners ({agents.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Agency / Company</th>
                  <th className="py-3 px-4">Agent ID</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Wholesale Margin</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Purchased Volume</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#082C43] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          B2B
                        </div>
                        <div>
                          <strong className="text-[#082C43] block">
                            {ag.profile?.company_name || ag.name}
                          </strong>
                          <span className="text-[11px] text-slate-500">{ag.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#17648A]">
                      {ag.profile?.agent_id || 'AGT-9000'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#082C43] block">{ag.name}</span>
                      <span className="text-[11px] text-slate-500">{ag.phone || 'None'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {ag.profile?.wholesale_discount_pct || 12}% Net
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      ₹{(ag.profile?.credit_limit || 500000).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                      ₹{(ag.totalPurchasedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          ag.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ag.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleAgentStatus(ag)}
                        className={`text-xs font-bold hover:underline cursor-pointer ${
                          ag.status === 'active' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {ag.status === 'active' ? 'Suspend' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register Agent Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register External B2B Travel Agency Partner"
          subtitle="Grants wholesale package purchase privileges at discounted trade rates."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
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
                <label className="font-bold text-[#082C43] block mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Director / Managing Agent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="partners@skylinetravel.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Wholesale Discount (%) *</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  required
                  value={formData.wholesale_discount_pct}
                  onChange={(e) => setFormData({ ...formData, wholesale_discount_pct: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard tier is 12% off public retail price.</span>
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

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Initial B2B Portal Password *</label>
              <input
                type="password"
                required
                placeholder="Temporary login password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Register B2B Agent
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
