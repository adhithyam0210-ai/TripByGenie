import React, { useState, useEffect } from 'react';
import { CalendarCheck, DollarSign, Users, FileDown } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { Booking } from '../../types';

export const AgentBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Load agent bookings
      const data = await api.getCustomerBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Client Resale Bookings"
      subtitle="View customer travel confirmations originating from your B2B wholesale purchases."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Confirmed Resale Itineraries ({bookings.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Travel Date</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Client Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No client bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#082C43]">
                        {b.booking_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#17648A]">
                        {b.package_title}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {b.customer_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
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
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#FF795C]"
                          onClick={() => alert(`Downloading voucher for ${b.booking_number}...`)}
                        >
                          Voucher
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
