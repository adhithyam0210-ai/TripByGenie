import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { BrandLogo } from '../../components/common/BrandLogo';

export const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenData, setTokenData] = useState<{
    email: string;
    role?: string;
    customer_id?: string;
    agent_id?: string;
    company_name?: string;
    booking_number?: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('No activation token provided. Please check the link sent to your email.');
      setIsVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        setIsVerifying(true);
        const res = await api.verifyActivationToken(token);
        setTokenData(res);
      } catch (err: any) {
        setTokenError(err.message || 'This activation link is invalid, expired, or has already been used.');
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [token]);

  const isB2BAgent = tokenData?.role === 'agent' || !!tokenData?.agent_id;
  const isStaff = tokenData?.role === 'staff' || tokenData?.role === 'sales' || tokenData?.role === 'operations' || !!(tokenData as any)?.employee_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.activateCustomerAccount({ token, password });
      success(
        isB2BAgent
          ? 'B2B Agent account activated successfully! Please log in.'
          : isStaff
          ? 'Staff account onboarded and activated successfully! Please log in.'
          : 'Your travel account has been activated successfully! Please log in.'
      );
      setIsActivated(true);
      setTimeout(() => {
        if (isB2BAgent) {
          navigate(`/login?role=agent&identifier=${encodeURIComponent(tokenData?.agent_id || tokenData?.email || '')}`);
        } else if (isStaff) {
          const roleParam = tokenData?.role === 'operations' ? 'operations' : 'staff';
          navigate(`/login?role=${roleParam}&email=${encodeURIComponent(tokenData?.email || '')}`);
        } else {
          navigate(`/login?role=customer&email=${encodeURIComponent(tokenData?.email || '')}`);
        }
      }, 2000);
    } catch (err: any) {
      error(err.message || 'Failed to activate account. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-between relative overflow-hidden font-sans">
      <TravelPatternBg />

      {/* Header with Brand Logo */}
      <header className="p-6 relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <BrandLogo size="md" to="/" />
        <Link
          to="/login"
          className="text-xs font-bold text-[#082C43] hover:text-[#FF0000] transition-colors"
        >
          Already activated? Log in →
        </Link>
      </header>

      {/* Main Activation Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#EFE7DA] shadow-xl p-6 sm:p-8 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#55C9BD]/15 text-[#008080] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#082C43] font-display">
              {isB2BAgent
                ? 'Activate Your B2B Agent Account'
                : isStaff
                ? 'Onboard Your Staff Account'
                : 'Activate Your Travel Account'}
            </h1>
            <p className="text-xs text-[#173247]/70">
              {isB2BAgent
                ? 'Set your secure password to access your dedicated wholesale dashboard, wholesale packages, and client bookings.'
                : isStaff
                ? 'Set your secure permanent password to onboard and access your staff management dashboard.'
                : 'Set your secure password to access your bookings, day-wise itineraries, and payment receipts.'}
            </p>
          </div>

          {/* Loading State */}
          {isVerifying ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-3 border-[#082C43] border-t-[#FF795C] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying your secure invitation link...</p>
            </div>
          ) : tokenError ? (
            /* Error State */
            <div className="space-y-5 text-center">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="font-bold">Activation Link Notice</p>
                <p className="text-amber-800 leading-relaxed">{tokenError}</p>
              </div>

              <div className="space-y-2">
                <Link to={isB2BAgent ? "/login?role=agent" : "/login?role=customer"}>
                  <Button variant="primary" size="md" className="w-full text-xs font-bold">
                    {isB2BAgent ? "Go to B2B Agent Login" : "Go to Customer Login"}
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Contact Support Desk
                  </Button>
                </Link>
              </div>
            </div>
          ) : isActivated ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#082C43]">Account Activated!</h2>
              <p className="text-xs text-slate-600">
                {isB2BAgent
                  ? 'Redirecting you to the B2B agent portal login screen...'
                  : 'Redirecting you to the customer portal login screen...'}
              </p>
            </div>
          ) : (
            /* Password Setup Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Account summary pill */}
              <div className="p-3 rounded-2xl bg-[#F8F1E7]/60 border border-[#EFE7DA] space-y-1">
                {isB2BAgent ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agent ID:</span>
                      <span className="font-mono font-bold text-[#17648A]">{tokenData?.agent_id}</span>
                    </div>
                    {tokenData?.company_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Agency / Company:</span>
                        <span className="font-semibold text-[#082C43]">{tokenData.company_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Email:</span>
                      <span className="font-semibold text-[#082C43]">{tokenData?.email}</span>
                    </div>
                  </>
                ) : isStaff ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employee ID:</span>
                      <span className="font-mono font-bold text-[#17648A]">{(tokenData as any)?.employee_id}</span>
                    </div>
                    {(tokenData as any)?.designation && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Designation:</span>
                        <span className="font-semibold text-[#082C43]">{(tokenData as any).designation}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corporate Email:</span>
                      <span className="font-semibold text-[#082C43]">{tokenData?.email}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer ID:</span>
                      <span className="font-mono font-bold text-[#082C43]">{tokenData?.customer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Email:</span>
                      <span className="font-semibold text-[#082C43]">{tokenData?.email}</span>
                    </div>
                    {tokenData?.booking_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Booking Reference:</span>
                        <span className="font-mono font-bold text-[#FF795C]">{tokenData.booking_number}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Create New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C] text-xs font-semibold text-[#082C43]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-bold text-[#082C43] block mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:outline-none focus:border-[#FF795C] text-xs font-semibold text-[#082C43]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold shadow-md"
                  leftIcon={<UserCheck className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Activating Account...' : 'Set Password & Activate Portal'}
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                Single-use secure link • Passwords are encrypted with bcrypt
              </p>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 relative z-10">
        © {new Date().getFullYear()} Trip by Genie. All rights reserved.
      </footer>
    </div>
  );
};
