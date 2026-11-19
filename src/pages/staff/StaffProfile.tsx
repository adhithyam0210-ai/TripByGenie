import React from 'react';
import { UserCheck, ShieldCheck, Mail, Phone, Award, Building } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export const StaffProfile: React.FC = () => {
  const { user, agency } = useAuth();

  return (
    <DashboardLayout
      title="Staff Consultant Profile"
      subtitle="View your employee credentials, designation, and agency affiliation."
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-[#EFE7DA] p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#EFE7DA]">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#55C9BD]"
          />
          <div>
            <h3 className="text-lg font-bold text-[#082C43]">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#17648A]/15 text-[#17648A]">
              Role: Travel Operations Consultant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Agency</span>
            <strong className="text-sm text-[#082C43] block mt-0.5">{agency?.name || 'Travel Genie'}</strong>
          </div>
          <div className="p-4 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultant Rating</span>
            <strong className="text-sm text-amber-600 block mt-0.5">4.9 / 5.0 (Top Rated)</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-[#082C43] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security & Permission Boundaries
          </h4>
          <p className="text-[11px] leading-relaxed">
            As a staff consultant, your account has operational access to communicate with assigned customer inquiries and generate quotations. Wholesale pricing rules and master financials are restricted to Agency Administrators.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};
