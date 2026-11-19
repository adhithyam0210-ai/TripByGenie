import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, DollarSign, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Payment, Booking } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminPayments: React.FC = () => {
  const { success, error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    booking_id: '',
    amount: 50000,
    payment_type: 'Advance',
    payment_method: 'Bank Transfer',
    transaction_reference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pays, bks] = await Promise.all([api.getAdminPayments(), api.getAdminBookings()]);
      setPayments(pays);
      setBookings(bks);
      if (bks.length > 0 && !formData.booking_id) {
        setFormData((prev) => ({ ...prev, booking_id: bks[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.booking_id || !formData.amount) {
      error('Please select a booking and enter the amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAdminPayment({
        ...formData,
        transaction_reference: formData.transaction_reference || `TXN-${Date.now()}`
      });

      success('Payment recorded successfully! Booking balance updated.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <DashboardLayout
      title="Financial Transactions & Payment Ledger"
      subtitle="Record offline customer & agent remittances, monitor bank transfers, and reconcile receivables."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setFormData({
              booking_id: bookings[0]?.id || '',
              amount: 50000,
              payment_type: 'Advance',
              payment_method: 'Bank Transfer',
              transaction_reference: `TXN-${Date.now()}`,
              notes: ''
            });
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Manual Payment
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Processed Remittances</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-display">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Payment Entries</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display">
              {payments.length} Transactions
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Reconciliation Mode</span>
            <span className="text-sm font-bold text-[#17648A] block mt-1">Multi-Channel GST Compliant</span>
            <span className="text-[11px] text-slate-500">Bank NEFT, UPI, Cash & Gateway</span>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Payments Register ({payments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {payments.map((p) => {
                  const b = bookings.find((item) => item.id === p.booking_id);
                  return (
                    <tr key={p.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#082C43]">
                        {p.transaction_reference}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#17648A]">
                        {b ? `#${b.booking_number}` : 'General'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.payment_type}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {p.payment_method}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                        {p.notes || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Received Remittance"
          subtitle="Updates client booking advance and adjusts outstanding balance."
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Target Booking *</label>
              <select
                required
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.booking_number} • {b.customer_name} (Balance: ₹{b.balance_amount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Received Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Method *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Payment Type</label>
                <select
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                >
                  <option value="Advance">Advance (Deposit)</option>
                  <option value="Balance">Balance Payment</option>
                  <option value="Full">Full Payment</option>
                  <option value="Refund">Refund</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Bank Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / UPI Ref ID"
                  value={formData.transaction_reference}
                  onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Payment Remarks</label>
              <textarea
                rows={2}
                placeholder="Remarks, bank name, branches..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
