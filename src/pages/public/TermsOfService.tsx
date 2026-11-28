import React from 'react';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { getGmailComposeUrl } from '../../utils/mail';

export const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative py-5 sm:py-7 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
            Please read these terms and conditions carefully before booking any holiday package, flight, hotel, or travel service with Trip by Genie.
          </p>
        </div>
      </section>

      {/* Main Full-Page Content */}
      <div className="max-w-5xl lg:max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 text-[#173247]">
          {/* Introduction */}
          <div className="space-y-3 pb-6 border-b border-[#EFE7DA]">
            <p className="text-sm sm:text-base leading-relaxed text-[#082C43] font-medium">
              Welcome to <strong className="text-[#004c8f]">Trip by Genie</strong> ("we", "us", or "our"). By accessing our website (<a href="https://tripbygenie.in" target="_blank" rel="noreferrer" className="text-[#004c8f] hover:underline font-semibold">tripbygenie.in</a>), submitting an inquiry, requesting a custom quote, or confirming a booking, you agree to be legally bound by these Terms of Service ("Terms").
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              If you make a booking on behalf of other travelers, you represent that you have the requisite authority to accept these Terms on behalf of all persons in your traveling group.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>Scope of Travel Agency Services</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Trip by Genie operates as an accredited tour operator and travel facilitator. We design customized domestic and international tour packages, arrange airline ticketing, reserve accommodation, coordinate chauffeur transfers, process visa consultations, and organize corporate MICE delegations.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              <strong>Important Third-Party Disclaimer:</strong> While we partner exclusively with verified hotels, transport operators, and licensed destination management companies, airlines, railways, and cruise lines operate under their own independent contracts of carriage. Trip by Genie acts as an intermediary coordinator between guests and third-party travel providers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>Inquiries, Quotations & Booking Confirmation</span>
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>Quotations Validity:</strong> All initial price quotations, itinerary drafts, and flight estimates are subject to seat and room availability at the time of final booking confirmation. Airfares and dynamic hotel tariffs are prone to market fluctuation until ticket issuance.
              </li>
              <li>
                <strong>Confirmation Deposit:</strong> A booking is formally confirmed only upon receipt of the designated booking advance/token payment and receipt of an official Trip by Genie booking reference ID or electronic travel voucher.
              </li>
              <li>
                <strong>Accurate Traveler Information:</strong> You are responsible for ensuring that all traveler names, titles, and dates of birth match government identity cards (Aadhaar / Voter ID for domestic travel) or valid international passports exactly. Any airline or immigration reissuance fee arising from incorrect name spelling provided by the client shall be borne by the client.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Pricing, Currency, Taxes & Payment Schedules</span>
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>Currency & GST Billing:</strong> All domestic package prices are quoted in Indian Rupees (INR) inclusive of applicable Goods and Services Tax (GST). For corporate clients, GST invoices with valid GSTIN must be requested prior to final billing.
              </li>
              <li>
                <strong>International Packages & Forex:</strong> Foreign currency components are converted based on the prevailing card rate or bank exchange rate on the date of final payment, in compliance with Reserve Bank of India (RBI) and Liberalised Remittance Scheme (LRS) guidelines.
              </li>
              <li>
                <strong>Advance Deposit:</strong> 25% – 30% of total package price upon initial booking confirmation + 100% of air ticket cost (if included).
              </li>
              <li>
                <strong>Second Tranche:</strong> 40% of package cost 30 days prior to departure date.
              </li>
              <li>
                <strong>Balance Clearance:</strong> Full 100% clearance at least 15 days prior to departure, prior to releasing hotel vouchers and driver contacts.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <span>Passports, Visas & Health Regulations</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              For all international travel:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>Each traveler's passport must possess at least <strong>6 months of remaining validity</strong> beyond the scheduled date of return to India.</li>
              <li>Trip by Genie provides professional visa documentation guidance, appointment booking, and visa file preparation. However, the granting or rejection of any visa or electronic travel authorization (ETA) is at the sole discretion of the respective embassy, high commission, or immigration authority.</li>
              <li>Trip by Genie shall not be held liable for visa delays or rejections by foreign governments, and non-refundable flight or hotel cancellation charges shall apply in accordance with supplier terms.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
              <span>Travel Insurance Advisory</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Comprehensive international travel and medical insurance is strongly recommended for all journeys (and mandatory for Schengen, UK, and European destinations):
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>Coverage Scope:</strong> Adequate coverage protects against unforeseen emergency medical expenses, hospitalization abroad, trip interruption, flight delay compensation, and accidental baggage loss.
              </li>
              <li>
                <strong>Facilitation:</strong> Trip by Genie facilitates certified overseas travel protection policies from approved insurers upon customer request prior to departure.
              </li>
              <li>
                <strong>Guest Responsibility:</strong> If a traveler declines to opt for travel insurance, any unexpected out-of-pocket costs arising from personal emergencies abroad shall be the sole responsibility of the guest.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">6</span>
              <span>Itinerary Changes, Force Majeure & Delays</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              While every effort is made to adhere to published sightseeing schedules:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>
                <strong>Operational Adjustments:</strong> Inclement weather, landslides in hill stations (e.g. Munnar, Ooty, Himachal), traffic congestion, sudden monument closures, or flight schedule retimings may require on-ground itinerary sequencing adjustments.
              </li>
              <li>
                <strong>Force Majeure:</strong> Trip by Genie shall not be liable for non-performance or delays caused by acts of God, extreme weather events, earthquakes, pandemics, civil unrest, strikes, airline technical groundings, or government directives beyond our reasonable control. In such events, we will make every effort to arrange reasonable alternatives or seek credit waivers from suppliers.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">7</span>
              <span>Traveler Conduct & Property Responsibility</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Travelers are expected to maintain civil conduct during tours and adhere to local cultural sensitivities and hotel regulations. Any fines or damages caused to hotel property, luxury coaches, or rental cars shall be the direct responsibility of the guest. Trip by Genie reserves the right to terminate tour arrangements for any passenger whose conduct severely endangers group safety or violates local laws.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">8</span>
              <span>Governing Law & Legal Jurisdiction</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              These Terms of Service and any dispute, claim, or controversy arising out of or related to your booking with Trip by Genie shall be governed by and construed in accordance with the laws of <strong>India</strong>.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80 font-medium">
              The courts located in <strong>Chennai, Tamil Nadu, India</strong> shall have exclusive jurisdiction to hear and decide any legal proceedings arising hereunder.
            </p>
          </section>

          {/* Contact Section */}
          <section className="pt-6 border-t border-[#EFE7DA] space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43]">Inquiries Regarding Terms & Conditions</h2>
            <p className="text-xs sm:text-sm text-[#173247]/80">
              For any clarifications, legal queries, or partnership agreements, please contact:
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-[#082C43]">
              <p><strong>Trip by Genie Legal & Compliance Desk</strong></p>
              <p>31/A East Jones Road, Saidapet, Chennai 600035, Tamil Nadu, India</p>
              <p>Email: <a href={getGmailComposeUrl("info@tripbygenie.com", "Terms of Service Inquiry")} target="_blank" rel="noopener noreferrer" className="text-[#004c8f] hover:underline font-semibold" title="Compose in Gmail">info@tripbygenie.com</a> | Phone: <a href="tel:+914446071374" className="text-[#004c8f] hover:underline font-semibold">+91 (44) 46071374</a></p>
            </div>
          </section>
      </div>
    </div>
  );
};
