import React, { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, Users, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { AgentPurchase } from '../../types';

export const AgentPurchases: React.FC = () => {
  const [purchases, setPurchases] = useState<AgentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const data = await api.getAgentPurchases();
      setPurchases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalMargin = purchases.reduce((sum, p) => sum + (p.projected_margin || 0), 0);

  return (
    <DashboardLayout
      title="Wholesale Purchase Orders"
      subtitle="Track your wholesale package orders, traveler rosters, and realized gross margins."
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Wholesale Orders</span>
            <span className="text-2xl font-extrabold text-[#082C43] font-display">
              {purchases.length} Packages
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Wholesale Net Cost</span>
            <span className="text-2xl font-extrabold text-[#FF795C] font-display">
              ₹{totalCost.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Gross Resale Margin</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-display">
              ₹{totalMargin.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Purchase History & Order Confirmations
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Travel Date</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Wholesale Net</th>
                  <th className="py-3 px-4">Client Price</th>
                  <th className="py-3 px-4">Gross Margin</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No wholesale purchases recorded.
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#082C43]">
                        #{pur.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#17648A]">
                        {pur.package_title}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {pur.client_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {pur.travel_date}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {pur.travelers_count}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FF795C]">
                        ₹{pur.total_cost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#082C43]">
                        ₹{pur.client_selling_price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-700">
                        +₹{pur.projected_margin.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={pur.status} />
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
