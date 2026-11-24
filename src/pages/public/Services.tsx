import React, { useState, useEffect } from 'react';
import { Plane, Bus, Car, Ship, Building2, FileCheck, ShieldCheck, MapPin, CheckCircle, Compass, Send } from 'lucide-react';
import { api } from '../../services/api';
import { TravelService } from '../../types';
import { fallbackData } from '../../data/fallbackData';
import { ServiceEnquiryModal } from '../../components/travel/ServiceEnquiryModal';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';

export const Services: React.FC = () => {
  const [services, setServices] = useState<TravelService[]>(() => fallbackData.travel_services);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<TravelService | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (e) {
      console.error(e);
    }
  };

  const getServiceIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('flight')) return <Plane className="w-6 h-6 text-[#17648A]" />;
    if (t.includes('bus')) return <Bus className="w-6 h-6 text-[#FF795C]" />;
    if (t.includes('car')) return <Car className="w-6 h-6 text-[#55C9BD]" />;
    if (t.includes('cruise')) return <Ship className="w-6 h-6 text-[#17648A]" />;
    if (t.includes('hotel')) return <Building2 className="w-6 h-6 text-[#FF795C]" />;
    if (t.includes('visa')) return <FileCheck className="w-6 h-6 text-[#55C9BD]" />;
    if (t.includes('insurance')) return <ShieldCheck className="w-6 h-6 text-[#17648A]" />;
    if (t.includes('airport') || t.includes('transfer')) return <MapPin className="w-6 h-6 text-[#FF795C]" />;
    if (t.includes('check-in')) return <CheckCircle className="w-6 h-6 text-[#55C9BD]" />;
    return <Compass className="w-6 h-6 text-[#17648A]" />;
  };

  const getServiceButtonLabel = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('flight')) return 'Enquire For Flight';
    if (t.includes('bus')) return 'Enquire For Bus';
    if (t.includes('car') || t.includes('chauffeur')) return 'Enquire For Car';
    if (t.includes('cruise')) return 'Enquire For Cruise';
    if (t.includes('hotel')) return 'Enquire For Hotel';
    if (t.includes('visa')) return 'Enquire For Visa';
    if (t.includes('insurance')) return 'Enquire For Insurance';
    if (t.includes('transfer') || t.includes('airport')) return 'Enquire For Transfer';
    if (t.includes('check-in') || t.includes('checkin')) return 'Enquire For Check-In';
    return 'Enquire Now';
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Header */}
      <section className="relative py-16 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Travel Services & Ground Assistance
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            From flight reservations and visa clearance to luxury vehicle chauffeurs and cruise staterooms, we handle all details seamlessly.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-6 rounded-3xl bg-white border border-[#EFE7DA] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F8F1E7] flex items-center justify-center mb-4 shadow-xs">
                  {getServiceIcon(srv.title)}
                </div>
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  {srv.title}
                </h3>
                <p className="text-xs text-[#17648A] font-semibold mt-1">
                  {srv.short_desc}
                </p>
                <p className="text-xs text-[#173247]/75 mt-3 leading-relaxed">
                  {srv.details}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EFE7DA]">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedService(srv);
                    setIsModalOpen(true);
                  }}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {getServiceButtonLabel(srv.title)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailored Service Enquiry Modal */}
      <ServiceEnquiryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />
    </div>
  );
};
