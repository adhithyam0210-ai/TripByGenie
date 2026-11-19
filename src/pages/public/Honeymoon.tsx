import React, { useState, useEffect } from 'react';
import { Heart, Star, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Package } from '../../types';
import { PackageCard } from '../../components/travel/PackageCard';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';
import { fallbackData } from '../../data/fallbackData';

export const Honeymoon: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(
    ((fallbackData.packages || []).filter((p: any) => p.category === 'Honeymoon Packages')) as any
  );
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  useEffect(() => {
    loadHoneymoonPackages();
  }, []);

  const loadHoneymoonPackages = async () => {
    try {
      const data = await api.getPackages({ category: 'Honeymoon Packages' });
      setPackages(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Honeymoon Hero */}
      <section className="relative py-20 bg-gradient-to-r from-[#041D30] to-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Celebrate Pure Romance
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            From secluded overwater bungalows in the Maldives and romantic Ubud pool villas to candlelight dinners beneath Parisian lights.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSelectedPkg(null);
                setIsTripModalOpen(true);
              }}
            >
              Plan A Customized Honeymoon
            </Button>
          </div>
        </div>
      </section>

      {/* Romantic Inclusions Perks Banner */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 -mt-6 relative z-10">
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <Heart className="w-5 h-5 text-[#FF795C] mx-auto" />
            <h4 className="text-xs font-bold text-[#082C43]">Candlelight Beach Dinner</h4>
            <p className="text-[11px] text-slate-500">Private starlit setups</p>
          </div>
          <div className="space-y-1">
            <Heart className="w-5 h-5 text-rose-500 mx-auto" />
            <h4 className="text-xs font-bold text-[#082C43]">Couple Spa Sessions</h4>
            <p className="text-[11px] text-slate-500">Aromatherapy rituals</p>
          </div>
          <div className="space-y-1">
            <Star className="w-5 h-5 text-amber-500 mx-auto" />
            <h4 className="text-xs font-bold text-[#082C43]">Honeymoon Suite Upgrades</h4>
            <p className="text-[11px] text-slate-500">Subject to availability</p>
          </div>
          <div className="space-y-1">
            <CheckCircle className="w-5 h-5 text-[#55C9BD] mx-auto" />
            <h4 className="text-xs font-bold text-[#082C43]">Complimentary Wine & Cake</h4>
            <p className="text-[11px] text-slate-500">Warm resort welcome</p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-16">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EFE7DA]">
          <div>
            <h2 className="text-2xl font-bold text-[#082C43] font-display">
              Featured Romantic Packages
            </h2>
            <p className="text-xs text-[#173247]/70 mt-0.5">
              Specially designed for couples with all romantic perks included
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageData={pkg}
              onEnquire={(p) => {
                setSelectedPkg(p);
                setIsTripModalOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom Trip Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        initialDestination={selectedPkg ? selectedPkg.title : 'Romantic Honeymoon Tour'}
        initialPackageId={selectedPkg ? selectedPkg.id : ''}
      />
    </div>
  );
};
