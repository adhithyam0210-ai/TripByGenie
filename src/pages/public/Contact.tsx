import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck, ExternalLink, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';

export const Contact: React.FC = () => {
  const { agency } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canonical contact information
  const phone1 = '+91 (44) 46071374';
  const phone1Clean = '+914446071374';
  const phone2 = '+91 99404 63566';
  const phone2Clean = '+919940463566';
  const whatsappNumber = '919940463566';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi%20TripbyGenie,%20I%20would%20like%20to%20enquire%20about%20a%20tour%20package`;
  const primaryEmail = 'info@tripbygenie.in';
  const secondaryEmail = 'info@tripbygenie.com';
  const officeAddress = 'A, E, Trip By Genie, 31, W Jones Rd, Periyapet, Saidapet, Chennai, Tamil Nadu 600015';
  const mapsLink = 'https://www.google.com/maps/place/Trip+By+Genie/@13.0252636,80.22315,17z/data=!3m1!4b1!4m6!3m5!1s0x3a5267f9e4481ac9:0x55e6d69a7d4a8e3!8m2!3d13.0252636!4d80.2257249!16s%2Fg%2F11l2bvylrx?entry=ttu';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject || 'General Enquiry',
        message: formData.message,
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('Thank you! Your message has been received. Our team will contact you promptly.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      error(err.message || 'Failed to submit contact enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Header */}
      <section className="relative py-16 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Contact Trip by Genie
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
            Have a question about a package, looking for customized travel design, or interested in becoming a B2B travel agent partner? Get in touch today.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#082C43] font-display">
                Headquarters & Regional Offices
              </h2>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs space-y-5">
              {/* Head Office Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Regional Head Office (South India)</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5 leading-relaxed">
                    {officeAddress}
                  </p>
                  <div className="mt-1.5">
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#004c8f] hover:text-[#FF795C] hover:underline transition-colors"
                    >
                      <span>Open in Google Maps</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct Phone Numbers */}
              <div className="flex items-start gap-3 pt-4 border-t border-[#EFE7DA]">
                <Phone className="w-5 h-5 text-[#55C9BD] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#082C43]">Direct Phone Line</h4>
                  <p className="text-xs text-[#173247]/70">
                    Click to call our customer reservation desk directly:
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={`tel:${phone1Clean}`}
                      className="text-xs font-bold text-[#082C43] hover:text-[#FF795C] hover:underline bg-[#F8F1E7] px-3 py-1.5 rounded-lg border border-[#EFE7DA] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3 text-[#55C9BD]" />
                      {phone1}
                    </a>
                    <a
                      href={`tel:${phone2Clean}`}
                      className="text-xs font-bold text-[#082C43] hover:text-[#FF795C] hover:underline bg-[#F8F1E7] px-3 py-1.5 rounded-lg border border-[#EFE7DA] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3 text-[#55C9BD]" />
                      {phone2}
                    </a>
                  </div>
                </div>
              </div>

              {/* WhatsApp Support Link */}
              <div className="flex items-start gap-3 pt-4 border-t border-[#EFE7DA]">
                <MessageSquare className="w-5 h-5 text-[#00A854] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#082C43]">WhatsApp Instant Support Desk</h4>
                  <p className="text-xs text-[#173247]/70">
                    Instant quotes, itinerary customized queries & 24/7 on-tour assistance:
                  </p>
                  <div className="pt-1">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#00A854] hover:bg-emerald-600 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat on WhatsApp (+91 99404 63566)
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="flex items-start gap-3 pt-4 border-t border-[#EFE7DA]">
                <Mail className="w-5 h-5 text-[#17648A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#082C43]">Email Inquiries</h4>
                  <p className="text-xs text-[#173247]/70">
                    Write to our specialist travel consultants:
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-xs font-bold text-[#17648A] hover:text-[#FF795C] hover:underline bg-[#F8F1E7] px-3 py-1.5 rounded-lg border border-[#EFE7DA] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3 h-3 text-[#17648A]" />
                      {primaryEmail}
                    </a>
                    <a
                      href={`mailto:${secondaryEmail}`}
                      className="text-xs font-bold text-[#17648A] hover:text-[#FF795C] hover:underline bg-[#F8F1E7] px-3 py-1.5 rounded-lg border border-[#EFE7DA] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3 h-3 text-[#17648A]" />
                      {secondaryEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-3 pt-4 border-t border-[#EFE7DA]">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Working Hours</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5 leading-relaxed">
                    Mon - Sat: 9:00 AM - 8:30 PM IST
                    <br />
                    <span className="text-emerald-700 font-semibold">
                      (24/7 dedicated WhatsApp emergency assistance for travelers currently on tour)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-[#EFE7DA] p-8 shadow-xl">
              <h3 className="text-xl font-bold text-[#082C43] font-display mb-1">
                Send Us An Online Message
              </h3>
              <p className="text-xs text-[#173247]/70 mb-6">
                Fill in the form and an operations consultant will reply within 30 minutes.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#082C43] mb-1 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#082C43] mb-1 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#082C43] mb-1 block">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#082C43] mb-1 block">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Family Trip to Kashmir"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#082C43] mb-1 block">
                    Your Message / Requirements *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you are looking for..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold shadow-md shadow-[#FF795C]/25"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
