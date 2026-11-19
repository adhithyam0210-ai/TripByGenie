import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  CreditCard,
  UserCheck,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { agency } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [agency?.id]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Executive CRM Dashboard" subtitle="Loading analytics and operations overview...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentLeads = data?.recentLeads || [];
  const recentBookings = data?.recentBookings || [];

  return (
    <DashboardLayout
      title="Executive CRM Command Center"
      subtitle={`Tenant: ${agency?.name || 'Travel Genie'} • Real-time leads pipeline, booking conversions & revenue`}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/admin/leads">
            <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Manage Leads
            </Button>
          </Link>
          <Link to="/admin/packages">
            <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4" />}>
              Packages
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Top Operational KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Inquiries"
            value={kpis.total_leads || 0}
            subtitle={`${kpis.new_leads || 0} New Unassigned`}
            icon={<Users className="w-4 h-4" />}
            accentColor="navy"
          />
          <StatCard
            title="Assigned Leads"
            value={kpis.assigned_leads || 0}
            subtitle={`${kpis.in_progress_leads || 0} in progress`}
            icon={<Clock className="w-4 h-4" />}
            accentColor="turquoise"
          />
          <StatCard
            title="Conversion Rate"
            value={kpis.conversion_rate || '0%'}
            subtitle={`${kpis.converted_leads || 0} leads converted`}
            icon={<TrendingUp className="w-4 h-4" />}
            accentColor="emerald"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${((kpis.total_revenue || 0) / 100000).toFixed(1)}L`}
            subtitle="Confirmed bookings"
            icon={<DollarSign className="w-4 h-4" />}
            accentColor="coral"
          />
          <StatCard
            title="Active Staff"
            value={kpis.active_staff || 0}
            subtitle="Handling inquiries"
            icon={<UserCheck className="w-4 h-4" />}
            accentColor="navy"
          />
          <StatCard
            title="B2B Agents"
            value={kpis.active_agents || 0}
            subtitle="Wholesale partners"
            icon={<Briefcase className="w-4 h-4" />}
            accentColor="amber"
          />
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Lead Generation & Conversions Bar Chart */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
              <div>
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  Monthly Lead Acquisition & Conversions
                </h3>
                <p className="text-xs text-slate-500">Pipeline growth over the last 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#082C43]">
                  <span className="w-3 h-3 rounded-md bg-[#082C43]" /> Inquiries
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" /> Converted
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="pt-6 h-56 flex items-end justify-between gap-3">
              {(charts.monthlyLeads || []).map((item: any, idx: number) => {
                const maxVal = 60;
                const leadsHeight = Math.min(100, (item.leads / maxVal) * 100);
                const convHeight = Math.min(100, (item.converted / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Leads bar */}
                      <div
                        className="w-1/2 max-w-[28px] bg-[#082C43] hover:bg-[#17648A] rounded-t-lg transition-all relative group"
                        style={{ height: `${leadsHeight}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#041D30] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none transition-opacity">
                          {item.leads} leads
                        </div>
                      </div>
                      {/* Converted bar */}
                      <div
                        className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all relative group"
                        style={{ height: `${convHeight}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none transition-opacity">
                          {item.converted} converted
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 mt-1">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Trends */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  Revenue Growth
                </h3>
                <p className="text-xs text-slate-500">Gross transaction turnover</p>
              </div>

              <div className="py-4 space-y-3">
                {(charts.revenueTrends || []).slice(-4).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">{r.month} 2026</span>
                    <div className="text-right">
                      <span className="font-extrabold text-[#082C43]">
                        ₹{r.revenue?.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">+18.5% MoM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F1E7] border border-[#EFE7DA] text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#082C43]">
                <span>Pending Receivables:</span>
                <span className="text-[#FF795C]">₹{(kpis.pending_payments || 0).toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                To be collected prior to customer tour departures.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Feeds: Recent Inquiries & Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inquiries */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
              <h3 className="text-base font-bold text-[#082C43] font-display">
                Latest Leads & Enquiries
              </h3>
              <Link to="/admin/leads" className="text-xs text-[#FF795C] font-semibold hover:underline">
                View All Leads
              </Link>
            </div>

            <div className="divide-y divide-[#EFE7DA]">
              {recentLeads.map((l: any) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#082C43]">{l.customer_name}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <span className="text-[11px] text-[#17648A] block mt-0.5">
                      Destination: {l.interested_destination} • Staff: {l.assigned_staff_name || 'Unassigned'}
                    </span>
                  </div>

                  <Link to="/admin/leads">
                    <Button variant="ghost" size="sm" className="text-xs text-[#FF795C]">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
              <h3 className="text-base font-bold text-[#082C43] font-display">
                Latest Confirmed Bookings
              </h3>
              <Link to="/admin/bookings" className="text-xs text-[#FF795C] font-semibold hover:underline">
                View Bookings
              </Link>
            </div>

            <div className="divide-y divide-[#EFE7DA]">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#082C43]">#{b.booking_number}</span>
                      <span className="font-semibold text-slate-700">{b.customer_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {b.package_title} • Departs: {b.travel_start_date}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-[#082C43] block">
                      ₹{b.total_amount?.toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={b.payment_status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
