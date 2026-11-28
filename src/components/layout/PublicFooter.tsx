import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ArrowUpRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TravelPatternBg } from '../travel/TravelPatternBg';
import { BrandLogo } from '../common/BrandLogo';
import { getGmailComposeUrl } from '../../utils/mail';

// Clean branded SVG icons for official social media channels
const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const PublicFooter: React.FC = () => {
  const { currentAgency } = useAuth();

  return (
    <footer className="relative bg-[#041D30] text-white pt-10 sm:pt-12 pb-7 sm:pb-8 overflow-hidden border-t border-white/10">
      {/* Decorative low-opacity travel pattern */}
      <TravelPatternBg variant="navy" opacity={0.04} />

      <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-8 sm:pb-9 border-b border-white/10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm inline-block">
              <BrandLogo size="md" to="/" />
            </div>

            <p className="text-xs sm:text-sm text-white/70 max-w-sm leading-relaxed">
              Crafting Journeys, Creating Memories! Specializing in personalized holiday packages, luxury honeymoons, South India temple & hill station tours, and international adventures for discerning travelers.
            </p>

            <div className="pt-1 space-y-2.5 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF795C] shrink-0 mt-0.5" />
                <div className="text-xs text-white/80 leading-relaxed">
                  <p>Trip By Genie, 31, West Jones Rd, Periyapet, Saidapet, Chennai, Tamil Nadu 600015</p>
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

              <div className="flex items-start sm:items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                  <div className="whitespace-nowrap">
                    <span className="text-white/80">Direct Call: </span>
                    <a href="tel:+914446071374" className="font-bold text-white hover:text-[#55C9BD] hover:underline">
                      +91 (44) 46071374
                    </a>
                  </div>
                  <span className="hidden sm:inline text-white/40">/</span>
                  <div className="whitespace-nowrap">
                    <span className="text-white/80">WhatsApp: </span>
                    <a
                      href="https://wa.me/919940463566?text=Hi%20TripbyGenie,%20I%20would%20like%20to%20enquire%20about%20a%20tour%20package"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#55C9BD] hover:text-white hover:underline"
                    >
                      +91 99404 63566
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start sm:items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF795C] shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <a
                    href={getGmailComposeUrl("info@tripbygenie.in", "Inquiry for Trip by Genie")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline whitespace-nowrap"
                    title="Compose in Gmail"
                  >
                    info@tripbygenie.in
                  </a>
                  <span className="text-white/40">/</span>
                  <a
                    href={getGmailComposeUrl("info@tripbygenie.com", "Inquiry for Trip by Genie")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline whitespace-nowrap"
                    title="Compose in Gmail"
                  >
                    info@tripbygenie.com
                  </a>
                </div>
              </div>

              <div className="flex items-start sm:items-center gap-2.5 text-white/70">
                <Clock className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-xs leading-snug">
                  <span className="text-white/60 font-medium">Operational Hours:</span>
                  <span className="whitespace-nowrap text-white/85">Monday – Saturday, 9:00 AM – 8:30 PM</span>
                </div>
              </div>

              {/* Official Social Media Channels (Instagram, YouTube, Facebook) */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#55C9BD] block mb-2">
                  Follow & Connect With Us:
                </span>
                <div className="flex items-center gap-2.5">
                  {/* Instagram Button */}
                  <a
                    href="https://www.instagram.com/trip_by_genie?cnvx=Y3Bpem50aDB6NXNi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-pink-500/30 transition-all cursor-pointer"
                    title="Follow Trip by Genie on Instagram"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>

                  {/* YouTube Button */}
                  <a
                    href="https://youtube.com/@tripbygenie?si=skvumFwmGXYMxS9-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-md hover:bg-red-600 hover:scale-110 hover:shadow-red-600/30 transition-all cursor-pointer"
                    title="Subscribe to Trip by Genie on YouTube"
                    aria-label="YouTube"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>

                  {/* Facebook Button */}
                  <a
                    href="https://www.facebook.com/share/1GB3Fu7C5Y/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:bg-blue-600 hover:scale-110 hover:shadow-blue-600/30 transition-all cursor-pointer"
                    title="Follow Trip by Genie on Facebook"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* South India & India Tours + Legal */}
          <div>
            {/* South India Tours - Hidden on mobile view */}
            <div className="hidden md:block">
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

            {/* Legal - Moved below South India Tours */}
            <div className="pt-2 md:pt-4 md:mt-4 md:border-t md:border-white/10">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#55C9BD] mb-3 font-display">
                Legal
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* International Holiday Packages - Hidden on mobile view */}
          <div className="hidden md:block">
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

          {/* Travel Services & Portals - Hidden on mobile view */}
          <div className="hidden md:block">
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
                <Link to="/mice" className="hover:text-white transition-colors">Corporate MICE & Offsites</Link>
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
        <div className="pt-5 sm:pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <div className="text-center md:text-left">
            <span>© {new Date().getFullYear()} Trip by Genie. Best Travel Agency in South India for Dream Getaways. All rights reserved.</span>
          </div>

          <div className="text-center md:text-right text-xs text-white/70">
            <span>Crafted by </span>
            <a
              href="https://www.bing.com/alink/link?url=http%3a%2f%2fwww.infyjob.com%2f&source=serp-local&h=AqfNRw%2fLIwgRJ5YXYELs66wKkrsxcmWODXNMHK94ScM%3d&p=lw_magsmlt&ig=DCFE1EA07E3F41948DE611F0897CE1DA&ypid=YNF64209535624FD94"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#55C9BD] hover:text-[#FF0000] font-semibold transition-colors"
            >
              Infyjob Technology Solutions (OPC) Private Limited
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
