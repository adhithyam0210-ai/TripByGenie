import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  ShieldCheck, 
  Percent, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export const AdminSettings: React.FC = () => {
  const { currentAgency, switchAgency, agencies } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    currency: 'INR',
    default_wholesale_discount_pct: 12,
    terms_conditions: ''
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/settings');
      if (data && data.agency) {
        setFormData({
          name: data.agency.name || '',
          tagline: data.agency.tagline || '',
          email: data.agency.email || '',
          phone: data.agency.phone || '',
          address: data.agency.address || '',
          currency: data.agency.currency || 'INR',
          default_wholesale_discount_pct: data.settings?.default_wholesale_discount_pct ?? 12,
          terms_conditions: data.settings?.terms_conditions || ''
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load agency settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentAgency?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/admin/settings', formData);
      showToast('Agency settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <div className="w-6 h-6 border-2 border-brand-coral border-t-transparent rounded-full animate-spin mr-3" />
        Loading agency configuration...
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Agency Settings & Branding"
      subtitle="Configure agency profile, multi-tenant isolation, default wholesale discounts, and customer terms."
    >
      <div className="space-y-6 max-w-5xl mx-auto">

      {/* Multi-Agency Tenant Status Card */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-ocean text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-turquoise" />
              <span className="text-xs uppercase font-semibold tracking-wider text-brand-turquoise">
                Multi-Tenant Architecture Active
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif">{currentAgency?.name}</h2>
            <p className="text-xs text-brand-cream/80">
              Tenant ID: <code className="bg-white/10 px-2 py-0.5 rounded">{currentAgency?.id}</code> | Slug: <code className="bg-white/10 px-2 py-0.5 rounded">{currentAgency?.slug}</code>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs space-y-1">
            <p className="font-semibold text-white">Agency Data Isolation Mode</p>
            <p className="text-brand-cream/80">Strict tenant segregation active. Staff & packages are scoped exclusively to this agency.</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Agency Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 className="w-5 h-5 text-brand-coral" />
            <h3 className="font-semibold text-brand-dark">Agency Profile & Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Agency Legal / Brand Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Brand Tagline / Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Official Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Support Phone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Office Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commercial & B2B Wholesale Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Percent className="w-5 h-5 text-brand-turquoise" />
            <h3 className="font-semibold text-brand-dark">B2B Agent Pricing & Currency Defaults</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default Wholesale Discount (%)</label>
              <div className="relative">
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={formData.default_wholesale_discount_pct}
                  onChange={(e) => setFormData({ ...formData, default_wholesale_discount_pct: Number(e.target.value) })}
                  className="w-full pr-9 pl-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Applied automatically to packages when calculating B2B agent net buy rate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Operational Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Default billing currency for invoices and payment gateways.</p>
            </div>
          </div>
        </div>

        {/* Legal Terms & Conditions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileText className="w-5 h-5 text-brand-navy" />
            <h3 className="font-semibold text-brand-dark">Customer Terms & Cancellation Policy</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Booking & Quotation Terms</label>
            <textarea
              rows={4}
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              placeholder="e.g. 25% non-refundable advance at booking time. Balance due 15 days before departure..."
              className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean font-mono text-xs"
            />
            <p className="text-xs text-gray-400 mt-1">Appended to staff PDF quotations and customer booking confirmations.</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" disabled={saving}>
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Agency Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </DashboardLayout>
  );
};
