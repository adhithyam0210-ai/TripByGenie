import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Percent,
  Calendar,
  Phone,
  Mail,
  User,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface EmiEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
  initialAmount?: string;
  initialTenure?: string;
}

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
];

const PRESET_AMOUNTS = [30000, 50000, 75000, 100000, 150000, 200000];

export const EmiEnquiryModal: React.FC<EmiEnquiryModalProps> = ({
  isOpen,
  onClose,
  initialDestination = '',
  initialAmount = '75000',
  initialTenure = '6 Months (0% No-Cost EMI)'
}) => {
  const { agency } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: initialDestination || '',
    departure_city: '',
    travel_date: '',
    loan_amount: initialAmount || '75000',
    tenure: initialTenure || '6 Months (0% No-Cost EMI)',
    employment_type: 'Salaried (Private / MNC / Govt)',
    monthly_income: '₹50,000 – ₹1,00,000',
    has_kyc_docs: true,
    preferred_bank: '',
    additional_notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData({
        name: '',
        email: '',
        phone: '',
        destination: initialDestination || '',
        departure_city: '',
        travel_date: '',
        loan_amount: initialAmount || '75000',
        tenure: initialTenure || '6 Months (0% No-Cost EMI)',
        employment_type: 'Salaried (Private / MNC / Govt)',
        monthly_income: '₹50,000 – ₹1,00,000',
        has_kyc_docs: true,
        preferred_bank: '',
        additional_notes: ''
      });
      setCountryCode('+91');
    }
  }, [isOpen, initialDestination, initialAmount, initialTenure]);

  // Calculate estimated monthly installment
  const calculateEmi = () => {
    const principal = Number(formData.loan_amount) || 0;
    if (principal <= 0) return 0;

    let months = 6;
    if (formData.tenure.includes('3')) months = 3;
    else if (formData.tenure.includes('6')) months = 6;
    else if (formData.tenure.includes('9')) months = 9;
    else if (formData.tenure.includes('12')) months = 12;

    return Math.round(principal / months);
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
        err = 'Destination or package name is required';
      } else if (trimmed.length < 2) {
        err = 'Destination must be at least 2 characters';
      } else if (/^\d+$/.test(trimmed)) {
        err = 'Destination cannot be only numbers';
      }
    } else if (field === 'loan_amount') {
      const num = Number(trimmed);
      if (!trimmed || isNaN(num) || num <= 0) {
        err = 'Please enter a valid financing amount';
      } else if (num < 15000) {
        err = 'Minimum holiday loan amount is ₹15,000';
      } else if (num > 1000000) {
        err = 'Maximum holiday loan amount is ₹10,00,000';
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
      if (err) next[field] = err;
      else delete next[field];
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

    const amountErr = validateField('loan_amount', String(formData.loan_amount));
    if (amountErr) newErrors.loan_amount = amountErr;

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
      const emiMonthly = calculateEmi();

      const emiDetails = [
        `[0% NO-COST EMI APPLICATION]`,
        `Requested Amount: ₹${Number(formData.loan_amount).toLocaleString('en-IN')}`,
        `Tenure: ${formData.tenure}`,
        `Estimated Monthly Installment: ₹${emiMonthly.toLocaleString('en-IN')}/month`,
        `Employment Type: ${formData.employment_type}`,
        `Monthly In-Hand Income: ${formData.monthly_income}`,
        `Digital KYC (Aadhaar/PAN): ${formData.has_kyc_docs ? 'Ready & Verified' : 'Pending'}`,
        formData.preferred_bank ? `Preferred Bank: ${formData.preferred_bank}` : '',
        formData.additional_notes ? `Notes: ${formData.additional_notes.trim()}` : ''
      ].filter(Boolean).join(' | ');

      await api.submitEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: fullPhone,
        destination: formData.destination.trim() || 'No Cost EMI Holiday Loan',
        departure_city: formData.departure_city.trim(),
        travel_date: formData.travel_date,
        travelers_count: 2,
        budget: `₹${Number(formData.loan_amount).toLocaleString('en-IN')} (${formData.tenure})`,
        hotel_preference: formData.employment_type,
        travel_preference: formData.tenure,
        additional_requirements: emiDetails,
        source: '0% EMI Vacation Application',
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('0% EMI Holiday Application submitted! Our financing specialist will contact you within 15 minutes for instant digital approval.');
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit loan application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthlyEmi = calculateEmi();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for 0% No Cost EMI Holiday Loan"
      subtitle="Say goodbye to upfront travel stress. Pay in simple, interest-free monthly installments with instant digital approval."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Banner with 0% benefits */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#082C43] to-[#17648A] text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#55C9BD]/20 text-[#55C9BD] flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Zero Down Payment • 0% Interest • No Hidden Charges</p>
              <p className="text-[11px] text-white/75 mt-0.5">Instant paperless approval in under 10 minutes via Aadhaar & PAN</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#55C9BD] bg-white/10 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bank-Grade Secured</span>
          </div>
        </div>

        {/* Personal Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#17648A]" /> Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, name: val });
                if (errors.name) validateField('name', val);
              }}
              onBlur={() => validateField('name', formData.name)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
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

          {/* Email Address */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#17648A]" /> Email Address *
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, email: val });
                if (errors.email) validateField('email', val);
              }}
              onBlur={() => validateField('email', formData.email)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
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

          {/* Phone / WhatsApp */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#17648A]" /> Phone / WhatsApp *
            </label>
            <div className="flex gap-1.5">
              <div className="relative w-24 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C] appearance-none cursor-pointer pr-6"
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#173247]/50 absolute right-2 top-3.5 pointer-events-none" />
              </div>

              <div className="flex-1">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: val });
                    if (errors.phone) validateField('phone', val);
                  }}
                  onBlur={() => validateField('phone', formData.phone)}
                  className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                      : 'border-[#EFE7DA] focus:border-[#FF795C]'
                  }`}
                />
              </div>
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Destination & Departure Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Destination */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF795C]" /> Destination / Tour *
            </label>
            <input
              type="text"
              placeholder="e.g. Kashmir, Maldives, Bali, Switzerland"
              value={formData.destination}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, destination: val });
                if (errors.destination) validateField('destination', val);
              }}
              onBlur={() => validateField('destination', formData.destination)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                errors.destination
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

          {/* Departure City */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1">
              Departure City
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Chennai, Delhi, Mumbai"
              value={formData.departure_city}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, departure_city: val });
                if (errors.departure_city) validateField('departure_city', val);
              }}
              onBlur={() => validateField('departure_city', formData.departure_city)}
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                errors.departure_city
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

          {/* Tentative Travel Date */}
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
              className={`w-full text-xs p-2.5 rounded-xl border bg-[#FFFDF8] focus:outline-none transition-colors ${
                errors.travel_date
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

        {/* EMI Financing & Loan Customization Card */}
        <div className="p-4 rounded-2xl bg-[#F8F1E7]/70 border border-[#EFE7DA] space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#082C43] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#17648A]" /> Loan Amount & EMI Calculator
            </h4>
            <span className="text-[11px] font-bold text-[#25D366] bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              0% Interest Eligible
            </span>
          </div>

          {/* Loan Amount Input & Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#082C43]">
                Estimated Holiday Loan Amount (₹) *
              </label>
              <span className="text-xs font-extrabold text-[#082C43]">
                ₹{Number(formData.loan_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setFormData({ ...formData, loan_amount: String(amt) });
                    validateField('loan_amount', String(amt));
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                    Number(formData.loan_amount) === amt
                      ? 'bg-[#082C43] text-white shadow-xs'
                      : 'bg-white border border-[#EFE7DA] text-[#173247] hover:border-[#082C43]'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-[#173247]/60">₹</span>
              <input
                type="number"
                min={15000}
                max={1000000}
                step={5000}
                value={formData.loan_amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, loan_amount: val });
                  if (errors.loan_amount) validateField('loan_amount', val);
                }}
                onBlur={() => validateField('loan_amount', String(formData.loan_amount))}
                className={`w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border bg-white focus:outline-none transition-colors ${
                  errors.loan_amount
                    ? 'border-red-400 focus:border-red-500 bg-red-50/15'
                    : 'border-[#EFE7DA] focus:border-[#FF795C]'
                }`}
                placeholder="Enter loan amount (min ₹15,000)"
              />
            </div>
            {errors.loan_amount && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.loan_amount}</span>
              </p>
            )}
          </div>

          {/* Tenure Selection & Live EMI Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* Preferred Tenure */}
            <div>
              <label className="text-xs font-bold text-[#082C43] mb-1 block">
                Preferred EMI Tenure *
              </label>
              <div className="relative">
                <select
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-white focus:outline-none focus:border-[#FF795C] appearance-none cursor-pointer pr-8 font-medium"
                >
                  <option value="3 Months (0% No-Cost EMI)">3 Months (0% No-Cost EMI)</option>
                  <option value="6 Months (0% No-Cost EMI)">6 Months (0% No-Cost EMI • Recommended)</option>
                  <option value="9 Months (Low Cost EMI)">9 Months (Low Cost EMI)</option>
                  <option value="12 Months (Flexible EMI)">12 Months (Flexible Tenure)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#173247]/50 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Live Monthly Installment Preview */}
            <div className="p-3 rounded-xl bg-white border border-[#EFE7DA] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#173247]/60 block leading-tight">
                  Estimated Monthly EMI
                </span>
                <span className="text-base font-extrabold text-[#082C43]">
                  ₹{monthlyEmi > 0 ? monthlyEmi.toLocaleString('en-IN') : '0'}
                  <span className="text-xs font-normal text-[#173247]/70"> / month</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#25D366] bg-green-100/60 px-2 py-0.5 rounded-full block">
                  0% Interest
                </span>
                <span className="text-[10px] text-[#173247]/60 mt-0.5 block">0 Processing Fee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility & Employment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Employment Type */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-[#17648A]" /> Employment Type *
            </label>
            <div className="relative">
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C] appearance-none cursor-pointer pr-8"
              >
                <option value="Salaried (Private / MNC / Govt)">Salaried (Corporate / Govt / IT)</option>
                <option value="Self-Employed / Business Owner">Self-Employed / Business Owner</option>
                <option value="Professional (Doctor, CA, Consultant)">Professional (Doctor, CA, Lawyer)</option>
                <option value="Other / Family Co-applicant">Other / Family Co-applicant</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#173247]/50 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Monthly In-Hand Income */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#17648A]" /> Monthly In-Hand Income *
            </label>
            <div className="relative">
              <select
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C] appearance-none cursor-pointer pr-8"
              >
                <option value="₹25,000 – ₹50,000">₹25,000 – ₹50,000</option>
                <option value="₹50,000 – ₹1,00,000">₹50,000 – ₹1,00,000</option>
                <option value="Above ₹1,00,000">Above ₹1,00,000</option>
                <option value="Below ₹25,000">Below ₹25,000</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#173247]/50 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Preferred Bank (Optional) */}
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#17648A]" /> Preferred Bank / Card
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC, ICICI, SBI, Axis, Kotak"
              value={formData.preferred_bank}
              onChange={(e) => setFormData({ ...formData, preferred_bank: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C]"
            />
          </div>
        </div>

        {/* Paperless Digital KYC Checkbox */}
        <div className="p-3 rounded-xl bg-[#55C9BD]/10 border border-[#55C9BD]/25 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="kyc-check"
            checked={formData.has_kyc_docs}
            onChange={(e) => setFormData({ ...formData, has_kyc_docs: e.target.checked })}
            className="mt-0.5 rounded border-[#55C9BD] text-[#17648A] focus:ring-[#55C9BD]"
          />
          <label htmlFor="kyc-check" className="text-xs text-[#082C43] cursor-pointer">
            <span className="font-bold">Instant Paperless Verification:</span> I have valid Aadhaar & PAN card available for quick 100% digital verification without paperwork.
          </label>
        </div>

        {/* Special Requests & Notes (Optional) */}
        <div>
          <label className="text-xs font-bold text-[#082C43] mb-1 block">
            Special Requests & Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.additional_notes}
            onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
            placeholder="Tell us about number of passengers, flight preferences, or specific travel financing questions..."
            className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C]"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EFE7DA]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-[#173247]/70 hover:text-[#082C43]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="text-xs font-bold bg-[#FF795C] hover:bg-[#ff6442] text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            {isSubmitting ? 'Submitting Application...' : 'Apply for 0% EMI Approval'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
