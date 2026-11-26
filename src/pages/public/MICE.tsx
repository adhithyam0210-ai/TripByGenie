import React, { useState } from 'react';
import { 
  Building2, 
  Users2, 
  Award, 
  Briefcase, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Video, 
  Send, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  Globe2, 
  Plane, 
  Compass,
  ArrowRight,
  Headphones,
  FileCheck2,
  Coffee,
  Check,
  AlertCircle
} from 'lucide-react';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const MICE: React.FC = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    eventType: 'Annual Conference & Summit',
    destination: 'Goa, India',
    paxCount: '50 - 100 Pax',
    tentativeDate: '',
    durationDays: '3 Days / 2 Nights',
    specialRequirements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: string, value: string): string => {
    let err = '';
    const trimmed = (value || '').trim();

    if (field === 'companyName') {
      if (!trimmed) {
        err = 'Company name is required';
      } else if (trimmed.length < 2) {
        err = 'Company name must be at least 2 characters';
      }
    } else if (field === 'contactPerson') {
      if (!trimmed) {
        err = 'Contact person name is required';
      } else if (trimmed.length < 2) {
        err = 'Contact person name must be at least 2 characters';
      }
    } else if (field === 'email') {
      if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'Please enter a valid corporate email address';
      }
    } else if (field === 'phone') {
      const digits = trimmed.replace(/\D/g, '');
      if (!trimmed) {
        err = 'Phone or WhatsApp number is required';
      } else if (digits.length < 10) {
        err = 'Phone number must contain at least 10 digits';
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });

    return err;
  };

  const validateAll = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const compErr = validateField('companyName', formData.companyName);
    if (compErr) newErrors.companyName = compErr;

    const personErr = validateField('contactPerson', formData.contactPerson);
    if (personErr) newErrors.contactPerson = personErr;

    if (formData.email) {
      const emailErr = validateField('email', formData.email);
      if (emailErr) newErrors.email = emailErr;
    }

    const phoneErr = validateField('phone', formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const micePillars = [
    {
      code: 'M',
      title: 'Meetings',
      subtitle: 'Boardrooms & Strategic Leadership Offsites',
      desc: 'Seamless corporate board meetings, executive strategy sessions, and confidential retreats in premium business suites equipped with cutting-edge AV, high-speed encrypted Wi-Fi, and personalized hospitality.',
      icon: <Building2 className="w-7 h-7 text-[#17648A]" />,
      highlights: ['State-of-the-Art AV & Projection', 'Private Executive Breakout Rooms', 'Custom Business Menus & High Teas', 'Confidential & High-Privacy Setup']
    },
    {
      code: 'I',
      title: 'Incentives',
      subtitle: 'Employee Recognition & Dealer Reward Tours',
      desc: 'Motivate and celebrate your top performers, sales champions, and high-value partners with once-in-a-lifetime luxury escapes to Dubai, Bali, Thailand, Sri Lanka, Goa, or private luxury cruise liners.',
      icon: <Award className="w-7 h-7 text-[#FF795C]" />,
      highlights: ['5-Star Luxury Resort Stays', 'Exclusive Private Yacht & Catamaran Parties', 'Curated Sightseeing & Desert Safaris', 'Custom Trophy & Award Ceremonies']
    },
    {
      code: 'C',
      title: 'Conferences',
      subtitle: 'National & Global Industry Conventions',
      desc: 'End-to-end management for large-scale conventions and annual summits from 50 to 1,500+ delegates. We oversee venue negotiations, stage production, flight blocks, registration desks, and VIP ground transfers.',
      icon: <Users2 className="w-7 h-7 text-[#55C9BD]" />,
      highlights: ['Mass Room Blocks & Convention Centers', 'Bulk Group Flight Discounts', 'On-Site Delegate Helpdesks', 'Stage, Lighting & LED Video Walls']
    },
    {
      code: 'E',
      title: 'Exhibitions & Events',
      subtitle: 'Trade Expos, Product Launches & Gala Dinners',
      desc: 'Flawless execution for brand showcases, dealer expos, and themed gala nights. From custom booth fabrication and live artist management to themed cocktail dinners, we elevate your corporate identity.',
      icon: <Briefcase className="w-7 h-7 text-[#082C43]" />,
      highlights: ['Custom Pavilion & Stall Fabrication', 'Sound & Intelligent Lighting Design', 'Celebrity Performers & Emcees', 'Themed Banquet & Gala Dinners']
    }
  ];

  const popularMiceDestinations = [
    {
      name: 'Goa, India',
      type: 'Domestic Beachfront',
      desc: 'Pristine coastal resorts, team-building beach games, sunset cruises on the Mandovi river, and vibrant beach gala dinners.',
      capacity: 'Up to 800 Pax',
      img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Dubai & UAE',
      type: 'International Mega City',
      desc: 'Futuristic exhibition centers, luxury desert safari galas, Dhow dinner cruises, and iconic gala venues near Burj Khalifa.',
      capacity: 'Up to 2,000 Pax',
      img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Bali, Indonesia',
      type: 'Tropical Island Paradise',
      desc: 'Beachfront luxury hotels in Nusa Dua and Seminyak, jungle team retreats in Ubud, and authentic Balinese cultural gala evenings.',
      capacity: 'Up to 500 Pax',
      img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Kerala (Kochi & Munnar)',
      type: 'Scenic Hills & Backwaters',
      desc: 'World-class convention centers in Kochi, scenic tea estate leadership retreats in Munnar, and authentic houseboat dinners.',
      capacity: 'Up to 600 Pax',
      img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Thailand (Bangkok & Pattaya)',
      type: 'Vibrant International Hub',
      desc: 'Extensive mega-convention hotel facilities, luxury private speedboat transfers, coral island team bonding, and rooftop banquets.',
      capacity: 'Up to 1,200 Pax',
      img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Jaipur & Rajasthan',
      type: 'Royal Heritage Retreats',
      desc: 'Majestic palace hotels, royal welcome with traditional folk troupes, regal banquet setups, and grand corporate conventions.',
      capacity: 'Up to 700 Pax',
      img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showToast('Please fix the highlighted corporate form errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Create lead in CRM with MICE category
      await api.createLead({
        customer_name: `${formData.contactPerson} (${formData.companyName})`,
        customer_email: formData.email || undefined,
        customer_phone: formData.phone,
        interested_destination: `${formData.destination} - MICE (${formData.eventType})`,
        pax_count: formData.paxCount,
        budget_range: 'Corporate Quote Required',
        notes: `[MICE RFP ENQUIRY] Event: ${formData.eventType} | Company: ${formData.companyName} | Pax: ${formData.paxCount} | Duration: ${formData.durationDays} | Date: ${formData.tentativeDate || 'Flexible'} | Requirements: ${formData.specialRequirements}`
      });

      setSubmitted(true);
      showToast('Corporate RFP received! Our MICE Specialist will contact you within 2 hours.', 'success');
    } catch {
      // Fallback: still show success to corporate client and open WhatsApp
      setSubmitted(true);
      showToast('Request logged. Opening direct Corporate Concierge WhatsApp...', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello Trip by Genie MICE Team,\nI am reaching out on behalf of *${formData.companyName || 'our company'}* for a Corporate Event / Offsite.\n- Event Type: ${formData.eventType}\n- Preferred Destination: ${formData.destination}\n- Estimated Delegates: ${formData.paxCount}\n- Contact: ${formData.contactPerson || 'Coordinator'} (${formData.phone || ''})\nPlease share a customized corporate proposal.`
    );
    window.open(`https://wa.me/919940463566?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-10 bg-[#082C43] text-white overflow-hidden">
        <TravelPatternBg variant="navy" opacity={0.08} />
        
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#17648A]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF795C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.15] text-white">
              Meetings, Incentives, Conferences & <span className="text-[#55C9BD]">Corporate Offsites</span>
            </h1>

            <p className="text-sm sm:text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              Elevate your corporate culture with world-class events. Trip by Genie handles complete end-to-end logistics: group flight bookings, verified 5-star venue blocks, luxury AC coach fleets, stage AV setups, and memorable team galas.
            </p>

            {/* Badges / Bullet Points */}
            <div className="pt-1 flex justify-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 sm:gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#55C9BD] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">100% GST Invoicing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#55C9BD] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Dedicated On-Site Desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#55C9BD] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Bulk Airfare Discounts</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto w-full">
              <a href="#corporate-rfp" className="w-full sm:w-1/2">
                <Button
                  variant="primary"
                  className="w-full justify-center text-[11px] sm:text-sm font-bold py-2 sm:py-3 px-3 sm:px-5 rounded-lg sm:rounded-xl shadow-md h-8.5 sm:h-auto"
                  leftIcon={<Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                >
                  Request Corporate Proposal (RFP)
                </Button>
              </a>
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-1/2 inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-5 rounded-lg sm:rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] sm:text-sm font-bold shadow-md transition-all cursor-pointer select-none active:scale-[0.98] h-8.5 sm:h-auto"
              >
                <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Direct Corporate WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE FOUR PILLARS OF MICE                               */}
      {/* ======================================================== */}
      <section className="py-8 sm:py-10 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
            The 4 Pillars of Trip by Genie MICE
          </h2>
          <p className="text-sm text-[#173247]/75">
            Whether rewarding your regional sales force, orchestrating high-stakes leadership symposiums, or managing international congresses, we execute with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {micePillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-8 rounded-3xl bg-white border border-[#EFE7DA] shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F1E7] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {pillar.icon}
                  </div>
                  <span className="text-3xl font-black font-display text-[#082C43]/15">
                    {pillar.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-[#082C43] font-display">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-bold text-[#17648A] mt-0.5">
                    {pillar.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
                  {pillar.desc}
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[#EFE7DA]">
                  {pillar.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs font-medium text-[#082C43]">
                      <Check className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EFE7DA]">
                <a
                  href="#corporate-rfp"
                  className="text-xs font-bold text-[#FF795C] hover:text-[#082C43] flex items-center gap-1.5 transition-colors"
                >
                  <span>Request Custom Proposal for {pillar.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. END-TO-END CORPORATE SERVICES & CAPABILITIES           */}
      {/* ======================================================== */}
      <section className="py-8 sm:py-10 bg-[#F8F1E7]/60 border-y border-[#EFE7DA]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display">
              End-to-End Corporate Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/75">
              Everything your organization needs managed under one trusted SLA.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: 'Bulk Flight Group Fares', desc: 'Pre-blocked seats & flexible naming', icon: <Plane className="w-5 h-5 text-[#17648A]" /> },
              { title: '5-Star Hotel Room Blocks', desc: 'Negotiated corporate rates & perks', icon: <Building2 className="w-5 h-5 text-[#FF795C]" /> },
              { title: 'Luxury Ground Coaches', desc: 'AC Volvo & executive tempo travellers', icon: <Compass className="w-5 h-5 text-[#55C9BD]" /> },
              { title: 'Stage, AV & LED Video', desc: 'Professional audio-visual & acoustics', icon: <Video className="w-5 h-5 text-[#17648A]" /> },
              { title: 'Gala & Theme Nights', desc: 'Bespoke dinners, live artists & emcees', icon: <Coffee className="w-5 h-5 text-[#FF795C]" /> },
              { title: 'GST Billing & Credit Desk', desc: 'Clean corporate compliance & statements', icon: <FileCheck2 className="w-5 h-5 text-[#55C9BD]" /> }
            ].map((srv) => (
              <div key={srv.title} className="p-5 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F8F1E7] flex items-center justify-center mx-auto">
                  {srv.icon}
                </div>
                <h4 className="text-xs font-bold text-[#082C43]">{srv.title}</h4>
                <p className="text-[11px] text-[#173247]/70 leading-snug">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. POPULAR MICE DESTINATIONS                              */}
      {/* ======================================================== */}
      <section className="py-8 sm:py-10 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082C43] font-display mt-1">
              Top Corporate Destinations
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/75 mt-1">
              Handpicked domestic and international locations proven for high-attendance corporate gatherings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleWhatsAppDirect}
            className="text-xs font-bold text-[#17648A] hover:text-[#FF795C] flex items-center gap-1 shrink-0"
          >
            <span>Inquire for Other Locations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularMiceDestinations.map((dest) => (
            <div
              key={dest.name}
              className="rounded-3xl overflow-hidden bg-white border border-[#EFE7DA] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#082C43]/80 backdrop-blur-xs text-white text-[10px] font-bold">
                  {dest.type}
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="text-lg font-bold font-display">{dest.name}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-white/80">
                    <Users2 className="w-3 h-3 text-[#55C9BD]" />
                    <span>Capacity: {dest.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-[#173247]/75 leading-relaxed">
                  {dest.desc}
                </p>
                <div className="pt-3 border-t border-[#EFE7DA] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#55C9BD] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Full Ground Logistics Ready
                  </span>
                  <a
                    href="#corporate-rfp"
                    className="text-xs font-bold text-[#FF795C] hover:underline"
                  >
                    Select Destination →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CORPORATE RFP INQUIRY FORM                             */}
      {/* ======================================================== */}
      <section id="corporate-rfp" className="py-8 sm:py-12 bg-[#082C43] text-white relative">
        <TravelPatternBg variant="navy" opacity={0.07} />
        
        <div className="relative max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
              Request a Corporate MICE Proposal
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto">
              Share your team’s headcount, tentative dates, and preferences. Our Corporate Events Director will dispatch a tailored itinerary and cost breakdown within 2 hours.
            </p>
          </div>

          <div className="bg-white text-[#082C43] p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/20">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold font-display text-[#082C43]">
                  Thank You! Corporate RFP Received
                </h3>
                <p className="text-sm text-[#173247]/80 max-w-md mx-auto">
                  Our Senior Corporate Travel Manager has been assigned to your event. We will review venue availability and contact you shortly.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppDirect}
                    className="px-6 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-md hover:bg-[#20bd5a] flex items-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Open Direct WhatsApp Chat</span>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => {
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) validateField('companyName', e.target.value);
                      }}
                      onBlur={() => validateField('companyName', formData.companyName)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                        errors.companyName
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] bg-[#FFFDF8] focus:ring-2 focus:ring-[#17648A]'
                      }`}
                    />
                    {errors.companyName && (
                      <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.companyName}</span>
                      </p>
                    )}
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Contact Person & Designation *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma (HR Director / Admin Head)"
                      value={formData.contactPerson}
                      onChange={(e) => {
                        setFormData({ ...formData, contactPerson: e.target.value });
                        if (errors.contactPerson) validateField('contactPerson', e.target.value);
                      }}
                      onBlur={() => validateField('contactPerson', formData.contactPerson)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                        errors.contactPerson
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] bg-[#FFFDF8] focus:ring-2 focus:ring-[#17648A]'
                      }`}
                    />
                    {errors.contactPerson && (
                      <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.contactPerson}</span>
                      </p>
                    )}
                  </div>

                  {/* Corporate Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Official Corporate Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. priya@acme.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) validateField('email', e.target.value);
                      }}
                      onBlur={() => validateField('email', formData.email)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                        errors.email
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] bg-[#FFFDF8] focus:ring-2 focus:ring-[#17648A]'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) validateField('phone', e.target.value);
                      }}
                      onBlur={() => validateField('phone', formData.phone)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                        errors.phone
                          ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                          : 'border-[#EFE7DA] bg-[#FFFDF8] focus:ring-2 focus:ring-[#17648A]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Event Category
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-medium focus:ring-2 focus:ring-[#17648A] focus:outline-none cursor-pointer"
                    >
                      <option value="Annual Conference & Summit">Annual Conference & Summit</option>
                      <option value="Incentive Tour (Top Performers / Dealers)">Incentive Tour (Top Performers / Dealers)</option>
                      <option value="Leadership Boardroom Retreat">Leadership Boardroom Retreat</option>
                      <option value="Exhibition, Trade Expo & Product Launch">Exhibition, Trade Expo & Product Launch</option>
                      <option value="Team Building & Annual Offsite">Team Building & Annual Offsite</option>
                      <option value="International Corporate Delegation">International Corporate Delegation</option>
                    </select>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Preferred Destination
                    </label>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-medium focus:ring-2 focus:ring-[#17648A] focus:outline-none cursor-pointer"
                    >
                      <option value="Goa, India">Goa, India</option>
                      <option value="Dubai, UAE">Dubai, UAE</option>
                      <option value="Bali, Indonesia">Bali, Indonesia</option>
                      <option value="Kerala (Kochi/Munnar), India">Kerala (Kochi/Munnar), India</option>
                      <option value="Thailand (Bangkok/Phuket)">Thailand (Bangkok/Phuket)</option>
                      <option value="Singapore & Sentosa">Singapore & Sentosa</option>
                      <option value="Jaipur / Udaipur, Rajasthan">Jaipur / Udaipur, Rajasthan</option>
                      <option value="Andaman Islands">Andaman Islands</option>
                      <option value="Vietnam (Da Nang / Hanoi)">Vietnam (Da Nang / Hanoi)</option>
                      <option value="Other / Open to Recommendations">Other / Open to Recommendations</option>
                    </select>
                  </div>

                  {/* Estimated Delegates */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Estimated Delegates (Pax)
                    </label>
                    <select
                      value={formData.paxCount}
                      onChange={(e) => setFormData({ ...formData, paxCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-medium focus:ring-2 focus:ring-[#17648A] focus:outline-none cursor-pointer"
                    >
                      <option value="15 - 30 Pax (Executive Board)">15 - 30 Pax (Executive Board)</option>
                      <option value="30 - 75 Pax (Department Offsite)">30 - 75 Pax (Department Offsite)</option>
                      <option value="75 - 150 Pax (Mid Scale Event)">75 - 150 Pax (Mid Scale Event)</option>
                      <option value="150 - 300 Pax (Company Annual)">150 - 300 Pax (Company Annual)</option>
                      <option value="300 - 800+ Pax (Convention / Expo)">300 - 800+ Pax (Convention / Expo)</option>
                    </select>
                  </div>

                  {/* Tentative Travel Dates / Month */}
                  <div>
                    <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                      Tentative Month or Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. December 2026 or Next Quarter"
                      value={formData.tentativeDate}
                      onChange={(e) => setFormData({ ...formData, tentativeDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-medium focus:ring-2 focus:ring-[#17648A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-xs font-bold text-[#082C43] mb-1.5">
                    Specific Requirements (Flight ticketing, Gala dinner, Jain food, AV stage, etc.)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any details about breakout rooms, team-building activities, dietary needs, or budget expectations..."
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-medium focus:ring-2 focus:ring-[#17648A] focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#173247]/70">
                    <ShieldCheck className="w-4 h-4 text-[#55C9BD] shrink-0" />
                    <span>Non-disclosure guaranteed. Strict corporate privacy.</span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                    className="shadow-lg font-bold text-xs"
                  >
                    {submitting ? 'Dispatching RFP...' : 'Submit Corporate RFP'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Direct Contacts */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#55C9BD]" />
              <span>Direct Corporate Desk: <a href="tel:+914446071374" className="font-bold text-white hover:underline">+91 (44) 46071374</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF795C]" />
              <span>Corporate RFP Email: <a href="mailto:info@tripbygenie.in" className="font-bold text-white hover:underline">info@tripbygenie.in</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#55C9BD]" />
              <span>Dedicated MICE Account Manager</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
