import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'coral' | 'navy' | 'turquoise' | 'emerald' | 'amber';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'navy',
  onClick
}) => {
  const accentClasses = {
    coral: 'bg-[#FF795C]/10 text-[#FF795C]',
    navy: 'bg-[#082C43]/10 text-[#082C43]',
    turquoise: 'bg-[#55C9BD]/15 text-[#1b7268]',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600'
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#173247]/60">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${accentClasses[accentColor]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-[#082C43] font-display">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-[#173247]/60 mt-1.5 font-medium">{subtitle}</p>
      )}
    </div>
  );
};
