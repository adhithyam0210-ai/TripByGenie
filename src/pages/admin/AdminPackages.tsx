import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Image,
  CheckCircle,
  Clock,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Calendar,
  MapPin,
  Compass,
  FileText,
  Users
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { Package, Destination, PackageItinerary } from '../../types';
import { useToast } from '../../context/ToastContext';

interface EditableDay {
  day_number: number;
  title: string;
  description: string;
  meals?: string;
  activities?: string;
}

export const AdminPackages: React.FC = () => {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'group'>('all');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'itinerary'>('details');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    title: '',
    slug: '',
    destination_id: '',
    category: 'International Holiday Packages',
    duration_days: 5,
    duration_nights: 4,
    public_price: 45000,
    wholesale_price: 36000,
    cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: '',
    starting_location: '',
    ending_location: '',
    destinations_covered: '',
    highlights: 'Luxury 4-star accommodation, Daily breakfast and dinner, Private AC transfers, Sightseeing passes',
    inclusions: 'Hotel stays, Daily meals, Private transport, Tolls & parking',
    exclusions: 'Airfare, Personal expenses, Travel insurance',
    accommodation: 'Handpicked 4-star boutique hotels',
    transportation: 'Private AC Toyota Innova / Sedan',
    is_featured: false,
    is_published: true,
    is_group_tour: false,
    available_seats: 8,
    total_seats: 24,
    upcoming_date: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [itineraries, setItineraries] = useState<EditableDay[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pkgs, dests] = await Promise.all([api.getAdminPackages(), api.getAdminDestinations()]);
      setPackages(pkgs);
      setDestinations(dests);
      if (dests.length > 0 && !formData.destination_id) {
        setFormData((prev) => ({ ...prev, destination_id: dests[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setActiveTab('details');
    setFormData({
      ...initialForm,
      destination_id: destinations[0]?.id || ''
    });
    // Initialize 5 default days for a new package
    setItineraries([
      { day_number: 1, title: 'Day 1: Arrival & Welcome', description: 'Arrive at destination airport. Meet chauffeur and transfer to hotel.', meals: 'Breakfast Included', activities: 'Arrival Transfer' },
      { day_number: 2, title: 'Day 2: City Sightseeing & Highlights', description: 'Explore iconic highlights, historical landmarks and scenic spots.', meals: 'Breakfast Included', activities: 'Full Day Sightseeing' },
      { day_number: 3, title: 'Day 3: Scenic Excursion', description: 'Full day excursion to picturesque nearby attractions.', meals: 'Breakfast Included', activities: 'Excursion Tour' },
      { day_number: 4, title: 'Day 4: Leisure & Local Culture', description: 'Enjoy local cuisine, shopping and leisure experiences.', meals: 'Breakfast Included', activities: 'Leisure & Shopping' },
      { day_number: 5, title: 'Day 5: Departure & Farewell', description: 'Check out from hotel and transfer to airport for onward journey.', meals: 'Breakfast Included', activities: 'Airport Departure Transfer' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenCreateGroupTour = () => {
    setEditingId(null);
    setActiveTab('details');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const dateStr = futureDate.toISOString().split('T')[0];

    setFormData({
      ...initialForm,
      destination_id: destinations[0]?.id || '',
      category: 'Group Tours',
      is_group_tour: true,
      total_seats: 24,
      available_seats: 8,
      upcoming_date: dateStr,
      highlights: '100% Guaranteed Group Departure, Dedicated Professional Tour Manager, Pure Veg & Jain Meals Available, Luxury AC Coach Transfers',
      inclusions: 'Handpicked 4-star Hotel Stays, Daily Buffet Breakfast & Dinner, Sightseeing & Entry Tickets, AC Coach Transfers, Experienced Tour Escort',
      exclusions: 'Flight tickets, Personal shopping, Travel insurance',
      transportation: 'Deluxe AC Coach / Mini-Bus with Chauffeur',
      accommodation: 'Premium 4-Star Hotels with Buffet Dining'
    });
    setItineraries([
      { day_number: 1, title: 'Day 1: Arrival & Group Orientation', description: 'Arrive at destination airport. Warm meet-and-greet with our Tour Manager and co-travelers. Transfer to hotel for check-in and welcome dinner.', meals: 'Dinner Included', activities: 'Group Welcome & Orientation' },
      { day_number: 2, title: 'Day 2: Guided Landmark Sightseeing Tour', description: 'Full day sightseeing excursion with our experienced tour manager. Explore major cultural landmarks and photography spots.', meals: 'Breakfast & Dinner Included', activities: 'Full Day Sightseeing' },
      { day_number: 3, title: 'Day 3: Scenic Excursions & Nature Experience', description: 'Exciting group day trip to picturesque nearby attractions and scenic viewpoints with arranged group lunch.', meals: 'Breakfast & Dinner Included', activities: 'Group Excursion' },
      { day_number: 4, title: 'Day 4: Leisure, Shopping & Farewell Gala', description: 'Leisure morning for shopping local handicrafts and souvenirs. Special celebration farewell gala dinner in the evening.', meals: 'Breakfast & Farewell Dinner', activities: 'Shopping & Farewell Gala' },
      { day_number: 5, title: 'Day 5: Check-out & Airport Transfer', description: 'Enjoy breakfast at the hotel. Group transfer to the airport for onward departure with lifelong memories.', meals: 'Breakfast Included', activities: 'Airport Departure Transfer' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (pkg: Package) => {
    setEditingId(pkg.id);
    setActiveTab('details');
    setFormData({
      title: pkg.title,
      slug: pkg.slug || '',
      destination_id: pkg.destination_id,
      category: pkg.category,
      duration_days: pkg.duration_days,
      duration_nights: pkg.duration_nights,
      public_price: pkg.public_price,
      wholesale_price: pkg.wholesale_price || Math.round(pkg.public_price * 0.8),
      cover_image: pkg.cover_image,
      description: pkg.description,
      starting_location: (pkg as any).starting_location || '',
      ending_location: (pkg as any).ending_location || '',
      destinations_covered: ((pkg as any).destinations_covered || []).join(', '),
      highlights: (pkg.highlights || []).join(', '),
      inclusions: (pkg.inclusions || []).join(', '),
      exclusions: (pkg.exclusions || []).join(', '),
      accommodation: pkg.accommodation,
      transportation: pkg.transportation,
      is_featured: pkg.is_featured,
      is_published: pkg.is_published,
      is_group_tour: !!pkg.is_group_tour || pkg.category === 'Group Tours',
      available_seats: pkg.available_seats !== undefined ? pkg.available_seats : ((pkg as any).seats_left ?? 8),
      total_seats: (pkg as any).total_seats ?? 24,
      upcoming_date: pkg.upcoming_date || ''
    });

    // Load authentic day-by-day itineraries for this package
    try {
      const itins = await api.getAdminPackageItineraries(pkg.id);
      if (itins && itins.length > 0) {
        setItineraries(
          itins.map((it: any, idx: number) => ({
            day_number: it.day_number || idx + 1,
            title: it.title || `Day ${idx + 1}`,
            description: it.description || '',
            meals: it.meals || 'Breakfast Included',
            activities: it.activities || 'Guided Sightseeing'
          }))
        );
      } else {
        // Fallback default days if none found
        const days = Array.from({ length: pkg.duration_days || 5 }, (_, i) => ({
          day_number: i + 1,
          title: `Day ${i + 1}: Itinerary Day`,
          description: `Activities and itinerary details for Day ${i + 1}.`,
          meals: 'Breakfast Included',
          activities: 'Sightseeing'
        }));
        setItineraries(days);
      }
    } catch {
      setItineraries([]);
    }

    setIsModalOpen(true);
  };

  // Itinerary Editing Functions
  const handleAddDay = () => {
    const nextDayNum = itineraries.length + 1;
    setItineraries((prev) => [
      ...prev,
      {
        day_number: nextDayNum,
        title: `Day ${nextDayNum}: New Itinerary Day`,
        description: 'Detail airport arrival, guided sightseeing, or journey highlights for this day.',
        meals: 'Breakfast Included',
        activities: 'Sightseeing Tour'
      }
    ]);
    setFormData((prev) => ({
      ...prev,
      duration_days: nextDayNum,
      duration_nights: Math.max(1, nextDayNum - 1)
    }));
  };

  const handleUpdateDay = (index: number, field: keyof EditableDay, value: any) => {
    setItineraries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteDay = (index: number) => {
    if (itineraries.length <= 1) {
      error('A package must have at least one itinerary day.');
      return;
    }
    setItineraries((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-number days sequentially
      const renumbered = filtered.map((day, idx) => ({
        ...day,
        day_number: idx + 1,
        title: day.title.replace(/^Day\s*\d+\s*[:\-]?\s*/i, `Day ${idx + 1}: `)
      }));
      setFormData((f) => ({
        ...f,
        duration_days: renumbered.length,
        duration_nights: Math.max(1, renumbered.length - 1)
      }));
      return renumbered;
    });
  };

  const handleMoveDay = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === itineraries.length - 1) return;

    setItineraries((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      // Re-number days sequentially after reordering
      return copy.map((day, idx) => ({
        ...day,
        day_number: idx + 1
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination_id) {
      error('Title and destination are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const destinationsList = formData.destinations_covered
        ? formData.destinations_covered.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        is_group_tour: !!formData.is_group_tour || formData.category === 'Group Tours',
        available_seats: Number(formData.available_seats) || 0,
        total_seats: Number(formData.total_seats) || 24,
        upcoming_date: formData.upcoming_date || '',
        duration_days: itineraries.length || formData.duration_days,
        duration_nights: formData.duration_nights || Math.max(1, (itineraries.length || formData.duration_days) - 1),
        destinations_covered: destinationsList,
        highlights: formData.highlights.split(',').map((s) => s.trim()).filter(Boolean),
        inclusions: formData.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
        exclusions: formData.exclusions.split(',').map((s) => s.trim()).filter(Boolean),
        itineraries: itineraries.map((it, idx) => ({
          day_number: idx + 1,
          title: it.title,
          description: it.description,
          meals: it.meals || 'Breakfast Included',
          activities: it.activities || 'Sightseeing & Transfers'
        }))
      };

      if (editingId) {
        await api.updateAdminPackage(editingId, payload);
        success(formData.is_group_tour ? 'Guaranteed Group Tour updated successfully!' : 'Package and authentic day-by-day itineraries updated successfully!');
      } else {
        await api.createAdminPackage(payload);
        success(formData.is_group_tour ? 'New Guaranteed Group Tour published to website!' : 'New package and itineraries published to website and agent marketplace!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package? It will be removed immediately from the website.')) return;
    try {
      await api.deleteAdminPackage(id);
      success('Package deleted successfully.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete package.');
    }
  };

  const togglePublished = async (pkg: Package) => {
    try {
      await api.updateAdminPackage(pkg.id, { is_published: !pkg.is_published });
      success(`Package ${!pkg.is_published ? 'published' : 'unpublished'}.`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update publication status.');
    }
  };

  const groupToursCount = useMemo(() => {
    return packages.filter((p) => p.is_group_tour || p.category === 'Group Tours').length;
  }, [packages]);

  // Filter packages based on viewMode, search query, category, and publication status
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const isGroup = pkg.is_group_tour || pkg.category === 'Group Tours';
      if (viewMode === 'group' && !isGroup) return false;

      const q = searchQuery.toLowerCase().trim();
      const dest = destinations.find((d) => d.id === pkg.destination_id);
      const matchesSearch =
        !q ||
        pkg.title.toLowerCase().includes(q) ||
        (pkg.slug && pkg.slug.toLowerCase().includes(q)) ||
        (dest && (dest.name.toLowerCase().includes(q) || dest.country.toLowerCase().includes(q))) ||
        ((pkg as any).starting_location && (pkg as any).starting_location.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || pkg.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'published' && pkg.is_published) ||
        (selectedStatus === 'draft' && !pkg.is_published);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [packages, destinations, searchQuery, selectedCategory, selectedStatus, viewMode]);

  return (
    <DashboardLayout
      title="Tour Package & Itinerary Management"
      subtitle="Complete catalog management, guaranteed group tours, authentic day-by-day itineraries, and B2B wholesale margins."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateGroupTour}
            className="border-[#55C9BD] text-[#082C43] hover:bg-[#55C9BD]/15 font-bold"
            leftIcon={<Users className="w-4 h-4 text-[#00A854]" />}
          >
            + Create Group Tour
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Package
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs: All Packages vs Guaranteed Group Tours */}
        <div className="flex items-center gap-2 border-b border-[#EFE7DA] pb-3">
          <button
            type="button"
            onClick={() => { setViewMode('all'); setSelectedCategory('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-[#082C43] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#F8F1E7] border border-[#EFE7DA]'
            }`}
          >
            <Layers className="w-4 h-4" />
            All Packages ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('group')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'group'
                ? 'bg-[#00A854] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#F8F1E7] border border-[#EFE7DA]'
            }`}
          >
            <Users className="w-4 h-4 text-[#55C9BD]" />
            Guaranteed Group Tours ({groupToursCount})
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search packages by title, destination, country, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs focus:ring-2 focus:ring-[#00A854] outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-semibold text-[#082C43] outline-none"
              >
                <option value="all">All Categories</option>
                <option value="International Holiday Packages">International Packages</option>
                <option value="Domestic Holiday Packages">Domestic / India Packages</option>
                <option value="Honeymoon Packages">Honeymoon Packages</option>
                <option value="Group Tours">Group Tours</option>
                <option value="Adventure Tours">Adventure Tours</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] text-xs font-semibold text-[#082C43] outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
                {viewMode === 'group' ? 'Guaranteed Group Tours' : 'Tour Packages'} ({filteredPackages.length} of {packages.length})
              </h3>
              {viewMode === 'group' && (
                <span className="text-[10px] bg-[#55C9BD]/20 text-[#041D30] font-bold px-2 py-0.5 rounded-full border border-[#55C9BD]/40">
                  Fixed Departures
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Synced with Homepage & Group Tours Catalog
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Package & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Public Retail</th>
                  <th className="py-3 px-4">Wholesale</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {filteredPackages.map((pkg) => {
                  const wholesale = pkg.wholesale_price || Math.round(pkg.public_price * 0.8);
                  const margin = pkg.public_price - wholesale;

                  return (
                    <tr key={pkg.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={pkg.cover_image}
                            alt={pkg.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#EFE7DA]"
                          />
                          <div className="max-w-md">
                            <strong className="text-[#082C43] block truncate font-bold text-[13px]">{pkg.title}</strong>
                            <span className="text-[11px] text-[#17648A] block truncate">{pkg.slug}</span>
                            {(pkg.is_group_tour || pkg.category === 'Group Tours') && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#55C9BD]/20 text-[#041D30] border border-[#55C9BD]/30">
                                  <Users className="w-3 h-3 text-[#082C43]" />
                                  Guaranteed Group Tour
                                </span>
                                {pkg.upcoming_date && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF795C]/15 text-[#C84B31]">
                                    <Calendar className="w-3 h-3" />
                                    {pkg.upcoming_date}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  {pkg.available_seats !== undefined ? pkg.available_seats : ((pkg as any).seats_left ?? 8)} / {(pkg as any).total_seats ?? 24} seats left
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {pkg.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {pkg.duration_days}D / {pkg.duration_nights}N
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                        ₹{pkg.public_price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#FF795C]">
                        ₹{wholesale.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => togglePublished(pkg)}
                          className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                            pkg.is_published
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {pkg.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {pkg.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <a
                            href={`/packages/${pkg.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-[#00A854] rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                            title="Preview Package Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(pkg)}
                            className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Edit Package & Itinerary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Package Form Modal with Dedicated Itinerary Management */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Tour Package & Itinerary' : 'Create & Publish New Package'}
          subtitle="Configure package content, multi-tier pricing, and authentic day-by-day itineraries."
          maxWidth="4xl"
        >
          {/* Modal Tabs */}
          <div className="flex items-center gap-3 border-b border-[#EFE7DA] pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#082C43] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Package Details & Pricing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('itinerary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'bg-[#00A854] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              2. Day-by-Day Itinerary ({itineraries.length} Days)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anchorage to Denali Tour Package for Nature Lovers"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Destination *</label>
                    <select
                      required
                      value={formData.destination_id}
                      onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    >
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Package Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    >
                      <option value="International Holiday Packages">International Holiday Packages</option>
                      <option value="Domestic Holiday Packages">Domestic Holiday Packages</option>
                      <option value="Honeymoon Packages">Honeymoon Packages</option>
                      <option value="Family Holiday Packages">Family Holiday Packages</option>
                      <option value="Group Tours">Group Tours</option>
                      <option value="Adventure Tours">Adventure Tours</option>
                      <option value="Weekend Getaways">Weekend Getaways</option>
                    </select>
                  </div>
                </div>

                {/* Pricing Section (Retail vs Wholesale) */}
                <div className="p-3.5 rounded-2xl bg-[#F8F1E7] border border-[#EFE7DA] grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Public Customer Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.public_price}
                      onChange={(e) => setFormData({ ...formData, public_price: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Displayed on public website</span>
                  </div>

                  <div>
                    <label className="font-bold text-[#FF795C] block mb-1">Agent Wholesale Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white font-bold text-[#FF795C]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Strictly hidden from customers</span>
                  </div>
                </div>

                {/* Guaranteed Group Tour Settings */}
                <div className="p-4 rounded-2xl bg-[#55C9BD]/10 border border-[#55C9BD]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#082C43]" />
                      <div>
                        <span className="font-bold text-[#082C43] text-xs block">
                          Guaranteed Group Tour (Fixed Departure)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Highlights on homepage and /group-tours with live seat status
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_group_tour}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            is_group_tour: checked,
                            category: checked ? 'Group Tours' : formData.category
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A854]"></div>
                      <span className="ml-2 text-xs font-semibold text-slate-700">
                        {formData.is_group_tour ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {(formData.is_group_tour || formData.category === 'Group Tours') && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#55C9BD]/20">
                      <div>
                        <label className="font-bold text-[#082C43] block mb-1 text-[11px]">
                          Upcoming Departure Date *
                        </label>
                        <input
                          type="date"
                          value={formData.upcoming_date}
                          onChange={(e) => setFormData({ ...formData, upcoming_date: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white font-medium text-xs text-[#082C43]"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Scheduled fixed departure</span>
                      </div>

                      <div>
                        <label className="font-bold text-[#082C43] block mb-1 text-[11px]">
                          Available Seats Left *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={formData.total_seats || 50}
                          value={formData.available_seats}
                          onChange={(e) => setFormData({ ...formData, available_seats: Number(e.target.value) })}
                          className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white font-bold text-xs text-[#00A854]"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. 8 seats remaining</span>
                      </div>

                      <div>
                        <label className="font-bold text-[#082C43] block mb-1 text-[11px]">
                          Total Group Capacity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.total_seats}
                          onChange={(e) => setFormData({ ...formData, total_seats: Number(e.target.value) })}
                          className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white font-bold text-xs text-[#082C43]"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Total max group size (e.g. 24)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration & Locations */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Days</label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Nights</label>
                    <input
                      type="number"
                      value={formData.duration_nights}
                      onChange={(e) => setFormData({ ...formData, duration_nights: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Starting Point</label>
                    <input
                      type="text"
                      placeholder="e.g. Anchorage"
                      value={formData.starting_location}
                      onChange={(e) => setFormData({ ...formData, starting_location: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#082C43] block mb-1">Ending Point</label>
                    <input
                      type="text"
                      placeholder="e.g. Denali"
                      value={formData.ending_location}
                      onChange={(e) => setFormData({ ...formData, ending_location: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Destinations Covered (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Anchorage, Talkeetna, Denali"
                    value={formData.destinations_covered}
                    onChange={(e) => setFormData({ ...formData, destinations_covered: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    required
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Overview Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#082C43] block mb-1">Key Highlights (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.highlights}
                    onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#082C43]">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded text-[#FF795C]"
                    />
                    Featured Package
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#082C43]">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="rounded text-[#082C43]"
                    />
                    Publish Immediately
                  </label>
                </div>
              </div>
            )}

            {/* Itinerary Management Interface (Master Prompt Section 8.4) */}
            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DA]">
                  <div>
                    <h4 className="font-bold text-[#082C43] text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#00A854]" />
                      Authentic Day-by-Day Itinerary Schedule
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure day titles, detailed descriptions, meals, and sightseeing activities.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddDay}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Day
                  </Button>
                </div>

                {/* Days Accordion / List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {itineraries.map((day, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-[#E5EFF5] shadow-[0_2px_8px_rgba(23,100,138,0.06)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#00A854]/10 text-[#00A854] font-bold flex items-center justify-center text-xs border border-[#00A854]/20">
                            {day.day_number}
                          </span>
                          <span className="font-bold text-[#082C43] text-xs">
                            Day {day.day_number} Details
                          </span>
                        </div>

                        {/* Reordering & Delete Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, 'up')}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg transition-colors ${
                              idx === 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#00A854] cursor-pointer'
                            }`}
                            title="Move Day Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, 'down')}
                            disabled={idx === itineraries.length - 1}
                            className={`p-1.5 rounded-lg transition-colors ${
                              idx === itineraries.length - 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#00A854] cursor-pointer'
                            }`}
                            title="Move Day Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDay(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete Day"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Day Title */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                          Day Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={day.title}
                          onChange={(e) => handleUpdateDay(idx, 'title', e.target.value)}
                          placeholder={`e.g. Day ${day.day_number}: Scenic Journey from Anchorage to Talkeetna`}
                          className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] font-medium"
                        />
                      </div>

                      {/* Day Description */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                          Day Activities & Full Itinerary Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={day.description}
                          onChange={(e) => handleUpdateDay(idx, 'description', e.target.value)}
                          placeholder="Provide the authentic day narrative, airport transfers, scenic trains, hotel check-ins, or tours..."
                          className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] leading-relaxed resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                            Meals Included
                          </label>
                          <input
                            type="text"
                            value={day.meals || ''}
                            onChange={(e) => handleUpdateDay(idx, 'meals', e.target.value)}
                            placeholder="e.g. Breakfast Included"
                            className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                            Key Sightseeing / Activities
                          </label>
                          <input
                            type="text"
                            value={day.activities || ''}
                            onChange={(e) => handleUpdateDay(idx, 'activities', e.target.value)}
                            placeholder="e.g. Talkeetna Wilderness Jet Boat Safari"
                            className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDay}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Another Day
                  </Button>
                  <span className="text-xs text-slate-500 font-medium">
                    Total {itineraries.length} Days Itinerary Configured
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#EFE7DA] flex justify-between items-center">
              {editingId && formData.slug && (
                <a
                  href={`/packages/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#00A854] font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview Customer Page
                </a>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  {editingId ? 'Save Changes' : 'Publish Package'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
