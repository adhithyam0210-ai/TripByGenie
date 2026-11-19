import React, { useState, useEffect } from 'react';
import { CalendarCheck, DollarSign, Users, Edit2, CheckCircle2, AlertCircle, FileDown } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminBookings: React.FC = () => {
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Booking Status Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (b: Booking) => {
    setSelectedBooking(b);
    setBookingStatus(b.booking_status);
    setPaymentStatus(b.payment_status);
    setAdvanceAmount(b.advance_amount);
    setBalanceAmount(b.balance_amount);
    setIsEditModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      await api.updateAdminBooking(selectedBooking.id, {
        booking_status: bookingStatus,
        payment_status: paymentStatus,
        advance_amount: Number(advanceAmount),
        balance_amount: Number(balanceAmount)
      });

      success(`Booking #${selectedBooking.booking_number} updated.`);
      setIsEditModalOpen(false);
      loadBookings();
    } catch (err: any) {
      error(err.message || 'Failed to update booking.');
    }
  };

  return (
    <DashboardLayout
      title="Booking & Departure Operations"
      subtitle="Manage traveler reservations, agent wholesale bookings, payment collections, and trip statuses."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Master Booking Register ({bookings.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Customer / Partner</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Departure Date</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Advance Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Trip Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#082C43]">
                      {b.booking_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-[#082C43] block">{b.customer_name}</strong>
                      <span className="text-[11px] text-slate-500">
                        {b.agent_id ? 'B2B Wholesale Agent' : 'Direct Customer'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#17648A]">
                      {b.package_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.travel_start_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-bold">
                      {b.travelers_count}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                      ₹{b.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{b.advance_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#FF795C]">
                      ₹{b.balance_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Update Booking & Payment Status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Booking Status Modal */}
      {isEditModalOpen && selectedBooking && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Update Booking #${selectedBooking.booking_number}`}
          subtitle={`Client: ${selectedBooking.customer_name} • Total: ₹${selectedBooking.total_amount?.toLocaleString('en-IN')}`}
        >
          <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Trip Status</label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress (Traveling)</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid (Full Settlement)</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Advance Collected (₹)</label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => {
                    const adv = Number(e.target.value);
                    setAdvanceAmount(adv);
                    setBalanceAmount(Math.max(0, (selectedBooking.total_amount || 0) - adv));
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Balance Due (₹)</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Save Booking Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
