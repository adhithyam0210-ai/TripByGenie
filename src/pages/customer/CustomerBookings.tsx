import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, CheckCircle, Clock, FileDown, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { Booking } from '../../types';

export const CustomerBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getCustomerBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVoucher = (bookingNumber: string) => {
    alert(`Downloading Official Travel Voucher & Hotel Confirmation for #${bookingNumber}...`);
  };

  return (
    <DashboardLayout
      title="My Confirmed Bookings & Trips"
      subtitle="View all confirmed departures, travel dates, passenger rosters, and official itinerary vouchers."
    >
      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EFE7DA] p-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#082C43]">No Bookings Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Once an enquiry is confirmed, your vouchers and booking records will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-[#EFE7DA] shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#EFE7DA] bg-[#F8F1E7]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#17648A]">
                        Booking #{b.booking_number}
                      </span>
                      <StatusBadge status={b.booking_status} />
                      <StatusBadge status={b.payment_status} />
                    </div>
                    <h3 className="text-lg font-bold text-[#082C43] font-display mt-1">
                      {b.package_title}
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadVoucher(b.booking_number)}
                    leftIcon={<FileDown className="w-4 h-4 text-[#FF795C]" />}
                  >
                    Download Travel Voucher
                  </Button>
                </div>

                {/* Details */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-[#173247]/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Departure Date</span>
                    <strong className="text-sm text-[#082C43] block mt-0.5">{b.travel_start_date}</strong>
                    <span className="text-[11px] text-slate-500">Return: {b.travel_end_date || 'Included in days'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Travelers</span>
                    <strong className="text-sm text-[#082C43] block mt-0.5">{b.travelers_count} Guests</strong>
                    <span className="text-[11px] text-[#55C9BD] font-semibold">AC Private Vehicle</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Package Value</span>
                    <strong className="text-sm text-[#082C43] block mt-0.5">₹{b.total_amount?.toLocaleString('en-IN')}</strong>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Paid: ₹{b.advance_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Balance</span>
                    <strong className="text-sm text-[#FF795C] block mt-0.5">
                      ₹{b.balance_amount?.toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {b.balance_amount === 0 ? 'Fully Settled' : 'Due at check-in'}
                    </span>
                  </div>
                </div>

                {/* Travellers Roster if any */}
                {b.travellers && b.travellers.length > 0 && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#EFE7DA]/50">
                    <span className="text-xs font-bold text-[#082C43] block mb-2">
                      Passenger Information:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {b.travellers.map((t: any) => (
                        <div key={t.id} className="p-2.5 rounded-xl bg-[#F8F1E7]/50 border border-[#EFE7DA]">
                          <span className="font-bold text-[#082C43] block">{t.full_name}</span>
                          <span className="text-[11px] text-slate-500">
                            {t.gender}, {t.age} yrs • ID: {t.passport_or_id || 'On File'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
