import React, { useState, useEffect } from 'react';
import { Image, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Video, Film, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { HeroBanner } from '../../types';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export const computeAutoCtaLink = (title?: string, ctaText?: string): string => {
  const combined = `${ctaText || ''} ${title || ''}`.toLowerCase().trim();
  
  if (combined.includes('honeymoon') || combined.includes('romantic') || combined.includes('couples')) {
    return '/honeymoon';
  }
  if (combined.includes('international') || combined.includes('swiss') || combined.includes('europe') || combined.includes('paris') || combined.includes('globe') || combined.includes('worldwide')) {
    return '/packages?category=International%20Holiday%20Packages';
  }
  if (combined.includes('south india') || combined.includes('kerala') || combined.includes('munnar') || combined.includes('alleppey') || combined.includes('wayanad')) {
    return '/packages?category=South%20India%20Holidays';
  }
  if (combined.includes('group') || combined.includes('fixed departure') || combined.includes('family tour')) {
    return '/group-tours';
  }
  if (combined.includes('mice') || combined.includes('corporate') || combined.includes('conference') || combined.includes('summit') || combined.includes('event')) {
    return '/mice';
  }
  if (combined.includes('destination') || combined.includes('places') || combined.includes('discover') || combined.includes('cities')) {
    return '/destinations';
  }
  if (combined.includes('service') || combined.includes('visa') || combined.includes('flight') || combined.includes('insurance')) {
    return '/services';
  }
  if (combined.includes('contact') || combined.includes('inquire') || combined.includes('enquiry') || combined.includes('touch') || combined.includes('reach')) {
    return '/contact';
  }
  if (combined.includes('about') || combined.includes('who we are') || combined.includes('story')) {
    return '/about';
  }
  return '/packages';
};

export const AdminBanners: React.FC = () => {
  const { success, error } = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<'image' | 'video'>('image');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_desktop: '',
    image_mobile: '',
    video_url: '',
    cta_text: 'Explore Packages',
    cta_link: '/packages',
    display_order: 1,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminBanners();
      setBanners(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setMediaMode('image');
    setFormData({
      title: '',
      subtitle: '',
      image_desktop: '',
      image_mobile: '',
      video_url: '',
      cta_text: 'Explore Packages',
      cta_link: '/packages',
      display_order: banners.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: HeroBanner) => {
    setEditingId(b.id);
    setMediaMode(b.video_url ? 'video' : 'image');
    setFormData({
      title: b.title,
      subtitle: b.subtitle,
      image_desktop: b.image_desktop || '',
      image_mobile: b.image_mobile || b.image_desktop || '',
      video_url: b.video_url || '',
      cta_text: b.cta_text,
      cta_link: b.cta_link || computeAutoCtaLink(b.title, b.cta_text),
      display_order: b.display_order,
      is_active: b.is_active
    });
    setIsModalOpen(true);
  };

  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    try {
      const res = await api.uploadFile(file);
      setFormData(prev => ({
        ...prev,
        image_desktop: res.url,
        image_mobile: prev.image_mobile || res.url
      }));
      success(`Image "${file.name}" uploaded successfully!`);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({
          ...prev,
          image_desktop: result,
          image_mobile: prev.image_mobile || result
        }));
        success(`Image "${file.name}" loaded!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocalVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      error('Please select a valid video file (MP4, WebM).');
      return;
    }

    try {
      const res = await api.uploadFile(file);
      setFormData(prev => ({
        ...prev,
        video_url: res.url
      }));
      success(`Video "${file.name}" uploaded successfully!`);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({
          ...prev,
          video_url: result
        }));
        success(`Video "${file.name}" loaded!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanQuotes = (s?: string) => (s || '').trim().replace(/^["']|["']$/g, '').trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      error('Banner heading is required.');
      return;
    }

    const finalCtaLink = computeAutoCtaLink(formData.title, formData.cta_text);
    const payload = {
      ...formData,
      cta_link: finalCtaLink,
      image_desktop: cleanQuotes(formData.image_desktop),
      image_mobile: cleanQuotes(formData.image_mobile),
      video_url: cleanQuotes(formData.video_url)
    };

    const hasImage = !!payload.image_desktop;
    const hasVideo = !!payload.video_url;

    if (!hasImage && !hasVideo) {
      error('Please either upload an image from local storage or paste a video URL. Either one is required to create a banner.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.updateAdminBanner(editingId, payload);
        success('Hero banner updated! Live on public website.');
      } else {
        await api.createAdminBanner(payload);
        success('New hero banner created and activated!');
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      error(err.message || 'Failed to save banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero banner?')) return;
    try {
      await api.deleteAdminBanner(id);
      success('Banner deleted.');
      loadBanners();
    } catch (err: any) {
      error(err.message || 'Failed to delete banner.');
    }
  };

  const toggleActive = async (b: HeroBanner) => {
    try {
      await api.updateAdminBanner(b.id, { is_active: !b.is_active });
      success(`Banner ${!b.is_active ? 'activated' : 'deactivated'}.`);
      loadBanners();
    } catch (err: any) {
      error(err.message || 'Failed to toggle banner status.');
    }
  };

  return (
    <DashboardLayout
      title="Hero Banner Management"
      subtitle="Control homepage cinematic slider images, headlines, buttons, and display priority."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Hero Banner
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA]">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Homepage Hero Slides ({banners.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Banner Heading</th>
                  <th className="py-3 px-4">CTA Button</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-[#082C43]">
                      #{b.display_order}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.video_url ? (
                        <div className="relative w-20 h-10 rounded-lg overflow-hidden border border-[#EFE7DA] bg-black">
                          {b.image_desktop ? (
                            <img src={resolveMediaUrl(b.image_desktop)} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <video src={resolveMediaUrl(b.video_url)} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 bg-[#FF795C] text-white text-[9px] font-bold px-1 rounded shadow-xs">Video</span>
                        </div>
                      ) : (
                        <img
                          src={resolveMediaUrl(b.image_desktop) || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'}
                          alt={b.title}
                          className="w-20 h-10 rounded-lg object-cover border border-[#EFE7DA]"
                        />
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-[#082C43] block line-clamp-1">{b.title}</strong>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{b.subtitle}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#17648A]">{b.cta_text}</span>
                      <span className="text-[10px] text-slate-400 block">{b.cta_link}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleActive(b)}
                        className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full cursor-pointer ${
                          b.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {b.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {b.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-500 hover:text-[#082C43] rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
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

      {/* Banner Form Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Hero Banner' : 'Create Hero Banner'}
          subtitle="Configure high-impact homepage photographic slides."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#082C43] block mb-1">Banner Heading *</label>
              <input
                type="text"
                required
                placeholder="e.g. Experience Unforgettable Journeys Across The Globe"
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    title: newTitle,
                    cta_link: computeAutoCtaLink(newTitle, prev.cta_text)
                  }));
                }}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
              />
            </div>

            <div>
              <label className="font-bold text-[#082C43] block mb-1">Supporting Description</label>
              <textarea
                rows={2}
                placeholder="Short tagline or value proposition..."
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] resize-none"
              />
            </div>

            {/* Media Asset Configuration: Local Image Upload OR Video URL */}
            <div className="bg-[#F8F1E7]/50 p-4 rounded-2xl border border-[#EFE7DA] space-y-3">
              <div className="flex items-center justify-between border-b border-[#EFE7DA] pb-2.5">
                <div>
                  <span className="font-bold text-[#082C43] text-xs block">Hero Banner Media *</span>
                  <span className="text-[11px] text-gray-500">
                    Either an image or video is necessary (not both).
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EFE7DA]">
                  <button
                    type="button"
                    onClick={() => setMediaMode('image')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      mediaMode === 'image'
                        ? 'bg-[#004c8f] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaMode('video')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      mediaMode === 'video'
                        ? 'bg-[#004c8f] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video URL</span>
                  </button>
                </div>
              </div>

              {/* OPTION 1: IMAGE (Local Storage Upload or URL) */}
              {mediaMode === 'image' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="font-semibold text-[#082C43] block mb-1">
                      Upload from Local Storage (Computer)
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#FF795C]/40 hover:border-[#FF795C] rounded-2xl bg-white hover:bg-[#FF795C]/5 transition-all group">
                      <Upload className="w-6 h-6 text-[#FF795C] group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-bold text-[#082C43]">
                        Click to browse local files from your storage
                      </span>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        PNG, JPG, JPEG, WEBP files supported
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">
                      Or Paste Desktop Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... (optional if uploading from local storage)"
                      value={formData.image_desktop}
                      onChange={(e) => setFormData({ ...formData, image_desktop: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-white text-xs"
                    />
                  </div>

                  {formData.image_desktop && (
                    <div className="relative rounded-xl overflow-hidden border border-[#EFE7DA] bg-black max-h-40">
                      <img
                        src={resolveMediaUrl(formData.image_desktop)}
                        alt="Preview"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_desktop: '' })}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">
                      Mobile Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to use desktop image"
                      value={formData.image_mobile}
                      onChange={(e) => setFormData({ ...formData, image_mobile: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#EFE7DA] bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* OPTION 2: VIDEO (Paste URL or Pick Local Video File) */}
              {mediaMode === 'video' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="font-semibold text-[#082C43] block mb-1">
                      Background Video URL (MP4 / WebM) *
                    </label>
                    <input
                      type="text"
                      placeholder="https://assets.mixkit.co/.../video.mp4"
                      value={formData.video_url || ''}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-white text-xs"
                    />
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Video will play automatically on the hero banner. <strong>No image upload required</strong> when video URL is provided.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">
                      Or Choose Local Video File from Computer:
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#EFE7DA] bg-white hover:bg-gray-50 text-xs font-semibold text-[#082C43]">
                      <Upload className="w-4 h-4 text-[#55C9BD]" />
                      <span>Select local MP4 / WebM video file</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={handleLocalVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Video Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
                      Or Click to Pick a Curated 4K Travel Video Preset:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Bali Surfing (Local Video)', url: '/videos/bali-surfing.mp4' },
                        { name: 'Maldives Overwater Resort', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-luxury-resort-in-the-maldives-42777-large.mp4' },
                        { name: 'Scenic Mountain Slope', url: 'https://assets.mixkit.co/videos/preview/mixkit-curved-road-on-a-mountain-slope-42776-large.mp4' },
                        { name: 'Turquoise Ocean Waves', url: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-turquoise-water-43224-large.mp4' },
                        { name: 'Serene River & Palms', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-drone-shot-of-a-winding-river-42778-large.mp4' }
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setFormData({ ...formData, video_url: preset.url })}
                          className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                            formData.video_url === preset.url
                              ? 'border-[#FF795C] bg-[#FF795C]/10 font-bold text-[#082C43]'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.video_url && (
                    <div className="relative rounded-xl overflow-hidden border border-[#EFE7DA] bg-black max-h-40">
                      <video
                        src={resolveMediaUrl(formData.video_url)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, video_url: '' })}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        title="Remove Video"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#082C43] block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Explore Packages"
                  value={formData.cta_text}
                  onChange={(e) => {
                    const newCta = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      cta_text: newCta,
                      cta_link: computeAutoCtaLink(prev.title, newCta)
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Auto Destination: <strong className="text-[#17648A]">{formData.cta_link || computeAutoCtaLink(formData.title, formData.cta_text)}</strong> (automatically routed)
                </span>
              </div>
              <div>
                <label className="font-bold text-[#082C43] block mb-1">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Priority sequence in the cinematic homepage slider.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#082C43]">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#FF795C]"
                />
                Active on Homepage
              </label>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  Save Banner
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
