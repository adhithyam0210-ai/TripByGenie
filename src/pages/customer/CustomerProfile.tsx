import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, FileText, MapPin, Save, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const CustomerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    passport_number: '',
    emergency_contact: '',
    preferred_destinations: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getCustomerProfile();
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        passport_number: data.profile?.passport_number || '',
        emergency_contact: data.profile?.emergency_contact || '',
        preferred_destinations: (data.profile?.preferred_destinations || []).join(', ')
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const destArray = formData.preferred_destinations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.updateCustomerProfile({
        name: formData.name,
        phone: formData.phone,
        passport_number: formData.passport_number,
        emergency_contact: formData.emergency_contact,
        preferred_destinations: destArray
      });

      updateUser({ name: formData.name, phone: formData.phone });
      success('Profile updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="My Traveler Profile"
      subtitle="Manage your personal travel documents, emergency contacts, and holiday preferences."
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-[#EFE7DA] p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-4 pb-6 border-b border-[#EFE7DA]">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#17648A]"
            />
            <div>
              <h3 className="text-lg font-bold text-[#082C43]">{formData.name || 'Traveler'}</h3>
              <p className="text-xs text-slate-500">{formData.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified Customer Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">Phone / WhatsApp</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">Passport Number</label>
              <input
                type="text"
                placeholder="e.g. N1234567"
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Emergency Contact Number</label>
            <input
              type="text"
              placeholder="+91 98765 00000 (Relationship/Name)"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">
              Dream Travel Bucket List (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Switzerland, Maldives, Iceland, Japan"
              value={formData.preferred_destinations}
              onChange={(e) => setFormData({ ...formData, preferred_destinations: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Details
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
