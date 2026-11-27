import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Printer,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';

export const AgentDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  useEffect(() => {
    loadB2BDocuments();
  }, []);

  const loadB2BDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getB2BDocuments();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.package_title.toLowerCase().includes(q) ||
      d.client_name.toLowerCase().includes(q) ||
      d.invoice_number.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      title="B2B Travel Partner Document Center"
      subtitle="Download wholesale tax invoices, white-labeled client travel vouchers & booking confirmations"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#082C43] via-[#17648A] to-[#082C43] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30">
              <Building2 className="w-4 h-4" />
              <span>B2B Commercial Travel Repository</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              Commercial Invoices & White-Label Vouchers
            </h2>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl mt-1">
              Access your official GST B2B invoices and unbranded / co-branded travel vouchers ready to deliver directly to your end customers.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center shrink-0">
            <span className="text-2xl font-bold text-amber-300">{documents.length}</span>
            <span className="text-[10px] text-white/70 block uppercase font-semibold">Available Invoices</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EFE7DA] shadow-xs">
          <span className="text-xs font-bold text-[#082C43] px-2">
            Order Invoices & Vouchers ({documents.length})
          </span>
          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client or invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-3xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">Loading B2B documents...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#082C43]">No B2B invoices found</h3>
              <p className="text-xs text-slate-400 mt-1">
                When you purchase wholesale packages from the marketplace, your official GST invoices and vouchers will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE7DA] bg-[#F8F1E7]/40 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">End Client / Passenger</th>
                    <th className="py-3 px-4">Wholesale Package</th>
                    <th className="py-3 px-4">Total Net B2B Cost</th>
                    <th className="py-3 px-4">Billing Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#17648A]">
                        {doc.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#082C43]">
                        {doc.client_name}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 max-w-[200px] truncate">
                        {doc.package_title}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#082C43]">
                        ₹{Number(doc.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(doc.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-[#082C43] hover:bg-[#F8F1E7] transition-colors cursor-pointer"
                            title="Preview Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={doc.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#082C43] text-white hover:bg-amber-600 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>GST Invoice</span>
                          </a>
                          <a
                            href={doc.voucher_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#17648A] text-white hover:bg-[#55C9BD] hover:text-[#082C43] transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Client Voucher</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Preview Modal */}
        {previewDoc && (
          <Modal
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            title={`B2B Commercial Tax Invoice — ${previewDoc.invoice_number}`}
            size="md"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8F1E7] border border-[#EFE7DA] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-bold text-[#082C43]">{previewDoc.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End Passenger:</span>
                  <span className="font-bold text-[#082C43]">{previewDoc.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesale Package:</span>
                  <span className="font-bold text-[#082C43]">{previewDoc.package_title}</span>
                </div>
                <div className="flex justify-between border-t border-[#EFE7DA] pt-2">
                  <span className="font-bold text-[#082C43]">Net B2B Payable (incl. GST):</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ₹{Number(previewDoc.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
                <a
                  href={previewDoc.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#082C43] text-white hover:bg-[#FF0000]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
