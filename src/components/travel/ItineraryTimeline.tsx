import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Utensils, Compass, Clock } from 'lucide-react';
import { PackageItinerary } from '../../types';

interface ItineraryTimelineProps {
  itineraries: PackageItinerary[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itineraries }) => {
  const [openDays, setOpenDays] = useState<number[]>([1]); // First day open by default

  const toggleDay = (day: number) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const expandAll = () => setOpenDays(itineraries.map((it) => it.day_number));
  const collapseAll = () => setOpenDays([]);

  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#173247]/60 bg-[#F8F1E7]/50 rounded-2xl border border-[#EFE7DA]">
        Detailed day-wise itinerary will be shared upon customized enquiry.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
        <span className="text-xs font-semibold text-[#17648A] uppercase tracking-wider">
          {itineraries.length} Days Itinerary
        </span>
        <div className="flex gap-3 text-xs font-bold text-[#FF795C]">
          <button onClick={expandAll} className="hover:underline cursor-pointer">
            Expand All
          </button>
          <span>•</span>
          <button onClick={collapseAll} className="hover:underline cursor-pointer">
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {itineraries.map((day) => {
          const isOpen = openDays.includes(day.day_number);

          return (
            <div
              key={day.id || day.day_number}
              className="rounded-xl border border-[#EFE7DA] bg-white overflow-hidden shadow-sm hover:border-[#17648A]/40 transition-colors"
            >
              {/* Day Header */}
              <button
                type="button"
                onClick={() => toggleDay(day.day_number)}
                className="w-full flex items-center justify-between p-4 text-left bg-gradient-to-r hover:bg-[#F8F1E7]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#082C43] text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#55C9BD] leading-none">
                      Day
                    </span>
                    <span className="text-sm font-extrabold leading-none mt-0.5">
                      {day.day_number}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-[#082C43]">
                      {day.title}
                    </h4>
                    {day.meals && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#17648A] font-medium mt-0.5">
                        <Utensils className="w-3 h-3 text-[#FF795C]" /> Meals: {day.meals}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-400 p-1">
                  {isOpen ? <ChevronUp className="w-5 h-5 text-[#082C43]" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Day Details Body */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-[#173247]/85 border-t border-[#EFE7DA]/50 space-y-3 bg-[#FFFDF8]">
                  <p className="leading-relaxed whitespace-pre-line text-sm text-[#173247]/80">
                    {day.description}
                  </p>

                  {day.activities && (
                    <div className="p-3 rounded-lg bg-[#F8F1E7] border border-[#EFE7DA] flex items-start gap-2 text-xs">
                      <Compass className="w-4 h-4 text-[#55C9BD] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#082C43] block">Key Activities & Sightseeing:</strong>
                        <span className="text-[#173247]/80">{day.activities}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
