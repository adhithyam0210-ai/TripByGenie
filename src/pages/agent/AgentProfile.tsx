import React, { useState } from 'react';
import { Building2, ShieldCheck, Mail, Phone, Award, DollarSign, Lock, KeyRound } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

export const AgentProfile: React.FC = () => {
  const { user, agency } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <DashboardLayout
      title="B2B Travel Agent Partner Profile"
      subtitle="View your commercial wholesale tier, verified corporate credentials, and credit lines."
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-[#EFE7DA] p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#EFE7DA]">
          <div className="w-16 h-16 rounded-2xl bg-[#082C43] text-white flex items-center justify-center font-bold text-xl font-display">
            B2B
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#082C43]">GlobeTrotters B2B Partner Ltd</h3>
            <p className="text-xs text-slate-500">Representative: {user?.name} ({user?.email})</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Verified IATA Travel Partner
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Wholesale Partner ID</span>
            <strong className="text-sm font-mono text-[#082C43] block mt-0.5">AGT-9042</strong>
          </div>
          <div className="p-4 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Wholesale Margin</span>
            <strong className="text-sm text-emerald-700 font-bold block mt-0.5">12% Fixed Net Discount</strong>
          </div>
        </div>

        {/* Password Security Option */}
        <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0070E0]/15 text-[#0070E0] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#082C43]">B2B Agent Portal Password</h4>
              <p className="text-[11px] text-slate-500">Update your partner wholesale account login credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0070E0] hover:bg-[#005bb8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer w-full sm:w-auto text-center"
          >
            Change Password
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#082C43] text-white text-xs space-y-2">
          <h4 className="font-bold text-[#55C9BD] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#55C9BD]" />
            Consolidated Travel Agency Protection
          </h4>
          <p className="text-[11px] text-white/80 leading-relaxed">
            Wholesale purchase prices are confidential and strictly invisible to regular retail customers. All bookings made through your account carry your agency's branding on customer-facing documentation.
          </p>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userRole="B2B Agent Partner"
      />
    </DashboardLayout>
  );
};
