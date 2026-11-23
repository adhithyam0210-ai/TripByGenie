import React, { useState, useEffect } from 'react';
import { CalendarCheck, DollarSign, Users, Edit2, CheckCircle2, AlertCircle, FileDown, UserPlus, Send, Mail, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Customer Account Invitation Modal
  const [invitationModalData, setInvitationModalData] = useState<{
    isOpen: boolean;
    customerId: string;
    customerName: string;
    email: string;
    bookingNumber: string;
    activationLink: string;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    success('Activation link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

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

  const handleCreateCustomerLogin = async (b: any) => {
    try {
      setIsProcessingAction(true);
      const res = await api.createCustomerAccount({ booking_id: b.id });
      success(res.message || `Customer login created! Generated Customer ID: ${res.customer_id}`);
      loadBookings();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id || b.customer_code || 'CUS-2026-0001',
          customerName: b.customer_name,
          email: b.customer_email,
          bookingNumber: b.booking_number,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create customer login.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleResendInvitation = async (b: any) => {
    try {
      setIsProcessingAction(true);
      const res = await api.resendCustomerInvitation({ booking_id: b.id, email: b.customer_email });
      success(res.message || `Activation invitation resent to ${b.customer_email}.`);
      loadBookings();
      if (res.activation_link) {
        setInvitationModalData({
          isOpen: true,
          customerId: res.customer_id || b.customer_code || 'CUS-2026-0001',
          customerName: b.customer_name,
          email: b.customer_email,
          bookingNumber: b.booking_number,
          activationLink: res.activation_link
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to resend invitation.');
    } finally {
      setIsProcessingAction(false);
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
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Section 7: CREATE CUSTOMER LOGIN Action */}
                        {!b.agent_id && (
                          <>
                            {(!b.customer_account_status || b.customer_account_status === 'NOT_CREATED') ? (
                              <button
                                onClick={() => handleCreateCustomerLogin(b)}
                                disabled={isProcessingAction || !(b.booking_status === 'Confirmed' || b.booking_status === 'BOOKING_CONFIRMED') || !(Number(b.advance_amount) > 0 || b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID' || b.payment_status === 'Partial' || b.payment_status === 'Paid')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#082C43] hover:bg-[#17648A] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                title={
                                  !(b.booking_status === 'Confirmed' || b.booking_status === 'BOOKING_CONFIRMED') || !(Number(b.advance_amount) > 0 || b.payment_status === 'PARTIALLY_PAID' || b.payment_status === 'PAID' || b.payment_status === 'Partial' || b.payment_status === 'Paid')
                                    ? 'Requires confirmed booking and verified advance payment'
                                    : 'Create secure customer account and email activation invitation'
                                }
                              >
                                <UserPlus className="w-3 h-3 text-[#55C9BD]" />
                                <span>Create Login</span>
                              </button>
                            ) : b.customer_account_status === 'INVITATION_SENT' ? (
                              <button
                                onClick={() => handleResendInvitation(b)}
                                disabled={isProcessingAction}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer whitespace-nowrap"
                                title="Resend single-use activation invitation"
                              >
                                <Send className="w-3 h-3 text-amber-700" />
                                <span>Resend Invite</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active Portal</span>
                              </span>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Update Booking & Payment Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Customer Account Invitation Ready Modal */}
      {invitationModalData?.isOpen && (
        <Modal
          isOpen={invitationModalData.isOpen}
          onClose={() => setInvitationModalData(null)}
          title="Customer Account Invitation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-emerald-950 text-sm">Customer Login Account Ready!</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Customer account for <strong>{invitationModalData.customerName}</strong> has been linked to Booking <strong>#{invitationModalData.bookingNumber}</strong> with Customer ID <strong>{invitationModalData.customerId}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Customer ID:</span>
                <span className="font-mono font-bold text-[#082C43] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {invitationModalData.customerId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Customer Email:</span>
                <span className="font-bold text-[#082C43]">{invitationModalData.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span className="font-medium">Booking Reference:</span>
                <span className="font-mono text-slate-700">{invitationModalData.bookingNumber}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Single-Use Activation Link (Valid for 48 Hours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitationModalData.activationLink}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(invitationModalData.activationLink)}
                  className="px-3.5 py-2.5 bg-[#FF795C] hover:bg-[#e0654a] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Direct Activation & SMTP Delivery:</strong>
              <p className="mt-1">
                If SMTP is configured in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env</code>, an onboarding email has been sent to <strong>{invitationModalData.email}</strong>. You can also directly copy and send this activation link to the customer.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DA]">
              <a
                href={invitationModalData.activationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#17648A] hover:underline font-bold text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Activation Page in New Tab
              </a>
              <Button type="button" variant="primary" size="sm" onClick={() => setInvitationModalData(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
