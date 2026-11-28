import React from 'react';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { getGmailComposeUrl } from '../../utils/mail';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative py-5 sm:py-7 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
            At Trip by Genie, we respect your privacy and are committed to safeguarding the personal information you entrust to us.
          </p>
        </div>
      </section>

      {/* Main Full-Page Content */}
      <div className="max-w-5xl lg:max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 text-[#173247]">
          {/* Introduction */}
          <div className="space-y-3 pb-6 border-b border-[#EFE7DA]">
            <p className="text-sm sm:text-base leading-relaxed text-[#082C43] font-medium">
              At <strong className="text-[#004c8f]">Trip by Genie</strong>, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website (<a href="https://tripbygenie.in" target="_blank" rel="noreferrer" className="text-[#004c8f] hover:underline font-semibold">tripbygenie.in</a>), contact us, submit an enquiry, make a booking, or use our travel-related services.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              By using our website or services, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              We may collect personal information that you voluntarily provide to us when you interact with Trip by Genie. This information may include:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>Full name</li>
              <li>Mobile or telephone number</li>
              <li>Email address</li>
              <li>Residential or correspondence address</li>
              <li>Passport or travel-related information (where required for flight/visa bookings)</li>
              <li>Travel preferences, dietary and special requirements</li>
              <li>Booking and payment-related transaction details</li>
              <li>Information submitted through enquiry, contact, or instant forms</li>
              <li>Any other information you voluntarily provide to us</li>
            </ul>

            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80 pt-2 font-medium">
              We may collect this information when you:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>Submit an enquiry through our website or social media forms</li>
              <li>Request information about a tour, honeymoon, or holiday travel package</li>
              <li>Make or inquire about a flight, bus, car, hotel, or cruise booking</li>
              <li>Contact our customer support or holiday travel consultants</li>
              <li>Subscribe to promotional communications or travel newsletters</li>
              <li>Participate in surveys, contests, or promotional activities</li>
              <li>Interact with our website, advertisements, or digital platforms</li>
            </ul>
            <p className="text-xs text-[#173247]/70 italic">
              We aim to collect only information that is reasonably necessary to provide our services and communicate with you effectively.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>How We Use Your Personal Information</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Trip by Genie may use the information collected from you for purposes including:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>Responding to your enquiries, itinerary queries, and requests</li>
              <li>Preparing customized travel packages, hotel allocations, and quotations</li>
              <li>Processing bookings, tickets, and reservations</li>
              <li>Arranging flights, hotels, luxury coaches, chauffeur cabs, tours, activities, and other travel services</li>
              <li>Communicating with you regarding your booking confirmation, updates, or travel vouchers</li>
              <li>Providing active 24/7 on-tour customer support and emergency coordination</li>
              <li>Sending relevant holiday offers, travel updates, promotions, and marketing communications where permitted</li>
              <li>Improving our website, products, services, and guest customer experience</li>
              <li>Conducting internal analysis, research, and business operations</li>
              <li>Preventing fraudulent, unauthorized, or potentially harmful activities</li>
              <li>Complying with applicable legal, civil aviation, and regulatory requirements</li>
            </ul>
            <p className="text-xs text-[#173247]/80">
              If you no longer wish to receive promotional communications from us, you may request to unsubscribe at any time.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Sharing of Personal Information</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#082C43] font-semibold">
              Trip by Genie does not sell, rent, or trade your personal information for monetary gain.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              However, in order to fulfill the travel services requested by you, we may need to share relevant information with trusted service providers and business partners, such as:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#173247]/80 leading-relaxed">
              <li>Airlines, railway reservation systems, and airline representatives</li>
              <li>Hotels, resorts, and accommodation partners</li>
              <li>Transportation, cab operators, and airport transfer providers</li>
              <li>Local destination management companies (DMCs), tour operators, and licensed local guides</li>
              <li>Visa processing centers, consulates, and documentation partners</li>
              <li>Authorized payment gateways, banks, and transaction processors</li>
              <li>Technology, secure cloud hosting, and IT infrastructure service providers</li>
              <li>Customer support and communication channels (SMS/WhatsApp gateways)</li>
              <li>Government authorities or regulatory bodies where legally required</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <span>Service Providers and Business Partners</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Trip by Genie may work with third-party companies that assist us in operating our business and delivering travel services. Such service providers may support functions including payment processing, booking management, website hosting, communication, customer support, marketing, analytics, and travel arrangements.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Where appropriate, we expect such service providers to handle personal information responsibly and only for the purposes for which it has been provided.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
              <span>International Data Transfers</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Some of the travel services you request (such as overseas hotel vouchers, international flight tickets, overseas medical insurance, and foreign visa filings) involve service providers, airlines, hotels, or other partners located outside India.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              As a result, relevant personal information may need to be transferred to or processed in another country to facilitate your requested travel arrangements. Where such transfers occur, Trip by Genie takes reasonable steps to handle your information in accordance with applicable privacy and data protection requirements.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">6</span>
              <span>Non-Personal Information</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              We may also collect certain non-personally identifiable technical information when you visit our website, including browser type, device type, operating system, general geographic location, language preferences, pages viewed, referring URL, and session timestamps.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">7</span>
              <span>Cookies & Tracking Technologies</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Our website uses standard cookies and session tracking technologies to remember user preferences, understand website traffic, improve website speed, and deliver relevant travel promotions. You can manage or disable cookies via your browser settings; however, certain features may not function optimally without them.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">8</span>
              <span>Data Security</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Trip by Genie takes reasonable technical and organizational measures (including SSL encryption, secure credential hashing, role-based database permissions, and secure server architecture) to protect personal information against unauthorized access, misuse, alteration, disclosure, or loss.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/75">
              However, no method of transmitting or storing information electronically can be guaranteed to be 100% impenetrable. While we take diligent precautions to safeguard your records, we cannot guarantee absolute security against all unforeseen digital threats.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">9</span>
              <span>Marketing Communications</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              If you provide contact details via forms, we may send relevant package deals and travel alerts. You may opt out at any time by contacting our helpline or clicking unsubscribe.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">10</span>
              <span>Third-Party Websites</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Our site may link to airlines, payment gateways, or tourism boards. We are not responsible for third-party privacy practices and recommend reviewing their external terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">11</span>
              <span>Data Retention</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              We retain your information as long as needed to fulfill bookings, comply with Indian tax/accounting requirements, resolve disputes, and maintain operational logs.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">12</span>
              <span>Your Privacy Rights</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              You may request access to, correction of, or deletion of personal data held by us, subject to statutory travel documentation and tax record keeping laws.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#082C43] text-white text-xs font-bold flex items-center justify-center shrink-0">13</span>
              <span>Children's Privacy & Policy Updates</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Our website does not intentionally collect personal information directly from minors without guardian consent. When minor details are needed for child flight fares or visa submissions, they must be supplied by the parent or adult legal guardian.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#173247]/80">
              Trip by Genie reserves the right to update this policy periodically to reflect evolving technology or legal standards. Changes will be published on this page with the updated revision date.
            </p>
          </section>

          {/* Section 14: Contact Us */}
          <section className="pt-6 border-t border-[#EFE7DA] space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#082C43]">Contact Us Regarding Privacy</h2>
            <p className="text-xs sm:text-sm text-[#173247]/80">
              If you have any questions, concerns, or data rights requests regarding this Privacy Policy, please contact our administrative desk:
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-[#082C43]">
              <p><strong>Trip by Genie Administrative & Privacy Desk</strong></p>
              <p>31/A East Jones Road, Saidapet, Chennai 600035, Tamil Nadu, India</p>
              <p>
                Email: <a href={getGmailComposeUrl("info@tripbygenie.com", "Privacy Inquiry")} target="_blank" rel="noopener noreferrer" className="text-[#004c8f] hover:underline font-semibold" title="Compose in Gmail">info@tripbygenie.com</a> | Phone: <a href="tel:+914446071374" className="text-[#004c8f] hover:underline font-semibold">+91 (44) 46071374</a> | WhatsApp: <a href="https://wa.me/919940463566" target="_blank" rel="noreferrer" className="text-[#004c8f] hover:underline font-semibold">+91 99404 63566</a>
              </p>
            </div>
          </section>
      </div>
    </div>
  );
};
