import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane,
  Bus,
  Car,
  Ship,
  Building2,
  FileCheck,
  ShieldCheck,
  MapPin,
  CheckCircle,
  Compass,
  Send,
  Calendar,
  Users,
  Phone,
  Mail,
  User,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Luggage,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { TravelService } from '../../types';
import { getTodayIST } from '../../utils/dateValidation';


const countryCodes = [
  { code: '+91', country: 'IN', label: '+91 (IN)' },
  { code: '+1', country: 'US', label: '+1 (US)' },
  { code: '+44', country: 'UK', label: '+44 (UK)' },
  { code: '+971', country: 'UAE', label: '+971 (UAE)' },
  { code: '+65', country: 'SG', label: '+65 (SG)' },
  { code: '+60', country: 'MY', label: '+60 (MY)' },
  { code: '+61', country: 'AU', label: '+61 (AU)' },
  { code: '+966', country: 'SA', label: '+966 (SA)' },
  { code: '+974', country: 'QA', label: '+974 (QA)' },
  { code: '+49', country: 'DE', label: '+49 (DE)' },
  { code: '+33', country: 'FR', label: '+33 (FR)' },
  { code: '+94', country: 'LK', label: '+94 (LK)' },
  { code: '+977', country: 'NP', label: '+977 (NP)' },
  { code: '+880', country: 'BD', label: '+880 (BD)' },
];

interface ServiceEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: TravelService | null;
}

export const ServiceEnquiryModal: React.FC<ServiceEnquiryModalProps> = ({
  isOpen,
  onClose,
  service
}) => {
  const { agency } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Contact Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: string, value: string): string => {
    let err = '';
    const trimmed = (value || '').trim();

    if (field === 'name') {
      if (!trimmed) {
        err = 'Full Name is required';
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (/^\d+$/.test(trimmed)) {
        err = 'Name cannot be only numbers';
      } else if (!/[a-zA-Z]/.test(trimmed)) {
        err = 'Name must contain at least one letter';
      } else if (/[^a-zA-Z0-9_\s]/.test(trimmed)) {
        err = 'Name cannot contain special characters';
      }
    } else if (field === 'email') {
      if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'Please enter a valid email address with a domain (e.g. name@domain.com)';
      }
    } else if (field === 'phone') {
      const digitsOnly = trimmed.replace(/\D/g, '');
      if (!trimmed) {
        err = 'Mobile number is required';
      } else if (digitsOnly.length < 10) {
        err = 'Mobile number must contain at least 10 digits';
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
    const nameErr = validateField('name', name);
    if (nameErr) newErrors.name = nameErr;

    const phoneErr = validateField('phone', phone);
    if (phoneErr) newErrors.phone = phoneErr;

    if (email) {
      const emailErr = validateField('email', email);
      if (emailErr) newErrors.email = emailErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 1. Flight specific state
  const [flightTripType, setFlightTripType] = useState<'One Way' | 'Round Trip' | 'Multi-City'>('Round Trip');
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightDepartDate, setFlightDepartDate] = useState('');
  const [flightReturnDate, setFlightReturnDate] = useState('');
  const [flightAdults, setFlightAdults] = useState('1');
  const [flightChildren, setFlightChildren] = useState('0');
  const [flightInfants, setFlightInfants] = useState('0');
  const [flightClass, setFlightClass] = useState('Economy');
  const [flightAirline, setFlightAirline] = useState('');
  const [flightMeal, setFlightMeal] = useState('Standard / Veg');

  // 2. Bus specific state
  const [busTripType, setBusTripType] = useState<'One Way' | 'Round Trip'>('One Way');
  const [busFrom, setBusFrom] = useState('');
  const [busTo, setBusTo] = useState('');
  const [busDepartDate, setBusDepartDate] = useState('');
  const [busReturnDate, setBusReturnDate] = useState('');
  const [busSeats, setBusSeats] = useState('2');
  const [busType, setBusType] = useState('AC Sleeper (2+1)');
  const [busTime, setBusTime] = useState('Night Sleeper (8 PM - 11 PM)');
  const [busBoardingPoint, setBusBoardingPoint] = useState('');

  // 3. Car Rental specific state
  const [carServiceType, setCarServiceType] = useState<'Outstation Round Trip' | 'Outstation One-Way Drop' | 'Local City (8hr/80km)' | 'Airport Transfer'>('Outstation Round Trip');
  const [carPickupCity, setCarPickupCity] = useState('');
  const [carDropCity, setCarDropCity] = useState('');
  const [carPickupDate, setCarPickupDate] = useState('');
  const [carReturnDate, setCarReturnDate] = useState('');
  const [carVehicle, setCarVehicle] = useState('Toyota Innova Crysta (6+1 Seater)');
  const [carPassengers, setCarPassengers] = useState('4');
  const [carLuggageCount, setCarLuggageCount] = useState('3-4 Bags');
  const [carSpecial, setCarSpecial] = useState('Tamil/English speaking courteous driver');

  // 4. Cruise specific state
  const [cruiseLine, setCruiseLine] = useState('Cordelia Cruises (Mumbai - Goa - Lakshadweep)');
  const [cruiseDeparturePort, setCruiseDeparturePort] = useState('Mumbai / Kochi / Chennai');
  const [cruiseDate, setCruiseDate] = useState('');
  const [cruiseDuration, setCruiseDuration] = useState('3 Nights / 4 Days');
  const [cruiseCabin, setCruiseCabin] = useState('Balcony Ocean-View Stateroom');
  const [cruiseAdults, setCruiseAdults] = useState('2');
  const [cruiseChildren, setCruiseChildren] = useState('0');
  const [cruiseOccasion, setCruiseOccasion] = useState('Family Holiday');

  // 5. Hotel specific state
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelRooms, setHotelRooms] = useState('1');
  const [hotelAdults, setHotelAdults] = useState('2');
  const [hotelChildren, setHotelChildren] = useState('0');
  const [hotelCategory, setHotelCategory] = useState('4-Star Premium Hotel');
  const [hotelMealPlan, setHotelMealPlan] = useState('With Complimentary Breakfast (CP)');
  const [hotelRoomType, setHotelRoomType] = useState('Deluxe / Valley View');

  // 6. Visa specific state
  const [visaCountry, setVisaCountry] = useState('Schengen (Europe - France / Swiss / Italy)');
  const [visaType, setVisaType] = useState('Tourist / Holiday Visa');
  const [visaTravelDate, setVisaTravelDate] = useState('');
  const [visaApplicants, setVisaApplicants] = useState('1');
  const [visaPassportNationality, setVisaPassportNationality] = useState('Indian Passport');
  const [visaServiceLevel, setVisaServiceLevel] = useState('Complete End-to-End Filing & Appointment');

  // 7. Airport Transfer state
  const [transferType, setTransferType] = useState<'Airport Pickup (Arrival)' | 'Airport Drop (Departure)' | 'Round Trip'>('Airport Pickup (Arrival)');
  const [transferAirport, setTransferAirport] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [transferFlightNo, setTransferFlightNo] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferVehicle, setTransferVehicle] = useState('Sedan (1-3 Pax)');
  const [transferSignName, setTransferSignName] = useState('');

  // 8. Travel Insurance state
  const [insurDestination, setInsurDestination] = useState('Schengen / Europe (Mandatory €30,000)');
  const [insurStartDate, setInsurStartDate] = useState('');
  const [insurEndDate, setInsurEndDate] = useState('');
  const [insurTravelers, setInsurTravelers] = useState('2');
  const [insurAgeGroup, setInsurAgeGroup] = useState('Adults (18-60 yrs)');
  const [insurPlanType, setInsurPlanType] = useState('Comprehensive (Medical + Baggage + Flight Delay)');

  // 9. Web Check-in state
  const [checkinAirline, setCheckinAirline] = useState('IndiGo');
  const [checkinPnr, setCheckinPnr] = useState('');
  const [checkinFlightNo, setCheckinFlightNo] = useState('');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinSeat, setCheckinSeat] = useState('Window Seat');
  const [checkinBaggage, setCheckinBaggage] = useState('Standard Free Allowance');

  // 10. General / Custom state
  const [genDestination, setGenDestination] = useState('');
  const [genDepartCity, setGenDepartCity] = useState('');
  const [genDate, setGenDate] = useState('');
  const [genPax, setGenPax] = useState('2');
  const [genBudget, setGenBudget] = useState('Comfort');

  const resetAllFields = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAdditionalNotes('');
    setFlightFrom('');
    setFlightTo('');
    setFlightDepartDate('');
    setFlightReturnDate('');
    setFlightAirline('');
    setBusFrom('');
    setBusTo('');
    setBusDepartDate('');
    setBusReturnDate('');
    setBusBoardingPoint('');
    setCarPickupCity('');
    setCarDropCity('');
    setCarPickupDate('');
    setCarReturnDate('');
    setCruiseDate('');
    setHotelCity('');
    setHotelCheckIn('');
    setHotelCheckOut('');
    setVisaTravelDate('');
    setTransferAirport('');
    setTransferAddress('');
    setTransferFlightNo('');
    setTransferDate('');
    setTransferSignName('');
    setInsurStartDate('');
    setInsurEndDate('');
    setCheckinPnr('');
    setCheckinFlightNo('');
    setCheckinDate('');
    setGenDestination('');
    setGenDepartCity('');
    setGenDate('');
    setGenPax('2');
    setGenBudget('Comfort');
  };

  // Reset all fields when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      resetAllFields();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetAllFields();
    onClose();
  };

  // Determine category of service
  const getCategory = (): 'flight' | 'bus' | 'car' | 'cruise' | 'hotel' | 'visa' | 'transfer' | 'insurance' | 'webcheckin' | 'general' => {
    if (!service) return 'general';
    const id = (service.id || '').toLowerCase();
    const t = (service.title || '').toLowerCase();

    if (id.includes('flight') || t.includes('flight')) return 'flight';
    if (id.includes('bus') || t.includes('bus')) return 'bus';
    if (id.includes('car') || t.includes('car') || t.includes('chauffeur')) return 'car';
    if (id.includes('cruise') || t.includes('cruise')) return 'cruise';
    if (id.includes('hotel') || t.includes('hotel') || t.includes('resort')) return 'hotel';
    if (id.includes('visa') || t.includes('visa')) return 'visa';
    if (id.includes('transfer') || t.includes('airport')) return 'transfer';
    if (id.includes('insurance') || t.includes('insurance')) return 'insurance';
    if (id.includes('checkin') || t.includes('check-in')) return 'webcheckin';
    return 'general';
  };

  const category = getCategory();

  const getServiceIcon = () => {
    switch (category) {
      case 'flight': return <Plane className="w-5 h-5 text-[#17648A]" />;
      case 'bus': return <Bus className="w-5 h-5 text-[#FF795C]" />;
      case 'car': return <Car className="w-5 h-5 text-[#55C9BD]" />;
      case 'cruise': return <Ship className="w-5 h-5 text-[#17648A]" />;
      case 'hotel': return <Building2 className="w-5 h-5 text-[#FF795C]" />;
      case 'visa': return <FileCheck className="w-5 h-5 text-[#55C9BD]" />;
      case 'transfer': return <MapPin className="w-5 h-5 text-[#FF795C]" />;
      case 'insurance': return <ShieldCheck className="w-5 h-5 text-[#17648A]" />;
      case 'webcheckin': return <CheckCircle className="w-5 h-5 text-[#55C9BD]" />;
      default: return <Compass className="w-5 h-5 text-[#17648A]" />;
    }
  };

  const getTitleAndSubtitle = () => {
    switch (category) {
      case 'flight':
        return {
          title: 'Flight Ticket Booking Enquiry',
          subtitle: 'Domestic & International airfares with group discounts, extra baggage & 24/7 rebooking assistance.'
        };
      case 'bus':
        return {
          title: 'Bus Ticket Booking Enquiry',
          subtitle: 'Comfortable Volvo AC sleeper & semi-sleeper coaches across South India & national routes.'
        };
      case 'car':
        return {
          title: 'Car Rental & Chauffeur Services',
          subtitle: 'Clean, sanitized sedans, Innova Crysta, Fortuners & Tempo Travellers with courteous verified drivers.'
        };
      case 'cruise':
        return {
          title: 'Luxury Cruise Booking Enquiry',
          subtitle: 'Cordelia Cruises India, Royal Caribbean Singapore & European ocean getaways with all-inclusive dining.'
        };
      case 'hotel':
        return {
          title: 'Hotel & Resort Reservations',
          subtitle: 'Direct agency rates, complimentary breakfast upgrades & guaranteed bookings at 3-star to 5-star properties.'
        };
      case 'visa':
        return {
          title: 'Visa Documentation & Assistance',
          subtitle: 'Expert guidance for Schengen, USA, UK, UAE & Asian e-visas with verified document checklists.'
        };
      case 'transfer':
        return {
          title: 'Airport Transfer Booking',
          subtitle: 'Punctual meet & greet airport pick-up and drop services with flight tracking for zero waiting time.'
        };
      case 'insurance':
        return {
          title: 'Travel Insurance Enquiry',
          subtitle: 'Overseas cashless hospitalization, flight delay coverage & Schengen visa-compliant medical insurance.'
        };
      case 'webcheckin':
        return {
          title: 'Web Check-In Assistance',
          subtitle: 'Automatic seat selection, luggage tags & instant digital boarding pass delivery directly to your WhatsApp.'
        };
      default:
        return {
          title: service?.title || 'Travel Service Enquiry',
          subtitle: service?.short_desc || 'Get tailored travel assistance and quotes from our dedicated operations team.'
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      error('Please fix highlighted contact errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      let interestedDestination = '';
      let travelDate = '';
      let paxCount = 1;
      let budgetVal = 'Flexible';
      let specificDetails = '';

      switch (category) {
        case 'flight':
          interestedDestination = `Flight: ${flightFrom || 'Origin'} → ${flightTo || 'Destination'} (${flightTripType})`;
          travelDate = flightDepartDate ? `${flightDepartDate}${flightTripType === 'Round Trip' && flightReturnDate ? ' to ' + flightReturnDate : ''}` : '';
          paxCount = Number(flightAdults) + Number(flightChildren) + Number(flightInfants);
          budgetVal = flightClass;
          specificDetails = [
            `Trip Type: ${flightTripType}`,
            `From: ${flightFrom}`,
            `To: ${flightTo}`,
            `Depart: ${flightDepartDate}`,
            flightTripType === 'Round Trip' ? `Return: ${flightReturnDate}` : '',
            `Adults: ${flightAdults}, Children: ${flightChildren}, Infants: ${flightInfants}`,
            `Class: ${flightClass}`,
            flightAirline ? `Preferred Airline: ${flightAirline}` : '',
            `Meal Preference: ${flightMeal}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'bus':
          interestedDestination = `Bus: ${busFrom || 'Boarding'} → ${busTo || 'Destination'} (${busTripType})`;
          travelDate = busDepartDate ? `${busDepartDate}${busTripType === 'Round Trip' && busReturnDate ? ' to ' + busReturnDate : ''}` : '';
          paxCount = Number(busSeats) || 2;
          budgetVal = busType;
          specificDetails = [
            `Trip Type: ${busTripType}`,
            `From: ${busFrom}`,
            `To: ${busTo}`,
            `Depart Date: ${busDepartDate}`,
            busTripType === 'Round Trip' ? `Return Date: ${busReturnDate}` : '',
            `Bus Type: ${busType}`,
            `Preferred Time: ${busTime}`,
            `Seats Required: ${busSeats}`,
            busBoardingPoint ? `Boarding Landmark: ${busBoardingPoint}` : '',
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'car':
          interestedDestination = `Car Rental: ${carPickupCity || 'Origin'} → ${carDropCity || 'Drop'} (${carServiceType})`;
          travelDate = carPickupDate ? `${carPickupDate}${carReturnDate ? ' to ' + carReturnDate : ''}` : '';
          paxCount = Number(carPassengers) || 4;
          budgetVal = carVehicle;
          specificDetails = [
            `Service Type: ${carServiceType}`,
            `Pickup Location: ${carPickupCity}`,
            `Drop / Outstation: ${carDropCity}`,
            `Pickup Date/Time: ${carPickupDate}`,
            carReturnDate ? `Return Date: ${carReturnDate}` : '',
            `Vehicle Requested: ${carVehicle}`,
            `Passengers: ${carPassengers}`,
            `Luggage: ${carLuggageCount}`,
            `Driver / Trip Preferences: ${carSpecial}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'cruise':
          interestedDestination = `Cruise: ${cruiseLine}`;
          travelDate = cruiseDate || 'Upcoming Sailing';
          paxCount = Number(cruiseAdults) + Number(cruiseChildren);
          budgetVal = cruiseCabin;
          specificDetails = [
            `Cruise Line / Route: ${cruiseLine}`,
            `Departure Port: ${cruiseDeparturePort}`,
            `Duration: ${cruiseDuration}`,
            `Cabin Category: ${cruiseCabin}`,
            `Adults: ${cruiseAdults}, Children: ${cruiseChildren}`,
            `Occasion: ${cruiseOccasion}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'hotel':
          interestedDestination = `Hotel: ${hotelCity || 'Destination'} (${hotelCategory})`;
          travelDate = hotelCheckIn ? `${hotelCheckIn} to ${hotelCheckOut}` : '';
          paxCount = Number(hotelAdults) + Number(hotelChildren);
          budgetVal = hotelCategory;
          specificDetails = [
            `City / Destination: ${hotelCity}`,
            `Check-in: ${hotelCheckIn} | Check-out: ${hotelCheckOut}`,
            `Rooms: ${hotelRooms} (${hotelRoomType})`,
            `Adults: ${hotelAdults}, Children: ${hotelChildren}`,
            `Category: ${hotelCategory}`,
            `Meal Plan: ${hotelMealPlan}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'visa':
          interestedDestination = `Visa Assistance: ${visaCountry} (${visaType})`;
          travelDate = visaTravelDate || 'Upcoming';
          paxCount = Number(visaApplicants) || 1;
          budgetVal = visaServiceLevel;
          specificDetails = [
            `Country: ${visaCountry}`,
            `Visa Type: ${visaType}`,
            `Expected Travel Date: ${visaTravelDate}`,
            `Applicants: ${visaApplicants}`,
            `Passport: ${visaPassportNationality}`,
            `Service Level: ${visaServiceLevel}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'transfer':
          interestedDestination = `Airport Transfer: ${transferAirport || 'Airport'} (${transferType})`;
          travelDate = transferDate || '';
          paxCount = 2;
          budgetVal = transferVehicle;
          specificDetails = [
            `Transfer Type: ${transferType}`,
            `Airport: ${transferAirport}`,
            `Flight Number: ${transferFlightNo}`,
            `Date & Time: ${transferDate}`,
            `City Address / Hotel: ${transferAddress}`,
            `Vehicle: ${transferVehicle}`,
            transferSignName ? `Nameboard Sign: ${transferSignName}` : '',
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'insurance':
          interestedDestination = `Travel Insurance: ${insurDestination}`;
          travelDate = insurStartDate ? `${insurStartDate} to ${insurEndDate}` : '';
          paxCount = Number(insurTravelers) || 2;
          budgetVal = insurPlanType;
          specificDetails = [
            `Destination: ${insurDestination}`,
            `Trip Duration: ${insurStartDate} to ${insurEndDate}`,
            `Travelers: ${insurTravelers}`,
            `Age Group: ${insurAgeGroup}`,
            `Plan Level: ${insurPlanType}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        case 'webcheckin':
          interestedDestination = `Web Check-In: ${checkinAirline} (${checkinFlightNo || 'Flight'})`;
          travelDate = checkinDate || '';
          paxCount = 1;
          budgetVal = 'Web Check-in';
          specificDetails = [
            `Airline: ${checkinAirline}`,
            `PNR / Booking Ref: ${checkinPnr}`,
            `Flight Number: ${checkinFlightNo}`,
            `Travel Date: ${checkinDate}`,
            `Seat Preference: ${checkinSeat}`,
            `Baggage Tagging: ${checkinBaggage}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;

        default:
          interestedDestination = `Service: ${service?.title || 'Custom Tour'}`;
          travelDate = genDate || '';
          paxCount = Number(genPax) || 2;
          budgetVal = genBudget;
          specificDetails = [
            `Destination: ${genDestination}`,
            `Departing From: ${genDepartCity}`,
            `Date: ${genDate}`,
            `Travelers: ${genPax}`,
            `Budget: ${genBudget}`,
            additionalNotes ? `Notes: ${additionalNotes}` : ''
          ].filter(Boolean).join(' | ');
          break;
      }

      const fullPhone = phone.trim().startsWith('+') ? phone.trim() : `${countryCode} ${phone.trim()}`;
      await api.submitEnquiry({
        name,
        email,
        phone: fullPhone,
        destination: interestedDestination,
        package_id: null,
        departure_city: flightFrom || busFrom || carPickupCity || genDepartCity || '',
        travel_date: travelDate,
        travelers_count: paxCount,
        budget: budgetVal,
        hotel_preference: category === 'hotel' ? hotelCategory : undefined,
        travel_preference: category,
        additional_requirements: specificDetails,
        source: `${service?.title || 'Service'} Enquiry`,
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success(`Your ${service?.title || 'service'} enquiry has been submitted! Our travel desk will contact you via WhatsApp/call shortly.`);
      resetAllFields();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-[#082C43]">
        {/* Service Header Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F1E7]/70 border border-[#EFE7DA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs">
              {getServiceIcon()}
            </div>
            <div>
              <span className="text-xs font-bold text-[#082C43] block">
                {service?.title}
              </span>
              <span className="text-[11px] text-[#17648A]">
                {service?.short_desc || 'Verified Travel Service'}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SPECIFIC FIELDS PER SERVICE TYPE                         */}
        {/* ======================================================== */}

        {/* 1. FLIGHT BOOKING FORM */}
        {category === 'flight' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" /> Flight Route & Details
              </span>
              {/* Trip type buttons */}
              <div className="flex items-center gap-1 bg-[#F8F1E7] p-1 rounded-xl">
                {(['Round Trip', 'One Way', 'Multi-City'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFlightTripType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      flightTripType === t
                        ? 'bg-[#004c8f] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Departure City / Airport *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai (MAA) or Bangalore (BLR)"
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                  <span>Popular:</span>
                  {['Chennai', 'Bangalore', 'Delhi', 'Kochi'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFlightFrom(c)}
                      className="text-[#17648A] hover:underline"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Destination City / Airport *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai (DXB), Singapore (SIN), London (LHR)"
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                  <span>Popular:</span>
                  {['Dubai', 'Singapore', 'Bali', 'Kashmir', 'Goa'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFlightTo(c)}
                      className="text-[#17648A] hover:underline"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Departure Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={flightDepartDate}
                  onChange={(e) => {
                    const newDep = e.target.value;
                    setFlightDepartDate(newDep);
                    if (flightReturnDate && flightReturnDate < newDep) {
                      setFlightReturnDate('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              {flightTripType === 'Round Trip' && (
                <div>
                  <label className="text-xs font-bold text-[#082C43] mb-1 block">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    min={flightDepartDate || getTodayIST()}
                    required={flightTripType === 'Round Trip'}
                    value={flightReturnDate}
                    onChange={(e) => setFlightReturnDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Travel Class
                </label>
                <select
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Economy">Economy Class</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business Class">Business Class</option>
                  <option value="First Class">First Class</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Adults (12+ yrs)
                </label>
                <select
                  value={flightAdults}
                  onChange={(e) => setFlightAdults(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, '9+ Group'].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Children (2-11 yrs)
                </label>
                <select
                  value={flightChildren}
                  onChange={(e) => setFlightChildren(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Infants (&lt;2 yrs)
                </label>
                <select
                  value={flightInfants}
                  onChange={(e) => setFlightInfants(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[0, 1, 2, 3].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Preferred Airline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emirates, Singapore Airlines, IndiGo, Air India"
                  value={flightAirline}
                  onChange={(e) => setFlightAirline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Meal / Baggage Preference
                </label>
                <select
                  value={flightMeal}
                  onChange={(e) => setFlightMeal(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Standard / Veg">Vegetarian Meal (South Indian / Hindu Veg)</option>
                  <option value="Non-Veg">Non-Vegetarian Meal</option>
                  <option value="Jain Meal">Jain Meal</option>
                  <option value="Need Extra Baggage Assistance">Need Extra Baggage Assistance (+10kg/+20kg)</option>
                  <option value="Wheelchair Assistance">Need Wheelchair Assistance</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 2. BUS BOOKING FORM */}
        {category === 'bus' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF795C] flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5" /> Bus Route & Coach Preferences
              </span>
              <div className="flex items-center gap-1 bg-[#F8F1E7] p-1 rounded-xl">
                {(['One Way', 'Round Trip'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusTripType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      busTripType === t
                        ? 'bg-[#FF0000] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Boarding City / Point *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai (Koyambedu / Guindy)"
                  value={busFrom}
                  onChange={(e) => setBusFrom(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                  <span>Quick Pick:</span>
                  {['Chennai', 'Bangalore', 'Coimbatore', 'Madurai'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBusFrom(c)}
                      className="text-[#FF795C] hover:underline"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Destination City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ooty, Munnar, Bangalore, Kodaikanal"
                  value={busTo}
                  onChange={(e) => setBusTo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                  <span>Popular:</span>
                  {['Ooty', 'Munnar', 'Kodaikanal', 'Hyderabad', 'Tirupati'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBusTo(c)}
                      className="text-[#FF795C] hover:underline"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Journey Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={busDepartDate}
                  onChange={(e) => {
                    const newDep = e.target.value;
                    setBusDepartDate(newDep);
                    if (busReturnDate && busReturnDate < newDep) {
                      setBusReturnDate('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              {busTripType === 'Round Trip' && (
                <div>
                  <label className="text-xs font-bold text-[#082C43] mb-1 block">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    min={busDepartDate || getTodayIST()}
                    required={busTripType === 'Round Trip'}
                    value={busReturnDate}
                    onChange={(e) => setBusReturnDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Number of Seats
                </label>
                <select
                  value={busSeats}
                  onChange={(e) => setBusSeats(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '15+ Group'].map((n) => (
                    <option key={n} value={n}>{n} Seat{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Preferred Bus / Coach Type
                </label>
                <select
                  value={busType}
                  onChange={(e) => setBusType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="AC Sleeper (2+1)">AC Sleeper (2+1 Luxury)</option>
                  <option value="Volvo Multi-Axle AC Sleeper">Volvo Multi-Axle AC Sleeper (Ultra Comfort)</option>
                  <option value="BharatBenz AC Sleeper">BharatBenz AC Sleeper</option>
                  <option value="AC Semi-Sleeper / Recliner">AC Semi-Sleeper / Recliner (2+2)</option>
                  <option value="Non-AC Sleeper">Non-AC Sleeper (Budget)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Preferred Boarding Window
                </label>
                <select
                  value={busTime}
                  onChange={(e) => setBusTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Night Sleeper (8 PM - 11 PM)">Night Sleeper (8:00 PM - 11:30 PM)</option>
                  <option value="Late Night (11 PM - 1 AM)">Late Night (11:00 PM - 1:00 AM)</option>
                  <option value="Evening (5 PM - 8 PM)">Evening (5:00 PM - 8:00 PM)</option>
                  <option value="Morning (5 AM - 10 AM)">Morning (5:00 AM - 10:00 AM)</option>
                  <option value="Anytime">Anytime / Flexible</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 3. CAR RENTAL & CHAUFFEUR FORM */}
        {category === 'car' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55C9BD] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Vehicle & Chauffeur Requirements
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Rental Service Type
                </label>
                <select
                  value={carServiceType}
                  onChange={(e) => setCarServiceType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Outstation Round Trip">Outstation Round Trip (Multi-Day Tour)</option>
                  <option value="Outstation One-Way Drop">Outstation One-Way Drop</option>
                  <option value="Local City (8hr/80km)">Local City Package (8 Hrs / 80 Km)</option>
                  <option value="Airport Transfer">Airport / Railway Station Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Vehicle Choice *
                </label>
                <select
                  value={carVehicle}
                  onChange={(e) => setCarVehicle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="Toyota Innova Crysta (6+1 Seater)">Toyota Innova Crysta (6+1 Seater) - Most Popular</option>
                  <option value="Sedan - Swift Dzire / Etios (4+1)">Sedan - Swift Dzire / Etios (Up to 4 Pax)</option>
                  <option value="Maruti Ertiga (6+1)">Maruti Ertiga (Family 6 Seater)</option>
                  <option value="Toyota Fortuner 4x4 (6+1)">Toyota Fortuner 4x4 Luxury SUV</option>
                  <option value="Tempo Traveller (12 Seater)">Tempo Traveller (12 Seater AC)</option>
                  <option value="Tempo Traveller (17/20 Seater)">Tempo Traveller (17/20 Seater AC)</option>
                  <option value="Luxury Sedan - Mercedes E-Class / BMW">Luxury Sedan - Mercedes / BMW</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Pickup City & Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai (T. Nagar / Airport)"
                  value={carPickupCity}
                  onChange={(e) => setCarPickupCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Destination / Hill Station *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ooty, Kodaikanal, Munnar, Pondicherry, Tirupati"
                  value={carDropCity}
                  onChange={(e) => setCarDropCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={carPickupDate}
                  onChange={(e) => {
                    const newPickup = e.target.value;
                    setCarPickupDate(newPickup);
                    if (carReturnDate && carReturnDate < newPickup) {
                      setCarReturnDate('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Return Date
                </label>
                <input
                  type="date"
                  min={carPickupDate || getTodayIST()}
                  value={carReturnDate}
                  onChange={(e) => setCarReturnDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Passengers
                </label>
                <select
                  value={carPassengers}
                  onChange={(e) => setCarPassengers(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, '8-12', '13-20', '20+'].map((p) => (
                    <option key={p} value={p}>{p} Pax</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Luggage Volume
                </label>
                <select
                  value={carLuggageCount}
                  onChange={(e) => setCarLuggageCount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="1-2 Hand Bags">1-2 Small Bags</option>
                  <option value="3-4 Trolley Bags">3-4 Trolley Bags</option>
                  <option value="5+ Large Bags">5+ Heavy Bags (Roof carrier needed)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 4. CRUISE BOOKING FORM */}
        {category === 'cruise' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5" /> Luxury Cruise Itinerary & Stateroom
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Cruise Line & Route *
                </label>
                <select
                  value={cruiseLine}
                  onChange={(e) => setCruiseLine(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="Cordelia Cruises (Mumbai - Goa - Lakshadweep)">Cordelia Cruises: Mumbai → Goa → Lakshadweep</option>
                  <option value="Cordelia Cruises (Chennai - Sri Lanka)">Cordelia Cruises: Chennai → Hambantota / Trincomalee</option>
                  <option value="Royal Caribbean (Singapore - Malaysia - Thailand)">Royal Caribbean: Singapore → Penang → Phuket</option>
                  <option value="European Mediterranean Ocean Cruise">European Mediterranean (Spain, France, Italy)</option>
                  <option value="Dubai & Arabian Gulf Cruise">Dubai & Arabian Gulf Cruise (Oman, Abu Dhabi)</option>
                  <option value="European River Cruise (Rhine / Danube)">European River Cruise (Rhine / Danube Luxury River)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Stateroom / Cabin Category *
                </label>
                <select
                  value={cruiseCabin}
                  onChange={(e) => setCruiseCabin(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Balcony Ocean-View Stateroom">Balcony Ocean-View Stateroom (Private Balcony - Recommended)</option>
                  <option value="Ocean View Porthole Cabin">Ocean View Porthole Cabin (Window to Sea)</option>
                  <option value="Interior Stateroom">Interior Stateroom (Best Value)</option>
                  <option value="Mini-Suite / Presidential Suite">Suite / Chairman's Luxury Suite with Butler Service</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Preferred Sailing Month / Date *
                </label>
                <input
                  type="date"
                  min={getTodayIST()}
                  value={cruiseDate}
                  onChange={(e) => setCruiseDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Duration
                </label>
                <select
                  value={cruiseDuration}
                  onChange={(e) => setCruiseDuration(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="2 Nights Weekend Cruise">2 Nights (Weekend Getaway)</option>
                  <option value="3 Nights / 4 Days">3 Nights / 4 Days</option>
                  <option value="4 Nights / 5 Days">4 Nights / 5 Days (Midweek Special)</option>
                  <option value="5 Nights Island Special">5 Nights Island Special (Lakshadweep)</option>
                  <option value="7+ Nights Grand Cruise">7+ Nights Grand International Cruise</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Celebration / Occasion
                </label>
                <select
                  value={cruiseOccasion}
                  onChange={(e) => setCruiseOccasion(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Honeymoon & Romantic">Honeymoon & Romantic Getaway</option>
                  <option value="Family Holiday">Family Holiday with Kids</option>
                  <option value="Wedding Anniversary">Wedding Anniversary</option>
                  <option value="Birthday Celebration">Birthday Celebration</option>
                  <option value="Corporate / Incentive Group">Corporate / Incentive Group</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. HOTEL RESERVATIONS FORM */}
        {category === 'hotel' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF795C] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Stay Details & Room Preferences
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Destination City / Resort Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa, Maldives, Munnar, Dubai, Paris, Manali"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Hotel Star Category *
                </label>
                <select
                  value={hotelCategory}
                  onChange={(e) => setHotelCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="5-Star Luxury Resort / Palace">5-Star Luxury Resort / Palace Heritage</option>
                  <option value="4-Star Premium Hotel">4-Star Premium Hotel (Recommended)</option>
                  <option value="3-Star Boutique / Comfort Hotel">3-Star Boutique / Comfort Hotel</option>
                  <option value="Private Pool Villa / Plantation Homestay">Private Pool Villa / Plantation Bungalow</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={hotelCheckIn}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    setHotelCheckIn(newCheckIn);
                    if (hotelCheckOut && hotelCheckOut < newCheckIn) {
                      setHotelCheckOut('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  required
                  min={hotelCheckIn || getTodayIST()}
                  value={hotelCheckOut}
                  onChange={(e) => setHotelCheckOut(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Number of Rooms
                </label>
                <select
                  value={hotelRooms}
                  onChange={(e) => setHotelRooms(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, '6+ Group'].map((r) => (
                    <option key={r} value={r}>{r} Room{r !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Meal Plan Preference
                </label>
                <select
                  value={hotelMealPlan}
                  onChange={(e) => setHotelMealPlan(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="With Complimentary Breakfast (CP)">Complimentary Breakfast Included (CP)</option>
                  <option value="Breakfast + Dinner (MAP)">Breakfast + Dinner (MAP / Half Board)</option>
                  <option value="All Inclusive (AP)">All Meals Included (Breakfast, Lunch & Dinner)</option>
                  <option value="Room Only (EP)">Room Only (EP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Room View / Category
                </label>
                <select
                  value={hotelRoomType}
                  onChange={(e) => setHotelRoomType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Deluxe / Valley View">Deluxe Room (Valley / Garden View)</option>
                  <option value="Ocean / Sea Facing Room">Ocean / Sea Facing Room</option>
                  <option value="Executive Suite">Executive Suite with Living Area</option>
                  <option value="Family Interconnecting Rooms">Family Interconnecting Rooms</option>
                  <option value="Private Pool Villa">Private Plunge Pool Villa</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 6. VISA ASSISTANCE FORM */}
        {category === 'visa' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55C9BD] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Destination Country & Visa Application
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Destination Country / Embassy *
                </label>
                <select
                  value={visaCountry}
                  onChange={(e) => setVisaCountry(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="Schengen (Europe - France / Swiss / Italy / Germany)">Schengen Visa (Europe - France, Swiss, Italy, etc.)</option>
                  <option value="United States (B1/B2 Tourist & Business)">United States (USA B1/B2 Visa & Slot Booking)</option>
                  <option value="United Kingdom (Standard Visitor Visa)">United Kingdom (UK 6 Months / 2 Years Visitor)</option>
                  <option value="United Arab Emirates (Dubai 30/60 Days E-Visa)">United Arab Emirates (Dubai 30 / 60 Days E-Visa)</option>
                  <option value="Singapore (E-Visa 30 Days)">Singapore E-Visa (Fast 2-3 Working Days)</option>
                  <option value="Malaysia / Thailand / Vietnam (E-Visa / Sticker)">Malaysia / Thailand / Vietnam</option>
                  <option value="Australia / New Zealand (Visitor Visa 600)">Australia / New Zealand Visitor Visa</option>
                  <option value="Canada (Visitor Visa / Super Visa)">Canada Visitor Visa</option>
                  <option value="Japan / South Korea">Japan / South Korea Tourist Visa</option>
                  <option value="Other Country">Other International Country</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Visa Category *
                </label>
                <select
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Tourist / Holiday Visa">Tourist / Holiday Visa</option>
                  <option value="Business / Conference Visa">Business / Conference / Exhibition Visa</option>
                  <option value="Family / Friend Visit">Visiting Family or Friends</option>
                  <option value="Transit Visa">Transit Visa</option>
                  <option value="Student Visa Guidance">Student Visa Guidance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Expected Travel Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={visaTravelDate}
                  onChange={(e) => setVisaTravelDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Number of Applicants
                </label>
                <select
                  value={visaApplicants}
                  onChange={(e) => setVisaApplicants(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, '6+ Family/Group'].map((a) => (
                    <option key={a} value={a}>{a} Applicant{a !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Passport Nationality
                </label>
                <input
                  type="text"
                  value={visaPassportNationality}
                  onChange={(e) => setVisaPassportNationality(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">
                Required Assistance Level
              </label>
              <select
                value={visaServiceLevel}
                onChange={(e) => setVisaServiceLevel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              >
                <option value="Complete End-to-End Filing & Appointment">Complete End-to-End Filing (Form + Checklist + Cover Letter + Appointment)</option>
                <option value="Biometrics Appointment & Slot Booking Only">Biometrics Appointment & VFS Slot Booking Only</option>
                <option value="Document Verification & Cover Letter Drafting">Document Verification & Custom Cover Letter Drafting</option>
                <option value="Urgent / Express Visa Processing">Urgent / Express Visa Processing Guidance</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. AIRPORT TRANSFER FORM */}
        {category === 'transfer' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF795C] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Airport Meet & Greet Transfer
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Transfer Type
                </label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Airport Pickup (Arrival)">Airport Pickup (Arrival Gate Meet & Greet)</option>
                  <option value="Airport Drop (Departure)">Airport Drop (Hotel to Departure Gate)</option>
                  <option value="Round Trip">Round Trip (Arrival + Departure)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Airport Name / Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai (MAA), Bangalore (BLR), Kochi (COK)"
                  value={transferAirport}
                  onChange={(e) => setTransferAirport(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Flight Number & Scheduled Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6E-204 at 10:45 AM"
                  value={transferFlightNo}
                  onChange={(e) => setTransferFlightNo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Transfer Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  City Hotel or Destination Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ITC Grand Chola, Guindy, Chennai"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Vehicle Type
                </label>
                <select
                  value={transferVehicle}
                  onChange={(e) => setTransferVehicle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Sedan (1-3 Pax)">Sedan (Dzire / Etios - 1 to 3 Pax)</option>
                  <option value="Toyota Innova Crysta (4-6 Pax)">Toyota Innova Crysta (4 to 6 Pax)</option>
                  <option value="Tempo Traveller (7-14 Pax)">Tempo Traveller (7 to 14 Pax)</option>
                  <option value="Luxury Mercedes / BMW">Luxury Chauffeur (Mercedes / BMW)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 8. TRAVEL INSURANCE FORM */}
        {category === 'insurance' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Travel Protection & Medical Coverage
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Travel Geographic Zone *
                </label>
                <select
                  value={insurDestination}
                  onChange={(e) => setInsurDestination(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="Schengen / Europe (Mandatory €30,000)">Schengen / Europe (Embassy Mandatory €30k Cover)</option>
                  <option value="Asia (Thailand, Bali, Singapore, Dubai, etc.)">Asia (Bali, Singapore, Thailand, UAE, etc.)</option>
                  <option value="Worldwide Excl. USA & Canada">Worldwide (Excluding USA & Canada)</option>
                  <option value="Worldwide Incl. USA & Canada">Worldwide (Including USA & Canada)</option>
                  <option value="Domestic India Travel">Domestic India Travel</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Coverage Plan Tier
                </label>
                <select
                  value={insurPlanType}
                  onChange={(e) => setInsurPlanType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Comprehensive (Medical + Baggage + Flight Delay)">Comprehensive (Emergency Medical, Baggage Loss & Flight Delay)</option>
                  <option value="Zero Deductible Schengen Compliant">Zero Deductible Schengen Compliant ($250,000)</option>
                  <option value="Student Overseas Health Cover">Student Overseas Health Cover (University Compliant)</option>
                  <option value="Senior Citizen Special Cover">Senior Citizen Special Medical Cover (60+ yrs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Trip Start Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={insurStartDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setInsurStartDate(newStart);
                    if (insurEndDate && insurEndDate < newStart) {
                      setInsurEndDate('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Trip End Date *
                </label>
                <input
                  type="date"
                  required
                  min={insurStartDate || getTodayIST()}
                  value={insurEndDate}
                  onChange={(e) => setInsurEndDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Age Group of Travelers
                </label>
                <select
                  value={insurAgeGroup}
                  onChange={(e) => setInsurAgeGroup(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Adults (18-60 yrs)">Adults (18-60 yrs)</option>
                  <option value="Senior Citizens (60-75 yrs)">Senior Citizens (60-75 yrs)</option>
                  <option value="Senior Citizens (75+ yrs)">Senior Citizens (75+ yrs)</option>
                  <option value="Family with Minor Children">Family with Minor Children</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 9. WEB CHECK-IN FORM */}
        {category === 'webcheckin' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55C9BD] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> PNR & Boarding Pass Details
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Airline *
                </label>
                <select
                  value={checkinAirline}
                  onChange={(e) => setCheckinAirline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none font-medium"
                >
                  <option value="IndiGo">IndiGo (6E)</option>
                  <option value="Air India">Air India (AI)</option>
                  <option value="Air India Express">Air India Express (IX)</option>
                  <option value="SpiceJet">SpiceJet (SG)</option>
                  <option value="Akasa Air">Akasa Air (QP)</option>
                  <option value="Emirates">Emirates (EK)</option>
                  <option value="Singapore Airlines">Singapore Airlines (SQ)</option>
                  <option value="Qatar Airways">Qatar Airways (QR)</option>
                  <option value="Other Airline">Other International / Domestic Airline</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  PNR / Booking Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC123"
                  value={checkinPnr}
                  onChange={(e) => setCheckinPnr(e.target.value.toUpperCase())}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none uppercase font-mono font-bold text-[#004c8f]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Flight Date *
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  value={checkinDate}
                  onChange={(e) => setCheckinDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Flight Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6E-512"
                  value={checkinFlightNo}
                  onChange={(e) => setCheckinFlightNo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Seat Preference
                </label>
                <select
                  value={checkinSeat}
                  onChange={(e) => setCheckinSeat(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  <option value="Window Seat">Window Seat</option>
                  <option value="Aisle Seat">Aisle Seat</option>
                  <option value="Extra Legroom Seat">Extra Legroom (Exit Row)</option>
                  <option value="Front Rows (Rows 1-5)">Front Rows</option>
                  <option value="Any Free Seat">Any Free Assigned Seat</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 10. GENERAL / CUSTOM TOUR */}
        {category === 'general' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Interested Destination / Plan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerala Backwaters, Kashmir, Swiss Alps"
                  value={genDestination}
                  onChange={(e) => setGenDestination(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Departing City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai, Bangalore, Hyderabad"
                  value={genDepartCity}
                  onChange={(e) => setGenDepartCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Tentative Travel Date
                </label>
                <input
                  type="date"
                  min={getTodayIST()}
                  value={genDate}
                  onChange={(e) => setGenDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Number of Travelers
                </label>
                <select
                  value={genPax}
                  onChange={(e) => setGenPax(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, '10+ Group'].map((p) => (
                    <option key={p} value={p}>{p} Person{p !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#082C43] mb-1 block">
                  Comfort Level
                </label>
                <select
                  value={genBudget}
                  onChange={(e) => setGenBudget(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none cursor-pointer"
                >
                  <option value="Economy">Economy</option>
                  <option value="Comfort">Comfort</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Super Luxury">Super Luxury</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* UNIVERSAL CONTACT & LEAD DETAILS                         */}
        {/* ======================================================== */}
        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#EFE7DA] space-y-3 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#082C43] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#004c8f]" /> Contact & Quotation Delivery Details
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) validateField('name', e.target.value);
                }}
                onBlur={() => validateField('name', name)}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none transition-colors ${
                  errors.name
                    ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                    : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#55C9BD]" /> WhatsApp / Mobile *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9940463566"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) validateField('phone', e.target.value);
                }}
                onBlur={() => validateField('phone', phone)}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none transition-colors ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                    : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#17648A]" /> Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) validateField('email', e.target.value);
                }}
                onBlur={() => validateField('email', email)}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                    : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">
              Additional Notes or Special Requests
            </label>
            <textarea
              rows={2}
              placeholder="Any specific requests, connecting flights, preferred timings, or hotel view requirements..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-white focus:border-[#FF795C] focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-4 py-2"
          >
            Cancel
          </button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            {category === 'flight' && 'Request Flight Fare & Availability'}
            {category === 'bus' && 'Request Bus Ticket Booking'}
            {category === 'car' && 'Get Car Rental Quote'}
            {category === 'cruise' && 'Enquire Cruise Stateroom'}
            {category === 'hotel' && 'Check Hotel Rates & Availability'}
            {category === 'visa' && 'Submit Visa Application Enquiry'}
            {category === 'transfer' && 'Book Airport Transfer'}
            {category === 'insurance' && 'Get Insurance Quote'}
            {category === 'webcheckin' && 'Submit Web Check-In Request'}
            {category === 'general' && 'Submit Service Enquiry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
