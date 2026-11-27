import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, CheckCircle2, ArrowRight, ShieldCheck, Send, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

const COUNTRY_EXTENSIONS = [
  { code: '+91', country: 'IN', label: '+91 (India)' },
  { code: '+1', country: 'US', label: '+1 (USA/Canada)' },
  { code: '+44', country: 'UK', label: '+44 (UK)' },
  { code: '+971', country: 'AE', label: '+971 (UAE)' },
  { code: '+65', country: 'SG', label: '+65 (Singapore)' },
  { code: '+61', country: 'AU', label: '+61 (Australia)' },
  { code: '+60', country: 'MY', label: '+60 (Malaysia)' },
  { code: '+66', country: 'TH', label: '+66 (Thailand)' },
  { code: '+49', country: 'DE', label: '+49 (Germany)' },
  { code: '+33', country: 'FR', label: '+33 (France)' }
];

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(6);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});

  useEffect(() => {
    if (!isSubmitted) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, navigate]);

  const validateField = (field: 'name' | 'email' | 'phone', value: string, code = countryCode) => {
    let errorMsg = '';
    const trimmed = value.trim();

    if (field === 'name') {
      if (!trimmed) {
        errorMsg = 'Full name is required.';
      } else if (trimmed.length < 2) {
        errorMsg = 'Full name must be at least 2 characters long.';
      } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
        errorMsg = 'Please enter a valid name (letters only).';
      }
    } else if (field === 'email') {
      if (!trimmed) {
        errorMsg = 'Email address is required.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          errorMsg = 'Please enter a valid email address (e.g. name@domain.com).';
        }
      }
    } else if (field === 'phone') {
      if (!trimmed) {
        errorMsg = 'Mobile number is required.';
      } else {
        const digits = trimmed.replace(/\D/g, '');
        if (code === '+91') {
          if (digits.length !== 10) {
            errorMsg = 'Please enter a valid 10-digit mobile number.';
          }
        } else {
          if (digits.length < 7 || digits.length > 15) {
            errorMsg = 'Please enter a valid mobile number (7-15 digits).';
          }
        }
      }
    }

    return errorMsg;
  };

  const handleBlur = (field: 'name' | 'email' | 'phone') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val = '';
    if (field === 'name') val = name;
    else if (field === 'email') val = email;
    else val = phone;
    const msg = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field: 'name' | 'email' | 'phone', val: string) => {
    if (field === 'name') setName(val);
    else if (field === 'email') setEmail(val);
    else setPhone(val);

    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }

    if (touched[field]) {
      const msg = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    if (touched.phone) {
      const msg = validateField('phone', phone, newCode);
      setErrors((prev) => ({ ...prev, phone: msg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });

    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const phoneErr = validateField('phone', phone);

    if (nameErr || emailErr || phoneErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        phone: phoneErr
      });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const fullPhone = `${countryCode} ${phone.trim()}`;
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        country_code: countryCode
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setErrors({
        general: err.message || 'Registration request could not be processed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#FF0000] selection:text-white">
      {/* Fullsize Container matching desktop widescreen design */}
      <div className="w-full max-w-6xl xl:max-w-7xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] lg:min-h-[680px]">
        
        {/* Left Side: Destination Showcase & Inspiration */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#EBF4FF] via-[#F2F8FF] to-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(#C3DCFF_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center justify-center lg:justify-start">
            <BrandLogo size="lg" to="/" />
          </div>

          {/* Center Visuals */}
          <div className="relative my-8 sm:my-12 flex items-center justify-center">
            {/* Dashed flight trajectory */}
            <svg
              className="absolute -top-4 w-72 sm:w-84 h-36 sm:h-44 pointer-events-none text-[#0284C7] opacity-60"
              viewBox="0 0 300 150"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M 20 110 Q 150 -10 270 30"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>

            {/* Travel Card 1 */}
            <div className="relative z-10 w-48 sm:w-64 h-36 sm:h-44 rounded-2xl overflow-hidden shadow-lg border-2 border-white transform -rotate-3 transition-transform hover:rotate-0 duration-300">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80"
                alt="Mountain Adventure"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Travel Card 2 */}
            <div className="relative z-20 w-52 sm:w-68 h-40 sm:h-48 -ml-12 sm:-ml-16 mt-6 rounded-2xl overflow-hidden shadow-xl border-2 border-white transform rotate-3 transition-transform hover:rotate-0 duration-300">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                alt="Santorini Coastline"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom Heading */}
          <div className="relative z-10 text-center lg:text-left mt-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[#082C43] tracking-tight">
              Begin Your Journey with{' '}
              <span className="text-[#082C43]">Trip</span>
              <span className="text-[#004C8F]">BY</span>
              <span className="text-[#FF0000]">Genie</span>
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
              Join thousands of happy travelers enjoying bespoke itineraries, 24/7 dedicated support, and verified holiday deals.
            </p>
          </div>
        </div>

        {/* Right Side: Form or Welcoming Confirmation Screen */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-white relative">
          <div className="w-full max-w-md mx-auto">
            
            {isSubmitted ? (
              /* Welcoming Screen upon successful submission */
              <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
                <h1 className="text-2xl sm:text-3xl font-black text-[#082C43] tracking-tight mb-2">
                  Request Received!
                </h1>

                {/* Explicit requested user-facing message */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 font-bold text-sm sm:text-base my-4 leading-snug">
                  Your request was submitted and our employee will contact you shortly.
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto mb-5">
                  Our manager has assigned your profile to a dedicated travel executive. Once verified, your personalized customer portal invitation and login credentials will be dispatched to <strong className="text-[#082C43]">{email}</strong>.
                </p>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-left space-y-2.5 mb-6 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <Send className="w-4 h-4 text-[#FF0000] shrink-0 mt-0.5" />
                    <span>Login link & customer pass will be sent directly to your registered email.</span>
                  </div>
                </div>

                {/* Auto redirect notification & Action button */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-medium">
                    Redirecting to landing page in <span className="font-bold text-[#FF0000]">{countdown}</span> seconds...
                  </p>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#FF0000] hover:bg-[#D90000] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Go to Landing Page Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/login"
                    className="block text-center text-xs font-semibold text-[#0070E0] hover:underline pt-1"
                  >
                    Already have credentials? Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              /* Clean Full-Size Signup Form with Validation and Inline Errors */
              <div>
                <div className="text-center lg:text-left mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#082C43] tracking-tight">
                    Join{' '}
                    <span className="text-[#082C43]">Trip</span>
                    <span className="text-[#004C8F]">BY</span>
                    <span className="text-[#FF0000]">Genie</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    Enter your details below. Our team will review your request and connect with you shortly.
                  </p>
                </div>

                {/* Server Error Banner */}
                {errors.general && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5 mb-5 animate-in fade-in zoom-in-95">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5" autoComplete="off" noValidate>
                  {/* Dummy hidden inputs to trap autofills */}
                  <input type="text" name="fake_signup_user" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        name="signup_fullname"
                        value={name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g. Rahul Verma"
                        autoComplete="off"
                        autoCapitalize="words"
                        autoCorrect="off"
                        spellCheck="false"
                        className={`w-full pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-xl border ${
                          errors.name
                            ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                            : 'border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000]'
                        } placeholder-slate-400 focus:outline-none transition-all font-medium`}
                      />
                    </div>
                    {/* Inline error for Name */}
                    {errors.name && (
                      <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="email"
                        name="signup_email_address"
                        value={email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g. rahul@example.com"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        className={`w-full pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-xl border ${
                          errors.email
                            ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                            : 'border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000]'
                        } placeholder-slate-400 focus:outline-none transition-all font-medium`}
                      />
                    </div>
                    {/* Inline error for Email */}
                    {errors.email && (
                      <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Mobile Number with Country Code Extension */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {/* Extension Dropdown */}
                      <div className="relative w-36 shrink-0">
                        <select
                          value={countryCode}
                          onChange={(e) => handleCountryCodeChange(e.target.value)}
                          className="w-full appearance-none pl-3 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000] cursor-pointer"
                        >
                          {COUNTRY_EXTENSIONS.map((ext) => (
                            <option key={ext.code + ext.country} value={ext.code}>
                              {ext.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Phone Input */}
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          name="signup_mobile_number"
                          value={phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          placeholder="e.g. 98765 43210"
                          autoComplete="off"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                          className={`w-full pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-xl border ${
                            errors.phone
                              ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                              : 'border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000]'
                          } placeholder-slate-400 focus:outline-none transition-all font-medium`}
                        />
                      </div>
                    </div>
                    {/* Inline error for Mobile */}
                    {errors.phone && (
                      <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button: "Sign up to join Genie" */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#FF0000] hover:bg-[#D90000] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-3"
                  >
                    <span>{isLoading ? 'Submitting Request...' : 'Sign up to join Genie'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Already have an account link */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-[#0070E0] hover:text-[#005bb5] font-bold hover:underline ml-1"
                    >
                      Log In
                    </Link>
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
