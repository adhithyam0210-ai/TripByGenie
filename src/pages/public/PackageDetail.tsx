import React, { useState, useEffect } from 'react';
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
  Navigation
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

  // Fast booking box form
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    travelDate: '',
    travelers: '2'
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    if (packageSlug) loadPackage(packageSlug);
  }, [packageSlug]);

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

    if (!bookingForm.name || (!bookingForm.email && !bookingForm.phone)) {
      error('Please provide your name and contact details.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      await api.submitEnquiry({
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        destination: pkg.title,
        package_id: pkg.id,
        travel_date: bookingForm.travelDate,
        travelers_count: Number(bookingForm.travelers),
        budget: `₹${(Number(pkg.public_price || pkg.b2c_price || pkg.price || 0) * Number(bookingForm.travelers)).toLocaleString('en-IN')}`,
        source: 'Package Booking',
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('Enquiry received! Our travel specialist will call you with quotation & booking confirmation.');
      setBookingForm({ name: '', email: '', phone: '', travelDate: '', travelers: '2' });
    } catch (err: any) {
      error(err.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmittingBooking(false);
    }
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

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#082C43] font-display">
            {pkg.title}
          </h1>
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
              <form onSubmit={handleQuickEnquire} className="space-y-3">
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
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Phone/WhatsApp"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      value={bookingForm.travelDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, travelDate: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Guests
                    </label>
                    <select
                      value={bookingForm.travelers}
                      onChange={(e) => setBookingForm({ ...bookingForm, travelers: e.target.value })}
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
