import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Tag, TrendingUp, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Package } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AgentMarketplace: React.FC = () => {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Purchase Modal
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    travelers_count: 2,
    travel_date: '',
    client_name: '',
    client_selling_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMarketplace();
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

  const handleOpenPurchase = (pkg: any) => {
    setSelectedPkg(pkg);
    setPurchaseForm({
      travelers_count: 2,
      travel_date: pkg.upcoming_date || '',
      client_name: '',
      client_selling_price: pkg.public_price * 2
    });
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    if (!purchaseForm.client_name) {
      error('Please enter the client / lead passenger name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchasePackageAsAgent({
        package_id: selectedPkg.id,
        travelers_count: purchaseForm.travelers_count,
        travel_date: purchaseForm.travel_date,
        client_name: purchaseForm.client_name,
        client_selling_price: Number(purchaseForm.client_selling_price)
      });

      success(`Wholesale purchase order confirmed for ${selectedPkg.title}! Resale booking has been created.`);
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
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout
      title="B2B Wholesale Travel Marketplace"
      subtitle="Purchase holiday inventory at special wholesale consolidator prices and resell to your clients at your chosen markup."
    >
      <div className="space-y-6">
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
                      <span className="line-through">₹{pkg.public_price.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-[#082C43] font-extrabold text-sm pt-1 border-t border-black/5">
                      <span>Wholesale Purchase Rate:</span>
                      <span className="text-[#FF795C]">₹{pkg.agent_wholesale_price.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-800 font-bold text-xs pt-1 border-t border-black/5">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Potential Gross Margin:
                      </span>
                      <span>+₹{pkg.potential_margin.toLocaleString('en-IN')} ({pkg.margin_pct}%)</span>
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

      {/* Wholesale Purchase Modal */}
      {isPurchaseModalOpen && selectedPkg && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Confirm Wholesale Package Purchase"
          subtitle={selectedPkg.title}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmPurchase} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8F1E7] border border-[#EFE7DA] space-y-1.5">
              <div className="flex justify-between">
                <span>Wholesale Unit Cost (per person):</span>
                <strong className="text-[#082C43]">₹{selectedPkg.agent_wholesale_price.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Wholesale Cost ({purchaseForm.travelers_count} Pax):</span>
                <strong className="text-[#FF795C] text-sm">
                  ₹{(selectedPkg.agent_wholesale_price * purchaseForm.travelers_count).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Number of Travelers (Pax) *</label>
                <select
                  value={purchaseForm.travelers_count}
                  onChange={(e) => {
                    const pax = Number(e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      travelers_count: pax,
                      client_selling_price: selectedPkg.public_price * pax
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} Traveler{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#082C43] block mb-1">Travel Departure Date *</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.travel_date}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, travel_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Client / Lead Passenger Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mr. Rajesh Khanna & Family"
                value={purchaseForm.client_name}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, client_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
              />
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
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none"
              />
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                Calculated Gross Profit Margin: +₹{Math.max(0, purchaseForm.client_selling_price - (selectedPkg.agent_wholesale_price * purchaseForm.travelers_count)).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Wholesale Purchase
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
