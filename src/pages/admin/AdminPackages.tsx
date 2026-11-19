import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Eye, EyeOff, Image, CheckCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { Package, Destination } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminPackages: React.FC = () => {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    title: '',
    destination_id: '',
    category: 'Domestic Holiday Packages',
    duration_days: 5,
    duration_nights: 4,
    public_price: 35000,
    wholesale_price: 28000,
    cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: '',
    highlights: 'Luxury 4-star accommodation, Daily breakfast and dinner, Private AC transfers, Sightseeing passes',
    inclusions: 'Hotel stays, Daily meals, Private transport, Tolls & parking',
    exclusions: 'Airfare, Personal expenses, Travel insurance',
    accommodation: 'Handpicked 4-star boutique hotels',
    transportation: 'Private AC Toyota Innova / Sedan',
    is_featured: false,
    is_published: true,
    is_group_tour: false,
    available_seats: 20,
    upcoming_date: ''
  };

  const [formData, setFormData] = useState(initialForm);

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
    setFormData({
      ...initialForm,
      destination_id: destinations[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setFormData({
      title: pkg.title,
      destination_id: pkg.destination_id,
      category: pkg.category,
      duration_days: pkg.duration_days,
      duration_nights: pkg.duration_nights,
      public_price: pkg.public_price,
      wholesale_price: pkg.wholesale_price || Math.round(pkg.public_price * 0.8),
      cover_image: pkg.cover_image,
      description: pkg.description,
      highlights: (pkg.highlights || []).join(', '),
      inclusions: (pkg.inclusions || []).join(', '),
      exclusions: (pkg.exclusions || []).join(', '),
      accommodation: pkg.accommodation,
      transportation: pkg.transportation,
      is_featured: pkg.is_featured,
      is_published: pkg.is_published,
      is_group_tour: pkg.is_group_tour,
      available_seats: pkg.available_seats || 20,
      upcoming_date: pkg.upcoming_date || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination_id) {
      error('Title and destination are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        highlights: formData.highlights.split(',').map((s) => s.trim()).filter(Boolean),
        inclusions: formData.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
        exclusions: formData.exclusions.split(',').map((s) => s.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.updateAdminPackage(editingId, payload);
        success('Package updated successfully!');
      } else {
        await api.createAdminPackage(payload);
        success('New package published to website and agent marketplace!');
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
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.deleteAdminPackage(id);
      success('Package deleted.');
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

  return (
    <DashboardLayout
      title="Holiday Package Management"
      subtitle="Full CRUD catalog control, public retail rates, confidential B2B wholesale prices, and itineraries."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Package
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Published Tour Catalog ({packages.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Public Retail Price</th>
                  <th className="py-3 px-4">Agent Wholesale Price</th>
                  <th className="py-3 px-4">Margin</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {packages.map((pkg) => {
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
                          <div>
                            <strong className="text-[#082C43] block line-clamp-1">{pkg.title}</strong>
                            <span className="text-[11px] text-[#17648A]">{pkg.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {pkg.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {pkg.duration_days}D / {pkg.duration_nights}N
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                        ₹{pkg.public_price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#FF795C]">
                        ₹{wholesale.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        +₹{margin.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => togglePublished(pkg)}
                          className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full cursor-pointer ${
                            pkg.is_published
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {pkg.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {pkg.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(pkg)}
                            className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Package"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
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

      {/* Package Form Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Holiday Package' : 'Create & Publish New Package'}
          subtitle="Configure package content, multi-tier pricing, and inclusions."
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Package Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Rajasthan Heritage Odyssey"
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
                  <option value="Domestic Holiday Packages">Domestic Holiday Packages</option>
                  <option value="International Holiday Packages">International Holiday Packages</option>
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

            <div className="grid grid-cols-3 gap-3">
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
                <label className="font-bold text-[#082C43] block mb-1">Upcoming Date</label>
                <input
                  type="date"
                  value={formData.upcoming_date}
                  onChange={(e) => setFormData({ ...formData, upcoming_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
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
              <label className="font-bold text-[#082C43] block mb-1">Description</label>
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
                  checked={formData.is_group_tour}
                  onChange={(e) => setFormData({ ...formData, is_group_tour: e.target.checked })}
                  className="rounded text-[#55C9BD]"
                />
                Group Tour
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

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                {editingId ? 'Update Package' : 'Publish Package'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
