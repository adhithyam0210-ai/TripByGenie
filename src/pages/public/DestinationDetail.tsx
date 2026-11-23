import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, MapPin, Compass, ShieldCheck, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { Destination, Package } from '../../types';
import { PackageCard } from '../../components/travel/PackageCard';
import { DestinationOverviewCard } from '../../components/travel/DestinationOverviewCard';
import { DestinationAccordion } from '../../components/travel/DestinationAccordion';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { Button } from '../../components/common/Button';

export const DestinationDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  useEffect(() => {
    if (slug) loadDestinationData(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const loadDestinationData = async (destinationSlug: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDestinationBySlug(destinationSlug);
      setDestination(data.destination);
      setPackages(data.packages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Destination Details...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-[#FFFDF8]">
        <h2 className="text-xl font-bold text-[#082C43]">Destination Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">We couldn't locate details for this destination.</p>
        <Link to="/destinations" className="mt-4 text-xs font-bold text-[#FF795C] hover:underline">
          ← Back to All Destinations
        </Link>
      </div>
    );
  }

  // Filter packages by category if selected
  const displayedPackages = packages.filter((pkg) => {
    if (selectedCategoryFilter === 'all') return true;
    const cat = (pkg.category || '').toLowerCase();
    const title = (pkg.title || '').toLowerCase();
    if (selectedCategoryFilter === 'honeymoon') {
      return cat.includes('honeymoon') || title.includes('honeymoon') || title.includes('romantic');
    }
    if (selectedCategoryFilter === 'family') {
      return cat.includes('family') || title.includes('family') || title.includes('holiday');
    }
    if (selectedCategoryFilter === 'group') {
      return pkg.is_group_tour || cat.includes('group') || title.includes('group');
    }
    return true;
  });

  // Extract or generate authentic visitor insights matching tripbygenie.in/australia/
  const isAustralia = destination.slug === 'australia' || destination.name.toLowerCase() === 'australia';
  const totalVisitors = isAustralia ? '86,00,000' : '45,00,000+';
  const maleRatio = isAustralia ? '51%' : '52%';
  const femaleRatio = isAustralia ? '49%' : '48%';
  const topCities = isAustralia
    ? ['Chennai', 'Delhi', 'Hyderabad', 'Pune', 'Jaipur', 'Mumbai', 'Bengaluru', 'Kolkata', 'Ahmedabad', 'Lucknow']
    : ['Chennai', 'Bengaluru', 'Hyderabad', 'Kochi', 'Mumbai', 'Delhi', 'Coimbatore', 'Madurai'];

  const factsParagraphs = isAustralia
    ? [
        `With more than 12,000 beaches and over 200,000 species found nowhere else—like kangaroos, koalas, and kookaburras—Australia is one of the most extraordinary destinations on the planet. Its deep Aboriginal roots, stretching back over 50,000 years, add to the richness of its cultural landscape. But there’s much more that makes the journey to Australia truly rewarding.`,
        `The legendary Australian Outback stands as one of the most remote regions in the world. Ancient mountain ranges meet vast plains blanketed in wildflowers, and the iconic Ayers Rock (Uluru) rises from the desert floor, creating a sight unlike any other. Tasmania is another gem—a paradise for food and wine lovers and a thrill-seeker’s playground with options like kayaking, white-water rafting, and mountain biking.`,
        `For travelers looking to experience the pristine beauty of the Daintree Rainforest or explore the breathtaking Great Barrier Reef—the largest coral reef system in the world—there are specially designed Australia tour packages available through TripByGenie with 4-star stays, private airport transfers, and guided sightseeing.`,
        `Australia is a land of massive scale, with 2.9 million square miles of incredible landscapes. That’s why there are customized Australia tour packages to choose from, tailored for romantic honeymoons, rugged outback trails, coastal retreats, and family vacations.`
      ]
    : [
        `Discover the captivating beauty and authentic cultural heritage of ${destination.name}. From scenic landscapes to historic landmarks, every journey is curated with handpicked accommodations, private airport transfers, and guided sightseeing.`,
        `Enjoy authentic South Indian culinary preferences and seamless ground transfers arranged by South India's trusted travel experts. Our dedicated 24/7 on-tour coordinator ensures peace of mind throughout your vacation.`,
        `Whether you're planning a romantic honeymoon, an adventurous exploration, or a memorable family holiday, our bespoke ${destination.name} packages offer the ideal balance of leisure, guided tours, and free exploration.`
      ];

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-24">
      {/* Top Breadcrumb Header */}
      <div className="bg-[#F8F1E7] border-b border-[#EFE7DA] py-3 px-4 sm:px-8 text-xs text-[#173247]/70">
        <div className="max-w-[1600px] w-full mx-auto flex items-center gap-2">
          <Link to="/" className="hover:text-[#FF795C] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/destinations" className="hover:text-[#FF795C] transition-colors">Destinations</Link>
          <span>/</span>
          <span className="text-[#082C43] font-bold">{destination.name} Tour Packages</span>
        </div>
      </div>

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#082C43] hover:text-[#FF795C] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Destinations</span>
          </Link>
        </div>

        {/* 1. Destination Overview Card matching Image 1 & tripbygenie.in/australia/ */}
        <DestinationOverviewCard
          destination={destination}
          onViewPackages={() => {
            document.getElementById('packages-grid')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 2. Visitor Insights & Travel Overview Section matching tripbygenie.in/australia/ */}
        <section className="bg-white rounded-3xl border border-[#EFE7DA] p-6 sm:p-8 shadow-xs mb-12 text-[#082C43]">
          <div className="flex items-center gap-2 mb-6">
            <Compass className="w-5 h-5 text-[#FF795C]" />
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#082C43]">
              {destination.name}’s – Visitor Insights & Travel Overview
            </h2>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Annual Visitors */}
            <div className="bg-[#F8F1E7]/60 rounded-2xl p-5 border border-[#EFE7DA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] block mb-1">
                Total Annual Visitors
              </span>
              <div className="text-3xl font-black text-[#082C43] font-display">
                {totalVisitors}
              </div>
              <p className="text-xs text-slate-500 mt-1">International & leisure arrivals per year</p>
            </div>

            {/* Gender Ratio */}
            <div className="bg-[#F8F1E7]/60 rounded-2xl p-5 border border-[#EFE7DA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] block mb-1">
                Traveler Demographics
              </span>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <span className="text-2xl font-black text-[#082C43] font-display">{maleRatio}</span>
                  <span className="text-xs text-slate-500 block">Male</span>
                </div>
                <div className="h-8 w-px bg-slate-300" />
                <div>
                  <span className="text-2xl font-black text-[#FF795C] font-display">{femaleRatio}</span>
                  <span className="text-xs text-slate-500 block">Female</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Family & couple holiday distribution</p>
            </div>

            {/* Top Visitors from India */}
            <div className="bg-[#F8F1E7]/60 rounded-2xl p-5 border border-[#EFE7DA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] block mb-2">
                Top Visitors from India
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topCities.slice(0, 8).map((city) => (
                  <span
                    key={city}
                    className="text-[11px] font-semibold bg-white text-[#082C43] px-2.5 py-0.5 rounded-full border border-[#EFE7DA] shadow-2xs"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Essential Facts and Insights Article */}
          <div className="border-t border-[#EFE7DA] pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#082C43] font-display mb-4">
              Essential Facts and Insights About {destination.name}
            </h3>

            <div className="space-y-4 text-xs sm:text-[13px] text-slate-700 leading-relaxed max-w-5xl">
              {factsParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Rich FAQ & Information Accordion (About, Best Budget, Top Reasons, etc. - matching tripbygenie.in/australia/#) */}
        <DestinationAccordion destination={destination} />

        {/* 4. Available Packages in this destination */}
        <section id="packages-grid" className="pt-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EFE7DA] gap-4 mb-8">
            <div>
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082C43] font-display">
                  All Packages in {destination.name}
                </h2>
                <span className="text-xs font-bold bg-[#FF795C]/15 text-[#FF795C] px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 inline-flex items-center">
                  {packages.length} Tours
                </span>
              </div>
              <p className="text-xs text-[#173247]/70 mt-1">
                Curated holiday itineraries handpicked by South India’s trusted travel specialists
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
              {/* Category Dropdown: All Tours, Family, Honeymoon, Group */}
              <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full appearance-none bg-[#F8F1E7] border border-[#EFE7DA] text-[#082C43] text-xs font-bold py-2 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-[#FF795C] cursor-pointer shadow-xs"
                >
                  <option value="all">All Tours</option>
                  <option value="family">Family Tours</option>
                  <option value="honeymoon">Honeymoon</option>
                  <option value="group">Group Tours</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#082C43] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedPackage(null);
                  setIsTripModalOpen(true);
                }}
                className="text-xs font-bold shadow-md shadow-[#FF795C]/20 whitespace-nowrap shrink-0 px-3.5 py-2"
              >
                Custom Quote
              </Button>
            </div>
          </div>

          {displayedPackages.length === 0 ? (
            <div className="text-center py-16 bg-[#F8F1E7]/50 rounded-3xl border border-[#EFE7DA] mt-6">
              <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold text-[#082C43]">
                No specific {selectedCategoryFilter} packages listed
              </h3>
              <p className="text-xs text-[#173247]/70 mt-1 max-w-md mx-auto">
                Our travel consultants can create a completely customized itinerary tailored to your exact dates and budget.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setIsTripModalOpen(true);
                }}
              >
                Plan Custom {destination.name} Trip
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  packageData={pkg}
                  onEnquire={(p) => {
                    setSelectedPackage(p);
                    setIsTripModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Custom Trip Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        initialDestination={selectedPackage ? selectedPackage.title : destination.name}
        initialPackageId={selectedPackage ? selectedPackage.id : ''}
      />
    </div>
  );
};
