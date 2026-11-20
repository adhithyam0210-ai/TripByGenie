import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Destination } from '../../types';

interface DestinationCardProps {
  destination: Destination;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block h-80 bg-slate-900 border border-[#EFE7DA]"
    >
      {/* Background Image */}
      <img
        src={destination.image}
        alt={destination.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
        }}
      />

      {/* Multi-gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#041D30] via-[#041D30]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Region Badge */}
      <div className="absolute top-4 left-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#082C43]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          {destination.region}
        </span>
      </div>

      {/* Package Count Pill */}
      <div className="absolute top-4 right-4">
        <span className="text-xs font-bold text-[#041D30] bg-[#55C9BD] px-2.5 py-1 rounded-full shadow-md">
          {destination.package_count || 4} Packages
        </span>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end text-white">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#55C9BD] mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{destination.country}</span>
        </div>

        <h3 className="text-2xl font-bold text-white group-hover:text-[#FF795C] transition-colors font-display">
          {destination.name}
        </h3>

        <p className="text-xs text-white/80 line-clamp-2 mt-1.5 font-normal leading-relaxed">
          {destination.description}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#FF795C] group-hover:translate-x-1 transition-transform">
          <span>Explore Packages</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
};
