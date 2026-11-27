import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, FileText, CheckCircle2, Calendar, PhoneCall } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaffDashboard();
  }, []);

  const loadStaffDashboard = async () => {
    try {
      const data = await api.getStaffDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Staff Operations Overview" subtitle="Loading consultant dashboard...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    my_leads: 0,
    new_leads: 0,
    follow_ups_due: 0,
    quotations_sent: 0,
    converted_leads: 0
  };

  return (
    <DashboardLayout
      title={`Staff Workspace • ${user?.name || 'Consultant'}`}
      subtitle="Handle your assigned travel enquiries, log call interactions, prepare quotations, and close bookings."
      actions={
        <Link to="/staff/leads">
          <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
            Open Leads CRM
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Assigned Leads"
            value={stats.my_leads}
            subtitle="My active pipeline"
            icon={<Users className="w-5 h-5" />}
            accentColor="navy"
          />
          <StatCard
            title="Fresh Inquiries"
            value={stats.new_leads}
            subtitle="Needs initial contact"
            icon={<PhoneCall className="w-5 h-5" />}
            accentColor="coral"
          />
          <StatCard
            title="Follow-ups Due"
            value={stats.follow_ups_due}
            subtitle="Scheduled for today"
            icon={<Clock className="w-5 h-5" />}
            accentColor="amber"
          />
          <StatCard
            title="Quotes Dispatched"
            value={stats.quotations_sent}
            subtitle="Active proposals"
            icon={<FileText className="w-5 h-5" />}
            accentColor="turquoise"
          />
          <StatCard
            title="Converted Trips"
            value={stats.converted_leads}
            subtitle="Confirmed bookings"
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="emerald"
          />
        </div>

        {/* Priority Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Follow-ups Due Today */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF795C]" />
                  <h3 className="text-base font-bold text-[#082C43] font-display">
                    Action Required: Follow-ups Due Today
                  </h3>
                </div>
                <Link to="/staff/follow-ups" className="text-xs text-[#17648A] font-semibold hover:underline">
                  Full Agenda
                </Link>
              </div>

              <div className="py-4 space-y-3">
                {(!dashboardData?.followUpsDueToday || dashboardData.followUpsDueToday.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <span>Great job! All follow-ups for today are up to date.</span>
                  </div>
                ) : (
                  (dashboardData.followUpsDueToday || []).map((lead: any) => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-[#082C43]">{lead.customer_name}</strong>
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                            Due Today
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Destination: {lead.interested_destination} • {lead.customer_phone}
                        </p>
                      </div>

                      <Link to={`/staff/leads?id=${lead.id}`}>
                        <Button variant="primary" size="sm" className="text-xs">
                          Action
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Link to="/staff/follow-ups">
                <Button variant="outline" size="sm" className="w-full">
                  View Scheduled Follow-up Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Recently Handled Leads */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  My Active Lead Queue
                </h3>
                <Link to="/staff/leads" className="text-xs text-[#FF795C] font-semibold hover:underline">
                  View All
                </Link>
              </div>

              <div className="py-4 space-y-3">
                {(dashboardData?.assignedLeads || []).slice(0, 4).map((lead: any) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-[#082C43]">{lead.customer_name}</strong>
                        <StatusBadge status={lead.status} />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {lead.interested_destination} • Budget: {lead.budget}
                      </span>
                    </div>

                    <Link to="/staff/leads">
                      <Button variant="ghost" size="sm" className="text-xs text-[#17648A]">
                        Manage
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Link to="/staff/leads">
                <Button variant="turquoise" size="sm" className="w-full">
                  Open Lead Pipeline Table
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
