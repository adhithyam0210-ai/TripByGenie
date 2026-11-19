import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  to?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  to = '/',
  variant = 'auto'
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16'
  };

  const logoImg = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Official TripByGenie logo from reference */}
      <img
        src="/logo.png"
        alt="TripByGenie — A Elite Travel Experience"
        className={`${heightClasses[size]} w-auto object-contain ${
          variant === 'light' ? 'brightness-110 drop-shadow-[0_1px_3px_rgba(255,255,255,0.4)]' : ''
        }`}
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
      <Link to={to} className="inline-block transition-transform hover:scale-[1.02] focus:outline-none">
        {logoImg}
      </Link>
    );
  }

  return logoImg;
};
