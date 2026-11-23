import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Building,
  Car,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plane,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';

export const OperationsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    total_confirmed_bookings: 0,
    arrangements_pending: 0,
    hotel_confirmed: 0,
    transport_confirmed: 0,
    documents_ready: 0,
    trips_in_progress: 0,
    trips_completed: 0,
    issues_reported: 0,
    total_documents: 0,
    pending_customer_verifications: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOperationsDashboard();
      if (data.stats) setStats(data.stats);
      if (data.bookings) setRecentBookings(data.bookings.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Confirmed Bookings',
      value: stats.total_confirmed_bookings,
      icon: CalendarCheck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200',
      sub: 'Awaiting / Under execution'
    },
    {
      title: 'Arrangements Pending',
      value: stats.arrangements_pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      sub: 'Needs hotel/vehicle action'
    },
    {
      title: 'Hotel Confirmed',
      value: stats.hotel_confirmed,
      icon: Building,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      sub: 'Room vouchers generated'
    },
    {
      title: 'Transport Allocated',
      value: stats.transport_confirmed,
      icon: Car,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-200',
      sub: 'Driver & vehicle assigned'
    },
    {
      title: 'Travel Dossiers Ready',
      value: stats.documents_ready,
      icon: FileText,
      color: 'text-teal-600',
      bg: 'bg-teal-50 border-teal-200',
      sub: 'Ready for traveler departure'
    },
    {
      title: 'Active Trips In Progress',
      value: stats.trips_in_progress,
      icon: Compass,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
      sub: 'Travelers on tour right now'
    }
  ];

  return (
    <DashboardLayout
      title="Operations & Logistics Overview"
      subtitle="Execution tracking, hotel reservations, transport logistics, and traveler document management"
      actions={
        <Link to="/operations/bookings">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5">
            <span>Manage All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Operations KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${card.bg} shadow-xs flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#082C43]/70">
                    {card.title}
                  </span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-[#082C43] font-display">
                    {card.value}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {card.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Workflow Pipeline */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFE7DA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#082C43]">
                Standard Travel Operations Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end trip execution lifecycle from sales handover to successful trip completion
              </p>
            </div>
            <Link
              to="/operations/bookings"
              className="text-xs font-bold text-[#17648A] hover:underline flex items-center gap-1"
            >
              <span>View Booking Execution Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            {[
              { step: '1', title: 'Booking Received', desc: 'Handover from Sales' },
              { step: '2', title: 'Arrangements Pending', desc: 'Vendor inquiries' },
              { step: '3', title: 'Hotel Confirmed', desc: 'Voucher generated' },
              { step: '4', title: 'Transport Confirmed', desc: 'Driver & vehicle' },
              { step: '5', title: 'Documents Ready', desc: 'Dossier packaged' },
              { step: '6', title: 'Ready to Travel', desc: 'Pre-trip briefing' },
              { step: '7', title: 'Trip In Progress', desc: '24/7 on-tour care' },
              { step: '8', title: 'Trip Completed', desc: 'Feedback & closure' }
            ].map((st, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F8F1E7]/60 border border-[#EFE7DA] flex flex-col items-center justify-center"
              >
                <div className="w-6 h-6 rounded-full bg-[#082C43] text-white font-bold flex items-center justify-center text-[10px] mb-1.5 shadow-xs">
                  {st.step}
                </div>
                <span className="font-bold text-[#082C43] text-[11px] leading-tight block mb-0.5">
                  {st.title}
                </span>
                <span className="text-[9px] text-slate-400 block">{st.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Requiring Attention */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFE7DA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#FF795C]" />
              <h3 className="text-sm sm:text-base font-bold text-[#082C43]">
                Upcoming Departures & Bookings Under Execution
              </h3>
            </div>
            <Link
              to="/operations/bookings"
              className="text-xs font-bold text-[#17648A] hover:underline"
            >
              See all bookings ({stats.total_confirmed_bookings})
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-[#FF795C] border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400">Loading bookings...</span>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No confirmed bookings currently in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE7DA] text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Booking #</th>
                    <th className="py-2.5 px-3">Traveler / Client</th>
                    <th className="py-2.5 px-3">Package / Destination</th>
                    <th className="py-2.5 px-3">Departure Date</th>
                    <th className="py-2.5 px-3">Operational Status</th>
                    <th className="py-2.5 px-3">Hotel Voucher</th>
                    <th className="py-2.5 px-3">Vehicle Details</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {recentBookings.map((b) => {
                    const ops = b.operations || {};
                    return (
                      <tr key={b.id} className="hover:bg-[#F8F1E7]/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#17648A]">
                          {b.booking_number}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#082C43] block">
                            {b.customer_name || 'Valued Traveler'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.travelers_count} Travelers
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 max-w-[200px] truncate">
                          {b.package_title}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#082C43]">
                          {b.travel_start_date ? new Date(b.travel_start_date).toLocaleDateString() : 'Pending'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#17648A]/10 text-[#17648A]">
                            {ops.trip_status || 'Booking Received'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {ops.hotel_confirmation_number ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓ {ops.hotel_confirmation_number}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {ops.driver_name ? (
                            <span className="text-sky-700 font-semibold truncate block max-w-[120px]">
                              {ops.driver_name} ({ops.vehicle_type?.split(' ')[0] || 'Cab'})
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to="/operations/bookings"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF795C] hover:underline"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
