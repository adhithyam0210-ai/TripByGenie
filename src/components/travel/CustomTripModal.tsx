import React, { useState } from 'react';
import { Send, MapPin, Calendar, Users, Phone, Mail, User, Building, Heart } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface CustomTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
  initialPackageId?: string;
}

export const CustomTripModal: React.FC<CustomTripModalProps> = ({
  isOpen,
  onClose,
  initialDestination = '',
  initialPackageId = ''
}) => {
  const { user, agency } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    destination: initialDestination || '',
    departure_city: '',
    travel_date: '',
    adults: '2',
    children: '0',
    budget: '₹50,000 - ₹1,00,000',
    hotel_preference: '4-Star Premium Hotel',
    travel_preference: 'Couples / Romantic',
    additional_requirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.phone)) {
      error('Please provide your name and contact details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitEnquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: formData.destination || 'Custom Tour',
        package_id: initialPackageId || null,
        departure_city: formData.departure_city,
        travel_date: formData.travel_date,
        travelers_count: Number(formData.adults) + Number(formData.children),
        budget: formData.budget,
        hotel_preference: formData.hotel_preference,
        travel_preference: formData.travel_preference,
        additional_requirements: formData.additional_requirements,
        source: initialPackageId ? 'Package Booking' : 'Customized Trip Form',
        agency_id: agency?.id || 'agency_travel_genie'
      });

      success('Trip enquiry submitted! Our travel consultant will contact you with a customized quote shortly.');
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Your Dream Custom Trip"
      subtitle="Tell us your preferences and our travel designers will tailor an unforgettable itinerary."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#17648A]" /> Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#17648A]" /> Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#17648A]" /> Phone / WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Destination & Departure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF795C]" /> Destination *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kashmir, Maldives, Bali"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              Departure City
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Delhi, Mumbai"
              value={formData.departure_city}
              onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#17648A]" /> Tentative Travel Date
            </label>
            <input
              type="date"
              value={formData.travel_date}
              onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Travelers, Budget & Hotel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Adults (12+ yrs)</label>
            <select
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, '12+'].map((num) => (
                <option key={num} value={num}>
                  {num} Adult{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Children (0-11 yrs)</label>
            <select
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              {[0, 1, 2, 3, 4, '5+'].map((num) => (
                <option key={num} value={num}>
                  {num} Child{num !== 1 ? 'ren' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Budget (per person)</label>
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              <option value="₹25,000 - ₹50,000">₹25k - ₹50k (Economy)</option>
              <option value="₹50,000 - ₹1,00,000">₹50k - ₹1 Lakh (Comfort)</option>
              <option value="₹1,00,000 - ₹2,00,000">₹1 Lakh - ₹2 Lakhs (Premium)</option>
              <option value="₹2,00,000+">₹2 Lakhs+ (Ultra Luxury)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#082C43] mb-1 block">Stay Preference</label>
            <select
              value={formData.hotel_preference}
              onChange={(e) => setFormData({ ...formData, hotel_preference: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              <option value="3-Star Cozy Hotel">3-Star Cozy</option>
              <option value="4-Star Premium Hotel">4-Star Premium</option>
              <option value="5-Star Luxury Resort">5-Star Luxury</option>
              <option value="Private Pool Villa">Private Villa</option>
              <option value="Heritage Palaces / Houseboat">Heritage / Houseboat</option>
            </select>
          </div>
        </div>

        {/* Travel Style */}
        <div>
          <label className="text-xs font-bold text-[#082C43] mb-1 block">Travel Preference</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              'Couples / Romantic',
              'Family Vacation',
              'Friends & Adventure',
              'Relaxation & Spa'
            ].map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setFormData({ ...formData, travel_preference: pref })}
                className={`text-xs p-2 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                  formData.travel_preference === pref
                    ? 'bg-[#082C43] text-white border-[#082C43] shadow-sm'
                    : 'bg-[#FFFDF8] text-[#173247] border-[#EFE7DA] hover:bg-[#F8F1E7]'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Additional requirements */}
        <div>
          <label className="text-xs font-bold text-[#082C43] mb-1 block">
            Special Requests & Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Tell us about sightseeing interests, dietary requirements, anniversary celebrations, flight inclusions..."
            value={formData.additional_requirements}
            onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Enquiry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
