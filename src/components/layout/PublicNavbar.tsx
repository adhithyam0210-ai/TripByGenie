import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Send,
  Globe2,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { BrandLogo } from '../common/BrandLogo';

interface PublicNavbarProps {
  onOpenTripModal?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onOpenTripModal }) => {
  const { user, isAuthenticated, getRoleDashboardPath, currentAgency } = useAuth();
  const location = useLocation();
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
      countries: ['Bali', 'Thailand', 'Singapore', 'Malaysia', 'Vietnam', 'Japan', 'Hong Kong', 'Indonesia', 'Kazakhstan', 'Uzbekistan']
    },
    {
      continent: 'Europe',
      countries: ['Switzerland', 'France', 'Italy', 'Greece', 'United Kingdom', 'Austria', 'Germany', 'Spain', 'Netherlands', 'Iceland']
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
      countries: ['USA', 'Canada', 'Alaska', 'Australia', 'New Zealand', 'Fiji']
    }
  ];

  // India regions from tripbygenie.in
  const indiaDestinations = [
    {
      region: 'South India',
      badge: 'Specialist',
      spots: ['Kerala (Munnar & Alleppey)', 'Ooty & Nilgiris', 'Kodaikanal', 'Coorg (Scotland of India)', 'Bangalore & Mysore', 'Hyderabad City']
    },
    {
      region: 'North India',
      badge: 'Popular',
      spots: ['Kashmir Paradise', 'Ladakh & Pangong', 'Manali & Rohtang', 'Shimla & Kufri', 'Agra Taj Mahal', 'Jaipur & Rajasthan']
    },
    {
      region: 'North East',
      badge: 'Scenic',
      spots: ['Gangtok & Sikkim', 'Darjeeling Hills', 'Pelling & Kanchenjunga', 'Arunachal Pradesh', 'Shillong & Meghalaya']
    },
    {
      region: 'West & Islands',
      badge: 'Beach',
      spots: ['Goa Beaches & Cruises', 'Andaman & Nicobar Islands', 'Mumbai & Pune', 'Maharashtra Western Ghats']
    },
    {
      region: 'Spiritual Tours',
      badge: 'Devotion',
      spots: ['Ayodhya Ram Mandir', 'Tirupati Balaji Darshan', 'Haridwar & Rishikesh', 'Kashi & Varanasi', 'Madurai Meenakshi & Rameshwaram']
    },
    {
      region: 'Educational & MICE',
      badge: 'Corporate',
      spots: ['School Study Trips', 'College Industrial Visits', 'Corporate MICE Retreats', 'Team Outbound Camps']
    }
  ];

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
            <BrandLogo size="md" to="/" />
          </div>

          {/* Desktop Navigation Links — Blue Pill Buttons matching Image 2 */}
          <nav className="hidden xl:flex items-center gap-2 2xl:gap-3">
            {/* 1. Home */}
            <Link
              to="/"
              className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center justify-center ${
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
              className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center justify-center ${
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
                className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 justify-center ${
                  location.pathname === '/packages' || activeDropdown === 'packages'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>Packages</span>
                <span className="text-[10px] transform translate-y-[0.5px]">▼</span>
              </button>

              {/* Mega Dropdown Box */}
              {activeDropdown === 'packages' && (
                <div className="absolute top-full -left-20 w-[840px] bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50">
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
                          <span className="text-[10px] text-gray-400 font-normal">{col.countries.length} Tours</span>
                        </h4>
                        <ul className="space-y-1">
                          {col.countries.map((c) => (
                            <li key={c}>
                              <Link
                                to={`/packages?search=${encodeURIComponent(c)}`}
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
                className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 justify-center ${
                  location.pathname === '/destinations' || activeDropdown === 'india'
                    ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                    : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
                }`}
              >
                <span>India</span>
                <span className="text-[10px] transform translate-y-[0.5px]">▼</span>
              </button>

              {/* India Mega Dropdown Box */}
              {activeDropdown === 'india' && (
                <div className="absolute top-full -left-28 w-[880px] bg-white rounded-3xl shadow-2xl border border-[#EFE7DA] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-[#082C43] z-50">
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
                                to={`/packages?search=${encodeURIComponent(spot.split(' ')[0])}`}
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

            {/* 5. Honeymoon (Direct Link/Button - No Dropdown) */}
            <Link
              to="/honeymoon"
              className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center justify-center ${
                location.pathname === '/honeymoon'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Honeymoon
            </Link>

            {/* 6. Tickets Bookings (Direct Link/Button - No Dropdown) */}
            <Link
              to="/services"
              className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center justify-center ${
                location.pathname === '/services'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Tickets Bookings
            </Link>

            {/* 7. Contact Us */}
            <Link
              to="/contact"
              className={`px-4.5 py-1.5 2xl:px-5 2xl:py-2 rounded-full text-sm font-semibold transition-all shadow-xs flex items-center justify-center ${
                location.pathname === '/contact'
                  ? 'bg-[#003b73] text-white ring-2 ring-white/30 shadow-md'
                  : 'bg-[#004c8f] hover:bg-[#003d73] text-white'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Action: Plan Trip CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenTripModal}
              className="shadow-md shadow-[#FF795C]/25 text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Plan Your Trip
            </Button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenTripModal}
              className="text-xs bg-[#FF795C] text-white px-3 py-1.5 rounded-lg font-bold sm:hidden"
            >
              Enquire
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#082C43] hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-[#FF795C]" /> : <Menu className="w-6 h-6 text-[#082C43]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MOBILE NAVIGATION DRAWER (Full Categories & Phone)       */}
      {/* ======================================================== */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-sm bg-[#082C43] text-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs">
                  <BrandLogo size="sm" to="/" />
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
                                to={`/packages?search=${encodeURIComponent(c)}`}
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
                                to={`/packages?search=${encodeURIComponent(s.split(' ')[0])}`}
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-[#FF795C]"
                >
                  <Heart className="w-4 h-4" />
                  <span>Honeymoon Packages</span>
                </Link>

                <Link
                  to="/group-tours"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Users className="w-4 h-4 text-[#55C9BD]" />
                  <span>Group Tours</span>
                </Link>

                <Link
                  to="/services"
                  className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Travel Services
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
                <Link to={getRoleDashboardPath(user.role)}>
                  <Button variant="outline" size="md" className="w-full text-white border-white/30 text-xs font-bold">
                    Go to {user.role.toUpperCase()} Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="md" className="w-full text-white border-white/30 text-xs font-bold">
                    Sign In / Unified CRM Portal
                  </Button>
                </Link>
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
