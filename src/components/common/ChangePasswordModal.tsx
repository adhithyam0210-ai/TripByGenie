import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userRole
}) => {
  const { success, error } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = 'Current temporary or existing password is required.';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long.';
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = 'New password cannot be the same as your current password.';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmation password is required.';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setIsDone(true);
      success('Password changed successfully! You can now use your new password on future logins.');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.message || 'Failed to change password. Please check your current password.';
      if (msg.toLowerCase().includes('current password')) {
        setErrors({ oldPassword: msg });
      } else if (msg.toLowerCase().includes('match')) {
        setErrors({ confirmPassword: msg });
      } else {
        setErrors({ general: msg });
      }
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({});
    setIsDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EFE7DA] relative">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#0070E0]/10 text-[#0070E0] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#082C43]">Change Password</h2>
            <p className="text-xs text-slate-500">
              {userRole ? `Update credentials for your ${userRole} account` : 'Update your account credentials'}
            </p>
          </div>
        </div>

        {isDone ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-[#082C43]">Password Updated!</h3>
            <p className="text-xs text-slate-500">
              Your password has been securely updated. You can use it the next time you sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Old / Current Password */}
            <div>
              <label className="block text-xs font-bold text-[#082C43] mb-1">
                Current / Temporary Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    if (errors.oldPassword) setErrors((prev) => ({ ...prev, oldPassword: undefined }));
                  }}
                  placeholder="Enter current or temporary password"
                  className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                    errors.oldPassword ? 'border-red-500 ring-2 ring-red-100' : 'border-[#EFE7DA] focus:border-[#0070E0]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.oldPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-[#082C43] mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }}
                  placeholder="Enter new secure password (min 6 chars)"
                  className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                    errors.newPassword ? 'border-red-500 ring-2 ring-red-100' : 'border-[#EFE7DA] focus:border-[#0070E0]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-[#082C43] mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Re-enter new password"
                  className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                    errors.confirmPassword ? 'border-red-500 ring-2 ring-red-100' : 'border-[#EFE7DA] focus:border-[#0070E0]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Make sure your new password is at least 6 characters and unique to keep your portal secure.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0070E0] hover:bg-[#005bb8] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
