import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  icon?: React.ReactNode;
  action?: ToastAction;
  createdAt: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions | string) => void;
  success: (message: string, options?: ToastOptions | string) => void;
  error: (message: string, options?: ToastOptions | string) => void;
  info: (message: string, options?: ToastOptions | string) => void;
  warning: (message: string, options?: ToastOptions | string) => void;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Helper function to extract a crisp, relevant title for travel actions
function deriveToastTitle(message: string, type: ToastType): { title: string; body: string } {
  const trimmed = message.trim();

  // If message contains an exclamation mark (e.g. "Booking Approved! Client notified"), split cleanly
  if (trimmed.includes('!') && !trimmed.endsWith('!')) {
    const parts = trimmed.split('!');
    const candidateTitle = parts[0].trim();
    const candidateBody = parts.slice(1).join('!').trim();
    if (candidateTitle.length <= 40 && candidateBody.length > 0) {
      return { title: candidateTitle, body: candidateBody };
    }
  }

  const lower = trimmed.toLowerCase();

  if (type === 'success') {
    if (lower.includes('booking') && (lower.includes('confirm') || lower.includes('approv') || lower.includes('creat'))) {
      return { title: 'Booking Confirmed', body: trimmed };
    }
    if (lower.includes('payment') || lower.includes('paid') || lower.includes('receipt')) {
      return { title: 'Payment Verified', body: trimmed };
    }
    if (lower.includes('lead') && (lower.includes('assign') || lower.includes('allocat'))) {
      return { title: 'Lead Assigned', body: trimmed };
    }
    if (lower.includes('enquiry') || lower.includes('inquiry')) {
      return { title: 'Enquiry Received', body: trimmed };
    }
    if (lower.includes('invitation') || lower.includes('invite') || lower.includes('welcome')) {
      return { title: 'Invitation Sent', body: trimmed };
    }
    if (lower.includes('account') || lower.includes('user') || lower.includes('staff')) {
      return { title: 'Account Created', body: trimmed };
    }
    if (lower.includes('download') || lower.includes('brochure') || lower.includes('pdf')) {
      return { title: 'Download Ready', body: trimmed };
    }
    if (lower.includes('export') || lower.includes('csv')) {
      return { title: 'Export Complete', body: trimmed };
    }
    if (lower.includes('copied') || lower.includes('clipboard')) {
      return { title: 'Link Copied', body: trimmed };
    }
    if (lower.includes('deleted') || lower.includes('removed')) {
      return { title: 'Item Removed', body: trimmed };
    }
    if (lower.includes('saved') || lower.includes('updated')) {
      return { title: 'Changes Saved', body: trimmed };
    }
    if (lower.includes('read')) {
      return { title: 'Notification Read', body: trimmed };
    }
    return { title: 'Success', body: trimmed };
  }

  if (type === 'error') {
    if (lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('denied')) {
      return { title: 'Access Denied', body: trimmed };
    }
    if (lower.includes('not found')) {
      return { title: 'Record Not Found', body: trimmed };
    }
    if (lower.includes('required') || lower.includes('fill') || lower.includes('valid')) {
      return { title: 'Validation Required', body: trimmed };
    }
    return { title: 'Action Failed', body: trimmed };
  }

  if (type === 'warning') {
    return { title: 'Attention Required', body: trimmed };
  }

  return { title: 'Trip by Genie', body: trimmed };
}

// Single Dynamic Island Toast Item Component (with pause-on-hover countdown progress)
const DynamicIslandToastItem: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
  index: number;
}> = ({ toast, onDismiss, index }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(toast.duration);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const start = Date.now();
    const duration = remainingRef.current;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, duration - elapsed);
      setProgress((left / toast.duration) * 100);
      if (left <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 25);

    return () => {
      clearInterval(interval);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - start));
    };
  }, [isPaused, toast.id, toast.duration, onDismiss]);

  const config = {
    success: {
      borderColor: 'border-emerald-500/35',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      glow: 'shadow-[0_16px_36px_-6px_rgba(16,185,129,0.22)]',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    },
    error: {
      borderColor: 'border-rose-500/35',
      badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      progressBar: 'bg-gradient-to-r from-rose-500 to-orange-400',
      glow: 'shadow-[0_16px_36px_-6px_rgba(244,63,94,0.22)]',
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />
    },
    warning: {
      borderColor: 'border-amber-500/35',
      badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      glow: 'shadow-[0_16px_36px_-6px_rgba(245,158,11,0.22)]',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
    },
    info: {
      borderColor: 'border-[#55C9BD]/35',
      badgeBg: 'bg-[#55C9BD]/20 text-[#55C9BD] border border-[#55C9BD]/30',
      progressBar: 'bg-gradient-to-r from-[#17648A] to-[#55C9BD]',
      glow: 'shadow-[0_16px_36px_-6px_rgba(85,201,189,0.22)]',
      icon: <Compass className="w-4 h-4 text-[#55C9BD]" />
    }
  }[toast.type];

  // Subtle depth scale for stacked toasts
  const scale = Math.max(0.92, 1 - index * 0.03);
  const opacity = Math.max(0.65, 1 - index * 0.12);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        transform: `scale(${scale})`,
        opacity
      }}
      className={`pointer-events-auto relative overflow-hidden group tiktik-island-enter flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#061826]/95 backdrop-blur-xl border ${config.borderColor} ${config.glow} text-white transition-all duration-300 w-full max-w-md shadow-2xl select-none`}
    >
      {/* Dynamic Island Glowing Capsule Indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner ${config.badgeBg}`}>
        {toast.icon || config.icon}
      </div>

      {/* Message and Title Body */}
      <div className="flex-1 min-w-0 pr-1 text-left">
        {toast.title && (
          <div className="text-xs font-bold text-white tracking-wide truncate">
            {toast.title}
          </div>
        )}
        <div className="text-[11px] sm:text-xs text-slate-300 leading-tight font-medium line-clamp-2">
          {toast.message}
        </div>
      </div>

      {/* Optional Interactive Action Pill */}
      {toast.action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 cursor-pointer flex items-center gap-1 border border-white/10"
        >
          <span>{toast.action.label}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}

      {/* Sleek Hover Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all shrink-0 cursor-pointer"
        title="Dismiss"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 2px Animated Progress Countdown Bar at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
        <div
          className={`h-full ${config.progressBar} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options?: ToastOptions | string
  ) => {
    const id = `tiktik_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const duration = typeof options === 'object' && options?.duration ? options.duration : 4200;

    let explicitTitle: string | undefined;
    let explicitBody = message;
    let action: ToastAction | undefined;
    let icon: React.ReactNode | undefined;

    if (typeof options === 'string') {
      explicitTitle = options;
    } else if (typeof options === 'object' && options) {
      explicitTitle = options.title;
      action = options.action;
      icon = options.icon;
    }

    if (!explicitTitle) {
      const derived = deriveToastTitle(message, type);
      explicitTitle = derived.title;
      explicitBody = derived.body;
    }

    const newToast: ToastItem = {
      id,
      type,
      message: explicitBody,
      title: explicitTitle,
      duration,
      action,
      icon,
      createdAt: Date.now()
    };

    // Keep up to 4 toasts in queue to preserve clean Dynamic Island stack
    setToasts((prev) => [newToast, ...prev].slice(0, 4));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback((id?: string) => {
    if (id) {
      removeToast(id);
    } else {
      setToasts([]);
    }
  }, [removeToast]);

  const success = useCallback((msg: string, opts?: ToastOptions | string) => addToast(msg, 'success', opts), [addToast]);
  const error = useCallback((msg: string, opts?: ToastOptions | string) => addToast(msg, 'error', opts), [addToast]);
  const info = useCallback((msg: string, opts?: ToastOptions | string) => addToast(msg, 'info', opts), [addToast]);
  const warning = useCallback((msg: string, opts?: ToastOptions | string) => addToast(msg, 'warning', opts), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning, dismiss }}>
      {children}

      {/* TikTik-Style Dynamic Island Floating Toast Container (Top Center) */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none flex flex-col items-center gap-2 max-w-md w-full px-4"
        style={{ perspective: 1000 }}
      >
        {toasts.map((t, idx) => (
          <DynamicIslandToastItem
            key={t.id}
            toast={t}
            onDismiss={removeToast}
            index={idx}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
