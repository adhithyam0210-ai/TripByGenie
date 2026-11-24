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

  // Lock body scroll & prevent underlying page scrolling when desktop dropdown or mobile menu is open
  useEffect(() => {
    if (activeDropdown || isMobileMenuOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Intercept wheel events so the underlying page is 100% frozen
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement | null;
        const scrollContainer = target?.closest('.dropdown-scroll-box') as HTMLElement | null;

        if (!scrollContainer) {
          // Outside the scrollable dropdown box: block wheel scrolling completely
          e.preventDefault();
          return;
        }

        // Inside scrollable dropdown box: allow scrolling inside, but block chaining at top/bottom edges
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

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

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }, [activeDropdown, isMobileMenuOpen]);

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
      {/* MAIN NAVIGATION BAR (Sticky, Header, Mega Dropdowns)      */}
      {/* ======================================================== */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-2.5 border-b border-[#EFE7DA]'
            : 'bg-white py-3.5 border-b border-[#EFE7DA]/80 shadow-xs'
        }`}
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between gap-4">
          {/* Logo & Brand matching tripbygenie.in */}
          <div className="shrink-0">
            <BrandLogo
              size="lg"
              imgClassName="h-13 sm:h-16 md:h-18 lg:h-[74px]"
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>

          {/* Desktop Navigation Links — Blue Pill Buttons matching Image 2 */}
          <nav className="hidden xl:flex items-center gap-2 2xl:gap-3">
            {/* 1. Home */}
            <Link
              to="/"
              className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Home
            </Link>

            {/* 2. About Us */}
            <Link
              to="/about"
              className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/about'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
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
                className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center gap-1.5 justify-center whitespace-nowrap ${
                  location.pathname === '/packages' || activeDropdown === 'packages'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>Packages</span>
                <span className="text-xs transform translate-y-[0.5px]">▼</span>
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
                className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center gap-1.5 justify-center whitespace-nowrap ${
                  location.pathname === '/destinations' || activeDropdown === 'india'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>India</span>
                <span className="text-xs transform translate-y-[0.5px]">▼</span>
              </button>

              {/* India Mega Dropdown Box */}
              {activeDropdown === 'india' && (
                <div
                  className="dropdown-scroll-box absolute top-full mt-2 left-0 w-[880px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50"
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
                className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center gap-1.5 justify-center whitespace-nowrap ${
                  location.pathname === '/honeymoon' || activeDropdown === 'honeymoon'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>Honeymoon</span>
                <span className="text-xs transform translate-y-[0.5px]">▼</span>
              </button>

              {activeDropdown === 'honeymoon' && (
                <div
                  className="dropdown-scroll-box absolute top-full mt-2 left-0 w-[620px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50"
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

            {/* 6. Group Tours (Direct link to dedicated /group-tours page) */}
            <Link
              to="/group-tours"
              onClick={() => setActiveDropdown(null)}
              className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/group-tours'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Group Tours
            </Link>

            {/* 7. Tickets Bookings (Direct link button, no dropdown) */}
            <Link
              to="/services"
              onClick={() => setActiveDropdown(null)}
              className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/services'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Tickets Bookings
            </Link>

            {/* 8. Contact Us */}
            <Link
              to="/contact"
              className={`px-4.5 py-2 2xl:px-5.5 2xl:py-2.5 rounded-full text-sm 2xl:text-base font-bold tracking-tight transition-all shadow-sm flex items-center justify-center whitespace-nowrap ${
                location.pathname === '/contact'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Action: Plan Trip CTA & Quick Login */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Quick Login button near Plan Your Trip for easy testing */}
            <div className="relative dropdown-container">
              <div className="flex items-center shadow-xs">
                <Link
                  to={isAuthenticated ? getRoleDashboardPath() : '/login'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl text-xs font-bold transition-all border border-[#EFE7DA] bg-white text-[#082C43] hover:text-[#FF795C] hover:bg-[#F8F1E7]/50"
                  title="Staff, Agent, Admin & Customer Login"
                >
                  <User className="w-3.5 h-3.5 text-[#55C9BD]" />
                  <span>{isAuthenticated ? (user?.role ? user.role.toUpperCase() : 'Dashboard') : 'Login'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'quick-login' ? null : 'quick-login')}
                  className="p-1.5 rounded-r-xl border-y border-r border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50 text-slate-500 hover:text-[#082C43] transition-colors cursor-pointer"
                  title="Switch Role / Easy Login"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Role Switcher Dropdown */}
              {activeDropdown === 'quick-login' && (
                <div
                  className="dropdown-scroll-box absolute right-0 mt-2 w-56 max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-[#EFE7DA] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
                  style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin' }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-[#EFE7DA] mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Easy Login (Quick Switch)
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium">
                      One-click test access to any portal:
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('admin').then(() => {
                          navigate('/admin/dashboard');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-[#082C43] hover:text-[#FF795C] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[#FF795C]" />
                        Super Admin
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('manager').then(() => {
                          navigate('/manager/dashboard');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 text-[#082C43] hover:text-purple-700 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        Manager Portal
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">Manager</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('staff').then(() => {
                          navigate('/staff/leads');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-[#082C43] hover:text-[#004c8f] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#004c8f]" />
                        Sales Executive CRM
                      </span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">Sales</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('operations').then(() => {
                          navigate('/operations/dashboard');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-[#082C43] hover:text-blue-700 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Operations Logistics
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Operations</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('agent').then(() => {
                          navigate('/agent/marketplace');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-[#082C43] hover:text-[#FF795C] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-[#FF795C]" />
                        B2B Agent Portal
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">Agent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        demoLogin('customer').then(() => {
                          navigate('/customer/dashboard');
                          setActiveDropdown(null);
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 text-[#082C43] hover:text-[#55C9BD] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#55C9BD]" />
                        Customer Portal
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">User</span>
                    </button>
                  </div>

                  <div className="pt-2 mt-1 border-t border-[#EFE7DA] flex items-center justify-between px-2">
                    <Link
                      to="/login"
                      onClick={() => setActiveDropdown(null)}
                      className="text-[11px] font-bold text-[#FF795C] hover:underline"
                    >
                      Standard Login Page →
                    </Link>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setActiveDropdown(null);
                        }}
                        className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenTripModal}
              className="shadow-md shadow-[#FF795C]/25 text-xs font-bold whitespace-nowrap shrink-0 h-9 px-3.5 inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Plan Your Trip</span>
            </Button>
          </div>

          {/* Mobile Menu Actions & Hamburger */}
          <div className="flex xl:hidden items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              className="text-xs bg-[#082C43] hover:bg-[#003b73] text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all shadow-xs"
              title="Staff, Agent & Customer Login"
            >
              <User className="w-3.5 h-3.5 text-[#55C9BD]" />
              <span>Login</span>
            </Link>
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

      {/* Full-screen Backdrop for Desktop Dropdowns: prevents background chain scrolling & closes on click */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[0.5px] transition-opacity animate-in fade-in duration-150 overscroll-contain"
          style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
          onClick={() => setActiveDropdown(null)}
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

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
            className="dropdown-scroll-box w-full max-w-sm bg-[#082C43] text-white h-full overflow-y-auto overscroll-contain p-6 flex flex-col justify-between shadow-2xl"
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
                  <BrandLogo size="sm" to="/" onClick={() => setIsMobileMenuOpen(false)} />
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

            {/* Bottom Actions & Contacts */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenTripModal) onOpenTripModal();
                }}
                className="w-full text-xs font-bold shadow-lg"
              >
                Plan Your Customized Trip
              </Button>

              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/80 bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="font-semibold">Logged in as <strong className="text-[#55C9BD]">{user.name}</strong></span>
                    <span className="text-[10px] bg-[#FF795C] text-white px-2 py-0.5 rounded-full font-bold uppercase">{user.role}</span>
                  </div>
                  <Link to={getRoleDashboardPath(user.role)} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full text-white border-white/30 text-xs font-bold hover:bg-white/10">
                      Go to {user.role.toUpperCase()} Workspace →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#55C9BD] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Staff & Partner Access Portals</span>
                    </span>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-[#FF795C] text-[10px] font-bold lowercase hover:underline"
                    >
                      all logins →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/login?role=staff"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex flex-col text-left transition-colors group"
                    >
                      <span className="font-bold text-white flex items-center gap-1.5 group-hover:text-[#55C9BD]">
                        <Users className="w-3.5 h-3.5 text-[#55C9BD]" />
                        Staff CRM
                      </span>
                      <span className="text-[10px] text-white/60 mt-0.5">Leads & Follow-ups</span>
                    </Link>

                    <Link
                      to="/login?role=agent"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex flex-col text-left transition-colors group"
                    >
                      <span className="font-bold text-white flex items-center gap-1.5 group-hover:text-amber-400">
                        <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                        B2B Agent
                      </span>
                      <span className="text-[10px] text-white/60 mt-0.5">Wholesale Net Rates</span>
                    </Link>

                    <Link
                      to="/login?role=admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex flex-col text-left transition-colors group"
                    >
                      <span className="font-bold text-white flex items-center gap-1.5 group-hover:text-[#FF795C]">
                        <Shield className="w-3.5 h-3.5 text-[#FF795C]" />
                        Admin CRM
                      </span>
                      <span className="text-[10px] text-white/60 mt-0.5">Executive Command</span>
                    </Link>

                    <Link
                      to="/login?role=customer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex flex-col text-left transition-colors group"
                    >
                      <span className="font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        Customer
                      </span>
                      <span className="text-[10px] text-white/60 mt-0.5">Bookings & Hub</span>
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white/5 p-3 rounded-xl text-xs space-y-1.5 text-white/80">
                <p className="font-bold text-[#55C9BD]">Direct Contact Helpline</p>
                <p>Phone: <a href="tel:+914446071374" className="text-white hover:underline">+91 (44) 46071374</a></p>
                <p>WhatsApp: <a href="https://wa.me/919940463566" className="text-white hover:underline">+91 99404 63566</a></p>
                <p>Email: <a href="mailto:info@tripbygenie.com" className="text-white hover:underline">info@tripbygenie.com</a></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
