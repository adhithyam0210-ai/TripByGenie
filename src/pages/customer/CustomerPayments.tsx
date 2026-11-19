import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle, FileText, ArrowDownRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { Payment } from '../../types';

export const CustomerPayments: React.FC = () => {
  const [paymentsData, setPaymentsData] = useState<{ payments: Payment[]; bookings: any[] }>({
    payments: [],
    bookings: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await api.getCustomerPayments();
      setPaymentsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPaid = paymentsData.payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalBalanceDue = paymentsData.bookings.reduce(
    (sum, b) => sum + (b.balance_amount || 0),
    0
  );

  return (
    <DashboardLayout
      title="Payment Receipts & Ledger"
      subtitle="View all processed transaction receipts, invoices, and remaining trip balances."
    >
      <div className="space-y-6">
        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Settled</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-display">
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Verified receipts</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Pending Balance</span>
            <span className={`text-2xl font-extrabold font-display ${totalBalanceDue > 0 ? 'text-[#FF795C]' : 'text-[#082C43]'}`}>
              ₹{totalBalanceDue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              {totalBalanceDue === 0 ? 'All trips fully paid' : 'Due prior to departure'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Payment Security</span>
            <span className="text-sm font-bold text-[#082C43] block mt-1">100% Verified Bank & UPI</span>
            <span className="text-[11px] text-[#55C9BD] font-semibold block mt-0.5">Instant GST Invoices</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#082C43] font-display">
              Transaction History
            </h3>
            <span className="text-xs text-slate-400">
              {paymentsData.payments.length} record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {paymentsData.payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  paymentsData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#082C43]">
                        {p.transaction_reference}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#17648A]">
                        {p.payment_type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading official GST payment receipt for ${p.transaction_reference}...`)}
                          className="text-[#FF795C] font-bold hover:underline cursor-pointer"
                        >
                          Download
                        </button>
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
