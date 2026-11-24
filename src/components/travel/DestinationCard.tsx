import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Destination } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface DestinationCardProps {
  destination: Destination;
}

export const getCrispDestinationImage = (destination: Destination): string => {
  const img = destination.image || '';
  const name = (destination.name || '').toLowerCase();
  const slug = (destination.slug || '').toLowerCase();

  // Fix erroneous seed image for Andaman & Nicobar (which previously had Sydney Harbour Bridge)
  if (name.includes('andaman') || slug.includes('andaman')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90';
  }

  // If it's a 612x612 low-res thumbnail from WordPress, upgrade to a pristine high-resolution photo
  if (img.includes('612x612') || !img) {
    if (name.includes('goa') || slug.includes('goa')) {
      return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('bali') || slug.includes('bali')) {
      return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('dubai') || slug.includes('dubai')) {
      return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('maldives') || slug.includes('maldives')) {
      return 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('manali') || slug.includes('manali')) {
      return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('kerala') || slug.includes('kerala') || slug.includes('munnar')) {
      return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('switz') || slug.includes('switz')) {
      return 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('ooty') || slug.includes('ooty')) {
      return 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('singapore') || slug.includes('singapore')) {
      return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('thailand') || slug.includes('phuket')) {
      return 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1600&q=90';
    }
    if (name.includes('vietnam') || slug.includes('vietnam')) {
      return 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=90';
    }
  }

  // If it's an Unsplash URL, upgrade to 1600px width with 90% quality for high-DPI retina mobile screens
  if (img.includes('images.unsplash.com')) {
    return img.replace(/w=\d+/, 'w=1600').replace(/q=\d+/, 'q=90');
  }

  return resolveMediaUrl(img);
};

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  const imageSrc = getCrispDestinationImage(destination);

  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group destination-card relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 block h-80 bg-slate-900 border-0"
    >
      {/* Background Image with High-DPI Retina Resolution */}
      <img
        src={imageSrc}
        srcSet={
          imageSrc.includes('images.unsplash.com')
            ? `${imageSrc.replace(/w=\d+/, 'w=640')} 640w, ${imageSrc.replace(/w=\d+/, 'w=1080')} 1080w, ${imageSrc.replace(/w=\d+/, 'w=1600')} 1600w`
            : undefined
        }
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        alt={destination.name}
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        style={{
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=90';
        }}
      />

      {/* Multi-gradient overlay for readability - optimized for photographic brightness & clarity */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#041D30]/95 via-[#041D30]/25 to-transparent opacity-75 group-hover:opacity-65 transition-opacity" />

      {/* Region Badge */}
      <div className="absolute top-4 left-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#082C43]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          {destination.region}
        </span>
      </div>

      {/* Package Count Pill */}
      <div className="absolute top-4 right-4">
        <span className="text-xs font-bold text-[#041D30] bg-[#55C9BD] px-2.5 py-1 rounded-full shadow-md whitespace-nowrap shrink-0 inline-flex items-center">
          {destination.package_count === 1 ? '1 Package' : `${destination.package_count ?? 0} Packages`}
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
