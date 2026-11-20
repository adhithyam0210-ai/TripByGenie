import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Utensils, Compass } from 'lucide-react';
import { PackageItinerary } from '../../types';

interface ItineraryTimelineProps {
  itineraries: PackageItinerary[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itineraries }) => {
  // Defensive deduplication to guarantee no day number is ever rendered twice
  const displayItineraries = useMemo(() => {
    if (!Array.isArray(itineraries)) return [];
    const map = new Map<number, PackageItinerary>();
    for (const it of itineraries) {
      if (!it) continue;
      const dayNum = Number(it.day_number) || 1;
      if (!map.has(dayNum)) {
        map.set(dayNum, it);
      } else {
        const existing = map.get(dayNum)!;
        if ((it.description?.length || 0) > (existing.description?.length || 0)) {
          map.set(dayNum, it);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.day_number - b.day_number);
  }, [itineraries]);

  const [openDays, setOpenDays] = useState<number[]>([1]); // Day 1 open by default

  const toggleDay = (day: number) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const expandAll = () => setOpenDays(displayItineraries.map((it) => it.day_number));
  const collapseAll = () => setOpenDays([]);

  const formatTitle = (dayNumber: number, rawTitle?: string) => {
    if (!rawTitle) return `Day ${dayNumber}`;
    const clean = rawTitle.trim();
    // Normalize existing "Day 1: ...", "Day 1 - ...", "Day 1 : ..."
    const match = clean.match(/^Day\s*\d+\s*[:\-–—\.]\s*(.*)$/i);
    if (match && match[1]) {
      return `Day ${dayNumber}: ${match[1].trim()}`;
    }
    return `Day ${dayNumber}: ${clean}`;
  };

  if (!displayItineraries || displayItineraries.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#173247]/60 bg-[#F8F1E7]/50 rounded-2xl border border-[#EFE7DA]">
        Detailed day-wise itinerary will be shared upon customized enquiry.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {displayItineraries.length} Days Itinerary
        </span>
        <div className="flex items-center gap-3 text-xs font-bold text-[#FF795C]">
          <button
            type="button"
            onClick={expandAll}
            className="hover:underline cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:underline cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion Cards matching TripbyGenie Image 2 */}
      <div className="space-y-3">
        {displayItineraries.map((day) => {
          const isOpen = openDays.includes(day.day_number);

          return (
            <div
              key={day.id || `day_${day.day_number}`}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all overflow-hidden"
            >
              {/* Day Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDay(day.day_number)}
                className="w-full flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 text-left cursor-pointer transition-colors select-none group"
              >
                {/* Circular Green Arrow Icon */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#00A854] text-[#00A854] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#00A854]/10">
                  {isOpen ? (
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  )}
                </div>

                {/* Day Title (Green when open, Dark Navy when closed) */}
                <h4
                  className={`text-sm sm:text-base md:text-[17px] font-bold transition-colors leading-snug ${
                    isOpen ? 'text-[#00A854]' : 'text-[#082C43] group-hover:text-[#00A854]'
                  }`}
                >
                  {formatTitle(day.day_number, day.title)}
                </h4>
              </button>

              {/* Day Details Body */}
              {isOpen && (
                <div className="px-5 sm:px-7 pb-6 pt-0">
                  <div className="pl-9 sm:pl-11">
                    <p className="text-sm sm:text-[15px] text-[#2D3748] leading-relaxed whitespace-pre-line font-normal">
                      {day.description}
                    </p>

                    {(day.meals || day.activities) && (
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        {day.meals && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <Utensils className="w-3.5 h-3.5 text-[#00A854]" />
                            Meals: {day.meals}
                          </span>
                        )}
                        {day.activities && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <Compass className="w-3.5 h-3.5 text-[#00A854]" />
                            Sightseeing: {day.activities}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
