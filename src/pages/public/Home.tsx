import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Award,
  Globe2,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Plane,
  Building,
  Heart,
  ChevronLeft,
  ChevronRight,
  Send,
  MapPin,
  Tag,
  Clock,
  Briefcase,
  Video,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { HeroBanner, Destination, Package, Testimonial, TravelService } from '../../types';
import { SearchWidget } from '../../components/travel/SearchWidget';
import { DestinationCard } from '../../components/travel/DestinationCard';
import { PackageCard } from '../../components/travel/PackageCard';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { fallbackData } from '../../data/fallbackData';

interface ContextType {
  openTripModal: () => void;
}

export const Home: React.FC = () => {
  const context = useOutletContext<ContextType>();
  const [banners, setBanners] = useState<HeroBanner[]>((fallbackData.hero_banners || []) as any);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [customVideoInput, setCustomVideoInput] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>((fallbackData.destinations || []) as any);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [packages, setPackages] = useState<Package[]>((fallbackData.packages || []) as any);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupTours, setGroupTours] = useState<Package[]>(
    ((fallbackData.packages || []).filter((p: any) => p.category === 'Group Tours')) as any
  );
  const [services, setServices] = useState<TravelService[]>((fallbackData.travel_services || []) as any);
  const [testimonials, setTestimonials] = useState<Testimonial[]>((fallbackData.testimonials || []) as any);
  const [loading, setLoading] = useState(false);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Dedicated slides with ultra-sharp 4K imagery & video support
  const defaultBanners: HeroBanner[] = [
    {
      id: 'banner_1',
      agency_id: 'agency_travel_genie',
      title: 'Crafting Journeys, Creating Memories!',
      subtitle: 'Discover The Best Travel Agency in South India for World Class Travel Experiences. Handcrafted holidays to Kerala, Europe, Maldives, Bali & beyond.',
      image_desktop: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=90',
      image_mobile: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85',
      cta_text: 'Explore Packages',
      cta_link: '/packages',
      secondary_cta_text: 'Plan Your Trip',
      secondary_cta_link: '/#custom-trip',
      display_order: 1,
      is_active: true
    },
    {
      id: 'banner_2',
      agency_id: 'agency_travel_genie',
      title: 'Experience Unforgettable Journeys Across The Globe',
      subtitle: 'From the romantic Swiss Alps and Parisian boulevards to private overwater villas in Maldives & tropical Bali retreats.',
      image_desktop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=90',
      image_mobile: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85',
      cta_text: 'International Tours',
      cta_link: '/packages?category=International%20Holiday%20Packages',
      secondary_cta_text: 'Custom Itinerary',
      secondary_cta_link: '/#custom-trip',
      display_order: 2,
      is_active: true
    },
    {
      id: 'banner_3',
      agency_id: 'agency_travel_genie',
      title: 'Cherish Pure Romance in Exotic Honeymoon Getaways',
      subtitle: 'Candlelight beach dinners in Maldives, serene shikara rides in Kashmir, and private pool villas in Bali & Langkawi.',
      image_desktop: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2560&q=90',
      image_mobile: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1080&q=85',
      cta_text: 'Honeymoon Specials',
      cta_link: '/honeymoon',
      secondary_cta_text: 'Plan Honeymoon',
      secondary_cta_link: '/#custom-trip',
      display_order: 3,
      is_active: true
    },
    {
      id: 'banner_4',
      agency_id: 'agency_travel_genie',
      title: 'South India & Kerala Escapes with Dedicated Tour Assistance',
      subtitle: 'Misty tea gardens of Munnar, houseboats in Alleppey, Princess of Hills Kodaikanal, and temple heritage circuits with pure South Indian dining.',
      image_desktop: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=2560&q=90',
      image_mobile: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1080&q=85',
      cta_text: 'Explore South India',
      cta_link: '/destinations',
      secondary_cta_text: 'Book Cab & Tour',
      secondary_cta_link: '/services',
      display_order: 4,
      is_active: true
    },
    {
      id: 'banner_5',
      agency_id: 'agency_travel_genie',
      title: 'BALI & TROPICAL ISLANDS',
      subtitle: 'Surfing, coral reefs, and luxury private pool villas with custom guided excursions.',
      image_desktop: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2560&q=90',
      image_mobile: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1080&q=85',
      video_url: '/videos/bali-surfing.mp4',
      cta_text: 'Explore Packages',
      cta_link: '/packages',
      secondary_cta_text: 'Plan Your Trip',
      secondary_cta_link: '/#custom-trip',
      display_order: 5,
      is_active: true
    }
  ];

  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
  }, [currentBannerIndex]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [bannersData, destsData, pkgsData, toursData, srvsData, testsData] = await Promise.all([
        api.getBanners().catch(() => fallbackData.hero_banners),
        api.getDestinations().catch(() => fallbackData.destinations),
        api.getPackages({ limit: 12 }).catch(() => fallbackData.packages),
        api.getGroupTours().catch(() => (fallbackData.packages || []).filter((p: any) => p.category === 'Group Tours')),
        api.getServices().catch(() => fallbackData.travel_services),
        api.getTestimonials().catch(() => fallbackData.testimonials)
      ]);

      if (bannersData && bannersData.length > 0) setBanners(bannersData);
      if (destsData && destsData.length > 0) setDestinations(destsData);
      if (pkgsData && pkgsData.length > 0) setPackages(pkgsData);
      if (toursData && toursData.length > 0) setGroupTours(toursData);
      if (srvsData && srvsData.length > 0) setServices(srvsData);
      if (testsData && testsData.length > 0) setTestimonials(testsData);
    } catch (e) {
      console.warn('Failed to load homepage data, keeping instant fallback fixtures:', e);
    } finally {
      setLoading(false);
    }
  };

  // Auto rotate hero banner every 6.5 seconds, resetting on manual slide change
  useEffect(() => {
    const list = banners.length > 0 ? banners : defaultBanners;
    if (list.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % list.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [banners.length, currentBannerIndex]);

  const handleSetBannerVideo = (url: string) => {
    const list = [...(banners.length > 0 ? banners : defaultBanners)];
    if (list[currentBannerIndex]) {
      list[currentBannerIndex] = {
        ...list[currentBannerIndex],
        video_url: url || undefined
      };
      setBanners(list);
    }
    setIsVideoModalOpen(false);
  };

  const activeBanners = banners.length > 0 ? banners : defaultBanners;
  const currentBanner = activeBanners[currentBannerIndex] || defaultBanners[0];

  const handleOpenTripModal = () => {
    if (context && context.openTripModal) {
      context.openTripModal();
    }
  };

  const filteredDestinations = destinations.filter((d) => {
    if (selectedRegion === 'all') return true;
    if (selectedRegion === 'south-india') {
      const southSpots = ['kerala', 'ooty', 'kodaikanal', 'coorg', 'munnar', 'mysore', 'bangalore', 'hyderabad', 'tamil nadu', 'karnataka'];
      return southSpots.some(s => d.name.toLowerCase().includes(s));
    }
    if (selectedRegion === 'north-india') {
      const northSpots = ['kashmir', 'ladakh', 'manali', 'shimla', 'delhi', 'agra', 'jaipur'];
      return northSpots.some(s => d.name.toLowerCase().includes(s));
    }
    if (selectedRegion === 'india') return d.region === 'India';
    if (selectedRegion === 'international') return d.region !== 'India';
    return d.region.toLowerCase() === selectedRegion.toLowerCase();
  });

  const categoriesList = [
    'All Packages',
    'South India Tours',
    'International Holiday Packages',
    'Honeymoon Packages',
    'Family Holiday Packages',
    'Group Tours',
    'Adventure Tours'
  ];

  const filteredPackages = packages.filter((p) => {
    if (selectedCategory === 'all' || selectedCategory === 'All Packages') return true;
    if (selectedCategory === 'South India Tours') {
      const southKeys = ['kerala', 'ooty', 'kodaikanal', 'coorg', 'munnar', 'mysore', 'south'];
      return southKeys.some(k => (p.title + ' ' + p.destination).toLowerCase().includes(k));
    }
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Tour Package Category cards directly from tripbygenie.in
  const quickTourismCategories = [
    {
      title: 'Asia Tour Packages',
      desc: 'Bali, Thailand, Singapore, Malaysia, Vietnam & Japan',
      img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
      tag: 'Trending',
      link: '/packages?search=Asia'
    },
    {
      title: 'South India Getaways',
      desc: 'Kerala, Munnar, Ooty, Kodaikanal, Coorg & Mysore',
      img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
      tag: 'Our Specialty',
      link: '/packages?search=Kerala'
    },
    {
      title: 'Europe Tour Packages',
      desc: 'Switzerland, France, Italy, UK, Greece & Austria',
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
      tag: 'Iconic',
      link: '/packages?search=Europe'
    },
    {
      title: 'Island & Honeymoon Escapes',
      desc: 'Maldives, Mauritius, Seychelles & Sri Lanka',
      img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80',
      tag: 'Romantic',
      link: '/honeymoon'
    },
    {
      title: 'America & Pacific Packages',
      desc: 'USA, Canada, Australia, New Zealand & Fiji',
      img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
      tag: 'Scenic',
      link: '/packages?search=Australia'
    },
    {
      title: 'Africa & Wildlife Safaris',
      desc: 'Kenya, South Africa, Morocco & Zimbabwe',
      img: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
      tag: 'Adventure',
      link: '/packages?search=Kenya'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-[#FFFDF8]">
      {/* ======================================================== */}
      {/* SECTION 1: HERO BANNER SLIDER (Wanderly & tripbygenie.in) */}
      {/* ======================================================== */}
      <section className="relative min-h-[520px] sm:min-h-[75vh] lg:min-h-[82vh] flex flex-col justify-center py-10 sm:py-16 text-white overflow-hidden bg-[#041D30]">
        {/* Background Media: Dual Layer - ALWAYS renders crisp photo backdrop, overlays video when playing */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#082C43]">
          {/* 1. Underlying Ultra-HD 4K Photo Backdrop (Instant load, crisp sharpness, zero degradation) */}
          <img
            key={`hero-img-${currentBanner.id || currentBannerIndex}`}
            src={resolveMediaUrl(currentBanner.image_desktop || currentBanner.image_mobile || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=90')}
            srcSet={`${resolveMediaUrl(currentBanner.image_mobile || currentBanner.image_desktop)} 1080w, ${resolveMediaUrl(currentBanner.image_desktop || currentBanner.image_mobile)} 2560w`}
            sizes="100vw"
            alt={currentBanner.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              if (currentBanner.image_desktop && target.src !== currentBanner.image_desktop) {
                target.src = currentBanner.image_desktop;
              } else if (!target.src.includes('1507525428034')) {
                target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=90';
              } else {
                target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=90';
              }
            }}
          />

          {/* 2. Optional Video Stream (Plays above image on supported devices/connections) */}
          {currentBanner.video_url && !videoError && (
            <video
              key={`hero-vid-${currentBanner.video_url}`}
              ref={(el) => {
                if (el) {
                  el.muted = true;
                  el.defaultMuted = true;
                  const playPromise = el.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(() => {
                      // Autoplay blocked by mobile browser - show crisp photo backdrop
                      setVideoError(true);
                    });
                  }
                }
              }}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={resolveMediaUrl(currentBanner.image_desktop || currentBanner.image_mobile)}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => {
                console.warn('Video failed or blocked on mobile, revealing photo backdrop');
                setVideoError(true);
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={resolveMediaUrl(currentBanner.video_url)} type="video/mp4" />
            </video>
          )}

          {/* Clean legibility scrim: subtle left vignette for white text, 100% natural photo/video clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Left Navigation Arrow - Hidden on narrow mobile to prevent overlapping banner text */}
        {currentBannerIndex > 0 && (
          <button
            onClick={() => setCurrentBannerIndex((prev) => Math.max(0, prev - 1))}
            className="hidden sm:flex absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-xs border border-white/20 items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Right Navigation Arrow - Hidden on narrow mobile to prevent overlapping banner text */}
        {currentBannerIndex < activeBanners.length - 1 && (
          <button
            onClick={() => setCurrentBannerIndex((prev) => Math.min(activeBanners.length - 1, prev + 1))}
            className="hidden sm:flex absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-xs border border-white/20 items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Slide Indicator Dots - Always visible & touch friendly */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/15">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBannerIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentBannerIndex === idx
                  ? 'w-6 bg-[#FF795C]'
                  : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1600px] w-full mx-auto px-5 sm:px-8 lg:px-12 2xl:px-16 my-auto py-6 sm:py-8">
          <div className="max-w-4xl space-y-3.5 sm:space-y-6 sm:pl-4 lg:pl-10">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.2] sm:leading-[1.1] font-display drop-shadow-md">
              {currentBanner.title}
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-sm">
              {currentBanner.subtitle}
            </p>

            {/* Small Left-Aligned Action Buttons */}
            <div className="flex flex-row items-center justify-start gap-2.5 sm:gap-3 pt-1 sm:pt-3">
              <Link to={currentBanner.cta_link || '/packages'}>
                <Button
                  variant="primary"
                  size="sm"
                  className="shadow-md shadow-[#FF795C]/30 text-xs font-bold px-4 py-2 h-9 sm:h-9.5 rounded-xl cursor-pointer"
                >
                  {currentBanner.cta_text || 'Explore Packages'}
                </Button>
              </Link>
              <Button
                variant="white"
                size="sm"
                onClick={handleOpenTripModal}
                className="text-xs font-bold shadow-xs px-4 py-2 h-9 sm:h-9.5 rounded-xl text-[#082C43] hover:bg-white/95 cursor-pointer whitespace-nowrap shrink-0"
              >
                Plan Your Trip
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: TOURISM PACKAGE CATEGORIES (from tripbygenie) */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#FFFDF8] relative">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF795C] block mb-2">
              Select The Best Packages For Your Tourism
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              Handpicked Holiday Collections
            </h2>
            <p className="text-sm text-[#173247]/75 mt-2">
              From idyllic backwaters and tea hills in South India to world-renowned global landmarks, find the perfect tour crafted with 4-star comfort.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickTourismCategories.map((cat) => (
              <Link
                key={cat.title}
                to={cat.link}
                className="group relative rounded-3xl overflow-hidden shadow-lg border border-[#EFE7DA] bg-white hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082C43]/90 via-[#082C43]/30 to-transparent" />
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FF795C] text-white shadow-sm">
                    {cat.tag}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#082C43] group-hover:text-[#FF795C] transition-colors font-display">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {cat.desc}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#17648A] group-hover:text-[#FF795C]">
                    <span>View Itineraries & Pricing</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: POPULAR DESTINATIONS                          */}
      {/* ======================================================== */}
      <section className="py-20 relative bg-[#F8F1E7]/40 border-y border-[#EFE7DA]">
        <TravelPatternBg variant="cream" opacity={0.04} />

        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF795C] block mb-1">
                Curated Travel Escapes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
                Popular Destinations
              </h2>
              <p className="text-sm text-[#173247]/70 mt-1">
                Explore majestic South Indian hills, coastal lagoons, and world-class international marvels.
              </p>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Places' },
                { id: 'south-india', label: 'South India' },
                { id: 'north-india', label: 'North India' },
                { id: 'international', label: 'International' },
                { id: 'Europe', label: 'Europe' },
                { id: 'Asia', label: 'Asia' },
                { id: 'Islands', label: 'Islands' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedRegion === tab.id
                      ? 'bg-[#082C43] text-white shadow-md'
                      : 'bg-white/80 text-[#082C43] hover:bg-white border border-[#EFE7DA]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDestinations.slice(0, 8).map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/destinations">
              <Button variant="outline" size="lg" className="border-[#082C43] text-[#082C43] hover:bg-[#082C43] hover:text-white font-bold text-xs">
                Explore All Destinations →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: HOLIDAY PACKAGES & PRICING                    */}
      {/* ======================================================== */}
      <section className="py-20 relative bg-[#FFFDF8]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#55C9BD] block mb-1">
                Transparent Pricing • 4-Star Stays
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
                Featured Holiday Packages
              </h2>
              <p className="text-sm text-[#173247]/70 mt-1">
                Handcrafted packages with day-by-day itineraries, flight bookings, and complete ground support.
              </p>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#FF795C] text-white shadow-sm'
                      : 'bg-[#F8F1E7] text-[#082C43] hover:bg-white border border-[#EFE7DA]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageData={pkg}
                onEnquire={() => handleOpenTripModal()}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: GUARANTEED GROUP TOURS                        */}
      {/* ======================================================== */}
      {groupTours.length > 0 && (
        <section className="py-20 relative bg-[#082C43] text-white overflow-hidden">
          <TravelPatternBg variant="navy" opacity={0.06} />

          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF795C] block mb-1">
                  Fixed Departure Departures
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
                  Guaranteed Group Tours
                </h2>
                <p className="text-sm text-white/75 mt-1">
                  Travel with friendly companions, experienced tour managers, and pure South Indian / Jain meal arrangements.
                </p>
              </div>

              <Link to="/group-tours">
                <Button variant="turquoise" size="sm" className="font-bold text-xs">
                  View All Group Departures
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {groupTours.slice(0, 3).map((tour) => (
                <div
                  key={tour.id}
                  className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 flex flex-col justify-between hover:bg-white/15 transition-all shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF795C] text-white">
                        Upcoming Departure
                      </span>
                      <span className="text-xs font-bold text-[#55C9BD] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {tour.seats_left || 8} Seats Left
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-display text-white">{tour.title}</h3>

                    <div className="flex items-center gap-4 text-xs text-white/80">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#55C9BD]" />
                        {tour.duration_days}D / {tour.duration_nights}N
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF795C]" />
                        {tour.destination}
                      </span>
                    </div>

                    <p className="text-xs text-white/70 line-clamp-2">
                      {tour.short_description || tour.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/60 block">Starting From</span>
                      <span className="text-xl font-extrabold text-[#55C9BD] font-display">
                        ₹{Number(tour.starting_price || tour.public_price || tour.b2c_price || tour.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link to={`/packages/${tour.id}`}>
                      <Button variant="primary" size="sm" className="text-xs font-bold">
                        Book Seat
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* SECTION 6: TRAVEL SERVICES (10 Services from Reference)  */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#FFFDF8] relative">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF795C] block mb-2">
              Comprehensive Travel Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              End-to-End Travel Services
            </h2>
            <p className="text-sm text-[#173247]/75 mt-2">
              From air ticketing and luxury coaches to hassle-free visa processing and corporate retreats.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs hover:shadow-md hover:border-[#55C9BD]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#082C43]/5 flex items-center justify-center text-[#17648A] mb-3">
                    <Plane className="w-5 h-5 text-[#FF795C]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#082C43]">{srv.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <Link
                  to="/services"
                  className="mt-4 text-[11px] font-bold text-[#17648A] hover:text-[#FF795C] flex items-center gap-1"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: WHY TRAVEL WITH TRIP BY GENIE                 */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#F8F1E7]/50 relative border-t border-[#EFE7DA]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display leading-tight">
                Why Thousands Choose Trip by Genie For Their Holidays
              </h2>

              <p className="text-sm text-[#173247]/80 leading-relaxed">
                We believe travel is not just about visiting places — it is about seamless comfort, authentic flavors, trusted local guides, and zero hidden costs. Based in South India, our travel specialists curate every detail with precision.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  '100% Customized Itineraries Tailored to Your Pace',
                  'Dedicated 24/7 On-Trip Concierge Support',
                  'Strictly Verified 4-Star & 5-Star Accommodations',
                  'Comfortable Tempo Travellers & Luxury Cab Fleet',
                  'Pure South Indian & Jain Meal Options on Request',
                  'Clear & Transparent Pricing with Zero Hidden Fees'
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs font-medium text-[#082C43]">
                    <CheckCircle2 className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOpenTripModal}
                  className="shadow-md font-bold text-xs"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Get Free Trip Quotation
                </Button>
                <a href="tel:+914446071374">
                  <Button variant="outline" size="lg" className="border-[#082C43] text-[#082C43] font-bold text-xs">
                    <PhoneCall className="w-4 h-4 mr-1.5 text-[#55C9BD]" />
                    Call +91 (44) 46071374
                  </Button>
                </a>
              </div>
            </div>

            {/* Genuine Trust Stats Card */}
            <div className="bg-[#082C43] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <TravelPatternBg variant="navy" opacity={0.08} />
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-bold font-display text-white">Genuine Business Milestones</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs">
                    <p className="text-3xl font-extrabold text-[#55C9BD] font-display">1,200+</p>
                    <p className="text-xs text-white/80 mt-1">Happy Travelers Curated</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs">
                    <p className="text-3xl font-extrabold text-[#FF795C] font-display">4.9 / 5</p>
                    <p className="text-xs text-white/80 mt-1">Average Customer Rating</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs">
                    <p className="text-3xl font-extrabold text-amber-400 font-display">25+</p>
                    <p className="text-xs text-white/80 mt-1">Destinations Across India & Abroad</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs">
                    <p className="text-3xl font-extrabold text-white font-display">24/7</p>
                    <p className="text-xs text-white/80 mt-1">Active Ground Concierge</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                  <span>IATA & Govt. Registered Travel Partner</span>
                  <span className="text-[#55C9BD] font-bold">100% Secure Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 8: REAL CUSTOMER TESTIMONIALS (tripbygenie.in)   */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#FFFDF8]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF795C] block mb-2">
              Stories From Our Travelers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              Customer Testimonials
            </h2>
            <p className="text-sm text-[#173247]/75 mt-2">
              Hear directly from families, honeymoon couples, and corporate groups who journeyed with Trip by Genie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test) => (
              <div
                key={test.id}
                className="bg-white p-6 rounded-3xl border border-[#EFE7DA] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(test.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-[#173247]/85 leading-relaxed">
                    {test.review_text}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-[#EFE7DA]">
                  <img
                    src={test.customer_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={test.customer_name}
                    className="w-10 h-10 rounded-full object-cover border border-[#EFE7DA]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#082C43]">{test.customer_name}</h4>
                    <span className="text-[11px] text-[#55C9BD] font-medium block">
                      {test.destination}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Customization Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#004c8f]/10 text-[#004c8f] flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#082C43]">Hero Banner Video</h3>
                <p className="text-xs text-gray-500">Play crystal-clear travel video directly in the hero banner</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                  Select a High-Definition Travel Video Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      name: 'Bali Surfing (Local Video)',
                      url: '/videos/bali-surfing.mp4'
                    },
                    {
                      name: 'Maldives Overwater Resort',
                      url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-luxury-resort-in-the-maldives-42777-large.mp4'
                    },
                    {
                      name: 'Scenic Mountain Drive',
                      url: 'https://assets.mixkit.co/videos/preview/mixkit-curved-road-on-a-mountain-slope-42776-large.mp4'
                    },
                    {
                      name: 'Tropical Ocean Waves',
                      url: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-turquoise-water-43224-large.mp4'
                    },
                    {
                      name: 'Serene River & Palms',
                      url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-drone-shot-of-a-winding-river-42778-large.mp4'
                    }
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCustomVideoInput(preset.url)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        customVideoInput === preset.url
                          ? 'border-[#FF795C] bg-[#FF795C]/10 text-[#082C43] font-bold ring-2 ring-[#FF795C]/30'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                  Or Paste Any Custom Video MP4 URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={customVideoInput}
                  onChange={(e) => setCustomVideoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#004c8f]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                <button
                  type="button"
                  onClick={() => handleSetBannerVideo('')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remove Video (Photo Only)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBannerVideo(customVideoInput)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#004c8f] hover:bg-[#00386b] shadow-md transition-colors"
                  >
                    Apply Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
