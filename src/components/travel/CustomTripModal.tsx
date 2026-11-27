import React, { useState, useEffect } from 'react';
import { Send, MapPin, Calendar, Phone, Mail, User, ChevronDown, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface CustomTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
  initialPackageId?: string;
}

export const CustomTripModal: React.FC<CustomTripModalProps> = ({
  isOpen,
  onClose,
  initialDestination = '',
  initialPackageId = ''
}) => {
  const { agency } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getBlankFormData = (dest = '') => ({
    name: '',
    email: '',
    phone: '',
    destination: dest || '',
    departure_city: '',
    travel_date: '',
    adults: '2',
    children: '0',
    budget: 'Comfort',
    hotel_preference: '4-Star Premium Hotel',
    travel_preference: 'Couples / Romantic',
    additional_requirements: ''
  });

  const [formData, setFormData] = useState(() => getBlankFormData(initialDestination));

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData(getBlankFormData(initialDestination));
      setCountryCode('+91');
    }
  }, [isOpen, initialDestination]);

  const handleClose = () => {
    setFormData(getBlankFormData(initialDestination));
    setErrors({});
    setCountryCode('+91');
    onClose();
  };

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
        err = 'Name cannot contain special characters (only letters, numbers, spaces, and _ allowed)';
      }
    } else if (field === 'email') {
      if (!trimmed) {
        err = 'Email Address is required';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'Please enter a valid email address with a domain (e.g. name@domain.com)';
      }
    } else if (field === 'phone') {
      if (!trimmed) {
        err = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(trimmed)) {
        err = 'Mobile number must be exactly 10 digits';
      }
    } else if (field === 'destination') {
      if (!trimmed) {
        err = 'Destination is required';
      } else if (trimmed.length < 2) {
        err = 'Destination must be at least 2 characters';
      } else if (/^\d+$/.test(trimmed)) {
        err = 'Destination cannot be only numbers';
      }
    } else if (field === 'departure_city') {
      if (trimmed) {
        if (trimmed.length < 2) {
          err = 'Departure city must be at least 2 characters';
        } else if (/^\d+$/.test(trimmed)) {
          err = 'Departure city cannot be only numbers';
        }
      }
    } else if (field === 'travel_date') {
      if (trimmed) {
        const selectedDate = new Date(trimmed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          err = 'Travel date cannot be in the past';
        }
      }
    }

    setErrors((prev) => {
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

  const validateAll = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const nameErr = validateField('name', formData.name);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateField('email', formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validateField('phone', formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const destErr = validateField('destination', formData.destination);
    if (destErr) newErrors.destination = destErr;

    const depErr = validateField('departure_city', formData.departure_city);
    if (depErr) newErrors.departure_city = depErr;

    const dateErr = validateField('travel_date', formData.travel_date);
    if (dateErr) newErrors.travel_date = dateErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      error('Please fix the highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `${countryCode} ${formData.phone}`.trim();
      await api.submitEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: fullPhone,
        destination: formData.destination.trim() || 'Custom Tour',
        package_id: initialPackageId || null,
        departure_city: formData.departure_city.trim(),
        travel_date: formData.travel_date,
        travelers_count: Number(formData.adults) + Number(formData.children),
        budget: formData.budget,
        hotel_preference: formData.hotel_preference,
        travel_preference: formData.travel_preference,
        additional_requirements: formData.additional_requirements.trim(),
        source: initialPackageId ? 'Package Booking' : 'Customized Trip Form',
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('Our travel consultant will contact you with a customized quote shortly.', {
        title: 'Trip Enquiry Submitted!'
      });
      setFormData(getBlankFormData(initialDestination));
      setErrors({});
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Plan Your Dream Custom Trip"
      subtitle="Tell us your preferences and our travel designers will tailor an unforgettable itinerary."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#17648A]" /> Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, name: val });
                if (errors.name) validateField('name', val);
              }}
              onBlur={() => validateField('name', formData.name)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${errors.name
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

          {/* Email Address */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#17648A]" /> Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, email: val });
                if (errors.email) validateField('email', val);
              }}
              onBlur={() => validateField('email', formData.email)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${errors.email
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

          {/* Phone / WhatsApp with Country Extension Dropdown */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#17648A]" /> Phone / WhatsApp *
            </label>
            <div className="flex gap-1.5">
              <div className="relative w-[68px] shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setCountryCode(newCode);
                    if (errors.phone) validateField('phone', formData.phone);
                  }}
                  className="w-full h-[38px] text-[11px] pl-2 pr-4 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-[#082C43] font-semibold focus:border-[#FF795C] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="+91">IN +91</option>
                  <option value="+971">AE +971</option>
                  <option value="+65">SG +65</option>
                  <option value="+60">MY +60</option>
                  <option value="+62">ID +62</option>
                  <option value="+66">TH +66</option>
                  <option value="+84">VN +84</option>
                  <option value="+960">MV +960</option>
                  <option value="+94">LK +94</option>
                  <option value="+44">UK +44</option>
                  <option value="+1">US +1</option>
                  <option value="+61">AU +61</option>
                  <option value="+33">FR +33</option>
                  <option value="+49">DE +49</option>
                  <option value="+41">CH +41</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#082C43]/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <input
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const cleanPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: cleanPhone });
                  if (errors.phone) validateField('phone', cleanPhone);
                }}
                onBlur={() => validateField('phone', formData.phone)}
                className={`w-full h-[38px] text-xs px-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors font-medium ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                    : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Destination & Departure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF795C]" /> Destination *
            </label>
            <input
              type="text"
              placeholder="e.g. Kashmir, Maldives, Bali"
              value={formData.destination}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, destination: val });
                if (errors.destination) validateField('destination', val);
              }}
              onBlur={() => validateField('destination', formData.destination)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${errors.destination
                ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
            />
            {errors.destination && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.destination}</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              Departure City
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Delhi, Mumbai"
              value={formData.departure_city}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, departure_city: val });
                if (errors.departure_city) validateField('departure_city', val);
              }}
              onBlur={() => validateField('departure_city', formData.departure_city)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${errors.departure_city
                ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
            />
            {errors.departure_city && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.departure_city}</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#17648A]" /> Tentative Travel Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={formData.travel_date}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, travel_date: val });
                if (errors.travel_date) validateField('travel_date', val);
              }}
              onBlur={() => validateField('travel_date', formData.travel_date)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${errors.travel_date
                ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
            />
            {errors.travel_date && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.travel_date}</span>
              </p>
            )}
          </div>
        </div>

        {/* Travelers & Travel Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Adults (12+ yrs)</label>
            <select
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, '12+'].map((num) => (
                <option key={num} value={num}>
                  {num} Adult{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Children (0-11 yrs)</label>
            <select
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4, '5+'].map((num) => (
                <option key={num} value={num}>
                  {num} Child{num !== 1 ? 'ren' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Travel Preference</label>
            <div className="relative">
              <select
                value={formData.travel_preference}
                onChange={(e) => setFormData({ ...formData, travel_preference: e.target.value })}
                className="w-full text-xs p-2.5 pr-8 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-[#082C43] focus:border-[#FF795C] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Couples / Romantic">Couples / Romantic</option>
                <option value="Family Vacation">Family Vacation</option>
                <option value="Friends & Adventure">Friends & Adventure</option>
                <option value="Relaxation & Spa">Relaxation & Spa</option>
                <option value="Solo Exploration">Solo Exploration</option>
                <option value="Senior Citizen Special">Senior Citizen Special</option>
                <option value="Corporate / Group Retreat">Corporate / Group Retreat</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#082C43] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Comfort Level & Stay Preference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Comfort Level</label>
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none cursor-pointer"
            >
              <option value="Economy">Economy</option>
              <option value="Comfort">Comfort</option>
              <option value="Premium">Premium</option>
              <option value="Luxury">Luxury</option>
              <option value="Super Luxury">Super Luxury</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Stay Preference</label>
            <select
              value={formData.hotel_preference}
              onChange={(e) => setFormData({ ...formData, hotel_preference: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none cursor-pointer"
            >
              <option value="3-Star Cozy Hotel">3-Star Cozy</option>
              <option value="4-Star Premium Hotel">4-Star Premium</option>
              <option value="5-Star Luxury Resort">5-Star Luxury</option>
              <option value="Private Pool Villa">Private Villa</option>
              <option value="Heritage Palaces / Houseboat">Heritage / Houseboat</option>
            </select>
          </div>
        </div>

        {/* Additional requirements */}
        <div>
          <label className="text-xs font-bold text-[#082C43] mb-1 block">
            Special Requests & Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Tell us about sightseeing interests, dietary requirements, anniversary celebrations, flight inclusions..."
            value={formData.additional_requirements}
            onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Enquiry
          </Button>
        </div>
      </form>
    </Modal>
  );
};

