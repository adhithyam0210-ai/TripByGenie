import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
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
          <span className="text-xs font-bold uppercase tracking-widest text-[#55C9BD] block">
            We're Here For You
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Contact Travel Genie
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
            Have a question about a package, looking for customized travel design, or interested in becoming a B2B travel agent partner? Get in touch today.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF795C] block mb-1">
                Reach Out Directly
              </span>
              <h2 className="text-2xl font-bold text-[#082C43] font-display">
                Headquarters & Regional Offices
              </h2>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Bengaluru Flagship Office</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5 leading-relaxed">
                    {agency?.address || 'Travel Genie Heights, 4th Floor, MG Road, Bengaluru, Karnataka 560001, India'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#EFE7DA]">
                <Phone className="w-5 h-5 text-[#55C9BD] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Phone & WhatsApp Desk</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5">
                    {agency?.phone || '+91 98765 43210'} / +91 80 4123 9900
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#EFE7DA]">
                <Mail className="w-5 h-5 text-[#17648A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Email Inquiries</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5">
                    {agency?.email || 'info@tripbygenie.in'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#EFE7DA]">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#082C43]">Working Hours</h4>
                  <p className="text-xs text-[#173247]/70 mt-0.5">
                    Mon - Sat: 9:00 AM - 8:00 PM IST (24/7 WhatsApp emergency assistance for travelers on tour)
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
