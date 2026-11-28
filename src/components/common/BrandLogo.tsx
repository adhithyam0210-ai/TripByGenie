import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  to?: string;
  variant?: 'light' | 'dark' | 'auto';
  onClick?: (e: React.MouseEvent) => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  to = '/',
  variant = 'auto',
  onClick
}) => {
  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-13',
    lg: 'h-14 sm:h-16 md:h-18 lg:h-20',
    xl: 'h-18 sm:h-22 md:h-24',
    '2xl': 'h-24 sm:h-28 md:h-32'
  };

  const handleClick = (e: React.MouseEvent) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onClick) onClick(e);
  };

  const logoImg = (
    <div
      className={`inline-flex items-center ${
        variant === 'light' ? 'bg-white px-3 py-1.5 rounded-xl shadow-xs' : ''
      }`}
    >
      {/* Official TripByGenie logo */}
      <img
        src="/logo.png"
        alt="Trip By Genie — A Elite Travel Experience"
        className={`${imgClassName || heightClasses[size]} w-auto object-contain transition-all`}
        style={{
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        onError={(e) => {
          // Fallback if image fails to load
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.fallback-text')) {
            const fallback = document.createElement('span');
            fallback.className = 'fallback-text font-black text-xl text-brand-navy tracking-tight font-display';
            fallback.innerHTML = 'Trip<span class="text-blue-600 font-extrabold mx-0.5">BY</span><span class="text-red-600">Genie</span>';
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={handleClick}
        className={`inline-block transition-transform hover:scale-[1.02] focus:outline-none ${className}`}
      >
        {logoImg}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {logoImg}
    </div>
  );
};
