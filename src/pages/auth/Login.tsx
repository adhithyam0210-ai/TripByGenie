import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getRoleDashboardPath } = useAuth();
  const { success } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});

  const from = (location.state as any)?.from?.pathname;

  const validateField = (field: 'identifier' | 'password', value: string) => {
    let errorMsg = '';
    const trimmed = value.trim();

    if (field === 'identifier') {
      if (!trimmed) {
        errorMsg = 'Email or mobile number is required.';
      } else if (trimmed.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          errorMsg = 'Please enter a valid email address (e.g. name@domain.com).';
        }
      } else {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          errorMsg = 'Please enter a valid 10-digit mobile number or email.';
        }
      }
    } else if (field === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (value.length < 6) {
        errorMsg = 'Password must be at least 6 characters.';
      }
    }

    return errorMsg;
  };

  const handleBlur = (field: 'identifier' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'identifier' ? identifier : password;
    const msg = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field: 'identifier' | 'password', val: string) => {
    if (field === 'identifier') setIdentifier(val);
    else setPassword(val);

    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }

    if (touched[field]) {
      const msg = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    const idError = validateField('identifier', identifier);
    const passError = validateField('password', password);

    if (idError || passError) {
      setErrors({
        identifier: idError,
        password: passError
      });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const userRole = await login(identifier.trim(), password);
      success('Welcome back! Logged in successfully.');
      navigate(from || getRoleDashboardPath(userRole));
    } catch (err: any) {
      setErrors({
        general: err.message || 'Invalid credentials. Please verify your email/phone and password.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] sm:min-h-screen bg-[#F0F6FF] flex flex-col justify-center items-center px-2.5 py-2 sm:p-6 lg:p-10 font-sans selection:bg-[#0070E0] selection:text-white">
      {/* Fullsize Container matching desktop widescreen design & comfortable mobile fit */}
      <div className="w-full max-w-[420px] sm:max-w-lg lg:max-w-6xl xl:max-w-7xl bg-white rounded-2xl sm:rounded-[36px] shadow-xl sm:shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[680px]">

        {/* Left Side: Destination Showcase & Inspiration */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#EBF4FF] via-[#F2F8FF] to-white p-3 pt-3.5 pb-2.5 sm:p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
          {/* Subtle decorative background */}
          <div className="absolute inset-0 bg-[radial-gradient(#C3DCFF_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Top Logo - Single centered logo */}
          <div className="relative z-10 flex items-center justify-center lg:justify-start">
            <BrandLogo size="sm" imgClassName="h-7 sm:h-12 w-auto object-contain" to="/" />
          </div>

          {/* Center Imagery: Overlapping travel cards with flight path */}
          <div className="relative my-1.5 sm:my-6 lg:my-12 flex items-center justify-center">
            <svg
              className="absolute -top-1 sm:-top-4 w-36 sm:w-60 lg:w-84 h-16 sm:h-28 lg:h-44 pointer-events-none text-[#0284C7] opacity-60"
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
            <div className="relative z-10 w-24 sm:w-40 lg:w-64 h-15 sm:h-26 lg:h-44 rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg border sm:border-2 border-white transform -rotate-3 transition-transform hover:rotate-0 duration-300">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80"
                alt="Mountain & Fjord Adventure"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Travel Card 2 */}
            <div className="relative z-20 w-28 sm:w-44 lg:w-68 h-17 sm:h-30 lg:h-48 -ml-6 sm:-ml-10 lg:-ml-16 mt-1.5 sm:mt-4 lg:mt-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-xl border sm:border-2 border-white transform rotate-3 transition-transform hover:rotate-0 duration-300">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                alt="Santorini Coastal Getaway"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom Heading & Subtitle */}
          <div className="relative z-10 text-center lg:text-left mt-0.5 sm:mt-auto">
            <h2 className="text-sm sm:text-lg lg:text-2xl font-black text-[#082C43] tracking-tight">
              Explore the World with{' '}
              <span className="text-[#082C43]">Trip</span>
              <span className="text-[#004C8F]">BY</span>
              <span className="text-[#FF0000]">Genie</span>
            </h2>
            <p className="text-[10px] sm:text-xs lg:text-[13px] text-slate-500 mt-0.5 max-w-md mx-auto lg:mx-0 leading-tight sm:leading-normal font-medium line-clamp-1 sm:line-clamp-none">
              Discover amazing destinations, plan your perfect trip and experience more with us.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="lg:col-span-6 p-3.5 sm:p-8 lg:p-14 flex flex-col justify-center bg-white relative">
          <div className="w-full max-w-md mx-auto">

            {/* Header Title & Subtitle */}
            <div className="text-center lg:text-left mb-2.5 sm:mb-6 lg:mb-8">
              <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-[#082C43] tracking-tight">
                Welcome to{' '}
                <span className="text-[#082C43]">Trip</span>
                <span className="text-[#004C8F]">BY</span>
                <span className="text-[#FF0000]">Genie</span>
              </h1>
              <p className="text-[11px] sm:text-xs lg:text-sm text-slate-500 mt-0.5 leading-snug sm:leading-normal line-clamp-1 sm:line-clamp-none">
                Login to access exclusive travel deals, manage your bookings, and plan your dream vacation hassle-free!
              </p>
            </div>

            {/* General Server Error Banner */}
            {errors.general && (
              <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 mb-2 sm:mb-5 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{errors.general}</span>
              </div>
            )}

            {/* Login Form with Autofill Guards */}
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4" autoComplete="off" noValidate>
              {/* Dummy hidden inputs to trap aggressive browser autofills */}
              <input type="text" name="fake_user" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />
              <input type="password" name="fake_pass" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />

              {/* Email or Phone field */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5 sm:mb-1.5">
                  Email or Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type="text"
                    name="login_identifier"
                    value={identifier}
                    onChange={(e) => handleChange('identifier', e.target.value)}
                    onBlur={() => handleBlur('identifier')}
                    placeholder="e.g. rahul@example.com or +91 98765 43210"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3.5 text-xs sm:text-sm rounded-xl border ${errors.identifier
                      ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                      : 'border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#0070E0]/20 focus:border-[#0070E0]'
                      } placeholder-slate-400 focus:outline-none transition-all font-medium`}
                  />
                </div>
                {/* Inline Error for Identifier */}
                {errors.identifier && (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-red-500 flex items-center gap-1.5 mt-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.identifier}</span>
                  </p>
                )}
              </div>

              {/* Password field with single show/hide toggle */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5 sm:mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="login_pass"
                    value={password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className={`w-full pl-8 sm:pl-10 pr-8 sm:pr-11 py-2 sm:py-3.5 text-xs sm:text-sm rounded-xl border ${errors.password
                      ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                      : 'border-slate-200 bg-[#FAFCFF] focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#0070E0]/20 focus:border-[#0070E0]'
                      } placeholder-slate-400 focus:outline-none transition-all font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    )}
                  </button>
                </div>
                {/* Inline Error for Password */}
                {errors.password && (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-red-500 flex items-center gap-1.5 mt-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}

                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setErrors((prev) => ({ ...prev, general: 'Please contact your Travel Genie manager or support to reset your password.' }))}
                    className="text-[11px] sm:text-xs text-[#0070E0] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 sm:py-3.5 px-4 sm:px-6 rounded-xl bg-[#0070E0] hover:bg-[#005bb5] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-0.5"
              >
                <span>{isLoading ? 'Signing In...' : 'Log In'}</span>
                {!isLoading && <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </form>

            {/* Don't have an account? Sign Up Link */}
            <div className="mt-2.5 sm:mt-6 lg:mt-8 pt-2 sm:pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-[#0070E0] hover:text-[#005bb5] font-bold hover:underline ml-1"
                >
                  Sign Up
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
