import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Compass, 
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  profile?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    emergency_contact?: string;
    preferred_currency?: string;
  };
  bookingsCount: number;
  enquiriesCount: number;
  totalSpent: number;
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const { showToast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/customers');
      setCustomers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.profile?.city && c.profile.city.toLowerCase().includes(q))
    );
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalBookingsAll = customers.reduce((sum, c) => sum + (c.bookingsCount || 0), 0);

  const exportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'City', 'Bookings Count', 'Enquiries Count', 'Total Spent (INR)', 'Status', 'Registered Date'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.profile?.city || ''}"`,
      c.bookingsCount,
      c.enquiriesCount,
      c.totalSpent,
      c.status,
      c.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory exported successfully!', 'success');
  };

  return (
    <DashboardLayout
      title="Customer Directory"
      subtitle="Manage your agency's direct clients, booking history, lifetime revenue, and traveler profiles."
      actions={
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          icon={<Users className="w-5 h-5 text-brand-navy" />} 
          subtitle="Registered travelers"
        />
        <StatCard 
          title="Active Travelers" 
          value={customers.filter(c => c.status === 'active').length} 
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} 
          subtitle="Ready to book"
        />
        <StatCard 
          title="Total Lifetime Spent" 
          value={`₹${totalSpentAll.toLocaleString('en-IN')}`} 
          icon={<CreditCard className="w-5 h-5 text-brand-coral" />} 
          subtitle="Across all bookings"
        />
        <StatCard 
          title="Avg Bookings / User" 
          value={customers.length > 0 ? (totalBookingsAll / customers.length).toFixed(1) : '0'} 
          icon={<Compass className="w-5 h-5 text-brand-turquoise" />} 
          subtitle="Customer retention"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ocean/20 focus:border-brand-ocean"
          />
        </div>
        <span className="text-xs text-gray-400 self-end md:self-center">
          Showing {filtered.length} of {customers.length} travelers
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-brand-cream/50 border-b border-gray-100 text-gray-500 font-medium">
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Enquiries</th>
                <th className="p-4 text-center">Bookings</th>
                <th className="p-4 text-right">Lifetime Spent</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-coral border-t-transparent animate-spin" />
                      Loading customer records...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-ivory/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy font-bold flex items-center justify-center">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-dark">{c.name}</p>
                          <p className="text-xs text-gray-400">ID: {c.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.profile?.city || 'Not specified'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {c.enquiriesCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {c.bookingsCount}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-brand-dark">
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(c)}
                        className="text-brand-ocean hover:text-brand-navy"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-navy text-white text-lg font-bold flex items-center justify-center">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-brand-dark">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-500">Registered {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Lifetime stats */}
              <div className="grid grid-cols-3 gap-2 bg-brand-cream/40 p-4 rounded-xl border border-brand-cream text-center">
                <div>
                  <p className="text-xs text-gray-500">Enquiries</p>
                  <p className="text-lg font-bold text-brand-navy">{selectedCustomer.enquiriesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedCustomer.bookingsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lifetime Spent</p>
                  <p className="text-lg font-bold text-brand-coral">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Email Address</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Phone Number</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">City / State</p>
                    <p className="font-medium text-brand-dark mt-0.5">
                      {selectedCustomer.profile?.city ? `${selectedCustomer.profile.city}, ${selectedCustomer.profile.state || 'India'}` : 'Not provided'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400">Preferred Currency</p>
                    <p className="font-medium text-brand-dark mt-0.5">{selectedCustomer.profile?.preferred_currency || 'INR (₹)'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedCustomer.profile?.emergency_contact && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                  <p className="text-xs font-semibold text-amber-800 uppercase">Emergency Contact</p>
                  <p className="text-amber-900 mt-0.5">{selectedCustomer.profile.emergency_contact}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    window.location.href = `mailto:${selectedCustomer.email}`;
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};
