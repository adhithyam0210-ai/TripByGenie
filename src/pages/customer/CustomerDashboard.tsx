import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calendar, FileText, CreditCard, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getCustomerDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Travel Hub" subtitle="Loading your travel dashboard...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    total_enquiries: 0,
    upcoming_trips: 0,
    completed_trips: 0,
    total_spent: 0,
    pending_payment: 0
  };

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'Traveler'}!`}
      subtitle="Track your custom holiday enquiries, confirmed bookings, and travel itinerary vouchers."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsTripModalOpen(true)}
          leftIcon={<Compass className="w-4 h-4" />}
        >
          Plan New Vacation
        </Button>
      }
    >
      <div className="space-y-8">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Enquiries"
            value={stats.total_enquiries}
            subtitle="Custom quotes & tour requests"
            icon={<FileText className="w-5 h-5" />}
            accentColor="navy"
          />
          <StatCard
            title="Upcoming Trips"
            value={stats.upcoming_trips}
            subtitle="Confirmed departures"
            icon={<Calendar className="w-5 h-5" />}
            accentColor="turquoise"
          />
          <StatCard
            title="Total Invested"
            value={`₹${stats.total_spent.toLocaleString('en-IN')}`}
            subtitle="Lifetime vacation spend"
            icon={<CreditCard className="w-5 h-5" />}
            accentColor="emerald"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pending_payment.toLocaleString('en-IN')}`}
            subtitle={stats.pending_payment > 0 ? 'Balance due before departure' : 'All accounts settled'}
            icon={<AlertCircle className="w-5 h-5" />}
            accentColor={stats.pending_payment > 0 ? 'coral' : 'navy'}
          />
        </div>

        {/* Two Column Layout: Upcoming Bookings & Active Enquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Trips */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  My Booked Trips
                </h3>
                <Link to="/customer/bookings" className="text-xs text-[#FF795C] font-semibold hover:underline">
                  View All
                </Link>
              </div>

              <div className="py-4 space-y-3">
                {dashboardData?.upcomingBookings?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No upcoming trips confirmed yet.</span>
                  </div>
                ) : (
                  dashboardData?.upcomingBookings?.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#082C43]">{b.package_title}</span>
                          <StatusBadge status={b.booking_status} />
                        </div>
                        <div className="text-[11px] text-[#17648A] mt-1 flex items-center gap-3">
                          <span>Booking #{b.booking_number}</span>
                          <span>•</span>
                          <span>Departing: {b.travel_start_date}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#082C43] block">
                          ₹{b.total_amount?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {b.payment_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Link to="/packages">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Available Tours
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Travel Enquiries */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  My Custom Enquiries
                </h3>
                <Link to="/customer/enquiries" className="text-xs text-[#FF795C] font-semibold hover:underline">
                  View Pipeline
                </Link>
              </div>

              <div className="py-4 space-y-3">
                {dashboardData?.enquiries?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No active enquiries found.</span>
                  </div>
                ) : (
                  dashboardData?.enquiries?.map((enq: any) => (
                    <div
                      key={enq.id}
                      className="p-4 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#082C43]">
                            {enq.interested_destination}
                          </span>
                          <StatusBadge status={enq.status} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span>{enq.travelers_count} Travelers</span>
                          <span className="mx-1.5">•</span>
                          <span>Budget: {enq.budget}</span>
                        </div>
                      </div>

                      <Link to="/customer/enquiries">
                        <Button variant="ghost" size="sm" className="text-xs text-[#FF795C]">
                          Details
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Button
                variant="turquoise"
                size="sm"
                className="w-full"
                onClick={() => setIsTripModalOpen(true)}
              >
                Submit New Trip Request
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          loadDashboard();
        }}
      />
    </DashboardLayout>
  );
};
