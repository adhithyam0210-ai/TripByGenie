import React from 'react';

interface TravelPatternBgProps {
  variant?: 'cream' | 'navy' | 'light';
  opacity?: number; // default 0.05 (5%)
  className?: string;
}

export const TravelPatternBg: React.FC<TravelPatternBgProps> = ({
  variant = 'cream',
  opacity = 0.05,
  className = ''
}) => {
  const strokeColor =
    variant === 'navy'
      ? '#55C9BD'
      : variant === 'cream'
      ? '#17648A'
      : '#082C43';

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id={`travel-pattern-${variant}`}
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            {/* Compass */}
            <g transform="translate(25, 25)">
              <circle cx="15" cy="15" r="14" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <circle cx="15" cy="15" r="2" fill={strokeColor} />
              <polygon points="15,4 18,15 15,13 12,15" fill={strokeColor} />
              <polygon points="15,26 18,15 15,17 12,15" fill="none" stroke={strokeColor} strokeWidth="1" />
            </g>

            {/* Airplane */}
            <g transform="translate(130, 30) rotate(45)">
              <path
                d="M10 2 L12 8 L22 11 L22 13 L12 13 L12 19 L15 21 L15 22 L10 21 L5 22 L5 21 L8 19 L8 13 L-2 13 L-2 11 L8 8 Z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>

            {/* Palm Tree */}
            <g transform="translate(35, 125)">
              <path d="M12 28 Q15 15 14 6" fill="none" stroke={strokeColor} strokeWidth="1.5" />
              <path d="M14 6 Q24 2 26 10" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <path d="M14 6 Q4 2 2 10" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <path d="M14 6 Q20 14 25 18" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <path d="M14 6 Q8 14 3 18" fill="none" stroke={strokeColor} strokeWidth="1.2" />
            </g>

            {/* Suitcase */}
            <g transform="translate(145, 130)">
              <rect x="2" y="8" width="24" height="18" rx="3" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <path d="M9 8 V4 a2 2 0 0 1 2 -2 h6 a2 2 0 0 1 2 2 v4" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <line x1="8" y1="8" x2="8" y2="26" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
              <line x1="20" y1="8" x2="20" y2="26" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
            </g>

            {/* Location Pin */}
            <g transform="translate(90, 80)">
              <path
                d="M10 2 A7 7 0 0 0 3 9 C3 14 10 22 10 22 C10 22 17 14 17 9 A7 7 0 0 0 10 2 Z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <circle cx="10" cy="9" r="2.5" fill={strokeColor} />
            </g>

            {/* Mountains */}
            <g transform="translate(80, 160)">
              <polygon points="15,4 27,24 3,24" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <polygon points="26,10 36,24 16,24" fill="none" stroke={strokeColor} strokeWidth="1" />
            </g>

            {/* Cruise Ship */}
            <g transform="translate(180, 75)">
              <path d="M2 14 L20 14 L17 20 L5 20 Z" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <rect x="6" y="8" width="8" height="6" fill="none" stroke={strokeColor} strokeWidth="1" />
              <line x1="9" y1="5" x2="9" y2="8" stroke={strokeColor} strokeWidth="1.2" />
            </g>

            {/* Dotted Route Flight Line */}
            <path
              d="M10 80 Q50 60 90 80 T170 60"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#travel-pattern-${variant})`} />
      </svg>
    </div>
  );
};
