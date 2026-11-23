import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  UserCheck,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AgentCustomer } from '../../types';

export const AgentCustomers: React.FC = () => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<AgentCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Client Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAgentCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      error('Client name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAgentCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        passport_number: passportNumber.trim(),
        notes: notes.trim()
      });

      success('End customer registered under your agency account!');
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassportNumber('');
      setNotes('');
      loadCustomers();
    } catch (err: any) {
      error(err.message || 'Failed to add client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      title="End-Customer & Passenger Directory"
      subtitle="Register and manage direct travel clients under your B2B partner agency account"
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Top Search & Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EFE7DA] shadow-xs">
          <span className="text-xs font-bold text-[#082C43] px-2">
            Registered Passengers ({customers.length})
          </span>
          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500">Loading client roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DA] shadow-xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#082C43]">No passengers registered yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Save your frequent travel clients here for one-click package assignment and voucher issuance.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                + Register First Client
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-[#EFE7DA] p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#082C43] leading-tight">
                        {c.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Added {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-[#F8F1E7]/40 p-3 rounded-xl border border-[#EFE7DA]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#17648A]" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#17648A]" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.passport_number && (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Passport: <strong>{c.passport_number}</strong></span>
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 italic">
                      "{c.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFE7DA] flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Active Client
                  </span>
                  <a
                    href={`tel:${c.phone}`}
                    className="text-[11px] font-bold text-[#17648A] hover:underline"
                  >
                    Contact Client
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Client Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register End Passenger / Client"
          size="md"
        >
          <form onSubmit={handleAddCustomer} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Client Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98200 44551"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#082C43] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ramesh.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Passport / ID Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Z9821456"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#082C43] block mb-1">
                Notes & Preferences
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Senior citizen travel preferences, prefers mountain destinations."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE7DA] bg-[#FFFDF8] focus:border-[#FF795C] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Save Passenger'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
