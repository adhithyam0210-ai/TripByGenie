import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'turquoise' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] whitespace-nowrap flex-nowrap';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  const hasCustomHoverBg = className.includes('hover:bg-') || className.includes('hover:!bg-');
  const hasCustomBorder = className.includes('border-') || className.includes('hover:border-');

  const variantClasses = {
    primary:
      'bg-[#FF795C] text-white hover:bg-[#E66346] shadow-sm hover:shadow-md hover:shadow-[#FF795C]/25',
    secondary:
      'bg-[#082C43] text-white hover:bg-[#041D30] shadow-sm hover:shadow-md hover:shadow-[#082C43]/20',
    turquoise:
      'bg-[#55C9BD] text-[#041D30] hover:bg-[#40B5A9] font-bold shadow-sm',
    outline:
      `border-2 ${hasCustomBorder ? '' : 'border-[#17648A]/30 hover:border-[#17648A]'} text-[#082C43] ${hasCustomHoverBg ? '' : 'hover:bg-[#17648A]/5'}`,
    ghost:
      'text-[#17648A] hover:bg-[#17648A]/10',
    white:
      'bg-white text-[#082C43] hover:bg-[#F8F1E7] shadow-md hover:shadow-lg'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
      )}
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
    </button>
  );
};
