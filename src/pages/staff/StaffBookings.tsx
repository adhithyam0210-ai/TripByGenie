import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  Award,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StaffBookings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Staff Payment Update Modal
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Partial');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminBookings();
      setBookings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaymentUpdate = (b: any) => {
    const tot = Number(b.total_amount || 0);
    const adv = Number(b.advance_amount || 0);
    const bal = b.balance_amount !== undefined ? Number(b.balance_amount) : Math.max(0, tot - adv);

    setSelectedBookingForPayment(b);
    setAdvanceAmount(adv);
    setBalanceAmount(bal);
    setPaymentStatus(b.payment_status || (bal === 0 && adv > 0 ? 'Paid' : 'Partial'));
    setPaymentMethod(b.payment_method || 'UPI');
    setTransactionRef(b.transaction_reference || '');
    setPaymentProof(b.payment_proof || '');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    try {
      setIsSubmitting(true);
      const bookingId = selectedBookingForPayment.id || selectedBookingForPayment.booking_number;
      await api.updateStaffBookingPayment(bookingId, {
        advance_amount: Number(advanceAmount),
        balance_amount: Number(balanceAmount),
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        payment_proof: paymentProof,
        notes: paymentNotes
      });

      success(`Payment updated for Booking #${selectedBookingForPayment.booking_number || bookingId}!`);
      setIsPaymentModalOpen(false);
      loadBookings();
    } catch (err: any) {
      error(err.message || 'Failed to update payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (b.booking_number && b.booking_number.toLowerCase().includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_email && b.customer_email.toLowerCase().includes(q)) ||
      (b.package_title && b.package_title.toLowerCase().includes(q))
    );
  });

  const totalConvertedVolume = filteredBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalCollectedAdvance = filteredBookings.reduce((sum, b) => sum + (Number(b.advance_amount) || 0), 0);

  return (
    <DashboardLayout
      title="Converted Customer Bookings & Payment Updates"
      subtitle="Exclusively manage payments, advance deposits, and settlement ledgers for your converted customer tours."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Booking Volume</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display block mt-1">
              ₹{totalConvertedVolume.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] uppercase font-bold text-emerald-600 block">Total Payments Collected</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-display block mt-1">
              ₹{totalCollectedAdvance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-[11px] uppercase font-bold text-[#17648A] block">Active Tour Bookings</span>
            <span className="text-2xl font-extrabold text-[#17648A] font-display block mt-1">
              {filteredBookings.length} Bookings
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, booking #, package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-semibold focus:outline-none"
            />
          </div>
          <span className="text-slate-500 font-semibold text-xs">
            Showing {filteredBookings.length} customer bookings
          </span>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Customer Bookings Ledger
            </h3>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Staff Payment Authority
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-3">Booking #</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Tour Package</th>
                  <th className="py-3 px-3">Travel Date</th>
                  <th className="py-3 px-3">Package Price</th>
                  <th className="py-3 px-3">Advance Paid</th>
                  <th className="py-3 px-3">Balance Due</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No converted bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#082C43] whitespace-nowrap">
                        {b.booking_number || b.id}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-[#082C43] block">{b.customer_name}</strong>
                        <span className="text-[11px] text-slate-500 block">{b.customer_email || b.customer_phone}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#17648A] max-w-[180px] truncate">
                        {b.package_title}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {b.travel_start_date || 'Flexible'}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#082C43] whitespace-nowrap">
                        ₹{(b.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 whitespace-nowrap">
                        ₹{(b.advance_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#FF795C] whitespace-nowrap">
                        ₹{(b.balance_amount !== undefined ? b.balance_amount : Math.max(0, (b.total_amount || 0) - (b.advance_amount || 0))).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={b.payment_status} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleOpenPaymentUpdate(b)}
                          leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                        >
                          Update Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Update Payment Modal */}
        {isPaymentModalOpen && selectedBookingForPayment && (
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title={`Update Customer Payment • #${selectedBookingForPayment.booking_number || selectedBookingForPayment.id}`}
            subtitle={`Customer: ${selectedBookingForPayment.customer_name} • Total Price: ₹${(selectedBookingForPayment.total_amount || 0).toLocaleString('en-IN')}`}
            maxWidth="md"
          >
            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8F1E7]/70 border border-[#EFE7DA] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Package Price</span>
                  <span className="font-extrabold text-[#082C43]">₹{(selectedBookingForPayment.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Advance</span>
                  <span className="font-extrabold text-emerald-700">₹{(selectedBookingForPayment.advance_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Balance</span>
                  <span className="font-extrabold text-[#FF795C]">₹{(selectedBookingForPayment.balance_amount !== undefined ? selectedBookingForPayment.balance_amount : Math.max(0, (selectedBookingForPayment.total_amount || 0) - (selectedBookingForPayment.advance_amount || 0))).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Advance Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={selectedBookingForPayment.total_amount || 9999999}
                    value={advanceAmount}
                    onChange={(e) => {
                      const adv = Number(e.target.value);
                      setAdvanceAmount(adv);
                      const tot = Number(selectedBookingForPayment.total_amount || 0);
                      const newBal = Math.max(0, tot - adv);
                      setBalanceAmount(newBal);
                      if (newBal === 0 && tot > 0) {
                        setPaymentStatus('Paid');
                      } else if (adv > 0) {
                        setPaymentStatus('Partial');
                      } else {
                        setPaymentStatus('Pending');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold text-emerald-700 text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Balance Due (₹)</label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => {
                      const bal = Number(e.target.value);
                      setBalanceAmount(bal);
                      if (bal === 0) setPaymentStatus('Paid');
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold text-[#FF795C] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Payment Status *</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs"
                  >
                    <option value="Partial">Partial (Advance Paid)</option>
                    <option value="Paid">Paid (Full Settlement)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-semibold text-xs"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Payment Gateway">Payment Gateway / Link</option>
                    <option value="Cash">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-2026-9812478912"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Proof (Screenshot / File Reference)</label>
                <input
                  type="text"
                  placeholder="e.g. proof_adv_80000.png or bank_receipt_9921.pdf"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Staff Payment Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received partial advance installment via GooglePay."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE7DA]">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Saving...' : 'Save Payment Updates'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
