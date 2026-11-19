import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, DollarSign } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { AgentTransaction } from '../../types';

export const AgentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.getAgentTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="B2B Wholesale Ledger & Account Statements"
      subtitle="Complete accounting ledger of package debits, NEFT settlements, and credit facilities."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Account Ledger Entries ({transactions.length})
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold">
              Current Account Status: In Good Standing
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Debit / Credit</th>
                  <th className="py-3 px-4">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            tx.type === 'Payment'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type === 'Payment' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#082C43] font-medium">
                        {tx.description}
                      </td>
                      <td className={`py-3 px-4 font-bold ${tx.type === 'Payment' ? 'text-emerald-700' : 'text-[#FF795C]'}`}>
                        {tx.type === 'Payment' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        ₹{tx.balance_after.toLocaleString('en-IN')}
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
