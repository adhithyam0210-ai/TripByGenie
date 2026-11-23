import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { SupportTicket } from '../../types';
import { useToast } from '../../context/ToastContext';

export const CustomerSupport: React.FC = () => {
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // New Ticket Modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<any>('General Enquiry');
  const [priority, setPriority] = useState<any>('medium');
  const [initialMessage, setInitialMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSupportTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      error('Please fill in both subject and description.');
      return;
    }

    setIsCreatingTicket(true);
    try {
      const newTicket = await api.createSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        message: initialMessage.trim()
      });

      success(`Ticket #${newTicket.ticket_number} created successfully! Our operations desk is reviewing it.`);
      setIsNewTicketOpen(false);
      setSubject('');
      setInitialMessage('');
      loadTickets();
      setSelectedTicket(newTicket);
    } catch (err: any) {
      error(err.message || 'Failed to create ticket.');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const updated = await api.replySupportTicket(selectedTicket.id, replyText.trim());
      success('Reply sent!');
      setReplyText('');
      setSelectedTicket(updated);
      loadTickets();
    } catch (err: any) {
      error(err.message || 'Failed to send reply.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Open
          </span>
        );
    }
  };

  return (
    <DashboardLayout
      title="Customer Support Desk"
      subtitle="Submit requests, ask about bookings, request itinerary adjustments & track live replies"
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Ticket List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-[#EFE7DA] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17648A]">
                My Support Inquiries ({tickets.length})
              </span>
              <span className="text-[11px] text-slate-400">24/7 Concierge Support</span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#FF795C] border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400">Loading tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 px-4">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#082C43]">No active tickets</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Have a question about your upcoming flight or need itinerary changes? Click Raise Support Ticket above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#17648A] bg-[#17648A]/5 shadow-xs ring-1 ring-[#17648A]/30'
                          : 'border-[#EFE7DA] bg-white hover:bg-[#F8F1E7]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-[#17648A]">
                          {t.ticket_number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(t.priority)}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[#082C43] truncate mb-1">
                        {t.subject}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>{t.category}</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Chat & Discussion Column */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white rounded-3xl border border-[#EFE7DA] shadow-xs flex flex-col h-full min-h-[520px]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-[#EFE7DA] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#17648A] px-2 py-0.5 rounded-md bg-[#17648A]/10">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-xs text-slate-400">• {selectedTicket.category}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#082C43]">
                    {selectedTicket.subject}
                  </h3>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Assigned to: <strong>{selectedTicket.assigned_to || 'Operations Desk'}</strong>
                  </span>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[380px] bg-[#F8F1E7]/20">
                {selectedTicket.messages && selectedTicket.messages.map((m) => {
                  const isCustomer = m.sender_role === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        <span>{m.sender_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          isCustomer
                            ? 'bg-[#082C43] text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-[#082C43] rounded-tl-xs border border-[#EFE7DA] shadow-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendReply} className="p-3.5 sm:p-4 border-t border-[#EFE7DA] bg-white rounded-b-3xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your response or question..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 px-4"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EFE7DA] p-12 text-center h-full flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-[#082C43]">Select a conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a ticket from the list or create a new inquiry to get in touch with our operations team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Support Ticket Modal */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Raise a Support Request"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              <option value="General Enquiry">General Trip Enquiry</option>
              <option value="Booking Modification">Itinerary / Date Modification</option>
              <option value="Payment & Refund">Payment & Receipts</option>
              <option value="On-Trip Support">On-Trip Urgent Assistance</option>
              <option value="Document Issue">Vouchers & Document Issue</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            >
              <option value="low">Low (General Query)</option>
              <option value="medium">Medium (Requires attention in 24 hrs)</option>
              <option value="high">High (Upcoming departure in next 3 days)</option>
              <option value="urgent">Urgent (Immediate assistance required)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Request to change flight seats or meal preferences"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#082C43] block mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please provide full details of your request so our operations desk can coordinate immediately..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsNewTicketOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isCreatingTicket}
            >
              {isCreatingTicket ? 'Submitting...' : 'Submit Support Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
