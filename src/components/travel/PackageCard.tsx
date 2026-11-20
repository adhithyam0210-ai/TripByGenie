import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, CheckCircle, ArrowRight, Star, Users } from 'lucide-react';
import { Package } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PackageCardProps {
  packageData?: Package;
  package?: Package;
  onEnquire?: (pkg: Package) => void;
  isAgentView?: boolean;
}

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
  const pkgImage = data.cover_image || (data as any).image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  const pkgPrice = Number(isAgentView ? (data.b2b_price || data.price) : (data.public_price || data.b2c_price || data.price || 25000));
  const pkgDays = Number(data.duration_days || 4);
  const pkgNights = Number(data.duration_nights || Math.max(1, pkgDays - 1));

  return (
    <div className="group rounded-2xl bg-white border border-[#EFE7DA] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Cover Image & Badges */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={pkgImage}
          alt={pkgTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041D30]/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge variant="turquoise" size="sm">
            {pkgCategory}
          </Badge>
          {data.is_featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF795C] text-white shadow-sm">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          )}
          {data.is_group_tour && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#55C9BD] text-[#041D30] shadow-sm">
              <Users className="w-3 h-3" /> Group Tour
            </span>
          )}
        </div>

        {/* Bottom Destination Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white/90 drop-shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#55C9BD]" />
          <span>{(data as any).destination || (data as any).country || 'Tour Package'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-[#173247]/70 mb-2 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF795C]" />
              {pkgDays} Days / {pkgNights} Nights
            </span>
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
              <span className="text-lg font-black text-[#082C43]">
                ₹{pkgPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-[#173247]/60">/person</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/packages/${pkgSlug}`}>
              <Button variant="secondary" size="sm" className="px-3 text-xs">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>

            {onEnquire && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEnquire(data)}
                className="px-3 text-xs"
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
