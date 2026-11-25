import React from 'react';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';

export const CancellationPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative py-5 sm:py-7 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
            Transparent cancellation timelines, fee slabs, and refund processing procedures for all holiday packages, flights, and travel bookings.
          </p>
        </div>
      </section>

      {/* Main Full-Page Content */}
      <div className="max-w-5xl lg:max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 text-[#173247]">
          {/* Introduction */}
          <div className="space-y-3 pb-6 border-b border-[#EFE7DA]">
            <p className="text-sm sm:text-base leading-relaxed text-[#082C43] font-medium">
              At <strong className="text-[#004c8f]">Trip by Genie</strong>, we recognize that unforeseen life events, work emergencies, or health conditions can sometimes require plans to change. Our Cancellation and Refund Policy is designed to be fair, clear, and transparent, balancing guest flexibility with advance supplier commitments (hotels, flights, transport blocks).
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              All cancellation requests must be communicated in writing via registered email to <a href="mailto:info@tripbygenie.com" className="text-[#004c8f] hover:underline font-semibold">info@tripbygenie.com</a> or submitted through your client dashboard to establish an exact timestamp.
            </p>
          </div>

          {/* Section 1: Standard Holiday Package Cancellation Slabs */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>Standard Holiday Package Cancellation Slabs</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              For standard domestic and international land packages (excluding airfare components, which follow individual airline fare rules), the following cancellation charges apply based on the date written notice is received prior to tour commencement:
            </p>

            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>30+ Days Prior to Departure (10% Deduction):</strong> Only a 10% administrative service fee is retained + any non-refundable advance deposits levied by specialized boutique hotels or cruise liners.
              </li>
              <li>
                <strong>15 to 29 Days Prior to Departure (25% – 30% Deduction):</strong> 25% to 30% of the total land package cost is retained to cover hotel retention penalties and transport allocation commitments.
              </li>
              <li>
                <strong>7 to 14 Days Prior to Departure (50% – 60% Deduction):</strong> 50% to 60% of total package cost is retained, as hotels and vehicle vendors impose high last-minute retention policies.
              </li>
              <li>
                <strong>Less Than 7 Days / No-Show (100% Non-Refundable):</strong> 100% of tour package cost is retained. No refund is feasible due to zero-refund supplier contracts within 7 days of arrival.
              </li>
            </ul>
          </section>

          {/* Section 2: Specific Services (Flights, Visas, Trains) */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>Special Component Rules: Flights, Visas & Trains</span>
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>Air Ticketing Cancellation:</strong> Flight ticket cancellations are subject entirely to the operating airline's fare rules (e.g. Indigo, Air India, Emirates, Singapore Airlines). Many promotional fares are strictly non-refundable. Where an airline allows cancellation, the airline penalty + airline fuel surcharge policy + a nominal agency processing fee of ₹500 per passenger per sector applies.
              </li>
              <li>
                <strong>Visa Fees & Consular Charges:</strong> All government visa fees, embassy consular fees, VFS biometric appointment charges, and visa documentation processing fees are <strong>100% non-refundable</strong> once submitted to the respective government or embassy, regardless of whether the visa is granted, delayed, or rejected.
              </li>
              <li>
                <strong>Train & Luxury Coach Bookings:</strong> Train ticket cancellations are governed exclusively by Indian Railways (IRCTC) deduction tables and clerkage rules based on the time of chart preparation.
              </li>
            </ul>
          </section>

          {/* Section 3: Peak Seasons & Non-Refundable Blocks */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Peak Season & Festive Holiday Policy</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              Bookings falling during peak holiday periods — including <strong>Diwali Week, Christmas & New Year (20 Dec – 05 Jan), Pongal, Eid, Pooja Holidays, and peak Summer hill station dates</strong> — operate under strict non-refundable terms mandated by hoteliers and luxury resorts. For bookings during these windows, 100% cancellation charges may apply once confirmed.
            </p>
          </section>

          {/* Section 4: Cancellation by Trip by Genie */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <span>Cancellations Initiated by Trip by Genie</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              In the rare event that Trip by Genie is compelled to cancel a fixed departure group tour (for instance, if minimum participant numbers are not attained):
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>We will notify travelers at least <strong>14 days prior</strong> to scheduled departure.</li>
              <li>Guests will be offered the option of transferring to an alternative departure date, selecting an alternative package of equivalent value, or receiving a <strong>100% full refund</strong> of all payments received by us with zero cancellation penalty.</li>
            </ul>
          </section>

          {/* Section 5: Unutilized Services */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
              <span>Unused Tour Services & Early Checkouts</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              No refunds or compensatory credits can be granted for unutilized services during an ongoing tour. This includes unused hotel nights due to late arrival, missed buffet meals, voluntarily skipped sightseeing excursions, or missed airport transfers resulting from flight retimings or passenger delays.
            </p>
          </section>

          {/* Section 6: Refund Processing & Timelines */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">6</span>
              <span>Refund Timelines & Mode of Payment</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              Eligible refunds are processed within <strong>7 to 14 business days</strong> after receiving formal written cancellation and settlement confirmation from corresponding airlines, hotels, and transport vendors.
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li><strong>Mode of Refund:</strong> Refunds are credited strictly back to the original source of payment (original bank account, debit/credit card, or UPI VPA) in compliance with Indian banking and anti-money laundering regulations.</li>
              <li><strong>Bank Charges:</strong> Any gateway convenience fee (typically 1.5% - 2%) charged by payment processors at the time of original transaction is non-refundable by banks.</li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="pt-6 border-t border-[#EFE7DA] space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43]">How to Request a Cancellation</h2>
            <p className="text-xs sm:text-sm text-[#173247]/80 leading-relaxed">
              To initiate a cancellation, please have your Booking ID ready and contact our dedicated holiday cancellations desk:
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-[#082C43]">
              <p><strong>Trip by Genie Holiday Cancellations Desk</strong></p>
              <p>31/A East Jones Road, Saidapet, Chennai 600035, Tamil Nadu, India</p>
              <p>
                Email: <a href="mailto:info@tripbygenie.com" className="text-[#004c8f] hover:underline font-semibold">info@tripbygenie.com</a> | 
                Phone: <a href="tel:+914446071374" className="text-[#004c8f] hover:underline font-semibold">+91 (44) 46071374</a> | 
                WhatsApp: <a href="https://wa.me/919940463566" target="_blank" rel="noreferrer" className="text-[#004c8f] hover:underline font-semibold">+91 99404 63566</a>
              </p>
            </div>
          </section>
      </div>
    </div>
  );
};
