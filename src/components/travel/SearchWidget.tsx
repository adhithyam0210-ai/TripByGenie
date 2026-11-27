import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Compass, Tag } from 'lucide-react';
import { Button } from '../common/Button';
import { getTodayIST } from '../../utils/dateValidation';

interface SearchWidgetProps {
  compact?: boolean;
  className?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ compact = false, className = '' }) => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [travelType, setTravelType] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.append('search', destination);
    if (departureCity) params.append('departure', departureCity);
    if (travelType && travelType !== 'all') params.append('category', travelType);
    if (travelDate) params.append('date', travelDate);
    if (travelers) params.append('pax', travelers);
    navigate(`/packages?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl border border-[#EFE7DA] transition-all hover:shadow-[#082C43]/15 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-center">
        {/* 1. Where To... */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl hover:bg-[#F8F1E7]/60 transition-colors">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FF795C]" />
            Where To...
          </label>
          <input
            type="text"
            placeholder="Kerala, Bali, Swiss, Dubai..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full text-sm font-semibold text-[#082C43] bg-transparent focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
        </div>

        {/* 2. Travel Type (Exact categories from tripbygenie.in) */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl hover:bg-[#F8F1E7]/60 transition-colors">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#55C9BD]" />
            Travel Type
          </label>
          <select
            value={travelType}
            onChange={(e) => setTravelType(e.target.value)}
            className="text-sm font-semibold text-[#082C43] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Tour Styles</option>
            <option value="Vacation Tours">Vacation Tours</option>
            <option value="Couple Tours">Couple Tours / Honeymoon</option>
            <option value="City Tours">City Tours</option>
            <option value="Adventure Tours">Adventure Tours</option>
            <option value="Group Tours">Group Tours</option>
            <option value="Spiritual Tours">Spiritual & Heritage</option>
          </select>
        </div>

        {/* 3. Departure City */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl hover:bg-[#F8F1E7]/60 transition-colors">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#17648A]" />
            Departing From
          </label>
          <select
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
            className="text-sm font-semibold text-[#082C43] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="">Any Departure City</option>
            <option value="Chennai">Chennai (Hub)</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Kochi">Kochi</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
          </select>
        </div>

        {/* 4. Travel Date */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl hover:bg-[#F8F1E7]/60 transition-colors">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#17648A] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF795C]" />
            Travel Date
          </label>
          <input
            type="date"
            min={getTodayIST()}
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="w-full text-sm font-semibold text-[#082C43] bg-transparent focus:outline-none cursor-pointer"
          />
        </div>

        {/* 5. Search / Book Now Button */}
        <div className="p-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-sm font-bold shadow-lg shadow-[#FF795C]/30 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search & Book</span>
          </Button>
        </div>
      </div>
    </form>
  );
};
