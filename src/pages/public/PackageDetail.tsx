import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Building,
  Car,
  Calendar,
  Users,
  ShieldCheck,
  Send,
  ArrowLeft,
  Phone,
  Compass,
  Navigation,
  ChevronDown,
  Share2,
  FileDown
} from 'lucide-react';
import { api } from '../../services/api';
import { Package, Destination, PackageItinerary } from '../../types';
import { ItineraryTimeline } from '../../components/travel/ItineraryTimeline';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { getPackageFallbackImage } from '../../components/travel/PackageCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PackageDetail: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const packageSlug = slug || id || '';
  const navigate = useNavigate();
  const { user, isAuthenticated, agency } = useAuth();
  const { success, error } = useToast();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [itineraries, setItineraries] = useState<PackageItinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const countryCodes = useMemo(() => [
    { code: '+91', country: 'IN', label: '+91 (India)' },
    { code: '+1', country: 'US', label: '+1 (USA/Canada)' },
    { code: '+44', country: 'UK', label: '+44 (UK)' },
    { code: '+971', country: 'AE', label: '+971 (UAE)' },
    { code: '+65', country: 'SG', label: '+65 (Singapore)' },
    { code: '+60', country: 'MY', label: '+60 (Malaysia)' },
    { code: '+61', country: 'AU', label: '+61 (Australia)' },
    { code: '+966', country: 'SA', label: '+966 (Saudi Arabia)' },
    { code: '+974', country: 'QA', label: '+974 (Qatar)' },
    { code: '+968', country: 'OM', label: '+968 (Oman)' },
    { code: '+49', country: 'DE', label: '+49 (Germany)' },
    { code: '+33', country: 'FR', label: '+33 (France)' },
    { code: '+39', country: 'IT', label: '+39 (Italy)' },
    { code: '+81', country: 'JP', label: '+81 (Japan)' },
    { code: '+66', country: 'TH', label: '+66 (Thailand)' },
    { code: '+94', country: 'LK', label: '+94 (Sri Lanka)' },
    { code: '+977', country: 'NP', label: '+977 (Nepal)' },
    { code: '+880', country: 'BD', label: '+880 (Bangladesh)' }
  ], []);

  // Fast booking box form with inline validation
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    travelDate: '',
    travelers: '2'
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    travelDate?: string;
  }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    if (packageSlug) loadPackage(packageSlug);
  }, [packageSlug]);

  const validateField = (field: 'name' | 'email' | 'phone' | 'travelDate', val: string, code = bookingForm.countryCode) => {
    let err = '';
    const trimmed = (val || '').trim();

    if (field === 'name') {
      if (!trimmed) {
        err = 'Your name is required';
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (/^\d+$/.test(trimmed)) {
        err = 'Name cannot be numbers only';
      }
    } else if (field === 'email') {
      if (!trimmed) {
        err = 'Email address is required';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'Please enter a valid email address';
      }
    } else if (field === 'phone') {
      const digits = trimmed.replace(/\D/g, '');
      if (!trimmed) {
        err = 'Mobile number is required';
      } else if (code === '+91') {
        if (digits.length !== 10) {
          err = 'Please enter a valid 10-digit mobile number';
        }
      } else if (digits.length < 7 || digits.length > 15) {
        err = 'Please enter a valid phone number (7-15 digits)';
      }
    } else if (field === 'travelDate') {
      if (trimmed) {
        const selected = new Date(trimmed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          err = 'Travel date cannot be in the past';
        }
      }
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });

    return err;
  };

  const validateAll = () => {
    const nameErr = validateField('name', bookingForm.name);
    const emailErr = validateField('email', bookingForm.email);
    const phoneErr = validateField('phone', bookingForm.phone, bookingForm.countryCode);
    const dateErr = validateField('travelDate', bookingForm.travelDate);

    const errs: typeof formErrors = {};
    if (nameErr) errs.name = nameErr;
    if (emailErr) errs.email = emailErr;
    if (phoneErr) errs.phone = phoneErr;
    if (dateErr) errs.travelDate = dateErr;

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const loadPackage = async (packageSlug: string) => {
    setIsLoading(true);
    try {
      const data = await api.getPackageBySlug(packageSlug);
      if ((data as any)?.is_destination) {
        navigate(`/destinations/${(data as any).destination_slug || packageSlug}`, { replace: true });
        return;
      }
      setPkg(data.package);
      setDestination(data.destination);
      setItineraries(data.itineraries || []);
    } catch (e) {
      try {
        const destData = await api.getDestinationBySlug(packageSlug);
        if (destData && destData.destination) {
          navigate(`/destinations/${packageSlug}`, { replace: true });
          return;
        }
      } catch {}
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEnquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;

    setHasAttemptedSubmit(true);
    if (!validateAll()) {
      error('Please complete all required fields correctly.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const fullPhone = `${bookingForm.countryCode} ${bookingForm.phone.trim()}`;
      await api.submitEnquiry({
        name: bookingForm.name.trim(),
        email: bookingForm.email.trim(),
        phone: fullPhone,
        destination: pkg.title,
        package_id: pkg.id,
        travel_date: bookingForm.travelDate,
        travelers_count: Number(bookingForm.travelers),
        budget: `₹${(Number(pkg.public_price || pkg.b2c_price || pkg.price || 0) * Number(bookingForm.travelers)).toLocaleString('en-IN')}`,
        source: 'Package Booking',
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('Enquiry received! Our travel specialist will call you with quotation & booking confirmation.');
      setBookingForm({ name: '', email: '', countryCode: '+91', phone: '', travelDate: '', travelers: '2' });
      setFormErrors({});
      setHasAttemptedSubmit(false);
    } catch (err: any) {
      error(err.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
      success('Tour link copied to clipboard. Share with your travel buddies!', {
        title: 'Link Copied',
        action: {
          label: 'Copy Again',
          onClick: () => navigator.clipboard?.writeText(window.location.href)
        }
      });
    } catch {
      success('Share this tour: ' + window.location.href, { title: 'Package Link' });
    }
  };

  const handleDownloadBrochure = () => {
    success(`Detailed itinerary brochure for ${pkg?.title || 'Tour'} has been prepared.`, {
      title: 'Itinerary Ready',
      action: {
        label: 'View',
        onClick: () => window.scrollTo({ top: 600, behavior: 'smooth' })
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-[#082C43]">Package Not Found</h2>
        <Link to="/packages" className="mt-3 text-sm text-[#FF795C] font-semibold underline">
          Back to all packages
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Top Breadcrumb Header */}
      <div className="bg-[#F8F1E7] border-b border-[#EFE7DA] py-3 px-4 sm:px-8 text-xs text-[#173247]/70">
        <div className="max-w-[1600px] w-full mx-auto flex items-center gap-2">
          <Link to="/" className="hover:text-[#FF795C]">Home</Link>
          <span>/</span>
          <Link to="/packages" className="hover:text-[#FF795C]">Packages</Link>
          <span>/</span>
          <span className="text-[#082C43] font-bold truncate max-w-xs">{pkg.title}</span>
        </div>
      </div>

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-6">
        {/* Title & Top Badges */}
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="turquoise">{pkg.category}</Badge>
            {pkg.is_featured && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF795C] text-white">
                Featured Tour
              </span>
            )}
            <span className="text-xs text-[#17648A] font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF795C]" />
              {pkg.duration_days} Days / {pkg.duration_nights} Nights
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              {pkg.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082C43] bg-white hover:bg-slate-50 border border-[#EFE7DA] shadow-xs transition-colors cursor-pointer"
                title="Share Tour Package"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FF795C]" />
                <span>Share Tour</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBrochure}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17648A] bg-sky-50 hover:bg-sky-100 border border-sky-200 shadow-xs transition-colors cursor-pointer"
                title="Download Day-Wise Itinerary Brochure"
              >
                <FileDown className="w-3.5 h-3.5 text-[#17648A]" />
                <span>Itinerary PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gallery / Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 h-72 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-[#EFE7DA] bg-slate-100">
          <div className="md:col-span-2 h-full">
            <img
              src={pkg.cover_image || getPackageFallbackImage(pkg.title, pkg.destination, pkg.category)}
              alt={pkg.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = getPackageFallbackImage(pkg.title, pkg.destination, pkg.category);
              }}
            />
          </div>
          <div className="hidden md:flex flex-col gap-3 h-full">
            <img
              src={pkg.gallery?.[1] || pkg.cover_image || getPackageFallbackImage(pkg.title, pkg.destination, pkg.category)}
              alt="Gallery 1"
              className="w-full h-1/2 object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = getPackageFallbackImage(pkg.title, pkg.destination, pkg.category);
              }}
            />
            <img
              src={pkg.gallery?.[2] || pkg.cover_image || getPackageFallbackImage(pkg.title, pkg.destination, pkg.category)}
              alt="Gallery 2"
              className="w-full h-1/2 object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = getPackageFallbackImage(pkg.title, pkg.destination, pkg.category);
              }}
            />
          </div>
        </div>

        {/* Main Content Layout (Left Details, Right Booking Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* Highlights */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#F8F1E7]/60 border border-[#EFE7DA]">
                <h3 className="text-base font-bold text-[#082C43] font-display mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#FF795C]" />
                  Key Tour Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#173247]/85">
                  {pkg.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5" />
                      <span className="leading-snug">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-[#082C43] font-display mb-2">
                Overview & Experience
              </h3>
              <p className="text-sm text-[#173247]/80 leading-relaxed whitespace-pre-line">
                {pkg.description}
              </p>
            </div>

            {/* Day-by-Day Itinerary */}
            <div>
              <h3 className="text-lg font-bold text-[#082C43] font-display mb-3">
                Day-by-Day Detailed Itinerary
              </h3>
              <ItineraryTimeline itineraries={itineraries} />
            </div>

            {/* Package Summary Section (Section 5) */}
            <div className="bg-white rounded-2xl border border-[#E5EFF5] shadow-[0_4px_20px_rgba(23,100,138,0.08)] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#082C43] font-display flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#00A854]" />
                  Package Summary
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00A854]/10 text-[#00A854] border border-[#00A854]/20">
                  Verified Itinerary
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Duration</span>
                  <strong className="text-sm text-[#082C43] font-bold">
                    {pkg.duration_days} Days / {pkg.duration_nights || Math.max(1, pkg.duration_days - 1)} Nights
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Starting & Ending Route</span>
                  <strong className="text-sm text-[#082C43] font-bold flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#00A854] shrink-0" />
                    <span>{pkg.starting_location || 'Arrival'} → {pkg.ending_location || 'Departure'}</span>
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 md:col-span-1">
                  <span className="text-slate-400 font-medium block mb-1">Itinerary Schedule</span>
                  <strong className="text-sm text-[#00A854] font-bold">
                    {itineraries.length || pkg.duration_days} Days Covered
                  </strong>
                </div>
              </div>

              {(pkg.destinations_covered && pkg.destinations_covered.length > 0) && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block mb-2">Destinations Covered During Trip:</span>
                  <div className="flex flex-wrap gap-2">
                    {pkg.destinations_covered.map((dest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-[#00A854]/10 text-[#00A854] font-bold text-xs border border-[#00A854]/25"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {/* Inclusions */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  What's Included
                </h4>
                <ul className="space-y-2 text-xs text-emerald-950/80">
                  {pkg.inclusions && pkg.inclusions.length > 0 ? (
                    pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{inc}</span>
                      </li>
                    ))
                  ) : (
                    <li>Standard 4-star hotel stay, transfers, and breakfast.</li>
                  )}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100">
                <h4 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  What's Excluded
                </h4>
                <ul className="space-y-2 text-xs text-rose-950/80">
                  {pkg.exclusions && pkg.exclusions.length > 0 ? (
                    pkg.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{exc}</span>
                      </li>
                    ))
                  ) : (
                    <li>Airfare, personal expenses, and optional water sports.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Accommodation & Transportation */}
            <div className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-[#082C43]">Logistics & Hospitality</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#173247]/80">
                <div className="flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-[#17648A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#082C43] block">Accommodation:</strong>
                    <span>{pkg.accommodation || 'Handpicked 4-star boutique resorts'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Car className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#082C43] block">Transportation:</strong>
                    <span>{pkg.transportation || 'Dedicated AC vehicle with private driver'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sticky Booking Box */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-2xl border border-[#EFE7DA] p-6 shadow-xl space-y-5">
              {/* Price header */}
              <div className="pb-4 border-b border-[#EFE7DA]">
                <span className="text-xs uppercase font-bold text-[#17648A] tracking-wider block">
                  Starting Price
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-[#082C43] font-display">
                    ₹{Number(pkg.public_price || pkg.b2c_price || pkg.price || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">/ person</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
                  <span>Price includes all taxes & hotel breakfast</span>
                </p>
              </div>

              {/* Fast Booking Form */}
              <form onSubmit={handleQuickEnquire} noValidate className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#082C43]">
                  Book / Enquire For This Package
                </h4>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={bookingForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookingForm((prev) => ({ ...prev, name: val }));
                      if (hasAttemptedSubmit) validateField('name', val);
                    }}
                    onBlur={() => {
                      if (hasAttemptedSubmit || bookingForm.name) validateField('name', bookingForm.name);
                    }}
                    className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                      formErrors.name
                        ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                        : 'border-[#EFE7DA] focus:border-[#FF795C]'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={bookingForm.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBookingForm((prev) => ({ ...prev, email: val }));
                        if (hasAttemptedSubmit) validateField('email', val);
                      }}
                      onBlur={() => {
                        if (hasAttemptedSubmit || bookingForm.email) validateField('email', bookingForm.email);
                      }}
                      className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                        formErrors.email
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] focus:border-[#FF795C]'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Phone *
                    </label>
                    <div
                      className={`flex rounded-xl border overflow-hidden bg-[#FFFDF8] transition-colors ${
                        formErrors.phone
                          ? 'border-red-400 focus-within:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] focus-within:border-[#FF795C]'
                      }`}
                    >
                      <div className="relative shrink-0 flex items-center">
                        <select
                          aria-label="Country Code"
                          value={bookingForm.countryCode}
                          onChange={(e) => {
                            const newCode = e.target.value;
                            setBookingForm((prev) => ({ ...prev, countryCode: newCode }));
                            if (hasAttemptedSubmit) validateField('phone', bookingForm.phone, newCode);
                          }}
                          className="h-full text-[10px] bg-[#F8F1E7]/70 text-[#082C43] font-bold pl-2 pr-3.5 py-2 border-r border-[#EFE7DA] focus:outline-none cursor-pointer appearance-none shrink-0"
                        >
                          {countryCodes.map((c) => (
                            <option key={c.code} value={c.code} title={c.label}>
                              {c.code} {c.country}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-[#082C43]/60 absolute right-1 pointer-events-none" />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Phone/WhatsApp"
                        value={bookingForm.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBookingForm((prev) => ({ ...prev, phone: val }));
                          if (hasAttemptedSubmit) validateField('phone', val);
                        }}
                        onBlur={() => {
                          if (hasAttemptedSubmit || bookingForm.phone) validateField('phone', bookingForm.phone);
                        }}
                        className="w-full text-xs p-2 bg-transparent focus:outline-none min-w-0"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={bookingForm.travelDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBookingForm((prev) => ({ ...prev, travelDate: val }));
                        if (hasAttemptedSubmit) validateField('travelDate', val);
                      }}
                      className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                        formErrors.travelDate
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] focus:border-[#FF795C]'
                      }`}
                    />
                    {formErrors.travelDate && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in">
                        {formErrors.travelDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Guests
                    </label>
                    <select
                      value={bookingForm.travelers}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, travelers: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    >
                      <option value="1">1 Traveler</option>
                      <option value="2">2 Travelers</option>
                      <option value="4">4 Travelers</option>
                      <option value="6">6+ Travelers</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold shadow-md shadow-[#FF795C]/25"
                  isLoading={isSubmittingBooking}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send Travel Enquiry
                </Button>
              </form>

              {/* Direct call assistance */}
              <div className="pt-3 border-t border-[#EFE7DA] text-center space-y-1">
                <span className="text-[11px] text-slate-500">Need Immediate Help?</span>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#082C43]">
                  <Phone className="w-3.5 h-3.5 text-[#55C9BD]" />
                  <span>Call: +91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        initialDestination={pkg.title}
        initialPackageId={pkg.id}
      />
    </div>
  );
};
