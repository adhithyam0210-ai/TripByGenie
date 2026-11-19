import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Package } from '../../types';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { TravelPatternBg } from '../../components/travel/TravelPatternBg';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';

export const GroupTours: React.FC = () => {
  const [tours, setTours] = useState<Package[]>([]);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Package | null>(null);

  useEffect(() => {
    loadGroupTours();
  }, []);

  const loadGroupTours = async () => {
    try {
      const data = await api.getGroupTours();
      setTours(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookTour = (tour: Package) => {
    setSelectedTour(tour);
    setIsTripModalOpen(true);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Header */}
      <section className="relative py-16 bg-[#082C43] text-white">
        <TravelPatternBg variant="navy" opacity={0.06} />
        <div className="relative max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Upcoming Fixed Departure Group Tours
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            Travel together with verified explorers. Premium 4-star stays, comfortable AC Volvo/minibuses, all meals, and a dedicated friendly tour manager.
          </p>
        </div>
      </section>

      {/* Group Tours Cards */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour) => {
            const seatsLeft = tour.available_seats || 8;
            const totalSeats = tour.total_seats || 24;
            const bookedPct = Math.round(((totalSeats - seatsLeft) / totalSeats) * 100);

            return (
              <div
                key={tour.id}
                className="rounded-3xl bg-white border border-[#EFE7DA] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={tour.cover_image}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#55C9BD] text-[#041D30] text-xs font-bold px-3 py-1 rounded-full">
                      Guaranteed Departure
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#041D30]/80 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF795C]" />
                      <span>Departs: {tour.upcoming_date || '2026-12-22'}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#082C43] font-display">
                      {tour.title}
                    </h3>
                    <p className="text-xs text-[#173247]/75 mt-2 line-clamp-2">
                      {tour.description}
                    </p>

                    {/* Highlights */}
                    <div className="mt-4 space-y-1.5 text-xs text-[#173247]/80">
                      {tour.highlights?.slice(0, 3).map((hl, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#55C9BD] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{hl}</span>
                        </div>
                      ))}
                    </div>

                    {/* Seats Progress */}
                    <div className="mt-6 p-4 rounded-2xl bg-[#F8F1E7]/70 border border-[#EFE7DA]">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                        <span className="text-[#082C43]">Available Seats:</span>
                        <span className="text-[#FF795C]">{seatsLeft} of {totalSeats} Remaining</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#EFE7DA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#55C9BD] to-[#FF795C] rounded-full"
                          style={{ width: `${bookedPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block text-right font-medium">
                        {bookedPct}% seats reserved
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#EFE7DA]/50 mt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs uppercase font-bold text-[#17648A]">
                      Package Price
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#082C43] font-display">
                        ₹{Number(tour.public_price || tour.starting_price || tour.b2c_price || tour.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500">/ person</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/packages/${tour.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Itinerary
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBookTour(tour)}
                    >
                      Book Seat Now
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        initialDestination={selectedTour ? selectedTour.title : 'Group Tour'}
        initialPackageId={selectedTour ? selectedTour.id : ''}
      />
    </div>
  );
};
