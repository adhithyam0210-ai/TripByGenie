import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'turquoise';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  const variantClasses = {
    primary: 'bg-[#FF795C]/15 text-[#E66346] font-semibold border border-[#FF795C]/30',
    turquoise: 'bg-[#55C9BD]/15 text-[#1b7268] font-semibold border border-[#55C9BD]/30',
    success: 'bg-emerald-500/15 text-emerald-700 font-semibold border border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-800 font-semibold border border-amber-500/25',
    danger: 'bg-rose-500/15 text-rose-700 font-semibold border border-rose-500/25',
    info: 'bg-[#17648A]/15 text-[#17648A] font-semibold border border-[#17648A]/25',
    neutral: 'bg-slate-500/10 text-slate-700 font-medium border border-slate-500/20'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full capitalize leading-none tracking-wide ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();

  let variant: BadgeProps['variant'] = 'neutral';

  if (s === 'converted' || s === 'confirmed' || s === 'completed' || s === 'paid' || s === 'approved') {
    variant = 'success';
  } else if (s === 'new' || s === 'unassigned') {
    variant = 'primary';
  } else if (s === 'quotation sent' || s === 'assigned' || s === 'in progress') {
    variant = 'info';
  } else if (s === 'contacted' || s === 'negotiation' || s === 'partial' || s === 'pending') {
    variant = 'warning';
  } else if (s === 'lost' || s === 'cancelled' || s === 'rejected' || s === 'failed') {
    variant = 'danger';
  } else if (s === 'follow-up required') {
    variant = 'turquoise';
  }

  return <Badge variant={variant}>{status}</Badge>;
};
