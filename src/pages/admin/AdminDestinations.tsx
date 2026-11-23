import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Globe, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Destination } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminDestinations: React.FC = () => {
  const { success, error } = useToast();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region: 'India',
    description: '',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    is_featured: false,
    is_published: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminDestinations();
      setDestinations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      country: '',
      region: 'India',
      description: '',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      is_featured: false,
      is_published: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest: Destination) => {
    setEditingId(dest.id);
    setFormData({
      name: dest.name,
      country: dest.country,
      region: dest.region,
      description: dest.description,
      image: dest.image,
      is_featured: dest.is_featured,
      is_published: dest.is_published
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.country) {
      error('Name and country are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.updateAdminDestination(editingId, formData);
        success('Destination updated successfully!');
      } else {
        await api.createAdminDestination(formData);
        success('New destination created and published!');
      }
      setIsModalOpen(false);
      loadDestinations();
    } catch (err: any) {
      error(err.message || 'Failed to save destination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;
    try {
      await api.deleteAdminDestination(id);
      success('Destination deleted.');
      loadDestinations();
    } catch (err: any) {
      error(err.message || 'Failed to delete.');
    }
  };

  const togglePublished = async (dest: Destination) => {
    try {
      await api.updateAdminDestination(dest.id, { is_published: !dest.is_published });
      success(`Destination ${!dest.is_published ? 'published' : 'moved to draft'}.`);
      loadDestinations();
    } catch (err: any) {
      error(err.message || 'Failed to update publication status.');
    }
  };

  return (
    <DashboardLayout
      title="Destination Management"
      subtitle="Manage regional groupings, destination photography, descriptions, and regional filters."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Destination
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Destination Directory ({destinations.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Region Group</th>
                  <th className="py-3 px-4">Packages</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {destinations.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={d.image}
                          alt={d.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#EFE7DA]"
                        />
                        <div>
                          <strong className="text-[#082C43] block">{d.name}</strong>
                          <span className="text-[11px] text-slate-500">{d.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {d.country}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17648A]">
                      {d.region}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#082C43] whitespace-nowrap">
                      {d.package_count === 1 ? '1 Tour' : `${d.package_count ?? 0} Tours`}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => togglePublished(d)}
                        className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                          d.is_published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title="Click to toggle Published / Draft"
                      >
                        {d.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {d.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/destinations/${d.slug || d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-[#00A854] rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                          title="Preview Destination Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Edit Destination"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete Destination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Destination Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Destination' : 'Add Destination'}
          subtitle="Configure regional grouping and cover imagery."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Destination Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Switzerland"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Country *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Switzerland"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Region Category *</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              >
                <option value="India">India</option>
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="Middle East">Middle East</option>
                <option value="Island Destinations">Island Destinations</option>
                <option value="Africa">Africa</option>
                <option value="America">America</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Cover Image URL *</label>
              <input
                type="text"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Short Description</label>
              <textarea
                rows={3}
                placeholder="Overview of sights, culture, and travel allure..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
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
                Feature on Homepage
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#082C43]">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded text-[#082C43]"
                />
                Published
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Save Destination
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
