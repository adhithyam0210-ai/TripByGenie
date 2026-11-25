import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Award,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Plane,
  Bus,
  Car,
  Ship,
  Building2,
  FileCheck,
  CheckCircle,
  Building,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
    ((fallbackData.packages || []).filter((p: any) => p.category === 'Group Tours' || p.is_group_tour)) as any
  );

  // 3 latest upcoming group tour packages sorted by departure date
  const upcomingGroupTours = useMemo(() => {
    return [...groupTours]
      .sort((a, b) => {
        const dateA = a.upcoming_date ? new Date(a.upcoming_date).getTime() : Infinity;
        const dateB = b.upcoming_date ? new Date(b.upcoming_date).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [groupTours]);
  const [services, setServices] = useState<TravelService[]>((fallbackData.travel_services || []) as any);
  const [testimonials, setTestimonials] = useState<Testimonial[]>((fallbackData.testimonials || []) as any);
  const [selectedStory, setSelectedStory] = useState<Testimonial | null>(null);
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
        api.getPackages({ limit: 100 }).catch(() => fallbackData.packages),
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

  // Lock body scroll and handle Escape key for Customer Story popup
  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedStory(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedStory]);

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

  // Sliding stories slider state & controls
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isStoryHovered, setIsStoryHovered] = useState(false);
  const storyContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollState = () => {
    if (storyContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storyContainerRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [testimonials]);

  const handlePrevStory = () => {
    if (storyContainerRef.current) {
      const container = storyContainerRef.current;
      const card = container.firstElementChild as HTMLElement;
      const scrollAmount = card ? card.offsetWidth + 24 : container.clientWidth * 0.8;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollState, 350);
    }
  };

  const handleNextStory = () => {
    if (storyContainerRef.current) {
      const container = storyContainerRef.current;
      const card = container.firstElementChild as HTMLElement;
      const scrollAmount = card ? card.offsetWidth + 24 : container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollState, 350);
    }
  };

  // Helper to accurately calculate active card index in horizontal snap slider based on real DOM geometry
  const getActiveSliderIndex = (container: HTMLDivElement | null): number => {
    if (!container) return 0;
    const { scrollLeft, clientWidth, scrollWidth } = container;
    const children = Array.from(container.children) as HTMLElement[];
    if (!children.length) return 0;

    // Boundary snap detection
    if (scrollLeft <= 15) return 0;
    if (scrollLeft + clientWidth >= scrollWidth - 25) return children.length - 1;

    const viewportCenter = scrollLeft + clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(childCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  };

  // MICE Mobile Slider with Native Smooth Swipe & Dynamic Bump Effect
  const miceSliderRef = useRef<HTMLDivElement>(null);
  const [activeMiceIndex, setActiveMiceIndex] = useState(0);

  const handleMiceScroll = () => {
    setActiveMiceIndex(getActiveSliderIndex(miceSliderRef.current));
  };

  const scrollToMiceCard = (idx: number) => {
    if (miceSliderRef.current) {
      const card = miceSliderRef.current.children[idx] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setActiveMiceIndex(idx);
    }
  };

  // Featured Packages Mobile Slider with Native Smooth Swipe & Dynamic Bump Effect (like MICE)
  const packagesSliderRef = useRef<HTMLDivElement>(null);
  const [activePackageIndex, setActivePackageIndex] = useState(0);

  const handlePackagesScroll = () => {
    setActivePackageIndex(getActiveSliderIndex(packagesSliderRef.current));
  };

  const scrollToPackageCard = (idx: number) => {
    if (packagesSliderRef.current) {
      const card = packagesSliderRef.current.children[idx] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setActivePackageIndex(idx);
    }
  };

  useEffect(() => {
    setActivePackageIndex(0);
    if (packagesSliderRef.current) {
      packagesSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  // Guaranteed Group Tours Mobile Slider with Native Smooth Swipe & Dynamic Bump Effect (like MICE)
  const groupToursSliderRef = useRef<HTMLDivElement>(null);
  const [activeGroupTourIndex, setActiveGroupTourIndex] = useState(0);

  const handleGroupToursScroll = () => {
    setActiveGroupTourIndex(getActiveSliderIndex(groupToursSliderRef.current));
  };

  const scrollToGroupTourCard = (idx: number) => {
    if (groupToursSliderRef.current) {
      const card = groupToursSliderRef.current.children[idx] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setActiveGroupTourIndex(idx);
    }
  };

  const micePillars = [
    {
      letter: 'M',
      title: 'Meetings',
      subtitle: 'Boardrooms & Strategic Offsites',
      desc: 'Executive board meetings, leadership retreats, high-speed Wi-Fi, audio-visual projection, and confidential business dining.',
      highlights: ['Executive Boardroom Suites', 'AV & Digital Whiteboards', 'Private Business Dining'],
      tag: 'Leadership & Strategy',
      themeColor: 'text-[#17648A]',
      badgeBg: 'bg-[#17648A]',
      img: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
    },
    {
      letter: 'I',
      title: 'Incentives',
      subtitle: 'Employee & Dealer Reward Tours',
      desc: 'Reward top performers and dealers with memorable luxury getaways to Dubai, Bali, Thailand, Sri Lanka, Goa, and luxury cruises.',
      highlights: ['5-Star Luxury Stays', 'Private Yacht & Catamaran Parties', 'Curated Gala Evenings'],
      tag: 'Rewards & Recognition',
      themeColor: 'text-[#FF795C]',
      badgeBg: 'bg-[#FF795C]',
      img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
    },
    {
      letter: 'C',
      title: 'Conferences',
      subtitle: 'National & Global Summits',
      desc: 'End-to-end coordination for 50 to 1,500+ delegates. Room blocks, bulk airfare discounts, delegate registration, and stage production.',
      highlights: ['Bulk Group Airfares', 'Large 5-Star Hotel Blocks', 'Acoustics & LED Video Walls'],
      tag: 'Summits & Conventions',
      themeColor: 'text-[#55C9BD]',
      badgeBg: 'bg-[#008080]',
      img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
    },
    {
      letter: 'E',
      title: 'Exhibitions & Events',
      subtitle: 'Product Launches & Gala Galas',
      desc: 'Flawless execution for brand showcases, dealer expos, and themed gala nights with custom stall fabrication and celebrity artists.',
      highlights: ['Custom Stall Fabrication', 'Intelligent Lighting & Sound', 'Celebrity Emcees & Artists'],
      tag: 'Trade Expos & Galas',
      themeColor: 'text-[#082C43]',
      badgeBg: 'bg-[#082C43]',
      img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const renderMiceCard = (pillar: typeof micePillars[0], isCompactMobile = false, isActive = true) => (
    <div
      key={pillar.title}
      className={`h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-[#EFE7DA] flex flex-col justify-between group transition-all duration-300 ${
        isCompactMobile
          ? `w-[86vw] max-w-[340px] shrink-0 snap-center ${
              isActive ? 'scale-100 shadow-xl opacity-100 ring-1 ring-[#082C43]/10' : 'scale-[0.94] shadow-md opacity-85'
            }`
          : 'shadow-xs hover:shadow-md'
      }`}
    >
      <div>
        {/* Visual Photographic Header with Badges */}
        <div className={`relative ${isCompactMobile ? 'h-48' : 'h-44 sm:h-52'} overflow-hidden bg-slate-900`}>
          <img
            src={pillar.img}
            alt={pillar.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Top Left Title Badge - Compact & Sleek */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/95 text-[#082C43] shadow-xs text-[10px] sm:text-[11px] font-bold tracking-normal flex items-center border border-[#EFE7DA]">
            <span>{pillar.title}</span>
          </div>

          {/* Top Right Tag Badge - Compact & Sleek */}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/95 text-[#082C43] shadow-xs text-[9px] sm:text-[10px] font-semibold tracking-normal border border-[#EFE7DA]">
            {pillar.tag}
          </div>

          {/* Bottom Image Subtitle */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-sm font-bold font-display drop-shadow-sm leading-tight text-white group-hover:text-amber-200 transition-colors">
              {pillar.subtitle}
            </p>
          </div>
        </div>

        {/* Card Content - Clean without SLA & Inquire Now buttons */}
        <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
          <p className="text-xs text-[#173247]/75 leading-relaxed">
            {pillar.desc}
          </p>

          <div className="pt-2 border-t border-[#EFE7DA] space-y-1.5">
            {pillar.highlights.map((h) => (
              <div key={h} className="flex items-center gap-1.5 text-[11px] font-medium text-[#082C43]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderServiceIcon = (srv: TravelService) => {
    const t = (srv.title || '').toLowerCase();
    const iconName = ((srv as any).icon || '').toLowerCase();

    if (t.includes('bus') || iconName === 'bus') {
      return <Bus className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('car') || t.includes('chauffeur') || iconName === 'car') {
      return <Car className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('cruise') || t.includes('ship') || iconName === 'ship') {
      return <Ship className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('hotel') || t.includes('resort') || iconName === 'building2' || iconName === 'hotel') {
      return <Building2 className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('visa') || iconName === 'filecheck') {
      return <FileCheck className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('insurance') || iconName === 'shieldcheck') {
      return <ShieldCheck className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('airport') || t.includes('transfer')) {
      return <MapPin className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('check-in') || t.includes('checkin') || iconName === 'checkcircle') {
      return <CheckCircle className="w-5 h-5 text-[#FF795C]" />;
    }
    if (t.includes('custom') || t.includes('itinerar') || iconName === 'compass') {
      return <Compass className="w-5 h-5 text-[#FF795C]" />;
    }
    return <Plane className="w-5 h-5 text-[#FF795C]" />;
  };

  const renderGroupTourCard = (tour: any, isCompactMobile = false, isActive = true) => (
    <div
      key={tour.id}
      className={`rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-6 flex flex-col justify-between hover:bg-white/15 transition-all duration-300 h-full ${
        isCompactMobile
          ? `w-[86vw] max-w-[340px] shrink-0 snap-center ${
              isActive ? 'scale-100 shadow-2xl opacity-100 ring-1 ring-[#55C9BD]/40' : 'scale-[0.94] shadow-md opacity-85'
            }`
          : 'shadow-xl'
      }`}
    >
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20 backdrop-blur-xs">
            {tour.upcoming_date ? `Departure: ${tour.upcoming_date}` : 'Upcoming Departure'}
          </span>
          <span className="text-xs font-bold text-[#55C9BD] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {tour.available_seats !== undefined ? tour.available_seats : (tour.seats_left || 8)} Seats Left
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold font-display text-white line-clamp-2">{tour.title}</h3>

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

      <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-white/60 block">Starting From</span>
          <span className="text-xl font-extrabold text-[#55C9BD] font-display">
            ₹{Number(tour.starting_price || tour.public_price || tour.b2c_price || tour.price || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <Link to={`/packages/${tour.slug || tour.id}`}>
          <Button variant="primary" size="sm" className="text-xs font-bold">
            Book Seat
          </Button>
        </Link>
      </div>
    </div>
  );

  const activeBanners = banners.length > 0 ? banners : defaultBanners;
  const currentBanner = activeBanners[currentBannerIndex] || defaultBanners[0];

  const handleOpenTripModal = () => {
    if (context && context.openTripModal) {
      context.openTripModal();
    }
  };

  // Easy Travel Loans Mobile Slider state & controls
  const loanSliderRef = useRef<HTMLDivElement>(null);
  const [activeLoanIndex, setActiveLoanIndex] = useState(0);

  const handleLoanScroll = () => {
    setActiveLoanIndex(getActiveSliderIndex(loanSliderRef.current));
  };

  const scrollToLoanCard = (idx: number) => {
    if (loanSliderRef.current) {
      const card = loanSliderRef.current.children[idx] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setActiveLoanIndex(idx);
    }
  };

  const loanCards = [
    {
      id: 'loan-zero-down',
      title: 'Zero Rupees Down Payment With Genie',
      badge: '₹0 Down Payment',
      img: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'loan-zero-interest',
      title: 'Zero Rupees Intrest With Genie',
      badge: '0% Interest Rate',
      img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'loan-zero-fee',
      title: 'Zero Processing FEE With Genie',
      badge: 'Zero Hidden Fees',
      img: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'loan-6-months',
      title: '6 Months Easy Vacations With Genie',
      badge: '6 Months Tenor',
      img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'loan-no-cost-emi',
      title: 'No Cost EMI Vacations With Genie',
      badge: 'Instant Approval',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const renderLoanCard = (loanCard: typeof loanCards[0], isMobile = false) => (
    <div
      key={loanCard.id}
      className={`group relative rounded-2xl overflow-hidden bg-[#082C43] text-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col border border-[#EFE7DA] ${
        isMobile ? 'w-[78vw] max-w-[270px] shrink-0 snap-center' : ''
      }`}
    >
      {/* Image Section with Dotted Flight Path Accent */}
      <div className="relative h-36 sm:h-40 md:h-44 overflow-hidden bg-[#082C43]/40">
        <img
          src={loanCard.img}
          alt={loanCard.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Seamless blended dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#082C43] via-[#082C43]/20 to-transparent" />
        
        {/* Flight Trail Decorative Vector */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M20 180 C 60 120, 140 160, 180 40"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Top Right Pill Badge - Solid White Background */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white text-[#082C43] font-bold text-[9px] tracking-wider shadow-xs border border-[#EFE7DA]">
          {loanCard.badge}
        </div>
      </div>

      {/* Card Text Content with Brand Theme Color */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-center text-center relative z-10 bg-[#082C43]">
        <h3 className="text-sm sm:text-[15px] font-bold font-display leading-tight tracking-tight text-white group-hover:text-[#55C9BD] transition-colors">
          {loanCard.title}
        </h3>
      </div>
    </div>
  );

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

  // Exactly 9 package cards prioritizing manager featured packages
  const displayedPackages = useMemo(() => {
    let list = [...packages];

    if (selectedCategory !== 'all' && selectedCategory !== 'All Packages') {
      if (selectedCategory === 'South India Tours') {
        const southKeys = ['kerala', 'ooty', 'kodaikanal', 'coorg', 'munnar', 'mysore', 'south'];
        list = list.filter((p) =>
          southKeys.some((k) => (p.title + ' ' + p.destination).toLowerCase().includes(k))
        );
      } else {
        list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
      }
      // Prioritize featured ones within category
      list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    } else {
      // Prioritize packages featured by the manager
      const featured = list.filter((p) => p.is_featured);
      if (featured.length >= 9) {
        list = featured;
      } else {
        list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      }
    }

    // Now strictly show 9 package cards
    return list.slice(0, 9);
  }, [packages, selectedCategory]);

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
        {/* Background Media: Direct Video when video_url is present, otherwise crisp 4K Photo */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#082C43]">
          {currentBanner.video_url ? (
            <video
              key={`hero-vid-${currentBanner.video_url}`}
              src={resolveMediaUrl(currentBanner.video_url)}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="hero-video absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                willChange: 'transform'
              }}
            >
              <source src={resolveMediaUrl(currentBanner.video_url)} type={currentBanner.video_url?.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
            </video>
          ) : (
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
          )}

          {/* Clean legibility scrim: If video, keep it airy and bright so 100% of the video's original sharpness, vibrancy, and brightness shines through without dark banding */}
          {currentBanner.video_url ? (
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/5 to-transparent pointer-events-none" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </>
          )}
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
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.2] sm:leading-[1.1] font-display drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
              {currentBanner.title}
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
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
      <section className="py-6 sm:py-8 bg-[#FFFDF8] relative">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              Handpicked Holiday Collections
            </h2>
            <p className="text-sm text-[#173247]/75 mt-1.5">
              From idyllic backwaters and tea hills in South India to world-renowned global landmarks, find the perfect tour crafted with 4-star comfort.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#082C43]/85 text-white shadow-sm border border-white/20 backdrop-blur-xs">
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
      <section className="py-6 sm:py-8 relative bg-[#F8F1E7]/40 border-y border-[#EFE7DA]">
        <TravelPatternBg variant="cream" opacity={0.04} />

        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
                Popular Destinations
              </h2>
              <p className="text-sm text-[#173247]/70 mt-1">
                Explore majestic South Indian hills, coastal lagoons, and world-class international marvels.
              </p>
            </div>

            {/* Region Filter Dropdown - Right-aligned on mobile & desktop */}
            <div className="flex justify-end w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
              <div className="relative w-[150px] sm:w-[240px]">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  aria-label="Filter destinations by region"
                  className="w-full appearance-none bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#082C43] text-xs font-bold py-2 pl-3.5 pr-8 sm:py-2.5 sm:pl-4 sm:pr-10 rounded-xl sm:rounded-2xl shadow-xs hover:border-[#082C43] focus:outline-none focus:ring-2 focus:ring-[#082C43]/20 focus:border-[#082C43] cursor-pointer transition-all truncate"
                >
                  {[
                    { id: 'all', label: 'All Destinations' },
                    { id: 'south-india', label: 'South India' },
                    { id: 'north-india', label: 'North India' },
                    { id: 'international', label: 'International' },
                    { id: 'Europe', label: 'Europe' },
                    { id: 'Asia', label: 'Asia' },
                    { id: 'Islands', label: 'Islands' }
                  ].map((tab) => (
                    <option key={tab.id} value={tab.id} className="text-[#082C43] font-medium py-1">
                      {tab.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#082C43] absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDestinations.slice(0, 8).map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>

          <div className="mt-6 sm:mt-7 text-center">
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
      <section className="py-6 sm:py-8 relative bg-[#FFFDF8]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
                Featured Holiday Packages
              </h2>
              <p className="text-sm text-[#173247]/70 mt-1">
                Handcrafted packages with day-by-day itineraries, flight bookings, and complete ground support.
              </p>
            </div>

            {/* Category Filter Dropdown - Right-aligned on mobile & desktop */}
            <div className="flex justify-end w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
              <div className="relative w-[150px] sm:w-[240px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter holiday packages by category"
                  className="w-full appearance-none bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#082C43] text-xs font-bold py-2 pl-3.5 pr-8 sm:py-2.5 sm:pl-4 sm:pr-10 rounded-xl sm:rounded-2xl shadow-xs hover:border-[#FF795C] focus:outline-none focus:ring-2 focus:ring-[#FF795C]/20 focus:border-[#FF795C] cursor-pointer transition-all truncate"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat} className="text-[#082C43] font-medium py-1">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#082C43] absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile View: High-Performance Smooth Swipe like MICE */}
          <div className="block sm:hidden">
            <div
              ref={packagesSliderRef}
              onScroll={handlePackagesScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth py-3 px-[7vw] scrollbar-none select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayedPackages.map((pkg, idx) => {
                const isActive = idx === activePackageIndex;
                return (
                  <div
                    key={pkg.id}
                    className={`shrink-0 snap-center w-[86vw] max-w-[340px] transition-all duration-300 ${
                      isActive ? 'scale-100 shadow-xl opacity-100 ring-1 ring-[#FF795C]/20' : 'scale-[0.94] shadow-md opacity-85'
                    }`}
                  >
                    <PackageCard
                      packageData={pkg}
                      onEnquire={() => handleOpenTripModal()}
                    />
                  </div>
                );
              })}
            </div>

            {/* Clean, Responsive Progress Dots */}
            {displayedPackages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {displayedPackages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToPackageCard(idx)}
                    aria-label={`Go to package slide ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                      activePackageIndex === idx
                        ? 'w-6 bg-[#FF795C]'
                        : 'w-1.5 bg-[#082C43]/20 hover:bg-[#082C43]/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop & Tablet View: Grid - Exactly 9 Cards */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageData={pkg}
                onEnquire={() => handleOpenTripModal()}
              />
            ))}
          </div>

          {/* Explore All Packages CTA Button */}
          <div className="mt-6 text-center">
            <Link to="/packages">
              <Button
                variant="outline"
                size="lg"
                className="border-[#082C43] text-[#082C43] hover:bg-[#082C43] hover:text-white font-bold text-xs"
              >
                View All Holiday Packages ({packages.length}) →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: GUARANTEED GROUP TOURS                        */}
      {/* ======================================================== */}
      {upcomingGroupTours.length > 0 && (
        <section className="py-6 sm:py-8 relative bg-[#082C43] text-white overflow-hidden">
          <TravelPatternBg variant="navy" opacity={0.06} />

          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div>
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

            {/* Mobile View: High-Performance Smooth Swipe like MICE */}
            <div className="block sm:hidden">
              <div
                ref={groupToursSliderRef}
                onScroll={handleGroupToursScroll}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth py-3 px-[7vw] scrollbar-none select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {upcomingGroupTours.map((tour, idx) => (
                  <div key={tour.id} className="shrink-0 snap-center">
                    {renderGroupTourCard(tour, true, idx === activeGroupTourIndex)}
                  </div>
                ))}
              </div>

              {/* Clean, Responsive Progress Dots */}
              {upcomingGroupTours.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {upcomingGroupTours.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToGroupTourCard(idx)}
                      aria-label={`Go to group tour slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                        activeGroupTourIndex === idx
                          ? 'w-6 bg-[#55C9BD]'
                          : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop & Tablet View: 3-Column Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGroupTours.map((tour) => renderGroupTourCard(tour, false, true))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* SECTION 5.8: MICE & CORPORATE TRAVEL (tripbygenie.in)     */}
      {/* Meetings, Incentives, Conferences & Exhibitions          */}
      {/* ======================================================== */}
      <section className="py-6 sm:py-8 bg-[#F8F1E7]/70 relative border-t border-[#EFE7DA]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          
          {/* Section Header matching tripbygenie.in */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="max-w-3xl space-y-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#082C43] font-display">
                Corporate Travel & MICE Solutions
              </h2>
              <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
                Discover expert MICE travel solutions with the Best Travel Agency in South India for seamless meetings, incentives, conferences, and corporate events tailored to your business needs.
              </p>
            </div>

            {/* Desktop Only Header Button */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <Link
                to="/mice"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#082C43] hover:bg-[#17648A] text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>About MICE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Mobile View: High-Performance Smooth Swipe with Bump Effect */}
          <div className="block sm:hidden">
            <div 
              ref={miceSliderRef}
              onScroll={handleMiceScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth py-3 px-[7vw] scrollbar-none select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {micePillars.map((pillar, idx) => (
                <div key={pillar.title} className="shrink-0 snap-center">
                  {renderMiceCard(pillar, true, idx === activeMiceIndex)}
                </div>
              ))}
            </div>

            {/* Clean, Responsive Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {micePillars.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToMiceCard(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                    activeMiceIndex === idx
                      ? 'w-6 bg-[#082C43]'
                      : 'w-1.5 bg-[#082C43]/20 hover:bg-[#082C43]/40'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View: About MICE Button (positioned below cards & dots, above corporate support bar) */}
            <div className="mt-4 flex justify-center">
              <Link
                to="/mice"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#082C43] hover:bg-[#17648A] text-white text-xs font-bold shadow-sm transition-all w-full max-w-[260px]"
              >
                <span>About MICE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Desktop & Tablet View: 4-Column Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {micePillars.map((pillar) => renderMiceCard(pillar, false, true))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: TRAVEL SERVICES (10 Services from Reference)  */}
      {/* ======================================================== */}
      <section className="py-6 sm:py-8 bg-[#FFFDF8] relative border-t border-[#EFE7DA]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              End-to-End Travel Services
            </h2>
            <p className="text-sm text-[#173247]/75 mt-1.5">
              From air ticketing and luxury coaches to hassle-free visa processing and corporate retreats.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs hover:shadow-md hover:border-[#55C9BD]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#082C43]/5 flex items-center justify-center text-[#17648A] mb-3 group-hover:scale-105 transition-transform">
                    {renderServiceIcon(srv)}
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
      {/* SECTION 6.5: EASY TRAVEL LOANS (tripbygenie.in)           */}
      {/* 5 Cards with 0 Down Payment, 0% Interest, 0 Fee, 6M EMI  */}
      {/* ======================================================== */}
      <section className="py-6 sm:py-8 bg-[#FFFDF8] relative border-t border-[#EFE7DA]">
        <div className="max-w-[1450px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-1.5 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082C43] font-display leading-tight">
              Say Goodbye to Stress, Hello to Blissful Holidays with Easy Travel Loans
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/75 max-w-xl mx-auto">
              Don’t postpone your dream holiday. Travel with zero upfront burden and pay in simple, transparent monthly installments with Trip by Genie financing partners.
            </p>
          </div>

          {/* Mobile View: Horizontal Smooth Slide View with Snap & Progress Dots */}
          <div className="block sm:hidden">
            <div
              ref={loanSliderRef}
              onScroll={handleLoanScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 px-[11vw] scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {loanCards.map((card) => renderLoanCard(card, true))}
            </div>

            {/* Subtle Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {loanCards.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToLoanCard(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full h-1.5 ${
                    activeLoanIndex === idx
                      ? 'w-6 bg-[#082C43]'
                      : 'w-1.5 bg-[#082C43]/20 hover:bg-[#082C43]/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop & Tablet View: 5-Column Side-by-Side Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {loanCards.map((card) => renderLoanCard(card, false))}
          </div>

          {/* Quick Eligibility Bar */}
          <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F8F1E7] border border-[#EFE7DA] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#55C9BD]/20 text-[#17648A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#55C9BD]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#082C43]">
                  Instant Digital Verification • Zero Physical Paperwork
                </h4>
                <p className="text-[11px] text-[#173247]/75">
                  Available on all domestic and international holiday tour packages above ₹15,000 per person.
                </p>
              </div>
            </div>

            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenTripModal}
                className="flex-1 sm:flex-initial h-8 px-3 text-[11px] sm:text-xs font-bold rounded-lg shadow-xs justify-center whitespace-nowrap"
              >
                Apply for 0% EMI Trip
              </Button>
              <a
                href="https://wa.me/919940463566?text=Hi%20TripbyGenie,%20I%20would%20like%20to%20know%20more%20about%20Zero%20Rupees%20Down%20Payment%20and%20No%20Cost%20EMI%20holiday%20plans"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] sm:text-xs font-bold shadow-xs transition-colors shrink-0 whitespace-nowrap"
              >
                <PhoneCall className="w-3 h-3 shrink-0" />
                <span>WhatsApp EMI Desk</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: WHY TRAVEL WITH TRIP BY GENIE                 */}
      {/* ======================================================== */}
      <section className="py-6 sm:py-8 bg-[#F8F1E7]/50 relative border-t border-[#EFE7DA]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-5">
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

              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOpenTripModal}
                  className="shadow-md font-bold text-xs w-full sm:w-auto justify-center"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Get Free Trip Quotation
                </Button>
                <a href="tel:+914446071374" className="w-full sm:w-auto block sm:inline-block">
                  <Button variant="outline" size="lg" className="border-[#082C43] text-[#082C43] font-bold text-xs w-full sm:w-auto justify-center">
                    <PhoneCall className="w-4 h-4 mr-1.5 text-[#55C9BD]" />
                    Call +91 (44) 46071374
                  </Button>
                </a>
              </div>
            </div>

            {/* Genuine Trust Stats Card */}
            <div className="bg-[#082C43] text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <TravelPatternBg variant="navy" opacity={0.08} />
              <div className="relative z-10 space-y-5">
                <h3 className="text-xl font-bold font-display text-white">Genuine Business Milestones</h3>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
      {/* Sliding stories from left to right with navigation arrows */}
      {/* ======================================================== */}
      <section className="py-6 sm:py-8 bg-[#FFFDF8] relative overflow-hidden">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          {/* Header with Title */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              Customer Testimonials
            </h2>
            <p className="text-sm text-[#173247]/75 mt-1.5">
              Hear directly from families, honeymoon couples, and corporate groups who journeyed with Trip by Genie.
            </p>
          </div>

          {/* Sliding Stories Carousel with Left & Right Side Arrows */}
          <div className="relative group/carousel">
            {/* Left Side Arrow - Only appears when there are reviews on the left */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={handlePrevStory}
                className="absolute left-1 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#EFE7DA] bg-white hover:bg-[#082C43] hover:text-white text-[#082C43] shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Slide left to previous story"
                aria-label="Previous story"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Sliding Stories Carousel Track */}
            <div
              ref={storyContainerRef}
              onScroll={checkScrollState}
              onMouseEnter={() => setIsStoryHovered(true)}
              onMouseLeave={() => setIsStoryHovered(false)}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {testimonials.map((test, index) => {
                const reviewContent = test.review_text || test.comment || '';
                const isLong = reviewContent.length > 130;

                return (
                  <div
                    key={test.id || index}
                    className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start shrink-0 bg-white p-6 rounded-3xl border border-[#EFE7DA] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-[230px]"
                  >
                    <div className="space-y-2.5 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(test.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified Trip
                        </span>
                      </div>
                      <p className="text-xs text-[#173247]/85 leading-relaxed line-clamp-3 italic">
                        "{reviewContent}"
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-[#EFE7DA] flex items-end justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <h4 className="text-base sm:text-lg font-bold text-[#082C43] truncate leading-tight">
                          {test.customer_name}
                        </h4>
                        <span className="text-xs text-[#55C9BD] font-medium block mt-0.5 truncate">
                          {test.destination}
                        </span>
                      </div>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setSelectedStory(test)}
                          className="shrink-0 text-xs font-bold text-[#FF795C] hover:text-white bg-[#FF795C]/10 hover:bg-[#FF795C] px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-none border border-[#FF795C]/25"
                        >
                          Read Story
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side Arrow - Only appears when there are reviews on the right */}
            {canScrollRight && (
              <button
                type="button"
                onClick={handleNextStory}
                className="absolute right-1 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#EFE7DA] bg-white hover:bg-[#082C43] hover:text-white text-[#082C43] shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Slide right to next story"
                aria-label="Next story"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Customer Story Popup Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EFE7DA] relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close "x" Symbol Button */}
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#082C43] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-3">
              {[...Array(selectedStory.rating || 5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Customer Details */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#082C43] font-display pr-8">
              {selectedStory.customer_name}
            </h3>
            <span className="text-xs sm:text-sm text-[#55C9BD] font-semibold block mt-1">
              {selectedStory.destination}
            </span>

            <div className="my-5 border-t border-[#EFE7DA]" />

            {/* Full Review Text */}
            <div className="max-h-[55vh] overflow-y-auto pr-2">
              <p className="text-sm text-[#173247]/90 leading-relaxed whitespace-pre-line font-normal">
                "{selectedStory.review_text || selectedStory.comment}"
              </p>
            </div>
          </div>
        </div>
      )}

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
