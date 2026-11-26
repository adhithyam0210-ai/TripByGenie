import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Menu,
  X,
  ChevronDown,
  User,
  Phone,
  Mail,
  Clock,
  MapPin,
  Plane,
  Heart,
  Users,
  ShieldCheck,
  Shield,
  Briefcase,
  Send,
  Globe2,
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { BrandLogo } from '../common/BrandLogo';

interface PublicNavbarProps {
  onOpenTripModal?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onOpenTripModal }) => {
  const { user, isAuthenticated, getRoleDashboardPath, currentAgency, demoLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Lock body scroll when mobile menu drawer or desktop dropdown popup is open
  useEffect(() => {
    if (isMobileMenuOpen || activeDropdown) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isMobileMenuOpen, activeDropdown]);

  // Prevent background chain scrolling:
  // 1. Scrolling outside the popup does NOT close it, and does NOT scroll the below page
  // 2. Scrolling inside the popup scrolls only the popup and cannot chain-scroll the page
  // 3. Popup closes only when clicking outside or clicking the top menu button again
  useEffect(() => {
    if (activeDropdown) {
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement | null;
        const scrollContainer = target?.closest('.dropdown-scroll-box') as HTMLElement | null;

        // If scrolling outside the dropdown container:
        // Lock background scroll and keep the popup open (do not close on scroll)
        if (!scrollContainer) {
          e.preventDefault();
          return;
        }

        // If scrolling inside the dropdown container:
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const canScroll = scrollHeight > clientHeight;

        // If the dropdown fits entirely without overflowing, prevent scrolling behind it
        if (!canScroll) {
          e.preventDefault();
          return;
        }

        // Prevent chain scrolling when reaching the boundaries of the scrollable dropdown
        const isAtTop = scrollTop <= 0;
        const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1;

        if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
          e.preventDefault();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement | null;
        const scrollContainer = target?.closest('.dropdown-scroll-box');
        if (!scrollContainer) {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

      return () => {
        window.removeEventListener('wheel', handleWheel, { capture: true });
        window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      };
    }
  }, [activeDropdown]);

  // Close dropdown or mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    if (activeDropdown || isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeDropdown, isMobileMenuOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileSection = (key: string) => {
    setMobileSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleHomeClick = () => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Continents and countries from tripbygenie.in
  const internationalDestinations = [
    {
      continent: 'Asia',
      countries: ['Bali', 'Thailand', 'Singapore', 'Malaysia', 'Vietnam', 'Japan', 'Hong Kong', 'Indonesia', 'Cambodia', 'China', 'South Korea', 'Philippines', 'Taiwan', 'Kazakhstan', 'Uzbekistan']
    },
    {
      continent: 'Europe',
      countries: ['Switzerland', 'France', 'Italy', 'Greece', 'United Kingdom', 'London', 'Austria', 'Germany', 'Spain', 'Netherlands', 'Iceland', 'Croatia', 'Norway', 'Portugal', 'Turkey']
    },
    {
      continent: 'Island Escapes',
      countries: ['Maldives', 'Mauritius', 'Sri Lanka', 'Seychelles', 'Madagascar', 'Reunion']
    },
    {
      continent: 'Middle East',
      countries: ['Dubai / UAE', 'Egypt', 'Jordan', 'Oman', 'Qatar', 'Israel']
    },
    {
      continent: 'Africa',
      countries: ['Kenya', 'South Africa', 'Morocco', 'Zimbabwe', 'Tanzania']
    },
    {
      continent: 'America & Pacific',
      countries: ['Australia', 'New Zealand', 'Fiji', 'USA', 'Canada', 'Alaska', 'South America']
    }
  ];

  // India regions from tripbygenie.in
  const indiaDestinations = [
    {
      region: 'South India',
      badge: 'Specialist',
      spots: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Bangalore', 'Mysore', 'Kochi', 'Hyderabad', 'Ooty']
    },
    {
      region: 'North India',
      badge: 'Popular',
      spots: ['Delhi', 'Manali', 'Shimla', 'Jaipur', 'Ladakh', 'Jammu and Kashmir', 'Agra']
    },
    {
      region: 'East & North East',
      badge: 'Scenic',
      spots: ['Gangtok', 'Pelling', 'Darjeeling', 'West Bengal', 'Arunachal Pradesh']
    },
    {
      region: 'West India',
      badge: 'Beach & Hills',
      spots: ['Goa', 'Pune', 'Mumbai', 'Maharashtra']
    },
    {
      region: 'Spiritual Tours',
      badge: 'Devotion',
      spots: ['Ayodhya', 'Tirupati', 'Haridwar & Rishikesh']
    },
    {
      region: 'Honeymoon Special',
      badge: 'Romantic',
      spots: ['Munnar', 'Andaman', 'Kodaikanal', 'Coorg', 'Kashmir']
    }
  ];

  // Honeymoon spots matching tripbygenie.in
  const honeymoonDestinations = [
    {
      type: 'India Romantic Escapes',
      spots: ['Kerala', 'Munnar', 'Andaman', 'Goa', 'Shimla', 'Manali', 'Kashmir', 'Ooty', 'Kodaikanal', 'Coorg']
    },
    {
      type: 'International Honeymoon',
      spots: ['Maldives', 'Bali', 'Switzerland', 'Mauritius', 'Paris', 'Italy', 'Greece', 'Dubai', 'Thailand', 'Singapore', 'Australia']
    }
  ];

  // Ticketing & travel services matching tripbygenie.in
  const ticketingServices = [
    { name: 'Flight Tickets Booking', desc: 'Domestic & International airlines with 24/7 rebooking support', icon: 'Plane', path: '/services' },
    { name: 'Train & IRCTC Bookings', desc: 'Confirmed tatkal & premium express bookings across India', icon: 'Clock', path: '/services' },
    { name: 'Bus Tickets Booking', desc: 'Luxury AC Volvo, sleeper coaches & intercity transfers', icon: 'MapPin', path: '/services' },
    { name: 'Hotel & Resort Stays', desc: 'Handpicked 4-star & 5-star verified boutique properties', icon: 'ShieldCheck', path: '/services' },
    { name: 'Visa & Forex Support', desc: 'Fast-track visa filing, embassy appointments & currency exchange', icon: 'Globe2', path: '/services' }
  ];

  const getCleanSearchTerm = (item: string) => {
    return item.replace(/\s*\([^)]*\)/g, '').replace(' / UAE', '').trim();
  };

  const getDestinationSlug = (name: string): string => {
    const clean = name.replace(/\s*\([^)]*\)/g, '').replace(' / UAE', '').trim();
    const map: Record<string, string> = {
      'Australia': 'australia',
      'Singapore': 'singapore',
      'Bali': 'bali',
      'Thailand': 'thailand',
      'Malaysia': 'malaysia',
      'Vietnam': 'vietnam',
      'Japan': 'japan',
      'Hong Kong': 'hong-kong',
      'Indonesia': 'indonesia',
      'Cambodia': 'cambodia',
      'China': 'china',
      'South Korea': 'south-korea',
      'Philippines': 'philippines',
      'Taiwan': 'taiwan',
      'Kazakhstan': 'kazakhstan',
      'Uzbekistan': 'uzbekistan',
      'Switzerland': 'switzerland',
      'France': 'france-paris',
      'Paris': 'france-paris',
      'Italy': 'italy',
      'Greece': 'greece',
      'United Kingdom': 'united-kingdom',
      'London': 'london',
      'Austria': 'austria',
      'Germany': 'germany',
      'Spain': 'spain',
      'Netherlands': 'netherlands',
      'Iceland': 'iceland',
      'Croatia': 'croatia',
      'Norway': 'norway',
      'Portugal': 'portugal',
      'Turkey': 'turkey',
      'Maldives': 'maldives',
      'Mauritius': 'mauritius',
      'Sri Lanka': 'sri-lanka',
      'Seychelles': 'seychelles',
      'Madagascar': 'madagascar',
      'Reunion': 'reunion',
      'Dubai': 'dubai',
      'Dubai / UAE': 'dubai',
      'UAE': 'uae',
      'Egypt': 'egypt',
      'Jordan': 'jordan',
      'Oman': 'oman',
      'Qatar': 'qatar',
      'Israel': 'israel',
      'Kenya': 'kenya',
      'South Africa': 'south-africa',
      'Morocco': 'morocco',
      'Zimbabwe': 'zimbabwe',
      'Tanzania': 'tanzania',
      'New Zealand': 'new-zealand',
      'Fiji': 'fiji',
      'USA': 'united-states',
      'Canada': 'canada',
      'Alaska': 'alaska',
      'South America': 'south-america',
      'Kerala': 'kerala',
      'Tamil Nadu': 'tamil-nadu',
      'Karnataka': 'karnataka',
      'Bangalore': 'bangalore',
      'Mysore': 'mysore',
      'Kochi': 'kochi',
      'Hyderabad': 'hyderabad',
      'Ooty': 'ooty',
      'Delhi': 'delhi',
      'Manali': 'manali',
      'Shimla': 'shimla',
      'Jaipur': 'jaipur',
      'Ladakh': 'ladakh',
      'Jammu and Kashmir': 'jammu-and-kashmir',
      'Agra': 'agra',
      'Gangtok': 'gangtok',
      'Pelling': 'pelling',
      'Darjeeling': 'darjeeling',
      'West Bengal': 'west-bengal',
      'Arunachal Pradesh': 'arunachal-pradesh',
      'Goa': 'goa',
      'Pune': 'pune',
      'Mumbai': 'mumbai',
      'Maharashtra': 'maharashtra',
      'Ayodhya': 'ayodhya',
      'Tirupati': 'tirupati',
      'Haridwar & Rishikesh': 'haridwar-rishikesh',
      'Munnar': 'munnar',
      'Andaman': 'andaman',
      'Kodaikanal': 'kodaikanal',
      'Coorg': 'coorg',
      'Kashmir': 'kashmir'
    };
    return map[clean] || map[name] || clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  return (
    <>
      {/* ======================================================== */}
      {/* MAIN NAVIGATION BAR (Fixed, Header, Mega Dropdowns)       */}
      {/* ======================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-1.5 border-b border-[#EFE7DA]'
            : 'bg-white py-2 border-b border-[#EFE7DA]/80 shadow-xs'
        }`}
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between gap-3">
          {/* Logo & Brand matching tripbygenie.in */}
          <div className="shrink-0">
            <BrandLogo
              size="md"
              imgClassName="h-9 sm:h-10 md:h-11 lg:h-[46px]"
              to="/"
              onClick={handleHomeClick}
            />
          </div>

          {/* Desktop Navigation Links — Compact Blue Pill Buttons */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2">
            {/* 1. Home */}
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Home
            </Link>

            {/* 2. About Us */}
            <Link
              to="/about"
              className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/about'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              About Us
            </Link>

            {/* 3. Packages ▾ (Dropdown with Worldwide & International Tour Packages - Click to toggle) */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'packages' ? null : 'packages')}
                className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center gap-1 justify-center whitespace-nowrap ${
                  location.pathname === '/packages' || activeDropdown === 'packages'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>Packages</span>
                <span className="text-[9px] transform translate-y-[0.5px]">▼</span>
              </button>

              {/* Mega Dropdown Box */}
              {activeDropdown === 'packages' && (
                <div
                  className="dropdown-scroll-box absolute top-full mt-2 left-0 w-[840px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50"
                  style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin' }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-[#17648A]" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#082C43]">
                        Worldwide Holiday Tour Packages
                      </span>
                    </div>
                    <Link
                      to="/packages"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-[#FF795C] hover:underline"
                    >
                      View All Packages →
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {internationalDestinations.map((col) => (
                      <div key={col.continent} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#17648A] border-b border-gray-100 pb-1 flex items-center justify-between">
                          <span>{col.continent}</span>
                          <span className="text-[10px] text-gray-400 font-normal whitespace-nowrap shrink-0">{col.countries.length} Tours</span>
                        </h4>
                        <ul className="space-y-1">
                          {col.countries.map((c) => (
                            <li key={c}>
                              <Link
                                to={`/destinations/${getDestinationSlug(c)}`}
                                onClick={() => setActiveDropdown(null)}
                                className="text-xs text-gray-700 hover:text-[#FF795C] hover:translate-x-1 transition-all flex items-center justify-between py-0.5 group"
                              >
                                <span>{c}</span>
                                <span className="text-[10px] text-gray-300 group-hover:text-[#FF795C]">›</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Mega footer banner */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between bg-[#F8F1E7]/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <ShieldCheck className="w-4 h-4 text-[#FF795C]" />
                      <span>Need a custom international itinerary? Get visa assistance, flights & 4-star stays.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        if (onOpenTripModal) onOpenTripModal();
                      }}
                      className="text-xs font-bold text-[#082C43] hover:text-[#FF795C] underline cursor-pointer"
                    >
                      Customise Trip Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. India ▾ (Dropdown with South India & Regional Escapes - Click to toggle) */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'india' ? null : 'india')}
                className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center gap-1 justify-center whitespace-nowrap ${
                  location.pathname === '/destinations' || activeDropdown === 'india'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>India</span>
                <span className="text-[9px] transform translate-y-[0.5px]">▼</span>
              </button>

              {/* India Mega Dropdown Box */}
              {activeDropdown === 'india' && (
                <div
                  className="dropdown-scroll-box absolute top-full mt-2 left-1/2 -translate-x-1/3 2xl:-translate-x-1/2 w-[880px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50"
                  style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin' }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#FF795C]" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#082C43]">
                        Incredible India & South India Escapes
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Special South Indian Food & Transfers Included
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {indiaDestinations.map((col) => (
                      <div key={col.region} className="space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17648A]">
                            {col.region}
                          </h4>
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                            {col.badge}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {col.spots.map((spot) => (
                            <li key={spot}>
                              <Link
                                to={`/destinations/${getDestinationSlug(spot)}`}
                                onClick={() => setActiveDropdown(null)}
                                className="text-xs text-gray-700 hover:text-[#FF795C] hover:translate-x-1 transition-all flex items-center justify-between py-0.5 group"
                              >
                                <span>{spot}</span>
                                <span className="text-[10px] text-gray-300 group-hover:text-[#FF795C]">›</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* India footer banner */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between bg-amber-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>Chennai, Bangalore, Hyderabad & Kochi departures available with dedicated tempo travellers and cars.</span>
                    </div>
                    <Link
                      to="/destinations"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-amber-800 hover:underline"
                    >
                      Explore All India Tours →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Honeymoon ▾ (Dropdown with India & International Romantic Getaways) */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'honeymoon' ? null : 'honeymoon')}
                className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center gap-1 justify-center whitespace-nowrap ${
                  location.pathname === '/honeymoon' || activeDropdown === 'honeymoon'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>Honeymoon</span>
                <span className="text-[9px] transform translate-y-[0.5px]">▼</span>
              </button>

              {activeDropdown === 'honeymoon' && (
                <div
                  className="dropdown-scroll-box absolute top-full mt-2 right-0 2xl:left-1/2 2xl:-translate-x-1/2 w-[620px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50"
                  style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin' }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#082C43]">
                        Handpicked Honeymoon Packages
                      </span>
                    </div>
                    <Link
                      to="/honeymoon"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-[#FF795C] hover:underline"
                    >
                      All Honeymoon Tours →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {honeymoonDestinations.map((col) => (
                      <div key={col.type} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#17648A] border-b border-gray-100 pb-1">
                          {col.type}
                        </h4>
                        <ul className="space-y-1">
                          {col.spots.map((spot) => (
                            <li key={spot}>
                              <Link
                                to={`/destinations/${getDestinationSlug(spot)}`}
                                onClick={() => setActiveDropdown(null)}
                                className="text-xs text-gray-700 hover:text-[#FF795C] hover:translate-x-1 transition-all flex items-center justify-between py-0.5 group"
                              >
                                <span>{spot}</span>
                                <span className="text-[10px] text-gray-300 group-hover:text-[#FF795C]">›</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Tickets Bookings (Direct link button, no dropdown) */}
            <Link
              to="/services"
              onClick={() => setActiveDropdown(null)}
              className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/services'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Tickets Bookings
            </Link>

            {/* 8. Contact Us */}
            <Link
              to="/contact"
              className={`px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-full text-xs 2xl:text-[13px] font-bold tracking-tight transition-all shadow-xs flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/contact'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-sm'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Action: Sign In & Plan Trip CTA */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to={getRoleDashboardPath()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-[#003b73]/20 bg-[#003b73]/5 hover:bg-[#003b73]/10 text-[#003b73] shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-[#003b73]" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-[#082C43]/20 bg-white hover:bg-[#F8F1E7]/50 text-[#082C43] hover:text-[#FF795C] shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-[#004c8f]" />
                <span>Sign In</span>
              </Link>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenTripModal}
              className="shadow-md shadow-[#FF795C]/25 text-xs font-bold whitespace-nowrap shrink-0 h-8 px-3.5 inline-flex items-center gap-1.5 rounded-full"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Plan Your Trip</span>
            </Button>
          </div>

          {/* Mobile Menu Actions & Hamburger */}
          <div className="flex xl:hidden items-center gap-1.5 sm:gap-2">
            {isAuthenticated && user ? (
              <Link
                to={getRoleDashboardPath(user.role)}
                className="text-xs bg-[#082C43] hover:bg-[#003b73] text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all shadow-xs"
                title={`${user.role.toUpperCase()} Workspace`}
              >
                <User className="w-3.5 h-3.5 text-[#55C9BD]" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs bg-[#082C43] hover:bg-[#003b73] text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all shadow-xs"
                title="Staff, Agent & Customer Login"
              >
                <User className="w-3.5 h-3.5 text-[#55C9BD]" />
                <span>Login</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onOpenTripModal}
              className="text-xs bg-[#FF795C] hover:bg-[#e06348] text-white px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-xs"
            >
              Plan Trip
            </button>
            <button
              onClick={() => {
                setActiveDropdown(null);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-1.5 sm:p-2 rounded-xl text-[#082C43] hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-[#FF795C]" /> : <Menu className="w-6 h-6 text-[#082C43]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to preserve document layout flow under the fixed navbar */}
      <div className="h-[56px] sm:h-[60px] md:h-[64px] lg:h-[68px] shrink-0 pointer-events-none" aria-hidden="true" />


      {/* ======================================================== */}
      {/* MOBILE NAVIGATION DRAWER (Full Categories & Phone)       */}
      {/* ======================================================== */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in overscroll-contain"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="dropdown-scroll-box w-full max-w-sm bg-[#082C43] text-white h-full overflow-y-auto overscroll-contain p-6 flex flex-col shadow-2xl"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs">
                  <BrandLogo size="sm" to="/" onClick={handleHomeClick} />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Direct links */}
              <div className="space-y-2 text-sm font-semibold">
                <Link
                  to="/"
                  onClick={handleHomeClick}
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  About Us
                </Link>

                {/* International accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileSection('intl')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <span>International Packages</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSectionOpen.intl ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileSectionOpen.intl && (
                    <div className="pl-4 pr-2 py-2 space-y-3 bg-black/20 rounded-xl my-1 text-xs">
                      {internationalDestinations.map(cat => (
                        <div key={cat.continent}>
                          <p className="font-bold text-[#55C9BD] uppercase tracking-wider mb-1">{cat.continent}</p>
                          <div className="grid grid-cols-2 gap-1 text-white/80">
                            {cat.countries.map(c => (
                              <Link
                                key={c}
                                to={`/destinations/${getDestinationSlug(c)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="hover:text-[#FF795C] py-0.5"
                              >
                                {c}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* India accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileSection('india')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>India & South India</span>
                      <span className="text-[9px] bg-[#55C9BD] text-[#082C43] font-bold px-1 rounded">Top</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSectionOpen.india ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileSectionOpen.india && (
                    <div className="pl-4 pr-2 py-2 space-y-3 bg-black/20 rounded-xl my-1 text-xs">
                      {indiaDestinations.map(reg => (
                        <div key={reg.region}>
                          <p className="font-bold text-[#FF795C] uppercase tracking-wider mb-1">{reg.region}</p>
                          <div className="space-y-1 text-white/80">
                            {reg.spots.map(s => (
                              <Link
                                key={s}
                                to={`/destinations/${getDestinationSlug(s)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block hover:text-[#55C9BD] py-0.5"
                              >
                                {s}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/honeymoon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  Honeymoon Packages
                </Link>

                <Link
                  to="/group-tours"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  Group Tours
                </Link>

                <Link
                  to="/services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  Tickets Bookings
                </Link>

                <Link
                  to="/contact"
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
