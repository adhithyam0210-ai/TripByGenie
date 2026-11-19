import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, TrendingUp, CreditCard, CalendarCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAgentDashboard();
  }, []);

  const loadAgentDashboard = async () => {
    try {
      const data = await api.getAgentDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="B2B Wholesale Portal" subtitle="Loading agency partner dashboard...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    wholesale_discount_pct: 12,
    total_purchases: 0,
    total_purchase_amount: 0,
    total_client_sales: 0,
    projected_gross_margin: 0,
    credit_limit: 500000,
    confirmed_bookings: 0
  };

  return (
    <DashboardLayout
      title={`B2B Travel Partner • ${dashboardData?.profile?.company_name || user?.name}`}
      subtitle={`Agent ID: ${dashboardData?.profile?.agent_id || 'AGT-9042'} • Tier: Wholesale Preferred Partner (${stats.wholesale_discount_pct}% Net Margin)`}
      actions={
        <Link to="/agent/marketplace">
          <Button variant="primary" size="sm" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Open Package Marketplace
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Wholesale Margin Tier"
            value={`${stats.wholesale_discount_pct}%`}
            subtitle="Discount off public selling price"
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="turquoise"
          />
          <StatCard
            title="Total Purchase Spend"
            value={`₹${stats.total_purchase_amount.toLocaleString('en-IN')}`}
            subtitle={`${stats.total_purchases} wholesale packages ordered`}
            icon={<ShoppingBag className="w-5 h-5" />}
            accentColor="navy"
          />
          <StatCard
            title="Client Resale Volume"
            value={`₹${stats.total_client_sales.toLocaleString('en-IN')}`}
            subtitle="Gross customer billing"
            icon={<DollarSign className="w-5 h-5" />}
            accentColor="emerald"
          />
          <StatCard
            title="Projected Gross Margin"
            value={`₹${stats.projected_gross_margin.toLocaleString('en-IN')}`}
            subtitle="Resale markup earned"
            icon={<CreditCard className="w-5 h-5" />}
            accentColor="coral"
          />
        </div>

        {/* Recent Purchases & Bookings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Wholesale Purchase Orders */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  Recent Wholesale Purchase Orders
                </h3>
                <Link to="/agent/purchases" className="text-xs text-[#FF795C] font-semibold hover:underline">
                  View Orders
                </Link>
              </div>

              <div className="py-4 space-y-3">
                {dashboardData?.recentPurchases?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No wholesale orders placed yet.</span>
                  </div>
                ) : (
                  dashboardData?.recentPurchases?.map((pur: any) => (
                    <div
                      key={pur.id}
                      className="p-3.5 rounded-xl border border-[#EFE7DA] bg-[#F8F1E7]/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-[#082C43]">{pur.package_title}</strong>
                          <StatusBadge status={pur.status} />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Client: {pur.client_name} • {pur.travelers_count} Pax
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#082C43] block">
                          Cost: ₹{pur.total_cost?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Margin: +₹{pur.projected_margin?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Link to="/agent/marketplace">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Wholesale Marketplace
                </Button>
              </Link>
            </div>
          </div>

          {/* Partner Ledger Snapshot */}
          <div className="bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  Credit & Account Status
                </h3>
                <Link to="/agent/transactions" className="text-xs text-[#17648A] font-semibold hover:underline">
                  Full Ledger
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[#082C43] text-white my-4 space-y-3">
                <div className="flex justify-between items-center text-xs text-white/70">
                  <span>Approved Wholesale Credit Facility:</span>
                  <span className="font-bold text-[#55C9BD]">₹{stats.credit_limit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/70">
                  <span>Settlement Cycle:</span>
                  <span className="font-bold text-white">Net 15 Days</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/70">
                  <span>Wholesale Verification:</span>
                  <span className="font-bold text-emerald-400">Verified Active Agent</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE7DA]">
              <Link to="/agent/transactions">
                <Button variant="turquoise" size="sm" className="w-full">
                  View Transaction Ledger
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
