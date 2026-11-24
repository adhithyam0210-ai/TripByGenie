import React from 'react';
import { MapPin } from 'lucide-react';
import { Destination } from '../../types';

interface DestinationOverviewCardProps {
  destination: Destination;
  onViewPackages?: () => void;
}

export const DestinationOverviewCard: React.FC<DestinationOverviewCardProps> = ({
  destination,
  onViewPackages
}) => {
  const tips = destination.tips && destination.tips.length > 0 ? destination.tips : [
    `ATMs and credit cards are widely accepted across ${destination.name}.`,
    `Banks and foreign exchange counters are easily located in major commercial hubs.`,
    `Ensure you carry valid digital copies of travel insurance, visas, and reservations.`,
    `Check weather forecasts in advance for seasonal outdoor sightseeing.`,
    `Locals are welcoming and warm to international and domestic visitors.`,
    `Pre-book popular attraction passes with TripByGenie for hassle-free entry.`
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#EFE7DA] p-6 sm:p-8 shadow-sm mb-10 text-[#082C43]">
      {/* Capital Header */}
      {destination.capital && (
        <div className="flex items-center justify-center gap-2 mb-6 text-sm font-bold text-red-600">
          <MapPin className="w-4 h-4 fill-red-600 text-red-600" />
          <span>Capital: {destination.capital}</span>
        </div>
      )}

      {/* Main 2-Column Content matching tripbygenie.in layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Destination Hero Image */}
        <div className="lg:col-span-5 h-full">
          <div className="relative rounded-2xl overflow-hidden border border-[#EFE7DA] shadow-md h-72 sm:h-96 lg:h-[420px] bg-slate-100 group">
            <img
              src={destination.image}
              alt={destination.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                {destination.region}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold font-display mt-1">
                {destination.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Right Column: Trusted Experts, 4 Stats Box & Tips */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-emerald-600 mb-4 font-display">
              South India’s Trusted Travel Experts
            </h4>

            {/* 4 Stats Gray Container */}
            <div className="bg-[#EBECEE] rounded-2xl p-4 sm:p-5 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border-r border-b border-gray-300/60 pb-3 pr-2">
                  <h5 className="text-xs sm:text-sm font-bold text-[#082C43]">Currency Name</h5>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {destination.currency || 'Australian Dollar'}
                  </p>
                </div>
                <div className="border-b border-gray-300/60 pb-3 pl-2">
                  <h5 className="text-xs sm:text-sm font-bold text-[#082C43]">Climate in {destination.name}</h5>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {destination.climate || '12°C to 25°C'}
                  </p>
                </div>
                <div className="border-r border-gray-300/60 pt-2 pr-2">
                  <h5 className="text-xs sm:text-sm font-bold text-[#082C43]">Languages Speaking</h5>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {destination.language || 'English'}
                  </p>
                </div>
                <div className="pt-2 pl-2">
                  <h5 className="text-xs sm:text-sm font-bold text-[#082C43]">{destination.name}’s Ideal Season</h5>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {destination.season || 'June – August'}
                  </p>
                </div>
              </div>
            </div>

            {/* Essential Tips Section */}
            <div className="mb-6">
              <h5 className="text-sm sm:text-base font-bold text-[#082C43] mb-3">
                Essential Tips for Travelling to {destination.name}
              </h5>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-700">
                {tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#082C43] font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-snug">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {onViewPackages ? (
              <button
                type="button"
                onClick={onViewPackages}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#E50914] hover:bg-[#C10811] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                View All Packages
              </button>
            ) : (
              <a
                href="#packages-grid"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#E50914] hover:bg-[#C10811] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                View All Packages
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
