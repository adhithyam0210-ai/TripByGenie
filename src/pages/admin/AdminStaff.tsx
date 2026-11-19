import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Mail, Phone, ShieldCheck, ToggleLeft, ToggleRight, Award } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminStaff: React.FC = () => {
  const { success, error } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Holidays & International',
    designation: 'Travel Consultant',
    password: '',
    employee_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStaff();
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error('Name, email, and temporary password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAdminStaff(formData);
      success('Staff account created successfully! Credentials active.');
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Holidays & International',
        designation: 'Travel Consultant',
        password: '',
        employee_id: ''
      });
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStaffStatus = async (staffMember: any) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAdminStaff(staffMember.id, { status: newStatus });
      success(`Staff account ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      loadStaff();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status.');
    }
  };

  return (
    <DashboardLayout
      title="Staff & Consultant Management"
      subtitle="Provision employee accounts, assign department roles, set access statuses, and monitor conversion metrics."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Staff Member
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Travel Operations Team ({staff.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Active Leads</th>
                  <th className="py-3 px-4">Conversions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={s.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#EFE7DA]"
                        />
                        <div>
                          <strong className="text-[#082C43] block">{s.name}</strong>
                          <span className="text-[11px] text-slate-500">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#17648A]">
                      {s.profile?.employee_id || 'TG-EMP-100'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#082C43] block">
                        {s.profile?.designation || 'Consultant'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {s.profile?.department || 'Holidays'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#082C43]">
                      {s.assignedLeadsCount} Leads
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {s.convertedLeadsCount} Closed
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleStaffStatus(s)}
                        className={`text-xs font-bold hover:underline cursor-pointer ${
                          s.status === 'active' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {s.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Staff Consultant Account"
          subtitle="Generates employee account with role-based CRM access."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul.staff@travelgenie.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00003"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Employee ID Code</label>
                <input
                  type="text"
                  placeholder="TG-EMP-105"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="Holidays & International">Holidays & International</option>
                  <option value="Domestic & Group Tours">Domestic & Group Tours</option>
                  <option value="Honeymoon Specialists">Honeymoon Specialists</option>
                  <option value="Ticketing & Visa Desk">Ticketing & Visa Desk</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="Senior Travel Specialist"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Temporary Login Password *</label>
              <input
                type="password"
                required
                placeholder="Temporary login password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Will be encrypted with bcrypt before storing. Employee can change upon first login.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Provision Staff Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
