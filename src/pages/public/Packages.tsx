import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { api } from '../../services/api';
import { Package, Destination } from '../../types';
import { PackageCard } from '../../components/travel/PackageCard';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';

export const Packages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedDestination, setSelectedDestination] = useState(searchParams.get('destination') || 'all');
  const [duration, setDuration] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [sortBy, setSortBy] = useState('featured');

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedPackageForEnquiry, setSelectedPackageForEnquiry] = useState<Package | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pkgs, dests] = await Promise.all([api.getPackages(), api.getDestinations()]);
      setPackages(pkgs);
      setDestinations(dests);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'all',
    'Domestic Holiday Packages',
    'International Holiday Packages',
    'Honeymoon Packages',
    'Family Holiday Packages',
    'Group Tours',
    'Weekend Getaways'
  ];

  // Client filtering
  let filtered = packages.filter((pkg) => {
    // Category
    if (selectedCategory !== 'all' && pkg.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    // Destination
    if (selectedDestination !== 'all' && pkg.destination_id !== selectedDestination) {
      return false;
    }
    // Max price
    if (pkg.public_price > maxPrice) {
      return false;
    }
    // Duration
    if (duration === 'short' && pkg.duration_days > 4) return false;
    if (duration === 'medium' && (pkg.duration_days < 5 || pkg.duration_days > 7)) return false;
    if (duration === 'long' && pkg.duration_days <= 7) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = pkg.title.toLowerCase().includes(q);
      const matchDesc = pkg.description.toLowerCase().includes(q);
      const matchCat = pkg.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'price_asc') return a.public_price - b.public_price;
    if (sortBy === 'price_desc') return b.public_price - a.public_price;
    if (sortBy === 'duration') return a.duration_days - b.duration_days;
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const handleEnquire = (pkg: Package) => {
    setSelectedPackageForEnquiry(pkg);
    setIsTripModalOpen(true);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Header */}
      <section className="relative py-14 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#55C9BD] block mb-1">
            Curated Itineraries
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Holiday Packages & Tours
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mt-2">
            Explore bespoke itineraries curated with 4-star handpicked hotels, private airport transfers, and guided sightseeing.
          </p>
        </div>
      </section>

      {/* Main Filter Bar & Content */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-8">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DA] shadow-xs mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Keyword Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by package name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] focus:outline-none focus:border-[#FF795C]"
            />
          </div>

          {/* Destination Dropdown */}
          <div className="w-full lg:w-48">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] text-[#082C43] focus:outline-none focus:border-[#FF795C]"
            >
              <option value="all">All Destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.country})
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="w-full lg:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] text-[#082C43] focus:outline-none focus:border-[#FF795C]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Dropdown */}
          <div className="w-full lg:w-40">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] text-[#082C43] focus:outline-none focus:border-[#FF795C]"
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (&lt;= 4 Days)</option>
              <option value="medium">Medium (5 - 7 Days)</option>
              <option value="long">Long (7+ Days)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full lg:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#F8F1E7]/50 border border-[#EFE7DA] text-[#082C43] focus:outline-none focus:border-[#FF795C]"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration">Duration Days</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Active Pills */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#173247]/70">
          <div>
            Showing <strong className="text-[#082C43]">{filtered.length}</strong> available holiday packages
          </div>

          {(selectedCategory !== 'all' || selectedDestination !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDestination('all');
                setSearchTerm('');
              }}
              className="text-[#FF795C] font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Packages Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#F8F1E7]/40 rounded-3xl border border-[#EFE7DA]">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-base font-bold text-[#082C43]">No Packages Match Your Filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Our travel specialists can design a custom itinerary for any destination.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-4"
              onClick={() => {
                setSelectedPackageForEnquiry(null);
                setIsTripModalOpen(true);
              }}
            >
              Request Custom Quote
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageData={pkg}
                onEnquire={handleEnquire}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setSelectedPackageForEnquiry(null);
        }}
        initialDestination={selectedPackageForEnquiry?.title || ''}
        initialPackageId={selectedPackageForEnquiry?.id || ''}
      />
    </div>
  );
};
