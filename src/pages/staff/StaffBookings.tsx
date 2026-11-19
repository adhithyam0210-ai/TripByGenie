import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, DollarSign, Users, Award } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';

export const StaffBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Bookings in the system
      const data = await api.getAdminBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalConvertedVolume = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <DashboardLayout
      title="Converted Bookings Record"
      subtitle="Track tours converted from your inquiries and client departures."
    >
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">Total Booking Volume</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display block mt-0.5">
              ₹{totalConvertedVolume.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-400">Total Trips Closed</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-display block mt-0.5">
              {bookings.length} Bookings
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Booking Roster ({bookings.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Departure</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#082C43]">
                      {b.booking_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17648A]">
                      {b.customer_name}
                    </td>
                    <td className="py-3 px-4">
                      {b.package_title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.travel_start_date}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.travelers_count}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#082C43]">
                      ₹{b.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.booking_status} />
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
