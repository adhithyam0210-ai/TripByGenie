import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Tag,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Percent
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Package, AgentCustomer, B2BPricingCalculation } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getTodayIST } from '../../utils/dateValidation';

export const AgentMarketplace: React.FC = () => {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [agentCustomers, setAgentCustomers] = useState<AgentCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Purchase Modal & Pricing Engine State
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pricingCalc, setPricingCalc] = useState<B2BPricingCalculation | null>(null);
  const [selectedCustomerMode, setSelectedCustomerMode] = useState<'existing' | 'new'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [purchaseForm, setPurchaseForm] = useState({
    travelers_count: 2,
    travel_date: '',
    client_name: '',
    client_selling_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMarketplace();
    loadCustomers();
  }, []);

  const loadMarketplace = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAgentMarketplace();
      setPackages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api.getAgentCustomers();
      setAgentCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Recalculate B2B wholesale pricing via engine when package or traveler count changes
  const updatePricingEngine = async (pkgId: string, pax: number) => {
    try {
      const calc = await api.calculateB2BPrice(pkgId, pax);
      setPricingCalc(calc);
      return calc;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleOpenPurchase = async (pkg: any) => {
    setSelectedPkg(pkg);
    const initialPax = 2;
    const calc = await updatePricingEngine(pkg.id, initialPax);

    setPurchaseForm({
      travelers_count: initialPax,
      travel_date: pkg.upcoming_date || '',
      client_name: '',
      client_selling_price: (calc?.suggested_retail_price || pkg.public_price) * initialPax
    });
    setSelectedCustomerMode(agentCustomers.length > 0 ? 'existing' : 'new');
    if (agentCustomers.length > 0) {
      setSelectedCustomerId(agentCustomers[0].id);
      setPurchaseForm((prev) => ({ ...prev, client_name: agentCustomers[0].name }));
    }
    setIsPurchaseModalOpen(true);
  };

  const handlePaxChange = async (pax: number) => {
    if (!selectedPkg) return;
    const calc = await updatePricingEngine(selectedPkg.id, pax);
    setPurchaseForm((prev) => ({
      ...prev,
      travelers_count: pax,
      client_selling_price: (calc?.suggested_retail_price || selectedPkg.public_price) * pax
    }));
  };

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = agentCustomers.find((c) => c.id === custId);
    if (found) {
      setPurchaseForm((prev) => ({ ...prev, client_name: found.name }));
    }
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    if (!purchaseForm.client_name.trim()) {
      error('Please specify the client / lead passenger name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchasePackageAsAgent({
        package_id: selectedPkg.id,
        travelers_count: purchaseForm.travelers_count,
        travel_date: purchaseForm.travel_date,
        client_name: purchaseForm.client_name.trim(),
        client_selling_price: Number(purchaseForm.client_selling_price)
      });

      success(`Wholesale purchase order confirmed for ${selectedPkg.title}! Resale booking has been registered.`);
      setIsPurchaseModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to place purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = packages.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <DashboardLayout
      title="B2B Wholesale Travel Marketplace"
      subtitle="Purchase holiday inventory at volume-tiered wholesale prices and resell to your clients at your chosen markup."
    >
      <div className="space-y-6">
        {/* Tier Advantage Banner */}
        <div className="bg-gradient-to-r from-[#082C43] via-[#17648A] to-[#082C43] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30">
                <Percent className="w-4 h-4" />
                <span>Automated Wholesale Pricing Engine Active</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Net Wholesale Rates with Instant Volume Discounts
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-xl mt-1">
                Your B2B account automatically unlocks extra volume margins: 5% off for 5-9 pax, 10% off for 10-19 pax, and 15% off for 20+ pax group bookings.
              </p>
            </div>

            {/* Wholesale Tiers Overview Pill */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs w-full lg:w-auto">
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/70 block uppercase font-bold">1-4 Pax</span>
                <span className="text-sm font-bold text-white">Standard Net</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/70 block uppercase font-bold">5-9 Pax</span>
                <span className="text-sm font-bold text-amber-300">5% Extra Off</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/70 block uppercase font-bold">10-19 Pax</span>
                <span className="text-sm font-bold text-[#55C9BD]">10% Extra Off</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/70 block uppercase font-bold">20+ Pax</span>
                <span className="text-sm font-bold text-[#FF795C]">15% Bulk Off</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search wholesale packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['all', 'Domestic Holiday Packages', 'International Holiday Packages', 'Honeymoon Packages', 'Family Holiday Packages', 'Group Tours'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#082C43] text-white shadow-xs'
                    : 'bg-[#F8F1E7] text-[#173247] hover:bg-[#EFE7DA]'
                }`}
              >
                {cat === 'all' ? 'All Wholesale' : cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl bg-white border border-[#EFE7DA] shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={pkg.cover_image}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#082C43]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {pkg.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#55C9BD] text-[#041D30] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {pkg.duration_days}D / {pkg.duration_nights}N
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-[#082C43] font-display line-clamp-1">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-[#173247]/70 mt-1 line-clamp-2">
                    {pkg.description}
                  </p>

                  {/* Wholesale Pricing Breakdown Card */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F8F1E7] border border-[#EFE7DA] text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Public Selling Rate:</span>
                      <span className="line-through">₹{pkg.public_price?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-[#082C43] font-extrabold text-sm pt-1 border-t border-black/5">
                      <span>Wholesale Base Rate:</span>
                      <span className="text-[#FF795C]">
                        ₹{(pkg.agent_wholesale_price || pkg.wholesale_price || Math.round(pkg.public_price * 0.85)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-800 font-bold text-xs pt-1 border-t border-black/5">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Potential Gross Margin:
                      </span>
                      <span>
                        +₹{(pkg.potential_margin || Math.round(pkg.public_price * 0.15)).toLocaleString('en-IN')} ({pkg.margin_pct || '15'}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-md shadow-[#FF795C]/25"
                  onClick={() => handleOpenPurchase(pkg)}
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                >
                  Purchase Wholesale Package
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wholesale Purchase Modal with Live Pricing Engine */}
      {isPurchaseModalOpen && selectedPkg && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Wholesale Order & Pricing Engine"
          subtitle={selectedPkg.title}
          size="lg"
        >
          <form onSubmit={handleConfirmPurchase} className="space-y-4 text-xs">
            {/* Live Pricing Breakdown Card */}
            {pricingCalc && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#082C43] to-[#17648A] text-white shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    {pricingCalc.tier_name}
                  </span>
                  {pricingCalc.tier_discount_pct > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#55C9BD] text-[#082C43]">
                      +{pricingCalc.tier_discount_pct}% Volume Bonus Applied!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-white/70 block uppercase">Net Wholesale / Pax</span>
                    <strong className="text-sm font-bold text-[#55C9BD]">
                      ₹{pricingCalc.final_wholesale_price_per_pax.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-white/70 block uppercase">Total B2B Cost</span>
                    <strong className="text-sm font-bold text-[#FF795C]">
                      ₹{pricingCalc.total_wholesale_cost.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-white/70 block uppercase">Retail Suggested</span>
                    <strong className="text-sm font-bold text-white">
                      ₹{pricingCalc.total_retail_price.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-white/70 block uppercase">Your Profit Margin</span>
                    <strong className="text-sm font-bold text-amber-300">
                      +₹{pricingCalc.projected_margin_total.toLocaleString('en-IN')} ({pricingCalc.margin_pct}%)
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Travelers & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Number of Travelers (Pax) *
                </label>
                <select
                  value={purchaseForm.travelers_count}
                  onChange={(e) => handlePaxChange(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 30].map((num) => (
                    <option key={num} value={num}>
                      {num} Traveler{num > 1 ? 's' : ''} {num >= 20 ? '(15% Off)' : num >= 10 ? '(10% Off)' : num >= 5 ? '(5% Off)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Travel Departure Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={purchaseForm.travel_date}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, travel_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            {/* Client Selection (Existing Client or New Entry) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#082C43] block">
                  Lead Passenger / Client Assignment *
                </label>
                {agentCustomers.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerMode('existing')}
                      className={`font-bold cursor-pointer ${
                        selectedCustomerMode === 'existing' ? 'text-[#FF795C] underline' : 'text-slate-400'
                      }`}
                    >
                      From Saved Clients
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerMode('new');
                        setPurchaseForm((prev) => ({ ...prev, client_name: '' }));
                      }}
                      className={`font-bold cursor-pointer ${
                        selectedCustomerMode === 'new' ? 'text-[#FF795C] underline' : 'text-slate-400'
                      }`}
                    >
                      New Client
                    </button>
                  </div>
                )}
              </div>

              {selectedCustomerMode === 'existing' && agentCustomers.length > 0 ? (
                <select
                  value={selectedCustomerId}
                  onChange={handleSelectCustomer}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {agentCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Sharma & Family"
                  value={purchaseForm.client_name}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, client_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">
                Your Client Resale Price (₹) - For Profit Tracking
              </label>
              <input
                type="number"
                required
                value={purchaseForm.client_selling_price}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, client_selling_price: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
              {pricingCalc && (
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  Calculated Net Gross Profit: +₹{Math.max(0, purchaseForm.client_selling_price - pricingCalc.total_wholesale_cost).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing Order...' : 'Confirm B2B Purchase'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
