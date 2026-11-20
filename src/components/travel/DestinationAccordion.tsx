import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, BookOpen } from 'lucide-react';
import { Destination } from '../../types';

interface DestinationAccordionProps {
  destination: Destination;
}

export const DestinationAccordion: React.FC<DestinationAccordionProps> = ({ destination }) => {
  const items = destination.accordions && destination.accordions.length > 0 ? destination.accordions : [
    {
      title: `About ${destination.name}`,
      content: `${destination.name} is one of the world's most captivating travel destinations, renowned for its diverse landscapes, rich heritage, and vibrant culture. Whether you are traveling for a romantic honeymoon, a family getaway, or an adventurous exploration, TripByGenie curates bespoke itineraries with 4-star handpicked hotels, private airport transfers, and guided sightseeing.`
    },
    {
      title: `Best Budget ${destination.name} Tour Packages`,
      content: `${destination.name} doesn't have to be expensive. With careful planning, budget-friendly ${destination.name} tour packages can offer an immersive experience without breaking the bank. Opt for group departures, travel during shoulder seasons, and choose packages that include accommodation, airport transfers, and internal sightseeing to enjoy maximum value without sacrificing comfort.`
    },
    {
      title: `Top Reasons To Visit ${destination.name}`,
      content: `• Spectacular Natural Landscapes: Stunning coastal beaches, lush highlands, and iconic natural wonders.\n• Rich Cultural Heritage: Historic monuments, timeless traditions, and authentic cultural experiences.\n• South India's Trusted Service: Curated with South Indian vegetarian and non-vegetarian dining preferences and 24/7 coordinator support.\n• World-Class Sightseeing: Handpicked attractions and private guided tours for hassle-free exploration.`
    },
    {
      title: `Top Things To Do In ${destination.name}`,
      content: `• Visit iconic architectural landmarks and historic heritage sites.\n• Embark on scenic day trips, wildlife tours, and picturesque nature trails.\n• Savor authentic regional cuisine and local delicacies.\n• Enjoy relaxing boat cruises, coastal promenades, or serene beach walks.\n• Discover bustling traditional bazaars for handcrafted souvenirs and local specialties.`
    },
    {
      title: `Best Time To Visit ${destination.name} – For Indians`,
      content: `The ideal time for Indian travelers to visit ${destination.name} is during ${destination.season || 'October to April'}, when pleasant weather and clear skies make outdoor sightseeing and guided excursions comfortable. Convenient flight connections from Chennai, Bengaluru, Mumbai, and Delhi make this season especially popular for family holidays and festive breaks.`
    },
    {
      title: `${destination.name} At A Glance`,
      content: `• Capital / Hub: ${destination.capital || destination.name}\n• Currency: ${destination.currency || 'Indian Rupee (INR)'}\n• Climate: ${destination.climate || '20°C to 28°C'}\n• Languages: ${destination.language || 'English & Regional'}\n• Ideal Season: ${destination.season || 'October - April'}\n• Service Standard: 4-Star handpicked hotels, private AC transfers, and 24/7 dedicated South India tour assistance.`
    },
    {
      title: `Top Cities & Places To Visit In ${destination.name}`,
      content: `Explore renowned highlights across ${destination.name}, from historic city centers and scenic hill viewpoints to world-famous heritage attractions. Each day of your itinerary is thoughtfully paced to provide the perfect balance between guided excursions and leisurely self-exploration.`
    },
    {
      title: `Shopping & Local Souvenirs In ${destination.name}`,
      content: `Shopping in ${destination.name} is a delightful mix of traditional handicrafts, artisan markets, and modern retail hubs. Pick up authentic local spices, handcrafted textiles, traditional artwork, and regional delicacies to bring home cherished memories of your holiday.`
    }
  ];

  // Open the 2nd item (index 1) by default matching user screenshot, or item 0
  const [openIndices, setOpenIndices] = useState<number[]>([1]);

  const toggleItem = (idx: number) => {
    if (openIndices.includes(idx)) {
      setOpenIndices(openIndices.filter((i) => i !== idx));
    } else {
      setOpenIndices([...openIndices, idx]);
    }
  };

  return (
    <section className="mt-14 mb-16 max-w-[1600px] w-full mx-auto">
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Travel Guide & Insights
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082C43] font-display">
            Everything You Need To Know About {destination.name}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-[#F8F1E7] px-3 py-1.5 rounded-full border border-[#EFE7DA]">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>{items.length} Travel Topics</span>
        </div>
      </div>

      {/* Floating Accordion Cards matching Image media_1795154916143_21dc1ba4.png */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndices.includes(index);

          return (
            <div
              key={index}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-blue-100 shadow-xs ring-1 ring-blue-50'
                  : 'border-[#EAF0F6] hover:border-slate-300'
              }`}
            >
              {/* Header Button */}
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="w-full text-left px-5 sm:px-7 py-4.5 flex items-center gap-3.5 cursor-pointer select-none transition-colors"
                aria-expanded={isOpen}
              >
                {/* Left Circle Arrow Icon matching media_1795154916143_21dc1ba4.png */}
                {isOpen ? (
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600 shrink-0 stroke-[1.75]" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-emerald-600 shrink-0 stroke-[1.75]" />
                )}

                {/* Title (Green when open, Dark Navy when closed - matching screenshot) */}
                <span
                  className={`text-base sm:text-[17px] font-bold transition-colors font-display ${
                    isOpen ? 'text-[#16a34a]' : 'text-[#082C43]'
                  }`}
                >
                  {item.title}
                </span>
              </button>

              {/* Collapsible Content */}
              {isOpen && (
                <div className="px-5 sm:px-7 pb-6 pt-1 text-xs sm:text-[13.5px] text-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="pl-8.5 pr-2 pt-1">
                    {item.content.includes('\n') ? (
                      <div className="space-y-2">
                        {item.content.split('\n').map((line, lIdx) => (
                          <p key={lIdx} className={line.startsWith('•') || line.match(/^\d+\./) ? 'pl-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
