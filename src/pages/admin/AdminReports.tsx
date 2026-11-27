import React, { useState, useEffect } from 'react';
import { BarChart3, FileDown, Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common/Button';
import { api, getAuthToken } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminReports: React.FC = () => {
  const { success, error } = useToast();
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminReports();
      setReportsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async (type: 'leads' | 'bookings') => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/reports/export-csv?type=${type}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-genie-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      success(
        `Generated and downloaded ${type === 'leads' ? 'Leads & Enquiries' : 'Confirmed Bookings'} archive as CSV.`,
        { title: `${type === 'leads' ? 'Leads' : 'Bookings'} CSV Ready` }
      );
    } catch (err: any) {
      error(err.message || 'Export error');
    }
  };

  return (
    <DashboardLayout
      title="Reports & Business Analytics"
      subtitle="Performance benchmarks, consultant conversion rankings, B2B partner sales, and downloadable CSV audit archives."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV('leads')}
            leftIcon={<FileDown className="w-4 h-4 text-[#FF795C]" />}
          >
            Export Leads CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExportCSV('bookings')}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            Export Bookings CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Staff Performance Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              Travel Consultant Conversion Performance
            </h3>
            <span className="text-xs text-slate-400">Employee Benchmarking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Consultant Name</th>
                  <th className="py-3 px-4">Assigned Leads</th>
                  <th className="py-3 px-4">Converted Bookings</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4 text-right">Performance Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {(reportsData?.staffPerformance || []).map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#082C43]">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {s.assigned} Inquiries
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {s.converted} Trips Closed
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#17648A] bg-[#17648A]/10 px-2 py-0.5 rounded-full">
                        {s.rate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Rank #{idx + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Sales Volume Table */}
        <div className="bg-white rounded-2xl border border-[#EFE7DA] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE7DA] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#082C43] uppercase tracking-wider">
              B2B Travel Agent Wholesale Sales Rankings
            </h3>
            <span className="text-xs text-slate-400">Trade Partner Volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F1E7]/60 text-[#173247] uppercase font-bold border-b border-[#EFE7DA]">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Managing Agent</th>
                  <th className="py-3 px-4">Wholesale Packages Purchased</th>
                  <th className="py-3 px-4">Total Purchase Turnover</th>
                  <th className="py-3 px-4 text-right">Partner Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DA]">
                {(reportsData?.agentPerformance || []).map((ag: any) => (
                  <tr key={ag.id} className="hover:bg-[#F8F1E7]/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#082C43]">
                      {ag.company}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {ag.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#17648A]">
                      {ag.purchasesCount} Packages
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#FF795C]">
                      ₹{ag.totalVolume.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Tier 1 Consolidator
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
