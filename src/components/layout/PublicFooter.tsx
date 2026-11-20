import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Phone, Mail, MapPin, ShieldCheck, Heart, ArrowUpRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TravelPatternBg } from '../travel/TravelPatternBg';
import { BrandLogo } from '../common/BrandLogo';

export const PublicFooter: React.FC = () => {
  const { currentAgency } = useAuth();

  return (
    <footer className="relative bg-[#041D30] text-white pt-16 pb-12 overflow-hidden border-t border-white/10">
      {/* Decorative low-opacity travel pattern */}
      <TravelPatternBg variant="navy" opacity={0.04} />

      <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm inline-block">
              <BrandLogo size="lg" to="/" />
            </div>

            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              Crafting Journeys, Creating Memories! Specializing in personalized holiday packages, luxury honeymoons, South India temple & hill station tours, and international adventures for discerning travelers.
            </p>

            <div className="pt-2 space-y-2 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF795C] shrink-0 mt-0.5" />
                <div className="text-xs text-white/80 leading-relaxed">
                  <p>A, E, Trip By Genie, 31, W Jones Rd, Periyapet, Saidapet, Chennai, Tamil Nadu 600015</p>
                  <div className="mt-1">
                    <a
                      href="https://www.google.com/maps/place/Trip+By+Genie/@13.0252636,80.22315,17z/data=!3m1!4b1!4m6!3m5!1s0x3a5267f9e4481ac9:0x55e6d69a7d4a8e3!8m2!3d13.0252636!4d80.2257249!16s%2Fg%2F11l2bvylrx?entry=ttu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#55C9BD] hover:text-white hover:underline transition-colors"
                    >
                      <span>Open in Google Maps</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#55C9BD] shrink-0" />
                <span>
                  Direct Call:{' '}
                  <a href="tel:+914446071374" className="font-bold text-white hover:text-[#55C9BD] hover:underline">
                    +91 (44) 46071374
                  </a>
                  {' '}/ WhatsApp:{' '}
                  <a
                    href="https://wa.me/919940463566?text=Hi%20TripbyGenie,%20I%20would%20like%20to%20enquire%20about%20a%20tour%20package"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#55C9BD] hover:text-white hover:underline"
                  >
                    +91 99404 63566
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF795C] shrink-0" />
                <a href="mailto:info@tripbygenie.in" className="hover:text-white hover:underline">
                  info@tripbygenie.in
                </a>
                <span className="text-white/40">/</span>
                <a href="mailto:info@tripbygenie.com" className="hover:text-white hover:underline">
                  info@tripbygenie.com
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-white/60">
                <Clock className="w-4 h-4 text-[#55C9BD] shrink-0" />
                <span>Operational Hours: Monday – Saturday, 9:00 AM – 8:30 PM</span>
              </div>
            </div>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#55C9BD] mb-4 font-display">
              South India & India Tours
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link to="/packages?search=Kerala" className="hover:text-white transition-colors">Kerala Backwaters & Munnar</Link>
              </li>
              <li>
                <Link to="/packages?search=Ooty" className="hover:text-white transition-colors">Ooty, Nilgiris & Coonoor</Link>
              </li>
              <li>
                <Link to="/packages?search=Kodaikanal" className="hover:text-white transition-colors">Kodaikanal Princess of Hills</Link>
              </li>
              <li>
                <Link to="/packages?search=Coorg" className="hover:text-white transition-colors">Coorg Scotland of India</Link>
              </li>
              <li>
                <Link to="/packages?search=Kashmir" className="hover:text-white transition-colors">Kashmir & Gulmarg Snow</Link>
              </li>
              <li>
                <Link to="/packages?search=Andaman" className="hover:text-white transition-colors">Andaman & Havelock Island</Link>
              </li>
              <li>
                <Link to="/packages?search=Tirupati" className="hover:text-white transition-colors">Tirupati & Spiritual Circuits</Link>
              </li>
            </ul>
          </div>

          {/* International Holiday Packages */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#55C9BD] mb-4 font-display">
              International Escapes
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link to="/packages?search=Maldives" className="hover:text-white transition-colors">Maldives Overwater Villas</Link>
              </li>
              <li>
                <Link to="/packages?search=Bali" className="hover:text-white transition-colors">Bali Ubud & Seminyak Luxury</Link>
              </li>
              <li>
                <Link to="/packages?search=Dubai" className="hover:text-white transition-colors">Dubai Desert Safari & Marina</Link>
              </li>
              <li>
                <Link to="/packages?search=Singapore" className="hover:text-white transition-colors">Singapore & Sentosa Island</Link>
              </li>
              <li>
                <Link to="/packages?search=Thailand" className="hover:text-white transition-colors">Thailand, Phuket & Krabi</Link>
              </li>
              <li>
                <Link to="/packages?search=Switzerland" className="hover:text-white transition-colors">Switzerland & Europe Grand</Link>
              </li>
              <li>
                <Link to="/packages?search=Vietnam" className="hover:text-white transition-colors">Vietnam & Ha Long Bay Cruise</Link>
              </li>
            </ul>
          </div>

          {/* Travel Services & Portals */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#55C9BD] mb-4 font-display">
              Services & Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Flight Ticket Booking</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Tempo & Luxury Car Rental</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Cruise Vacations</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Visa & Travel Insurance</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Corporate MICE & Offsites</Link>
              </li>
              <li className="pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-[#FF795C] hover:text-white font-bold transition-colors">
                  <span>Sign In / CRM Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and accreditation */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#55C9BD]" />
            <span>© {new Date().getFullYear()} Trip by Genie. Best Travel Agency in South India for Dream Getaways. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Cancellation Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
