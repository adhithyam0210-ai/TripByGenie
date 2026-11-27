import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plane,
  Building,
  Car,
  Ticket,
  ShieldCheck,
  Search,
  Filter,
  X,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { TravelDocument } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getTodayIST } from '../../utils/dateValidation';

export const CustomerDocuments: React.FC = () => {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<TravelDocument | null>(null);

  // Upload Document Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'Customer-Provided' | 'Booking Confirmation' | 'Flight & Travel Ticket' | 'Hotel Voucher' | 'Transport Voucher' | 'Activity Pass'>('Customer-Provided');
  const [docTitle, setDocTitle] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [categoryFilter]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTravelDocuments({
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      error('Please provide a document title.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.uploadTravelDocument({
        title: docTitle.trim(),
        category: uploadCategory,
        expiry_date: docExpiry || undefined,
        notes: docNotes || undefined,
        file_name: `${docTitle.trim().replace(/\s+/g, '_')}.pdf`,
        file_size: '420 KB',
        file_type: 'application/pdf',
        file_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
      });

      success('Document submitted successfully! Our Operations team will verify it shortly.');
      setIsUploadModalOpen(false);
      setDocTitle('');
      setDocExpiry('');
      setDocNotes('');
      loadDocuments();
    } catch (err: any) {
      error(err.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Flight & Travel Ticket':
        return <Plane className="w-5 h-5 text-sky-500" />;
      case 'Hotel Voucher':
        return <Building className="w-5 h-5 text-indigo-500" />;
      case 'Transport Voucher':
        return <Car className="w-5 h-5 text-amber-500" />;
      case 'Activity Pass':
        return <Ticket className="w-5 h-5 text-rose-500" />;
      case 'Customer-Provided':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'Booking Confirmation':
      default:
        return <FileText className="w-5 h-5 text-[#55C9BD]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {status === 'verified' ? 'Verified' : 'Ready'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending Verification
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.file_name.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.notes && doc.notes.toLowerCase().includes(q))
    );
  });

  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'Booking Confirmation', label: 'Booking Vouchers' },
    { id: 'Flight & Travel Ticket', label: 'Flights & Rail' },
    { id: 'Hotel Voucher', label: 'Hotel Vouchers' },
    { id: 'Transport Voucher', label: 'Transfers & Cabs' },
    { id: 'Activity Pass', label: 'Activity Passes' },
    { id: 'Customer-Provided', label: 'My Uploaded IDs' }
  ];

  return (
    <DashboardLayout
      title="Digital Document Wallet"
      subtitle="Access official hotel vouchers, flight e-tickets, transport passes & manage travel IDs"
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Travel ID / Document</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Wallet Overview Banner */}
        <div className="bg-gradient-to-r from-[#082C43] via-[#17648A] to-[#082C43] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#55C9BD] text-xs font-bold mb-2 backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Travel Genie Traveler Vault</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Your Confirmed Travel Documents
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-2xl mt-1">
                All travel vouchers, boarding passes, hotel confirmations, and verified IDs are stored here securely. Download offline copies anytime prior to departure.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
              <div className="text-center">
                <span className="text-2xl font-bold text-[#FF795C]">{documents.length}</span>
                <span className="text-[11px] text-white/70 block uppercase font-semibold">Total Documents</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <span className="text-2xl font-bold text-[#55C9BD]">
                  {documents.filter((d) => d.status === 'available' || d.status === 'verified').length}
                </span>
                <span className="text-[11px] text-white/70 block uppercase font-semibold">Ready to Travel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EFE7DA] shadow-xs">
          {/* Scrollable categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === c.id
                    ? 'bg-[#082C43] text-white shadow-xs'
                    : 'text-[#082C43]/70 hover:text-[#082C43] hover:bg-[#F8F1E7]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#FF795C] border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading document vault...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DA] shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F1E7] text-[#17648A] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#082C43]">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : 'As your booking is confirmed and logistics are arranged by our Operations team, your hotel vouchers, transport details, and e-tickets will appear here.'}
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Travel Document
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const Icon = getCategoryIcon(doc.category);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-[#EFE7DA] p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Icon, Category & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-[#F8F1E7] group-hover:bg-[#FF0000]/10 transition-colors shrink-0">
                          {Icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#17648A] uppercase tracking-wider block">
                            {doc.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {doc.file_size || 'PDF'}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {/* Document Title */}
                    <h4 className="text-sm font-bold text-[#082C43] group-hover:text-[#FF0000] transition-colors leading-snug line-clamp-2">
                      {doc.title}
                    </h4>

                    {/* Notes / Description */}
                    {doc.notes && (
                      <p className="text-xs text-[#173247]/70 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}

                    {doc.expiry_date && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Valid until: <strong>{doc.expiry_date}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-[#EFE7DA] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg text-[#082C43] hover:bg-[#F8F1E7] transition-colors cursor-pointer"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#082C43] text-white hover:bg-[#FF0000] transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Document Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Travel Document / ID Proof"
          size="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Document Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              >
                <option value="Customer-Provided">Passport Copy / Visa / Photo ID</option>
                <option value="Booking Confirmation">Customer Travel Insurance</option>
                <option value="Flight & Travel Ticket">Flight Ticket (Self-Booked)</option>
                <option value="Activity Pass">Vaccination / Medical Certificate</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Passport Copy - Rohit Kulkarni"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              >
              </input>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Document Expiry Date (if applicable)
              </label>
              <input
                type="date"
                min={getTodayIST()}
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Select File (PDF, PNG, JPG - Max 10MB)
              </label>
              <div className="border-2 border-dashed border-[#EFE7DA] rounded-2xl p-6 text-center hover:bg-[#F8F1E7]/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-[#17648A] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#082C43]">Click to select file or drag and drop</p>
                <p className="text-[11px] text-slate-400 mt-0.5">High quality scanned PDF or image copy</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Notes for Operations Team (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Passport valid for 10 years, submitted for hotel registration."
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Uploading...' : 'Submit Document'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Preview Modal */}
        {previewDoc && (
          <Modal
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            title={previewDoc.title}
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-[#F8F1E7] p-3 rounded-xl border border-[#EFE7DA]">
                <div>
                  <span className="font-bold text-[#082C43] block">{previewDoc.file_name}</span>
                  <span className="text-slate-500">{previewDoc.category} • {previewDoc.file_size}</span>
                </div>
                {getStatusBadge(previewDoc.status)}
              </div>

              {/* Document Mock Viewer Container */}
              <div className="rounded-2xl border border-[#EFE7DA] bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-8 min-h-[320px] text-center relative">
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.title}
                  className="max-h-72 object-contain rounded-lg shadow-xl"
                />
              </div>

              {previewDoc.notes && (
                <div className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <strong>Notes:</strong> {previewDoc.notes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Uploaded by {previewDoc.uploaded_by_name} ({previewDoc.uploaded_by_role})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewDoc(null)}
                  >
                    Close
                  </Button>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF0000] text-white hover:opacity-90 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original</span>
                  </a>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
