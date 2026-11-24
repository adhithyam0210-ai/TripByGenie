import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Building,
  Car,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  ExternalLink,
  ChevronDown,
  Layers,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TripOperationalStatus } from '../../types';

export const OperationsBookings: React.FC = () => {
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Booking for Operations Management Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState<'hotel' | 'transport' | 'status' | 'documents'>('hotel');

  // Hotel Form State
  const [hotelForm, setHotelForm] = useState({
    hotel_name: '',
    room_category: 'Deluxe View Room',
    meal_plan: 'Breakfast & Dinner (MAP)',
    hotel_confirmation_number: '',
    hotel_check_in: '',
    hotel_check_out: '',
    special_instructions: ''
  });

  // Transport Form State
  const [transportForm, setTransportForm] = useState({
    vehicle_type: 'Toyota Innova Crysta AC',
    driver_name: '',
    driver_phone: '',
    pickup_location: '',
    drop_location: '',
    guide_name: '',
    guide_phone: ''
  });

  // Status Progression
  const [newTripStatus, setNewTripStatus] = useState<TripOperationalStatus>('Arrangements Pending');

  // Upload Voucher State
  const [docCategory, setDocCategory] = useState<any>('Hotel Voucher');
  const [docTitle, setDocTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOperationsBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenManageModal = (b: any, initialTab: 'hotel' | 'transport' | 'status' | 'documents' = 'hotel') => {
    setSelectedBooking(b);
    setActiveModalTab(initialTab);
    const ops = b.operations || {};

    setHotelForm({
      hotel_name: ops.hotel_name || '',
      room_category: ops.room_category || 'Deluxe Room',
      meal_plan: ops.meal_plan || 'Breakfast & Dinner (MAP)',
      hotel_confirmation_number: ops.hotel_confirmation_number || '',
      hotel_check_in: ops.hotel_check_in || b.travel_start_date || '',
      hotel_check_out: ops.hotel_check_out || b.travel_end_date || '',
      special_instructions: ops.special_instructions || ''
    });

    setTransportForm({
      vehicle_type: ops.vehicle_type || 'Toyota Innova Crysta AC',
      driver_name: ops.driver_name || '',
      driver_phone: ops.driver_phone || '',
      pickup_location: ops.pickup_location || 'Airport Arrival Terminal',
      drop_location: ops.drop_location || 'Hotel Lobby',
      guide_name: ops.guide_name || '',
      guide_phone: ops.guide_phone || ''
    });

    setNewTripStatus(ops.trip_status || 'Arrangements Pending');
    setDocTitle(`${b.package_title} - ${initialTab === 'hotel' ? 'Hotel Voucher' : 'Transport Pass'}`);
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      await api.updateOperationsArrangements(selectedBooking.id, {
        ...hotelForm,
        trip_status: 'Hotel Confirmed'
      });
      success(`Hotel reservations saved for booking ${selectedBooking.booking_number}!`);
      loadBookings();
      setSelectedBooking((prev: any) => ({
        ...prev,
        operations: { ...prev.operations, ...hotelForm, trip_status: 'Hotel Confirmed' }
      }));
    } catch (err: any) {
      error(err.message || 'Failed to update hotel reservations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      await api.updateOperationsArrangements(selectedBooking.id, {
        ...transportForm,
        trip_status: 'Transport Confirmed'
      });
      success(`Vehicle & driver allocated for booking ${selectedBooking.booking_number}!`);
      loadBookings();
      setSelectedBooking((prev: any) => ({
        ...prev,
        operations: { ...prev.operations, ...transportForm, trip_status: 'Transport Confirmed' }
      }));
    } catch (err: any) {
      error(err.message || 'Failed to update transport.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTripStatus = async (status: TripOperationalStatus) => {
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      await api.updateTripOperationalStatus(selectedBooking.id, status);
      success(`Trip status updated to: ${status}`);
      loadBookings();
      setSelectedBooking((prev: any) => ({
        ...prev,
        operations: { ...prev.operations, trip_status: status }
      }));
    } catch (err: any) {
      error(err.message || 'Failed to update trip status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDossier = async () => {
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      await api.generateTravelDossier(selectedBooking.id);
      success('Official Consolidated Travel Dossier compiled and published to traveler wallet!');
      loadBookings();
      setSelectedBooking((prev: any) => ({
        ...prev,
        operations: { ...prev.operations, trip_status: 'Documents Ready', dossier_generated: true }
      }));
    } catch (err: any) {
      error(err.message || 'Failed to compile travel dossier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !docTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await api.uploadTravelDocument({
        booking_id: selectedBooking.id,
        customer_id: selectedBooking.customer_id,
        category: docCategory,
        title: docTitle.trim(),
        file_name: `${docTitle.trim().replace(/\s+/g, '_')}.pdf`,
        file_size: '380 KB',
        file_type: 'application/pdf',
        file_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        notes: docNotes
      });

      success(`Uploaded ${docCategory} for ${selectedBooking.booking_number}!`);
      loadBookings();
      setDocNotes('');
    } catch (err: any) {
      error(err.message || 'Failed to upload voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const operationalStatuses: TripOperationalStatus[] = [
    'Booking Received',
    'Arrangements Pending',
    'Hotel Confirmed',
    'Transport Confirmed',
    'Documents Ready',
    'Ready to Travel',
    'Trip In Progress',
    'Trip Completed',
    'Issue Reported'
  ];

  const filteredBookings = bookings.filter((b) => {
    const ops = b.operations || {};
    const matchesSearch =
      !search.trim() ||
      b.booking_number.toLowerCase().includes(search.toLowerCase()) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.package_title && b.package_title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || ops.trip_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      title="Booking Execution & Logistics Desk"
      subtitle="Hotel confirmations, vehicle & chauffeur assignments, operational vouchers, and travel dossiers"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EFE7DA] shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#082C43] text-white shadow-xs'
                  : 'text-[#082C43]/70 hover:bg-[#F8F1E7]'
              }`}
            >
              All Operational ({bookings.length})
            </button>
            {operationalStatuses.slice(0, 5).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-[#082C43] text-white shadow-xs'
                    : 'text-[#082C43]/70 hover:bg-[#F8F1E7]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by traveler or booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-[#FF795C] border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">Loading operations queue...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#082C43]">No bookings match this filter</h3>
              <p className="text-xs text-slate-400 mt-1">Adjust your status filter or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE7DA] bg-[#F8F1E7]/40 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Booking #</th>
                    <th className="py-3 px-4">Customer / Travelers</th>
                    <th className="py-3 px-4">Tour Package</th>
                    <th className="py-3 px-4">Travel Dates</th>
                    <th className="py-3 px-4">Trip Operational Status</th>
                    <th className="py-3 px-4">Hotel Reservation</th>
                    <th className="py-3 px-4">Chauffeur / Vehicle</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {filteredBookings.map((b) => {
                    const ops = b.operations || {};
                    return (
                      <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#17648A]">
                          {b.booking_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#082C43] block">
                            {b.customer_name || 'Traveler'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.travelers_count} Pax • ₹{Number(b.total_amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-[200px] truncate">
                          {b.package_title}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#082C43]">
                          {b.travel_start_date ? new Date(b.travel_start_date).toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ops.trip_status === 'Ready to Travel' || ops.trip_status === 'Documents Ready'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : ops.trip_status === 'Hotel Confirmed' || ops.trip_status === 'Transport Confirmed'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ops.trip_status || 'Booking Received'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          {ops.hotel_confirmation_number ? (
                            <div>
                              <span className="text-emerald-700 font-bold block truncate max-w-[140px]">
                                ✓ {ops.hotel_name || 'Hotel Booked'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Conf: {ops.hotel_confirmation_number}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenManageModal(b, 'hotel')}
                              className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                            >
                              + Assign Hotel
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          {ops.driver_name ? (
                            <div>
                              <span className="text-sky-700 font-bold block truncate max-w-[130px]">
                                {ops.driver_name}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {ops.vehicle_type}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenManageModal(b, 'transport')}
                              className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                            >
                              + Assign Vehicle
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenManageModal(b, 'hotel')}
                            className="text-[11px] px-3 py-1"
                          >
                            Manage Execution
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Operations Execution Modal */}
        {selectedBooking && (
          <Modal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            title={`Operations Logistics — ${selectedBooking.booking_number}`}
            size="lg"
          >
            <div className="space-y-4">
              {/* Trip Info Capsule */}
              <div className="p-3 bg-[#F8F1E7] rounded-2xl border border-[#EFE7DA] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#082C43] block text-sm">
                    {selectedBooking.package_title}
                  </span>
                  <span className="text-slate-500">
                    Traveler: <strong>{selectedBooking.customer_name}</strong> • {selectedBooking.travelers_count} Pax • Starts {selectedBooking.travel_start_date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                  <span className="text-xs font-bold text-[#17648A]">
                    {selectedBooking.operations?.trip_status || 'Booking Received'}
                  </span>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-[#EFE7DA] pb-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('hotel')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    activeModalTab === 'hotel'
                      ? 'bg-[#082C43] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F8F1E7]'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 inline mr-1" />
                  1. Hotel & Resort
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('transport')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    activeModalTab === 'transport'
                      ? 'bg-[#082C43] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F8F1E7]'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 inline mr-1" />
                  2. Chauffeur & Cab
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('status')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    activeModalTab === 'status'
                      ? 'bg-[#082C43] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F8F1E7]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1" />
                  3. Trip Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('documents')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    activeModalTab === 'documents'
                      ? 'bg-[#082C43] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F8F1E7]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  4. Upload Vouchers
                </button>
              </div>

              {/* TAB 1: HOTEL */}
              {activeModalTab === 'hotel' && (
                <form onSubmit={handleSaveHotel} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Hotel / Resort Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. The Seminyak Beach Resort & Spa"
                        value={hotelForm.hotel_name}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotel_name: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Confirmation / PNR # *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SMR-8921-ID"
                        value={hotelForm.hotel_confirmation_number}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotel_confirmation_number: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Room Category
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Deluxe Ocean View Villa"
                        value={hotelForm.room_category}
                        onChange={(e) => setHotelForm({ ...hotelForm, room_category: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Meal Plan
                      </label>
                      <select
                        value={hotelForm.meal_plan}
                        onChange={(e) => setHotelForm({ ...hotelForm, meal_plan: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      >
                        <option value="Breakfast Included (CP)">Breakfast Included (CP)</option>
                        <option value="Breakfast & Dinner (MAP)">Breakfast & Dinner (MAP)</option>
                        <option value="All Meals Included (AP)">All Meals Included (AP)</option>
                        <option value="Room Only (EP)">Room Only (EP)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={hotelForm.hotel_check_in}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotel_check_in: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={hotelForm.hotel_check_out}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotel_check_out: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#082C43] block mb-1">
                      Special Hotel Inclusions & Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Honeymoon cake on arrival, twin bed configuration, late check-out requested."
                      value={hotelForm.special_instructions}
                      onChange={(e) => setHotelForm({ ...hotelForm, special_instructions: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save & Confirm Hotel'}
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 2: TRANSPORT */}
              {activeModalTab === 'transport' && (
                <form onSubmit={handleSaveTransport} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Assigned Vehicle Type *
                      </label>
                      <select
                        value={transportForm.vehicle_type}
                        onChange={(e) => setTransportForm({ ...transportForm, vehicle_type: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      >
                        <option value="Toyota Innova Crysta AC">Toyota Innova Crysta AC</option>
                        <option value="Toyota Alphard VIP AC">Toyota Alphard VIP AC</option>
                        <option value="Luxury Sedan (Mercedes/BMW)">Luxury Sedan (Mercedes/BMW)</option>
                        <option value="Tempo Traveller 12-Seater AC">Tempo Traveller 12-Seater AC</option>
                        <option value="Private AC Coach / Mini Bus">Private AC Coach / Mini Bus</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Driver / Chauffeur Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wayan Sudirta / Altaf Ahmed"
                        value={transportForm.driver_name}
                        onChange={(e) => setTransportForm({ ...transportForm, driver_name: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Driver Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 94190 12345"
                        value={transportForm.driver_phone}
                        onChange={(e) => setTransportForm({ ...transportForm, driver_phone: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Airport Arrival Gate No. 3"
                        value={transportForm.pickup_location}
                        onChange={(e) => setTransportForm({ ...transportForm, pickup_location: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Drop / Sightseeing Route
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Seminyak Resort / Dal Lake Ghat 7"
                        value={transportForm.drop_location}
                        onChange={(e) => setTransportForm({ ...transportForm, drop_location: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#082C43] block mb-1">
                        Local Guide / Tour Escort (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ketut Artha (+62 813-9876-5432)"
                        value={transportForm.guide_name}
                        onChange={(e) => setTransportForm({ ...transportForm, guide_name: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save & Allocate Transport'}
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 3: PIPELINE STATUS */}
              {activeModalTab === 'status' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>Advance the operational milestone for this tour:</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGenerateDossier}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 bg-[#FF795C]"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Compile Consolidated Travel Dossier</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {operationalStatuses.map((st) => {
                      const isCurrent = selectedBooking.operations?.trip_status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateTripStatus(st)}
                          disabled={isSubmitting}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-[#082C43] text-white border-[#082C43] shadow-xs'
                              : 'bg-white hover:bg-[#F8F1E7] text-[#082C43] border-[#EFE7DA]'
                          }`}
                        >
                          <span>{st}</span>
                          {isCurrent ? (
                            <CheckCircle2 className="w-4 h-4 text-[#55C9BD]" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: UPLOAD VOUCHERS */}
              {activeModalTab === 'documents' && (
                <form onSubmit={handleUploadVoucher} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#082C43] block mb-1">
                      Document Type
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    >
                      <option value="Hotel Voucher">Hotel Confirmation Voucher</option>
                      <option value="Transport Voucher">Vehicle & Driver Transport Pass</option>
                      <option value="Flight & Travel Ticket">Flight / Rail E-Ticket</option>
                      <option value="Activity Pass">Sightseeing / Excursion Entry Pass</option>
                      <option value="Booking Confirmation">Official Booking Confirmation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#082C43] block mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#082C43] block mb-1">
                      Notes for Traveler
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please present this voucher at hotel reception along with government ID."
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Uploading...' : 'Upload & Publish to Traveler'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
