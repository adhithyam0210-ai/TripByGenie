import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Package, Destination } from '../../types';
import { PackageCard } from '../../components/travel/PackageCard';
import { DestinationOverviewCard } from '../../components/travel/DestinationOverviewCard';
import { DestinationAccordion } from '../../components/travel/DestinationAccordion';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';
import { fallbackData } from '../../data/fallbackData';

export const Packages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>((fallbackData.packages || []) as any);
  const [destinations, setDestinations] = useState<Destination[]>((fallbackData.destinations || []) as any);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedDestination, setSelectedDestination] = useState(searchParams.get('destination') || 'all');
  const [duration, setDuration] = useState('all');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState('featured');

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedPackageForEnquiry, setSelectedPackageForEnquiry] = useState<Package | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Sync state with URL parameters cleanly
  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearchTerm(s);

    const cat = searchParams.get('category') || 'all';
    setSelectedCategory(cat);

    const dest = searchParams.get('destination') || 'all';
    setSelectedDestination(dest);
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [pkgs, dests] = await Promise.all([api.getPackages(), api.getDestinations()]);
      if (Array.isArray(pkgs) && pkgs.length > 0) setPackages(pkgs);
      if (Array.isArray(dests) && dests.length > 0) setDestinations(dests);
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

  // Detect matching destination from either search term or destination dropdown
  const activeDestination = useMemo(() => {
    if (selectedDestination !== 'all') {
      return destinations.find((d) => d && (d.id === selectedDestination || d.slug === selectedDestination));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      // Look for exact slug or exact name
      const exactMatch = destinations.find((d) => {
        if (!d) return false;
        const dName = (d.name || '').toLowerCase();
        const dSlug = (d.slug || '').toLowerCase();
        return dName === q || dSlug === q;
      });
      if (exactMatch) return exactMatch;

      // Look for substring match
      return destinations.find((d) => {
        if (!d) return false;
        const dName = (d.name || '').toLowerCase();
        const dSlug = (d.slug || '').toLowerCase();
        const dCountry = (d.country || '').toLowerCase();
        return (
          (q.length >= 3 && dName.includes(q)) ||
          (dName.length >= 3 && q.includes(dName)) ||
          (q === 'usa' && (dName.includes('united states') || dSlug.includes('united-states'))) ||
          (q === 'dubai' && (dSlug.includes('dubai') || dSlug.includes('uae')))
        );
      });
    }
    return null;
  }, [destinations, selectedDestination, searchTerm]);

  // Client filtering
  let filtered = (packages || []).filter((pkg) => {
    if (!pkg) return false;
    const pkgCategory = pkg.category || 'Domestic Holiday Packages';
    const pkgTitle = pkg.title || '';
    const pkgDesc = pkg.description || '';
    const pkgPrice = Number(pkg.public_price || pkg.b2c_price || pkg.price || 0);
    const pkgDays = Number(pkg.duration_days || 4);

    // Category filter
    if (selectedCategory !== 'all' && pkgCategory.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // Destination dropdown filter
    if (selectedDestination !== 'all') {
      const matchesDest = pkg.destination_id === selectedDestination;
      const curDest = destinations.find((d) => d && d.id === selectedDestination);
      const matchesName = curDest && curDest.name && pkgTitle.toLowerCase().includes(curDest.name.toLowerCase());
      if (!matchesDest && !matchesName) {
        return false;
      }
    }

    // Max price filter
    if (pkgPrice > maxPrice) {
      return false;
    }

    // Duration filter
    if (duration === 'short' && pkgDays > 4) return false;
    if (duration === 'medium' && (pkgDays < 5 || pkgDays > 7)) return false;
    if (duration === 'long' && pkgDays <= 7) return false;

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const dest = destinations.find((d) => d && d.id === pkg.destination_id);
      const matchTitle = pkgTitle.toLowerCase().includes(q);
      const matchDesc = pkgDesc.toLowerCase().includes(q);
      const matchCat = pkgCategory.toLowerCase().includes(q);
      const matchDestName = dest && dest.name ? dest.name.toLowerCase().includes(q) : false;
      const matchDestCountry = dest && dest.country ? dest.country.toLowerCase().includes(q) : false;
      const matchDestRegion = dest && dest.region ? dest.region.toLowerCase().includes(q) : false;
      const matchHighlights = Array.isArray(pkg.highlights)
        ? pkg.highlights.some((h) => typeof h === 'string' && h.toLowerCase().includes(q))
        : false;

      // If activeDestination is detected, also match all packages linked to it
      const matchActiveDest = activeDestination && (
        pkg.destination_id === activeDestination.id ||
        (dest && dest.id === activeDestination.id) ||
        (activeDestination.name && pkgTitle.toLowerCase().includes(activeDestination.name.toLowerCase()))
      );

      if (!matchTitle && !matchDesc && !matchCat && !matchDestName && !matchDestCountry && !matchDestRegion && !matchHighlights && !matchActiveDest) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'price_asc') return (a.public_price || a.price || 0) - (b.public_price || b.price || 0);
    if (sortBy === 'price_desc') return (b.public_price || b.price || 0) - (a.public_price || a.price || 0);
    if (sortBy === 'duration') return (a.duration_days || 0) - (b.duration_days || 0);
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const handleEnquire = (pkg: Package) => {
    setSelectedPackageForEnquiry(pkg);
    setIsTripModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedDestination('all');
    setSearchTerm('');
    setDuration('all');
    setSearchParams({});
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
              placeholder="Search by package or destination..."
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

        {/* Detailed Destination Overview Card (Matching Image 1 from tripbygenie.in) */}
        {activeDestination && (
          <div className="mb-10 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <DestinationOverviewCard
              destination={activeDestination}
              onViewPackages={() => {
                document.getElementById('packages-results-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Travel Guide & Information Accordion (About, Best Budget, etc.) */}
            <DestinationAccordion destination={activeDestination} />
          </div>
        )}

        {/* Results Counter & Active Pills */}
        <div id="packages-results-section" className="flex items-center justify-between mb-6 text-xs text-[#173247]/70 scroll-mt-24">
          <div>
            Showing <strong className="text-[#082C43]">{filtered.length}</strong> available holiday packages
            {activeDestination && (
              <span className="ml-1 text-slate-500">
                for <span className="font-bold text-[#FF795C]">{activeDestination.name}</span>
              </span>
            )}
          </div>

          {(selectedCategory !== 'all' || selectedDestination !== 'all' || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="text-[#FF795C] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onEnquire={() => handleEnquire(pkg)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom Trip Enquiry Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setSelectedPackageForEnquiry(null);
        }}
        preselectedPackage={selectedPackageForEnquiry || undefined}
      />
    </div>
  );
};
