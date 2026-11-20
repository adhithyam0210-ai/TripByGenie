import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { Package } from '../../types';
import { Button } from '../common/Button';

interface PackageCardProps {
  packageData?: Package;
  package?: Package;
  onEnquire?: (pkg: Package) => void;
  isAgentView?: boolean;
}

export const getPackageFallbackImage = (title = '', destination = '', category = ''): string => {
  const s = `${title} ${destination} ${category}`.toLowerCase();
  if (s.includes('kerala') || s.includes('munnar') || s.includes('alleppey') || s.includes('kochi')) {
    return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('maldives') || s.includes('beach') || s.includes('island') || s.includes('mauritius') || s.includes('seychelles')) {
    return 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('europe') || s.includes('swiss') || s.includes('france') || s.includes('italy') || s.includes('paris')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('bali') || s.includes('thailand') || s.includes('vietnam') || s.includes('singapore') || s.includes('asia')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('australia') || s.includes('sydney') || s.includes('melbourne') || s.includes('pacific')) {
    return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('dubai') || s.includes('egypt') || s.includes('middle east')) {
    return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('kashmir') || s.includes('ladakh') || s.includes('himachal') || s.includes('manali')) {
    return 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('honeymoon') || s.includes('romantic')) {
    return 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
};

export const PackageCard: React.FC<PackageCardProps> = ({
  packageData,
  package: pkgProp,
  onEnquire,
  isAgentView = false
}) => {
  const data = packageData || pkgProp;
  if (!data) return null;

  const pkgTitle = data.title || 'Curated Holiday Package';
  const pkgSlug = data.slug || data.id;
  const pkgCategory = data.category || 'Domestic Holiday Packages';
  const pkgImage = data.cover_image || (data as any).image || getPackageFallbackImage(pkgTitle, (data as any).destination, pkgCategory);
  const pkgPrice = Number(isAgentView ? (data.b2b_price || data.price) : (data.public_price || data.b2c_price || data.price || 25000));
  const pkgDays = Number(data.duration_days || 4);
  const pkgNights = Number(data.duration_nights || Math.max(1, pkgDays - 1));

  return (
    <div className="group rounded-2xl bg-white border border-[#EFE7DA] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Clean Package Cover Image without AI-looking overlay badges */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
        <img
          src={pkgImage}
          alt={pkgTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = getPackageFallbackImage(pkgTitle, (data as any).destination || '', pkgCategory);
          }}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#173247]/70 mb-2 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF795C]" />
              {pkgDays} Days / {pkgNights} Nights
            </span>
            {((data as any).destination || (data as any).country) && (
              <span className="flex items-center gap-1 text-slate-500 font-semibold truncate text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-[#55C9BD] shrink-0" />
                {(data as any).destination || (data as any).country}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-[#082C43] group-hover:text-[#FF795C] transition-colors line-clamp-2 mb-2 font-display">
            {pkgTitle}
          </h3>

          <p className="text-xs text-[#173247]/70 line-clamp-2 mb-4 leading-relaxed">
            {data.description}
          </p>

          {/* Highlights */}
          {data.highlights && data.highlights.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {data.highlights.slice(0, 2).map((highlight, index) => (
                <div key={index} className="flex items-start gap-1.5 text-xs text-[#082C43]/85">
                  <CheckCircle className="w-3.5 h-3.5 text-[#55C9BD] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{highlight}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Price & Actions */}
        <div className="pt-4 border-t border-[#EFE7DA] flex items-center justify-between mt-auto gap-2">
          <div>
            <div className="text-[10px] text-[#173247]/60 uppercase tracking-wider font-bold">
              {isAgentView ? 'Agent Net B2B' : 'Starting From'}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-[#082C43]">
                ₹{pkgPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-[#173247]/60">/person</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to={`/packages/${pkgSlug}`}>
              <Button variant="secondary" size="sm" className="px-2.5 sm:px-3 text-xs whitespace-nowrap">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>

            {onEnquire && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEnquire(data)}
                className="px-2.5 sm:px-3 text-xs whitespace-nowrap"
              >
                Enquire
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
