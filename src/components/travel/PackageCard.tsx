import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, CheckCircle, ArrowRight, Star, Users } from 'lucide-react';
import { Package } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PackageCardProps {
  packageData: Package;
  onEnquire?: (pkg: Package) => void;
  isAgentView?: boolean;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  packageData,
  onEnquire,
  isAgentView = false
}) => {
  return (
    <div className="group rounded-2xl bg-white border border-[#EFE7DA] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Cover Image & Badges */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={packageData.cover_image}
          alt={packageData.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041D30]/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge variant="turquoise" size="sm">
            {packageData.category}
          </Badge>
          {packageData.is_featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF795C] text-white shadow-sm">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          )}
          {packageData.is_group_tour && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#55C9BD] text-[#041D30] shadow-sm">
              <Users className="w-3 h-3" /> Group Tour
            </span>
          )}
        </div>

        {/* Duration & Nights Pill on Image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-xs font-semibold bg-[#041D30]/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#55C9BD]" />
          <span>{packageData.duration_days} Days / {packageData.duration_nights} Nights</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link to={`/packages/${packageData.slug}`}>
            <h3 className="text-base font-bold text-[#082C43] group-hover:text-[#FF795C] transition-colors line-clamp-2 leading-snug font-display">
              {packageData.title}
            </h3>
          </Link>

          {/* Highlights */}
          {packageData.highlights && packageData.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-xs text-[#173247]/75">
              {packageData.highlights.slice(0, 2).map((hl, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#55C9BD] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{hl}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-4 border-t border-[#EFE7DA]">
          {isAgentView ? (
            <div className="mb-3 p-2.5 rounded-xl bg-[#F8F1E7] border border-[#EFE7DA] text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Public Rate:</span>
                <span className="line-through">₹{Number(packageData.public_price || packageData.b2c_price || packageData.price || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-[#082C43] font-bold text-sm mt-0.5">
                <span>Wholesale Net:</span>
                <span className="text-[#FF795C]">₹{Number(packageData.agent_wholesale_price || packageData.wholesale_price || packageData.b2b_offer_price || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-semibold mt-1 pt-1 border-t border-black/5">
                <span>Projected Margin:</span>
                <span>₹{Number(packageData.potential_margin || 0).toLocaleString('en-IN')} ({packageData.margin_pct || '12%'})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#17648A] font-bold block">
                  Starting From
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-[#082C43] font-display">
                    ₹{Number(packageData.public_price || packageData.b2c_price || packageData.price || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500">/ person</span>
                </div>
              </div>
              {packageData.available_seats && packageData.available_seats <= 10 && (
                <span className="text-[11px] font-bold text-[#FF795C] bg-[#FF795C]/10 px-2 py-0.5 rounded-md">
                  Only {packageData.available_seats} seats left!
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link to={`/packages/${packageData.slug}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
            {onEnquire && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => onEnquire(packageData)}
              >
                {isAgentView ? 'Purchase' : 'Enquire Now'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
