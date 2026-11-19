import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Users, DollarSign, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Lead, Quotation } from '../../types';

export const CustomerEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      const data = await api.getCustomerEnquiries();
      setEnquiries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Enquiries & Custom Quotations"
      subtitle="Track live consultation status, view personalized itinerary quotations, and approve bookings."
    >
      <div className="space-y-6">
        {enquiries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EFE7DA] p-8">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#082C43]">No Travel Enquiries Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ready to explore? Submit a custom vacation enquiry on any package.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((enq) => (
              <div
                key={enq.id}
                className="p-6 rounded-2xl bg-white border border-[#EFE7DA] shadow-xs hover:border-[#17648A]/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EFE7DA] gap-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-[#082C43]">
                      {enq.interested_destination}
                    </h3>
                    <StatusBadge status={enq.status} />
                  </div>
                  <span className="text-xs text-slate-400">
                    Requested on: {new Date(enq.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#173247]/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Travelers</span>
                    <strong className="text-[#082C43]">{enq.travelers_count} Guests</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tentative Date</span>
                    <strong className="text-[#082C43]">{enq.travel_date || 'Flexible'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget Expectation</span>
                    <strong className="text-[#082C43]">{enq.budget}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Specialist</span>
                    <strong className="text-[#17648A]">{enq.assigned_staff_name || 'Assigning Expert...'}</strong>
                  </div>
                </div>

                {enq.notes && (
                  <p className="text-xs text-slate-600 bg-[#F8F1E7]/50 p-3 rounded-xl border border-[#EFE7DA]">
                    <strong>Requirements:</strong> {enq.notes}
                  </p>
                )}

                {/* Received Quotations Section */}
                {enq.quotations && enq.quotations.length > 0 && (
                  <div className="pt-3 border-t border-[#EFE7DA]">
                    <span className="text-xs font-bold text-[#082C43] block mb-2">
                      Received Formal Quotations ({enq.quotations.length}):
                    </span>
                    <div className="space-y-2">
                      {enq.quotations.map((q: Quotation) => (
                        <div
                          key={q.id}
                          className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-950">
                                Quote #{q.quotation_number}
                              </span>
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                {q.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-800 block mt-0.5">
                              Final Negotiated Amount: <strong>₹{q.final_amount.toLocaleString('en-IN')}</strong> (Discount: ₹{q.discount.toLocaleString('en-IN')})
                            </span>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedQuote(q)}
                            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                          >
                            Review Quotation
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotation Detail Modal */}
      {selectedQuote && (
        <Modal
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          title={`Travel Quotation #${selectedQuote.quotation_number}`}
          subtitle={`Prepared for ${selectedQuote.customer_name} • Valid until ${selectedQuote.valid_until}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F1E7] border border-[#EFE7DA] space-y-2">
              <span className="font-bold text-[#082C43] block uppercase text-[10px] tracking-wider">
                Itemized Tour Costing
              </span>
              {selectedQuote.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[#173247]">
                  <span>{item.description}</span>
                  <span className="font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-[#EFE7DA] flex justify-between font-semibold text-slate-500">
                <span>Subtotal:</span>
                <span>₹{selectedQuote.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount:</span>
                <span>- ₹{selectedQuote.discount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-[#082C43]/20 flex justify-between font-extrabold text-sm text-[#082C43]">
                <span>Total Payable:</span>
                <span className="text-[#FF795C]">₹{selectedQuote.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedQuote.notes && (
              <p className="p-3 bg-white rounded-xl border border-[#EFE7DA] text-slate-600">
                <strong>Inclusions & Notes:</strong> {selectedQuote.notes}
              </p>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert('Thank you! Your acceptance has been notified to your travel consultant. We will call you for payment settlement.');
                  setSelectedQuote(null);
                }}
              >
                Accept & Confirm Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
