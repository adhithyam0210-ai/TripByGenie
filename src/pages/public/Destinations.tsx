import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { Destination } from '../../types';
import { DestinationCard } from '../../components/travel/DestinationCard';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { fallbackData } from '../../data/fallbackData';

export const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>((fallbackData.destinations || []) as any);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const data = await api.getDestinations();
      setDestinations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const regions = [
    { id: 'all', label: 'All Destinations' },
    { id: 'India', label: 'Incredible India' },
    { id: 'Australia & Pacific', label: 'Australia & Pacific' },
    { id: 'Asia', label: 'Asia' },
    { id: 'Europe', label: 'Europe' },
    { id: 'Island Destinations', label: 'Island Paradises' },
    { id: 'Middle East', label: 'Middle East' },
    { id: 'America', label: 'Americas' },
    { id: 'Africa', label: 'Africa' }
  ];

  const filtered = destinations.filter((d) => {
    const matchesRegion =
      selectedRegion === 'all' ? true : d.region.toLowerCase() === selectedRegion.toLowerCase();
    const matchesSearch =
      search.trim() === ''
        ? true
        : d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.country.toLowerCase().includes(search.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Top Banner Header */}
      <section className="relative py-16 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Explore Handcrafted Destinations
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mt-3">
            Discover mesmerizing sights, cultural treasures, and luxury retreats across India and the most sought-after global travel capitals.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mt-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by destination or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-[#082C43] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF795C] shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter Tabs & Grid */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-10">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {regions.map((reg) => (
            <button
              key={reg.id}
              onClick={() => setSelectedRegion(reg.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRegion === reg.id
                  ? 'bg-[#082C43] text-white shadow-md'
                  : 'bg-[#F8F1E7] text-[#173247] hover:bg-[#EFE7DA]'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>

        {/* Destination Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#F8F1E7]/40 rounded-2xl border border-[#EFE7DA]">
            <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#082C43]">No destinations found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your keyword or region filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
