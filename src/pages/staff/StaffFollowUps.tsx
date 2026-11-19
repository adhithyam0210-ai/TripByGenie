import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Phone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { Lead } from '../../types';

export const StaffFollowUps: React.FC = () => {
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      const data = await api.getStaffFollowUps();
      setFollowUps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = followUps.filter((f) => f.follow_up_date?.startsWith(todayStr));
  const upcoming = followUps.filter((f) => f.follow_up_date && !f.follow_up_date.startsWith(todayStr));

  return (
    <DashboardLayout
      title="Scheduled Follow-up Agenda"
      subtitle="Prioritize client calls and reminders to maximize lead conversion rates."
    >
      <div className="space-y-8">
        {/* Priority Due Today */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-base font-bold text-[#082C43] font-display">
              Due Today ({dueToday.length})
            </h3>
          </div>

          {dueToday.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#EFE7DA] text-center text-xs text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <span>No calls scheduled for today.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dueToday.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-2xl bg-white border-2 border-rose-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#082C43]">{lead.customer_name}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                      Due Today
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Destination: <strong>{lead.interested_destination}</strong> ({lead.travelers_count} Pax)
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                    {lead.notes || 'No reminder notes entered.'}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <a href={`tel:${lead.customer_phone}`} className="font-bold text-emerald-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <Link to={`/staff/leads?id=${lead.id}`}>
                      <Button variant="primary" size="sm">
                        Open Lead
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming This Week */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#17648A]" />
            <h3 className="text-base font-bold text-[#082C43] font-display">
              Upcoming Follow-ups ({upcoming.length})
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
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
                {upcoming.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#082C43]">
                      {u.follow_up_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17648A]">
                      {u.customer_name} ({u.customer_phone})
                    </td>
                    <td className="py-3 px-4">
                      {u.interested_destination}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/staff/leads`}>
                        <Button variant="ghost" size="sm" className="text-xs text-[#FF795C]">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
