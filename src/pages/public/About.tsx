import React from 'react';
import { ShieldCheck, Award, Users, Heart, Compass, Globe2, CheckCircle2 } from 'lucide-react';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';

export const About: React.FC = () => {
  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Hero */}
      <section className="relative py-16 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#55C9BD] block">
            Our Story & Legacy
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            About Travel Genie
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            Crafting extraordinary domestic and international travel memories through personalized design, transparent pricing, and world-class hospitality.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF795C]">
              Founded On Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082C43] font-display">
              Where True Craftsmanship Meets Modern Travel Technology
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              Travel Genie was founded with a singular conviction: travel is not just about tickets and hotel vouchers; it is about creating effortless, soul-enriching journeys that remain etched in memory forever.
            </p>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              Today, Travel Genie operates as both a premier luxury travel agency and a cutting-edge multi-agency travel CRM platform powering external travel agents, corporate entities, and discerning holidaymakers worldwide.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EFE7DA]">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
              alt="About Travel Genie"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>

        {/* Pillars / Values */}
        <div>
          <h3 className="text-xl font-bold text-[#082C43] font-display text-center mb-8">
            Our Core Operating Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
              <ShieldCheck className="w-8 h-8 text-[#55C9BD] mb-3" />
              <h4 className="text-base font-bold text-[#082C43] mb-1">Uncompromising Quality</h4>
              <p className="text-xs text-[#173247]/75 leading-relaxed">
                We inspect hotels personally and partner exclusively with verified operators, ensuring high safety and clean hygiene standards.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
              <Users className="w-8 h-8 text-[#FF795C] mb-3" />
              <h4 className="text-base font-bold text-[#082C43] mb-1">Human-Centric Care</h4>
              <p className="text-xs text-[#173247]/75 leading-relaxed">
                No automated bot dead ends. When you travel with us, your dedicated travel designer is available 24/7 on WhatsApp for any flight delay or assistance.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs">
              <Globe2 className="w-8 h-8 text-[#17648A] mb-3" />
              <h4 className="text-base font-bold text-[#082C43] mb-1">Fair Wholesale Pricing</h4>
              <p className="text-xs text-[#173247]/75 leading-relaxed">
                Direct hotel partnerships and consolidator airfares allow us to offer competitive quotes without sacrificing luxury or comfort.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
