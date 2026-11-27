import React, { useState, useRef } from 'react';
import {
  X,
  Building2,
  UserCheck,
  Briefcase,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface B2BPartnerEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Other (International)'
];

const POPULAR_DESTINATIONS = [
  'Kashmir',
  'Goa',
  'Kerala',
  'Dubai',
  'Bali',
  'Maldives',
  'Thailand',
  'Europe',
  'Singapore',
  'Andaman',
  'Himachal Pradesh',
  'Vietnam',
  'Ooty & Kodaikanal',
  'Sri Lanka',
  'Malaysia'
];

const PACKAGE_CATEGORIES = [
  'Domestic Tour Packages',
  'International Tour Packages',
  'Honeymoon Packages',
  'Family Tour Packages',
  'Group Tour Packages',
  'Adventure Packages',
  'Corporate Travel',
  'Customized Packages'
];

export const B2BPartnerEnquiryModal: React.FC<B2BPartnerEnquiryModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Section 1
    company_name: '',
    business_type: '',
    business_email: '',
    gst_number: '',
    business_reg_number: '',
    years_in_business: '',
    // Section 2
    contact_person: '',
    designation: '',
    custom_designation: '',
    mobile_number: '',
    whatsapp_number: '',
    contact_email: '',
    business_location: '',
    state: 'Tamil Nadu',
    country: 'India',
    // Section 3
    interested_categories: [] as string[],
    preferred_destinations: [] as string[],
    expected_monthly_bookings: '',
    travellers_per_booking: '',
    estimated_monthly_volume: '',
    partnership_type: '',
    // Section 4
    how_did_you_hear: '',
    additional_requirements: '',
    privacy_consent: false,
    communication_consent: false
  });

  const [customDestination, setCustomDestination] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const exists = prev.interested_categories.includes(category);
      const nextCategories = exists
        ? prev.interested_categories.filter((c) => c !== category)
        : [...prev.interested_categories, category];
      return { ...prev, interested_categories: nextCategories };
    });
    if (fieldErrors.interested_categories) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.interested_categories;
        return next;
      });
    }
  };

  const handleAddDestination = (dest: string) => {
    const trimmed = dest.trim();
    if (!trimmed) return;
    if (formData.preferred_destinations.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setCustomDestination('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      preferred_destinations: [...prev.preferred_destinations, trimmed]
    }));
    setCustomDestination('');
    if (fieldErrors.preferred_destinations) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.preferred_destinations;
        return next;
      });
    }
  };

  const handleRemoveDestination = (destToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_destinations: prev.preferred_destinations.filter((d) => d !== destToRemove)
    }));
  };

  const handleCopyMobileToWhatsApp = () => {
    if (!formData.mobile_number) return;
    handleInputChange('whatsapp_number', formData.mobile_number);
  };

  const handleCopyBusinessEmailToContact = () => {
    if (!formData.business_email) return;
    handleInputChange('contact_email', formData.business_email);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles: File[] = [];

    for (const file of files) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
        error(`Invalid format for "${file.name}". Only PDF, JPG, and PNG files are allowed.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        error(`"${file.name}" exceeds 5 MB size limit.`);
        continue;
      }
      if (selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        continue;
      }
      validFiles.push(file);
    }

    if (selectedFiles.length + validFiles.length > 5) {
      error('Maximum 5 documents can be uploaded at this time.');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Section 1: Business Information
    if (!formData.company_name.trim() || formData.company_name.trim().length < 2) {
      errors.company_name = 'Company / Agency Name is required (2–100 characters).';
    } else if (formData.company_name.trim().length > 100) {
      errors.company_name = 'Company Name cannot exceed 100 characters.';
    }

    if (!formData.business_type) {
      errors.business_type = 'Please select a Business Type.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.business_email.trim() || !emailRegex.test(formData.business_email.trim())) {
      errors.business_email = 'Valid business email address is required.';
    }

    if (formData.gst_number.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gst_number.trim().toUpperCase())) {
        errors.gst_number = 'Invalid Indian GSTIN format (e.g. 07AAAAA1111A1Z9).';
      }
    }

    if (!formData.years_in_business) {
      errors.years_in_business = 'Please select your Years in Business.';
    }

    // Section 2: Contact Information
    if (!formData.contact_person.trim() || formData.contact_person.trim().length < 2) {
      errors.contact_person = 'Contact Person Name is required (2–60 characters).';
    }

    if (!formData.designation) {
      errors.designation = 'Please select a Designation.';
    } else if (formData.designation === 'Other' && !formData.custom_designation.trim()) {
      errors.custom_designation = 'Please specify your designation.';
    }

    if (!formData.mobile_number.trim()) {
      errors.mobile_number = 'Mobile Number is required.';
    } else {
      const digits = formData.mobile_number.replace(/\D/g, '');
      if (digits.length < 10) {
        errors.mobile_number = 'Valid 10-digit mobile number is required.';
      }
    }

    if (!formData.contact_email.trim() || !emailRegex.test(formData.contact_email.trim())) {
      errors.contact_email = 'Valid contact email address is required.';
    }

    if (!formData.business_location.trim() || formData.business_location.trim().length < 2) {
      errors.business_location = 'Business City/Location is required (min 2 characters).';
    }

    if (!formData.state) {
      errors.state = 'Please select your State.';
    }

    if (!formData.country) {
      errors.country = 'Please select your Country.';
    }

    // Section 3: Business Requirements
    if (formData.interested_categories.length === 0) {
      errors.interested_categories = 'Select at least one Interested Package Category.';
    }

    if (formData.preferred_destinations.length === 0) {
      errors.preferred_destinations = 'Add at least one Preferred Destination.';
    }

    if (!formData.expected_monthly_bookings) {
      errors.expected_monthly_bookings = 'Please select Expected Monthly Bookings.';
    }

    if (!formData.partnership_type) {
      errors.partnership_type = 'Please select a Preferred Partnership Type.';
    }

    // Section 4: Additional Information
    if (formData.additional_requirements.length > 500) {
      errors.additional_requirements = 'Additional requirements cannot exceed 500 characters.';
    }

    if (!formData.privacy_consent) {
      errors.privacy_consent = 'You must accept the Privacy Policy to submit your business enquiry.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      error('Please complete all mandatory fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataPayload = new FormData();
      dataPayload.append('company_name', formData.company_name.trim());
      dataPayload.append('business_type', formData.business_type);
      dataPayload.append('business_email', formData.business_email.trim().toLowerCase());
      dataPayload.append('gst_number', formData.gst_number.trim().toUpperCase());
      dataPayload.append('business_reg_number', formData.business_reg_number.trim());
      dataPayload.append('years_in_business', formData.years_in_business);

      dataPayload.append('contact_person', formData.contact_person.trim());
      dataPayload.append('designation', formData.designation);
      if (formData.designation === 'Other') {
        dataPayload.append('custom_designation', formData.custom_designation.trim());
      }
      dataPayload.append('mobile_number', formData.mobile_number.trim());
      dataPayload.append('whatsapp_number', formData.whatsapp_number.trim());
      dataPayload.append('contact_email', formData.contact_email.trim().toLowerCase());
      dataPayload.append('business_location', formData.business_location.trim());
      dataPayload.append('state', formData.state);
      dataPayload.append('country', formData.country);

      dataPayload.append('interested_categories', JSON.stringify(formData.interested_categories));
      dataPayload.append('preferred_destinations', JSON.stringify(formData.preferred_destinations));
      dataPayload.append('expected_monthly_bookings', formData.expected_monthly_bookings);
      if (formData.travellers_per_booking) {
        dataPayload.append('travellers_per_booking', formData.travellers_per_booking);
      }
      if (formData.estimated_monthly_volume) {
        dataPayload.append('estimated_monthly_volume', formData.estimated_monthly_volume);
      }
      dataPayload.append('partnership_type', formData.partnership_type);

      if (formData.how_did_you_hear) {
        dataPayload.append('how_did_you_hear', formData.how_did_you_hear);
      }
      if (formData.additional_requirements.trim()) {
        dataPayload.append('additional_requirements', formData.additional_requirements.trim());
      }
      dataPayload.append('privacy_consent', 'true');
      dataPayload.append('communication_consent', formData.communication_consent ? 'true' : 'false');

      for (const file of selectedFiles) {
        dataPayload.append('documents', file);
      }

      const res = await api.submitB2BEnquiry(dataPayload);
      if (res && res.enquiry_id) {
        setSubmittedRefId(res.enquiry_id);
        setSubmitSuccess(true);
        success('B2B Partner Enquiry submitted successfully!');
      } else {
        throw new Error('No reference ID returned.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit B2B enquiry. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedRefId) {
      navigator.clipboard.writeText(submittedRefId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setSubmitSuccess(false);
    setSubmittedRefId('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#082C43] via-[#044A9C] to-[#0A3D62] text-white px-5 sm:px-8 py-5 relative shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF795C]/20 text-[#FFB2A1] border border-[#FF795C]/30 tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-[#FF795C]" />
              B2B Partner Registration
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight text-white">
            Become a Travel Partner
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
            Join our travel partner network and access exclusive wholesale travel packages.
          </p>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 text-slate-800 space-y-8">
          {submitSuccess ? (
            /* Success Screen matching specification */
            <div className="py-8 sm:py-12 px-4 text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-lg">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black font-display text-[#082C43]">
                  Application Submitted Successfully!
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Thank you for your interest in partnering with us! Your B2B enquiry has been successfully submitted. Our team will review your information and contact you shortly.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F1E7]/60 border border-[#EFE7DA] space-y-2 text-left">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  B2B Enquiry Reference ID
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg sm:text-xl font-mono font-bold text-[#044A9C]">
                    {submittedRefId}
                  </span>
                  <button
                    onClick={handleCopyRef}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRef ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  Please keep this reference number for all future correspondence with our partner onboarding desk.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-8 py-3 rounded-full bg-[#044A9C] text-white text-sm font-bold shadow-lg hover:bg-[#033B7C] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* ======================================================== */}
              {/* SECTION 01 – BUSINESS INFORMATION                        */}
              {/* ======================================================== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-[#044A9C]/10 text-[#044A9C] flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#082C43] font-display flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#044A9C]" />
                      Business Information
                    </h3>
                    <p className="text-xs text-slate-500">Provide legal entity details for your travel organization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company / Agency Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Agency Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="e.g. Voyage Express Holidays Pvt Ltd"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.company_name
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.company_name && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.company_name}
                      </p>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.business_type}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.business_type
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    >
                      <option value="">Select Business Type</option>
                      <option value="Travel Agency">Travel Agency</option>
                      <option value="Tour Operator">Tour Operator</option>
                      <option value="Travel Consultant">Travel Consultant</option>
                      <option value="Online Travel Agency (OTA)">Online Travel Agency (OTA)</option>
                      <option value="Corporate Travel Agency">Corporate Travel Agency</option>
                      <option value="Freelance Travel Agent">Freelance Travel Agent</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.business_type && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.business_type}
                      </p>
                    )}
                  </div>

                  {/* Years in Business */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Years in Business <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.years_in_business}
                      onChange={(e) => handleInputChange('years_in_business', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.years_in_business
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    >
                      <option value="">Select Experience</option>
                      <option value="Just Starting">Just Starting</option>
                      <option value="Less than 1 Year">Less than 1 Year</option>
                      <option value="1–3 Years">1–3 Years</option>
                      <option value="3–5 Years">3–5 Years</option>
                      <option value="5–10 Years">5–10 Years</option>
                      <option value="More than 10 Years">More than 10 Years</option>
                    </select>
                    {fieldErrors.years_in_business && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.years_in_business}
                      </p>
                    )}
                  </div>

                  {/* Business Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => handleInputChange('business_email', e.target.value)}
                      placeholder="e.g. partner@voyageexpress.com"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.business_email
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.business_email && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.business_email}
                      </p>
                    )}
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GST Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) => handleInputChange('gst_number', e.target.value.toUpperCase())}
                      placeholder="e.g. 07AAAAA1111A1Z9"
                      maxLength={15}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 uppercase transition-all ${
                        fieldErrors.gst_number
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.gst_number ? (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.gst_number}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">15-digit alphanumeric Indian GSTIN if registered</p>
                    )}
                  </div>

                  {/* Business Registration Number */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Registration Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.business_reg_number}
                      onChange={(e) => handleInputChange('business_reg_number', e.target.value)}
                      placeholder="e.g. CIN, MSME/Udyam, or Trade License Number"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 02 – CONTACT INFORMATION                         */}
              {/* ======================================================== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-[#044A9C]/10 text-[#044A9C] flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#082C43] font-display flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#044A9C]" />
                      Contact Information
                    </h3>
                    <p className="text-xs text-slate-500">Authorized representative managing partner communication</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Person Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.contact_person
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.contact_person && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.contact_person}
                      </p>
                    )}
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.designation
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    >
                      <option value="">Select Designation</option>
                      <option value="Owner">Owner</option>
                      <option value="Founder">Founder</option>
                      <option value="Managing Director">Managing Director</option>
                      <option value="Manager">Manager</option>
                      <option value="Travel Consultant">Travel Consultant</option>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.designation && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.designation}
                      </p>
                    )}
                  </div>

                  {/* Custom Designation if Other */}
                  {formData.designation === 'Other' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Specify Designation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.custom_designation}
                        onChange={(e) => handleInputChange('custom_designation', e.target.value)}
                        placeholder="e.g. Head of Business Development"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20"
                      />
                      {fieldErrors.custom_designation && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {fieldErrors.custom_designation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={formData.mobile_number}
                        onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                        placeholder="98765 43210"
                        maxLength={12}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-r-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.mobile_number
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                        }`}
                      />
                    </div>
                    {fieldErrors.mobile_number && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.mobile_number}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        WhatsApp Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyMobileToWhatsApp}
                        className="text-[11px] text-[#044A9C] hover:underline font-semibold cursor-pointer"
                      >
                        Same as Mobile
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all"
                    />
                  </div>

                  {/* Contact Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Contact Email <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyBusinessEmailToContact}
                        className="text-[11px] text-[#044A9C] hover:underline font-semibold cursor-pointer"
                      >
                        Same as Business Email
                      </button>
                    </div>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="e.g. ramesh@voyageexpress.com"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.contact_email
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.contact_email && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.contact_email}
                      </p>
                    )}
                  </div>

                  {/* Business Location (City) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Location / City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.business_location}
                      onChange={(e) => handleInputChange('business_location', e.target.value)}
                      placeholder="e.g. Chennai, Bangalore, or Mumbai"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.business_location
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    />
                    {fieldErrors.business_location && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.business_location}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State / UT <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all cursor-pointer"
                    >
                      {INDIAN_STATES_AND_UTS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Australia">Australia</option>
                      <option value="Canada">Canada</option>
                      <option value="Other">Other International Country</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 03 – BUSINESS REQUIREMENTS                      */}
              {/* ======================================================== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-[#044A9C]/10 text-[#044A9C] flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#082C43] font-display flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#044A9C]" />
                      Business Requirements & Package Interests
                    </h3>
                    <p className="text-xs text-slate-500">Tell us your wholesale package and booking volume expectations</p>
                  </div>
                </div>

                {/* Interested Package Categories (Multi-select) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Interested Package Categories <span className="text-rose-500">*</span> (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PACKAGE_CATEGORIES.map((cat) => {
                      const isSelected = formData.interested_categories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#044A9C] text-white border-[#044A9C] shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.interested_categories && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.interested_categories}
                    </p>
                  )}
                </div>

                {/* Preferred Destinations (Multi-Select Tags + Custom Entry) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Preferred Destinations <span className="text-rose-500">*</span> (Choose popular tags or enter custom)
                  </label>

                  {/* Selected Tags Display */}
                  {formData.preferred_destinations.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {formData.preferred_destinations.map((dest) => (
                        <span
                          key={dest}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#044A9C] text-white shadow-xs"
                        >
                          <MapPin className="w-3 h-3 text-[#55C9BD]" />
                          {dest}
                          <button
                            type="button"
                            onClick={() => handleRemoveDestination(dest)}
                            className="hover:text-rose-200 transition-colors cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Popular Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 self-center mr-1">Suggestions:</span>
                    {POPULAR_DESTINATIONS.filter(
                      (d) => !formData.preferred_destinations.some((pd) => pd.toLowerCase() === d.toLowerCase())
                    )
                      .slice(0, 8)
                      .map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => handleAddDestination(d)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-500" />
                          {d}
                        </button>
                      ))}
                  </div>

                  {/* Custom Destination Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDestination(customDestination);
                        }
                      }}
                      placeholder="Type custom destination (e.g. Switzerland, Ladakh, Tokyo) & press Add"
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDestination(customDestination)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {fieldErrors.preferred_destinations && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.preferred_destinations}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Expected Monthly Bookings */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Monthly Bookings <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.expected_monthly_bookings}
                      onChange={(e) => handleInputChange('expected_monthly_bookings', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.expected_monthly_bookings
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    >
                      <option value="">Select Monthly Volume</option>
                      <option value="1–5 Bookings">1–5 Bookings</option>
                      <option value="6–10 Bookings">6–10 Bookings</option>
                      <option value="11–25 Bookings">11–25 Bookings</option>
                      <option value="26–50 Bookings">26–50 Bookings</option>
                      <option value="50+ Bookings">50+ Bookings</option>
                    </select>
                    {fieldErrors.expected_monthly_bookings && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.expected_monthly_bookings}
                      </p>
                    )}
                  </div>

                  {/* Expected Travellers per Booking */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Travellers per Booking <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={formData.travellers_per_booking}
                      onChange={(e) => handleInputChange('travellers_per_booking', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all cursor-pointer"
                    >
                      <option value="">Select Group Size</option>
                      <option value="1–2 Travellers">1–2 Travellers (FIT / Couples)</option>
                      <option value="3–5 Travellers">3–5 Travellers (Small Family)</option>
                      <option value="6–10 Travellers">6–10 Travellers (Family Group)</option>
                      <option value="11–20 Travellers">11–20 Travellers (Group Tour)</option>
                      <option value="20+ Travellers">20+ Travellers (Mega Group / Corporate)</option>
                    </select>
                  </div>

                  {/* Estimated Monthly Business Volume */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimated Monthly Volume in INR <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={formData.estimated_monthly_volume}
                      onChange={(e) => handleInputChange('estimated_monthly_volume', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all cursor-pointer"
                    >
                      <option value="">Select Business Volume</option>
                      <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                      <option value="₹5 Lakhs – ₹15 Lakhs">₹5 Lakhs – ₹15 Lakhs</option>
                      <option value="₹15 Lakhs – ₹30 Lakhs">₹15 Lakhs – ₹30 Lakhs</option>
                      <option value="₹30 Lakhs – ₹50 Lakhs">₹30 Lakhs – ₹50 Lakhs</option>
                      <option value="₹50 Lakhs+">₹50 Lakhs+ (Enterprise Tier)</option>
                    </select>
                  </div>

                  {/* Preferred Partnership Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Partnership Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.partnership_type}
                      onChange={(e) => handleInputChange('partnership_type', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.partnership_type
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#044A9C] focus:ring-[#044A9C]/20'
                      }`}
                    >
                      <option value="">Select Partnership Type</option>
                      <option value="Wholesale Package Purchase">Wholesale Package Purchase</option>
                      <option value="Reseller Partnership">Reseller Partnership</option>
                      <option value="Bulk Group Booking">Bulk Group Booking</option>
                      <option value="Long-term Business Partnership">Long-term Business Partnership</option>
                    </select>
                    {fieldErrors.partnership_type && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.partnership_type}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 04 – ADDITIONAL INFORMATION                      */}
              {/* ======================================================== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-[#044A9C]/10 text-[#044A9C] flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#082C43] font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#044A9C]" />
                      Additional Information & Documents
                    </h3>
                    <p className="text-xs text-slate-500">Provide any specific requests, verification files, and consent</p>
                  </div>
                </div>

                {/* How Did You Hear About Us? */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    How Did You Hear About Us? <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formData.how_did_you_hear}
                    onChange={(e) => handleInputChange('how_did_you_hear', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all cursor-pointer"
                  >
                    <option value="">Select an option</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Social Media">Social Media (Instagram / LinkedIn / Facebook)</option>
                    <option value="Referral">Travel Agent Referral</option>
                    <option value="Existing Business Partner">Existing Business Partner</option>
                    <option value="Advertisement">Trade Expo / Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Additional Requirements with Live 500-Character Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Additional Requirements / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        formData.additional_requirements.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {formData.additional_requirements.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formData.additional_requirements}
                    onChange={(e) => handleInputChange('additional_requirements', e.target.value)}
                    placeholder="Tell us about specific destinations, pricing expectations, or customized package requirements you frequently book..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#044A9C] focus:ring-2 focus:ring-[#044A9C]/20 transition-all resize-none"
                  />
                  {fieldErrors.additional_requirements && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.additional_requirements}
                    </p>
                  )}
                </div>

                {/* Business Profile / Documents File Upload (Optional, PDF/JPG/PNG, max 5MB) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Profile / Documents <span className="text-slate-400 font-normal">(Optional, PDF, JPG, PNG up to 5 MB each)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#044A9C] rounded-2xl p-4 sm:p-5 text-center bg-slate-50 hover:bg-white transition-all cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-[#044A9C]/10 text-[#044A9C] group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#082C43]">
                      Click to upload business profile or registration document
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supported formats: PDF, JPG, PNG (Max 5 MB each, up to 5 files)
                    </p>
                  </div>

                  {/* Selected Files List with Remove */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((f, idx) => (
                        <div
                          key={`${f.name}-${idx}`}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <FileText className="w-4 h-4 text-[#044A9C] shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-3 pt-2">
                  {/* Mandatory Privacy Policy Consent */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.privacy_consent}
                      onChange={(e) => handleInputChange('privacy_consent', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#044A9C] focus:ring-[#044A9C] border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-rose-500 font-bold">* </strong>
                      I have read and agree to the{' '}
                      <a href="/privacy" target="_blank" className="text-[#044A9C] underline font-semibold">
                        Privacy Policy
                      </a>{' '}
                      and consent to the processing of my business enquiry information.
                    </span>
                  </label>
                  {fieldErrors.privacy_consent && (
                    <p className="text-[11px] text-rose-500 -mt-1 ml-7 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.privacy_consent}
                    </p>
                  )}

                  {/* Optional Business Communication Consent */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.communication_consent}
                      onChange={(e) => handleInputChange('communication_consent', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#044A9C] focus:ring-[#044A9C] border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to receive partner announcements, wholesale seasonal discounts, and business updates via WhatsApp & email.
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 text-center sm:text-left">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Enquiry data is strictly encrypted and protected under DPDP Act 2023.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-7 py-2.5 rounded-full bg-[#044A9C] hover:bg-[#033B7C] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Enquiry...</span>
                      </>
                    ) : (
                      <span>Submit Partner Enquiry</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
