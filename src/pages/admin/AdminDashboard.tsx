import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  IndianRupee,
  Plane,
  TrendingUp,
  BarChart2,
  Globe2,
  Zap,
  Clock,
  CalendarCheck,
  CreditCard,
  FileText,
  ShieldCheck,
  LayoutGrid,
  Trophy,
  Calendar,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  User,
  Check
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mini Sparkline SVG component for KPI cards
const Sparkline: React.FC<{ color: string; id: string }> = ({ color, id }) => {
  return (
    <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28" fill="none">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M0 20 C15 14, 25 24, 40 12 C55 0, 65 18, 80 6"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M0 20 C15 14, 25 24, 40 12 C55 0, 65 18, 80 6 L80 28 L0 28 Z"
        fill={`url(#spark-${id})`}
      />
    </svg>
  );
};

type DateRangeOption = 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'This Year';

export const AdminDashboard: React.FC = () => {
  const { agency, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangeOption>('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'This Month' | 'Last Month' | 'This Year'>('Last Month');
  const [chartOverride, setChartOverride] = useState<'This Month' | 'Last Month' | 'This Year' | null>(null);

  // Close date dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.date-range-dropdown')) {
        setIsDateDropdownOpen(false);
      }
    };
    if (isDateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDateDropdownOpen]);

  useEffect(() => {
    loadDashboard();
  }, [agency?.id]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive Date Range Reactive Data Model
  const metricsDataMap: Record<DateRangeOption, {
    totalBookings: string;
    bookingsGrowth: string;
    totalCustomers: string;
    customersGrowth: string;
    totalRevenue: string;
    revenueGrowth: string;
    upcomingDepartures: string | number;
    departuresGrowth: string;
    comparisonText: string;
    departuresComparison: string;
    businessGrowth: string;
    growthComparison: string;
    conversionRateText: string;
    conversionTrend: string;
    chart: {
      dates: string[];
      bluePath: string;
      purplePath: string;
      pinBooking: { x: number; y: number; badge: string };
      pinRevenue: { x: number; y: number; badge: string };
      badgeTopBooking: string;
      badgeTopRevenue: string;
    };
    destinations: Array<{
      id: number;
      name: string;
      bookings: number;
      pct: number;
      color: string;
      image: string;
    }>;
    bookingStatus: {
      total: string;
      confirmed: number;
      pending: number;
      cancelled: number;
      others: number;
      confirmedDash: string;
      pendingDash: string;
      cancelledDash: string;
      othersDash: string;
    };
    teamOverview: {
      staff: number;
      staffTrend: string;
      managers: number;
      managersTrend: string;
      agents: number;
      agentsTrend: string;
      others: number;
      othersTrend: string;
    };
  }> = {
    'Last 7 Days': {
      totalBookings: '312',
      bookingsGrowth: '↑ 9.4%',
      totalCustomers: '890',
      customersGrowth: '↑ 5.2%',
      totalRevenue: '₹11,40,000',
      revenueGrowth: '↑ 11.8%',
      upcomingDepartures: 24,
      departuresGrowth: '↑ 4.2%',
      comparisonText: 'vs prev 7 days',
      departuresComparison: 'this week',
      businessGrowth: '+14.2%',
      growthComparison: 'Compared to previous 7 days',
      conversionRateText: 'Your conversion rate is 71% this week',
      conversionTrend: '↑ 3.8%',
      chart: {
        dates: ['Nov 17', 'Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23'],
        bluePath: 'M 50 155 C 110 135, 170 145, 230 115 C 290 90, 350 110, 420 80 C 460 65, 480 70, 500 72',
        purplePath: 'M 50 170 C 110 155, 170 148, 230 155 C 290 165, 350 140, 420 130 C 460 122, 480 118, 500 115',
        pinBooking: { x: 500, y: 72, badge: '312' },
        pinRevenue: { x: 500, y: 115, badge: '₹11.4L' },
        badgeTopBooking: '32%',
        badgeTopRevenue: '54%'
      },
      destinations: [
        { id: 1, name: 'Dubai', bookings: 110, pct: 28.2, color: 'bg-blue-600', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=120&q=80' },
        { id: 2, name: 'Bali', bookings: 95, pct: 24.4, color: 'bg-purple-600', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=120&q=80' },
        { id: 3, name: 'Europe', bookings: 82, pct: 21.0, color: 'bg-emerald-500', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=120&q=80' },
        { id: 4, name: 'Thailand', bookings: 60, pct: 15.4, color: 'bg-amber-500', image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=120&q=80' },
        { id: 5, name: 'Singapore', bookings: 43, pct: 11.0, color: 'bg-teal-500', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=120&q=80' }
      ],
      bookingStatus: {
        total: '312',
        confirmed: 65,
        pending: 15,
        cancelled: 12,
        others: 8,
        confirmedDash: '155 238.76',
        pendingDash: '36 238.76',
        cancelledDash: '28 238.76',
        othersDash: '19 238.76'
      },
      teamOverview: {
        staff: 48,
        staffTrend: '↑ 4%',
        managers: 8,
        managersTrend: '↑ 0%',
        agents: 32,
        agentsTrend: '↑ 8%',
        others: 24,
        othersTrend: '↑ 2%'
      }
    },
    'Last 30 Days': {
      totalBookings: '1,248',
      bookingsGrowth: '↑ 12.5%',
      totalCustomers: '3,560',
      customersGrowth: '↑ 8.7%',
      totalRevenue: '₹42,50,000',
      revenueGrowth: '↑ 15.2%',
      upcomingDepartures: 86,
      departuresGrowth: '↑ 6.1%',
      comparisonText: 'vs last month',
      departuresComparison: 'this month',
      businessGrowth: '+18.7%',
      growthComparison: 'Compared to last month',
      conversionRateText: 'Your conversion rate is 68% this month',
      conversionTrend: '↑ 5.2%',
      chart: {
        dates: ['Aug 1', 'Aug 7', 'Aug 14', 'Aug 21', 'Aug 30'],
        bluePath: 'M 50 135 C 110 110, 160 125, 230 100 C 300 80, 360 95, 420 70 C 460 55, 480 58, 500 62',
        purplePath: 'M 50 160 C 110 145, 160 135, 230 145 C 300 155, 360 130, 420 120 C 460 115, 480 110, 500 105',
        pinBooking: { x: 500, y: 62, badge: '1,248' },
        pinRevenue: { x: 500, y: 105, badge: '₹42.5L' },
        badgeTopBooking: '28%',
        badgeTopRevenue: '48%'
      },
      destinations: [
        { id: 1, name: 'Dubai', bookings: 420, pct: 25.9, color: 'bg-blue-600', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=120&q=80' },
        { id: 2, name: 'Bali', bookings: 380, pct: 23.0, color: 'bg-purple-600', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=120&q=80' },
        { id: 3, name: 'Europe', bookings: 340, pct: 20.6, color: 'bg-emerald-500', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=120&q=80' },
        { id: 4, name: 'Thailand', bookings: 310, pct: 18.8, color: 'bg-amber-500', image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=120&q=80' },
        { id: 5, name: 'Singapore', bookings: 280, pct: 17.0, color: 'bg-teal-500', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=120&q=80' }
      ],
      bookingStatus: {
        total: '1,248',
        confirmed: 62,
        pending: 18,
        cancelled: 12,
        others: 8,
        confirmedDash: '148 238.76',
        pendingDash: '43 238.76',
        cancelledDash: '28 238.76',
        othersDash: '19 238.76'
      },
      teamOverview: {
        staff: 48,
        staffTrend: '↑ 6%',
        managers: 8,
        managersTrend: '↑ 0%',
        agents: 32,
        agentsTrend: '↑ 12%',
        others: 24,
        othersTrend: '↑ 4%'
      }
    },
    'This Month': {
      totalBookings: '1,085',
      bookingsGrowth: '↑ 14.1%',
      totalCustomers: '3,120',
      customersGrowth: '↑ 10.3%',
      totalRevenue: '₹38,20,000',
      revenueGrowth: '↑ 16.4%',
      upcomingDepartures: 74,
      departuresGrowth: '↑ 7.5%',
      comparisonText: 'vs prev month',
      departuresComparison: 'this month',
      businessGrowth: '+19.5%',
      growthComparison: 'Compared to previous month',
      conversionRateText: 'Your conversion rate is 69% this month',
      conversionTrend: '↑ 4.8%',
      chart: {
        dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
        bluePath: 'M 50 145 C 115 120, 175 130, 240 105 C 310 85, 370 98, 430 75 C 470 60, 485 64, 500 68',
        purplePath: 'M 50 165 C 115 150, 175 140, 240 148 C 310 158, 370 135, 430 125 C 470 118, 485 112, 500 108',
        pinBooking: { x: 500, y: 68, badge: '1,085' },
        pinRevenue: { x: 500, y: 108, badge: '₹38.2L' },
        badgeTopBooking: '30%',
        badgeTopRevenue: '50%'
      },
      destinations: [
        { id: 1, name: 'Dubai', bookings: 365, pct: 26.4, color: 'bg-blue-600', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=120&q=80' },
        { id: 2, name: 'Bali', bookings: 330, pct: 23.8, color: 'bg-purple-600', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=120&q=80' },
        { id: 3, name: 'Europe', bookings: 295, pct: 21.3, color: 'bg-emerald-500', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=120&q=80' },
        { id: 4, name: 'Thailand', bookings: 245, pct: 17.7, color: 'bg-amber-500', image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=120&q=80' },
        { id: 5, name: 'Singapore', bookings: 150, pct: 10.8, color: 'bg-teal-500', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=120&q=80' }
      ],
      bookingStatus: {
        total: '1,085',
        confirmed: 64,
        pending: 16,
        cancelled: 11,
        others: 9,
        confirmedDash: '152 238.76',
        pendingDash: '38 238.76',
        cancelledDash: '26 238.76',
        othersDash: '22 238.76'
      },
      teamOverview: {
        staff: 48,
        staffTrend: '↑ 6%',
        managers: 8,
        managersTrend: '↑ 0%',
        agents: 32,
        agentsTrend: '↑ 12%',
        others: 24,
        othersTrend: '↑ 4%'
      }
    },
    'This Year': {
      totalBookings: '14,860',
      bookingsGrowth: '↑ 28.4%',
      totalCustomers: '42,300',
      customersGrowth: '↑ 22.1%',
      totalRevenue: '₹5,18,00,000',
      revenueGrowth: '↑ 31.6%',
      upcomingDepartures: 430,
      departuresGrowth: '↑ 18.2%',
      comparisonText: 'vs last year',
      departuresComparison: 'full year',
      businessGrowth: '+31.6%',
      growthComparison: 'Compared to last year',
      conversionRateText: 'Your conversion rate is 72% full year',
      conversionTrend: '↑ 8.4%',
      chart: {
        dates: ['Q1 Jan-Mar', 'Q2 Apr-Jun', 'Q3 Jul-Sep', 'Q4 Oct-Dec', 'Full Year'],
        bluePath: 'M 50 155 C 120 135, 180 115, 250 95 C 320 75, 380 60, 440 45 C 475 38, 490 35, 500 32',
        purplePath: 'M 50 170 C 120 155, 180 138, 250 120 C 320 100, 380 85, 440 70 C 475 62, 490 58, 500 55',
        pinBooking: { x: 500, y: 32, badge: '14.8K' },
        pinRevenue: { x: 500, y: 55, badge: '₹5.18Cr' },
        badgeTopBooking: '14%',
        badgeTopRevenue: '24%'
      },
      destinations: [
        { id: 1, name: 'Dubai', bookings: 4920, pct: 27.2, color: 'bg-blue-600', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=120&q=80' },
        { id: 2, name: 'Bali', bookings: 4210, pct: 23.3, color: 'bg-purple-600', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=120&q=80' },
        { id: 3, name: 'Europe', bookings: 3850, pct: 21.3, color: 'bg-emerald-500', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=120&q=80' },
        { id: 4, name: 'Thailand', bookings: 3110, pct: 17.2, color: 'bg-amber-500', image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=120&q=80' },
        { id: 5, name: 'Singapore', bookings: 1980, pct: 11.0, color: 'bg-teal-500', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=120&q=80' }
      ],
      bookingStatus: {
        total: '14,860',
        confirmed: 68,
        pending: 14,
        cancelled: 10,
        others: 8,
        confirmedDash: '162 238.76',
        pendingDash: '33 238.76',
        cancelledDash: '24 238.76',
        othersDash: '19 238.76'
      },
      teamOverview: {
        staff: 48,
        staffTrend: '↑ 14%',
        managers: 8,
        managersTrend: '↑ 25%',
        agents: 32,
        agentsTrend: '↑ 33%',
        others: 24,
        othersTrend: '↑ 20%'
      }
    }
  };

  // Current reactive metrics based on selected dateRange
  const currentMetrics = metricsDataMap[dateRange];

  // Dedicated chart data for Booking Analytics toggle buttons
  const analyticsChartData: Record<'This Month' | 'Last Month' | 'This Year', {
    dates: string[];
    bluePath: string;
    purplePath: string;
    pinBooking: { x: number; y: number; badge: string };
    pinRevenue: { x: number; y: number; badge: string };
    badgeTopBooking: string;
    badgeTopRevenue: string;
  }> = {
    'This Month': {
      dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
      bluePath: 'M 50 145 C 115 120, 175 130, 240 105 C 310 85, 370 98, 430 75 C 470 60, 485 64, 500 68',
      purplePath: 'M 50 165 C 115 150, 175 140, 240 148 C 310 158, 370 135, 430 125 C 470 118, 485 112, 500 108',
      pinBooking: { x: 500, y: 68, badge: '1,085' },
      pinRevenue: { x: 500, y: 108, badge: '₹38.2L' },
      badgeTopBooking: '30%',
      badgeTopRevenue: '50%'
    },
    'Last Month': {
      dates: ['Aug 1', 'Aug 7', 'Aug 14', 'Aug 21', 'Aug 30'],
      bluePath: 'M 50 135 C 110 110, 160 125, 230 100 C 300 80, 360 95, 420 70 C 460 55, 480 58, 500 62',
      purplePath: 'M 50 160 C 110 145, 160 135, 230 145 C 300 155, 360 130, 420 120 C 460 115, 480 110, 500 105',
      pinBooking: { x: 500, y: 62, badge: '1,248' },
      pinRevenue: { x: 500, y: 105, badge: '₹42.5L' },
      badgeTopBooking: '28%',
      badgeTopRevenue: '48%'
    },
    'This Year': {
      dates: ['Q1 Jan-Mar', 'Q2 Apr-Jun', 'Q3 Jul-Sep', 'Q4 Oct-Dec', 'Full Year'],
      bluePath: 'M 50 155 C 120 135, 180 115, 250 95 C 320 75, 380 60, 440 45 C 475 38, 490 35, 500 32',
      purplePath: 'M 50 170 C 120 155, 180 138, 250 120 C 320 100, 380 85, 440 70 C 475 62, 490 58, 500 55',
      pinBooking: { x: 500, y: 32, badge: '14.8K' },
      pinRevenue: { x: 500, y: 55, badge: '₹5.18Cr' },
      badgeTopBooking: '14%',
      badgeTopRevenue: '24%'
    }
  };

  // Active chart data: if user explicitly toggled within the Booking Analytics card, use that override;
  // otherwise, default to currentMetrics.chart which is fully in sync with the top banner dropdown!
  const activeChart = chartOverride
    ? analyticsChartData[chartOverride]
    : currentMetrics.chart;

  // Changing the top banner dropdown updates EVERYTHING, including the Booking Analytics graph
  const handleTopBannerDateChange = (r: DateRangeOption) => {
    setDateRange(r);
    setChartOverride(null); // Resets local override so the chart matches the new top banner date range
    if (r === 'This Month') setAnalyticsPeriod('This Month');
    else if (r === 'Last 30 Days' || r === 'Last 7 Days') setAnalyticsPeriod('Last Month');
    else if (r === 'This Year') setAnalyticsPeriod('This Year');
  };

  // Changing dates in booking analytics ONLY changes the graph data, NOT the rest of the dashboard
  const handleAnalyticsPeriodChange = (p: 'This Month' | 'Last Month' | 'This Year') => {
    setAnalyticsPeriod(p);
    setChartOverride(p);
  };

  // Recent Activities
  const recentActivities = [
    {
      id: 'act-1',
      title: 'Booking Confirmed',
      subtitle: '#TRV-2025-0847 • Dubai Package',
      time: '2 min ago',
      badge: 'Success',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100/70 text-emerald-600'
    },
    {
      id: 'act-2',
      title: 'Payment Received',
      subtitle: '₹75,000 • #TRV-2025-0846',
      time: '5 min ago',
      badge: 'Success',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: CreditCard,
      iconBg: 'bg-blue-100/70 text-blue-600'
    },
    {
      id: 'act-3',
      title: 'New Enquiry',
      subtitle: 'from Priya Sharma • Bali Package',
      time: '8 min ago',
      badge: 'New',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200/60',
      icon: User,
      iconBg: 'bg-purple-100/70 text-purple-600'
    },
    {
      id: 'act-4',
      title: 'Document Uploaded',
      subtitle: 'Flight Tickets • #TRV-2025-0845',
      time: '12 min ago',
      badge: 'Info',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/60',
      icon: FileText,
      iconBg: 'bg-amber-100/70 text-amber-600'
    }
  ];

  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      subtitle={`Enterprise CRM & Multi-Agency Governance • ${agency?.name || 'Trip by Genie'}`}
    >
      <div className="space-y-6">
        {/* ======================================================== */}
        {/* WELCOME BANNER WITH SCENIC SKYLINE (No Search Bar)       */}
        {/* ======================================================== */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#eef4f9] via-[#f7f9fc] to-[#e8f1f8] border border-[#EFE7DA] p-6 sm:p-8 shadow-xs z-10">
          {/* Scenic Travel Watermark Silhouette - Isolated in overflow-hidden container */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div
              className="absolute inset-y-0 right-0 w-full md:w-3/5 bg-no-repeat bg-right-bottom opacity-20"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80")`,
                backgroundSize: 'contain'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082C43] font-display tracking-tight flex items-center gap-2">
                <span>Welcome back, {user?.name ? user.name.split(' ')[0] : 'Admin'}!</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Here's what's happening with your travel business today.
              </p>
            </div>

            {/* Date Range Dropdown Filter */}
            <div className="relative shrink-0 date-range-dropdown">
              <button
                type="button"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EFE7DA] shadow-xs text-xs font-bold text-[#082C43] hover:bg-[#F8F1E7]/50 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#17648A]" />
                <span>{dateRange}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDateDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-2xl border border-[#EFE7DA] p-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
                  {(['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        handleTopBannerDateChange(r);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left font-semibold cursor-pointer transition-colors ${
                        dateRange === r ? 'bg-[#F8F1E7] text-[#082C43] font-bold' : 'text-slate-600 hover:bg-[#F8F1E7]/50'
                      }`}
                    >
                      <span>{r}</span>
                      {dateRange === r && <Check className="w-3.5 h-3.5 text-[#17648A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOP METRIC CARDS ROW (4 Cards with Sparklines)           */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-[#EFE7DA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Bookings</span>
                <div className="text-2xl sm:text-3xl font-black text-[#082C43] font-display mt-1">
                  {currentMetrics.totalBookings}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>{currentMetrics.bookingsGrowth}</span>
                <span className="text-slate-400 font-normal ml-1">{currentMetrics.comparisonText}</span>
              </span>
              <Sparkline color="#2563EB" id="bookings" />
            </div>
          </div>

          {/* 2. Total Customers */}
          <div className="bg-white p-5 rounded-2xl border border-[#EFE7DA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Customers</span>
                <div className="text-2xl sm:text-3xl font-black text-[#082C43] font-display mt-1">
                  {currentMetrics.totalCustomers}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>{currentMetrics.customersGrowth}</span>
                <span className="text-slate-400 font-normal ml-1">{currentMetrics.comparisonText}</span>
              </span>
              <Sparkline color="#10B981" id="customers" />
            </div>
          </div>

          {/* 3. Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-[#EFE7DA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
                <div className="text-2xl sm:text-3xl font-black text-[#082C43] font-display mt-1">
                  {currentMetrics.totalRevenue}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>{currentMetrics.revenueGrowth}</span>
                <span className="text-slate-400 font-normal ml-1">{currentMetrics.comparisonText}</span>
              </span>
              <Sparkline color="#8B5CF6" id="revenue" />
            </div>
          </div>

          {/* 4. Upcoming Departures */}
          <div className="bg-white p-5 rounded-2xl border border-[#EFE7DA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Upcoming Departures</span>
                <div className="text-2xl sm:text-3xl font-black text-[#082C43] font-display mt-1">
                  {currentMetrics.upcomingDepartures}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Plane className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>{currentMetrics.departuresGrowth}</span>
                <span className="text-slate-400 font-normal ml-1">{currentMetrics.departuresComparison}</span>
              </span>
              <Sparkline color="#F59E0B" id="departures" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MIDDLE SECTION (Booking Analytics, Top Dest, Growth Card) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 1. Booking Analytics (Area Chart) */}
          <div className="lg:col-span-5 xl:col-span-5 bg-white p-6 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col justify-between">
            <div>
              {/* Header with Title and Period Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-[#082C43] font-display">
                    Booking Analytics
                  </h3>
                </div>
                {/* Time toggle pills */}
                <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold">
                  {(['This Month', 'Last Month', 'This Year'] as const).map((p) => {
                    const isSelected = chartOverride
                      ? chartOverride === p
                      : (
                        (dateRange === 'This Month' && p === 'This Month') ||
                        (dateRange === 'This Year' && p === 'This Year') ||
                        (dateRange === 'Last 30 Days' && p === 'Last Month') ||
                        (dateRange === 'Last 7 Days' && p === 'Last Month')
                      );

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleAnalyticsPeriodChange(p)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-[#082C43]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend Row */}
              <div className="flex items-center justify-end gap-4 mt-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Bookings</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>Revenue</span>
                </div>
              </div>

              {/* Dual-Line Curve SVG Area Chart dynamically reactive to dateRange */}
              <div className="relative mt-2 h-56 w-full">
                <svg className="w-full h-full" viewBox="0 0 520 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333EA" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#9333EA" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Dashed Gridlines & Y-Axis Labels */}
                  <g stroke="#E5E7EB" strokeDasharray="4 4" strokeWidth="1">
                    <line x1="45" y1="20" x2="510" y2="20" />
                    <line x1="45" y1="60" x2="510" y2="60" />
                    <line x1="45" y1="100" x2="510" y2="100" />
                    <line x1="45" y1="140" x2="510" y2="140" />
                    <line x1="45" y1="180" x2="510" y2="180" />
                  </g>

                  {/* Y-Axis Label Texts */}
                  <g className="text-[10px] fill-slate-400 font-semibold" textAnchor="end">
                    <text x="35" y="24">2K</text>
                    <text x="35" y="64">1.5K</text>
                    <text x="35" y="104">1K</text>
                    <text x="35" y="144">500</text>
                    <text x="35" y="184">0</text>
                  </g>

                  {/* Purple Curve (Revenue) Area + Line */}
                  <path
                    d={`${activeChart.purplePath} L 500 180 L 50 180 Z`}
                    fill="url(#purpleArea)"
                  />
                  <path
                    d={activeChart.purplePath}
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />

                  {/* Blue Curve (Bookings) Area + Line */}
                  <path
                    d={`${activeChart.bluePath} L 500 180 L 50 180 Z`}
                    fill="url(#blueArea)"
                  />
                  <path
                    d={activeChart.bluePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* End Data Pin: Bookings */}
                  <circle cx={activeChart.pinBooking.x} cy={activeChart.pinBooking.y} r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />

                  {/* End Data Pin: Revenue */}
                  <circle cx={activeChart.pinRevenue.x} cy={activeChart.pinRevenue.y} r="5" fill="#9333EA" stroke="#FFFFFF" strokeWidth="2" />
                </svg>

                {/* Floating Callout Badges on Right Edge */}
                <div
                  className="absolute right-0 bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-md pointer-events-none transition-all duration-300"
                  style={{ top: activeChart.badgeTopBooking }}
                >
                  {activeChart.pinBooking.badge}
                </div>
                <div
                  className="absolute right-0 bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-md pointer-events-none transition-all duration-300"
                  style={{ top: activeChart.badgeTopRevenue }}
                >
                  {activeChart.pinRevenue.badge}
                </div>
              </div>

              {/* X-Axis Dates */}
              <div className="flex items-center justify-between pl-10 pr-2 pt-1 text-[11px] font-bold text-slate-500">
                {activeChart.dates.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Top Destinations (Middle Column - View All shown ONLY if > 5) */}
          <div className="lg:col-span-4 xl:col-span-4 bg-white p-6 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-[#082C43] font-display">
                    Top Destinations
                  </h3>
                </div>
                {/* View All button is ONLY rendered when there are MORE than 5 destinations */}
                {currentMetrics.destinations.length > 5 && (
                  <Link
                    to="/destinations"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All ({currentMetrics.destinations.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Destination Rows (Dubai, Bali, Europe, Thailand, Singapore) */}
              <div className="divide-y divide-slate-100 mt-2">
                {currentMetrics.destinations.slice(0, 5).map((dest) => (
                  <div key={dest.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-3 shrink-0">
                        {dest.id}
                      </span>
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-100"
                      />
                      <div className="truncate">
                        <div className="font-bold text-[#082C43] truncate">{dest.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {dest.bookings.toLocaleString()} Bookings
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dest.color}`}
                          style={{ width: `${dest.pct * 3.5}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-11 text-right">
                        {dest.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Business Growth Card (Deep Blue Sky Gradient Card) */}
          <div className="lg:col-span-3 xl:col-span-3 bg-gradient-to-br from-[#0c2438] via-[#082C43] to-[#041724] text-white p-6 rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[340px]">
            {/* Background Plane & Cloud Overlay Silhouette */}
            <Plane className="w-16 h-16 text-white/10 absolute top-4 right-4 transform rotate-12 pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>

              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Business Growth
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white font-display mt-1">
                  {currentMetrics.businessGrowth}
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">
                  {currentMetrics.growthComparison}
                </span>
              </div>
            </div>

            {/* Rising Bars Graphic (7 bars) */}
            <div className="my-6 flex items-end justify-between gap-2 h-24 px-1">
              {[18, 28, 42, 58, 70, 82, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-white/15 to-white/70 rounded-t-md transition-all hover:bg-white"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* View Detailed Report Button */}
            <Link
              to="/admin/reports"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-[#082C43] rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Detailed Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM SECTION (Recent Activities, Booking Status, Team) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Recent Activities */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-[#082C43] font-display">
                    Recent Activities
                  </h3>
                </div>
                <Link
                  to="/admin/bookings"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-[#082C43] truncate">{act.title}</div>
                          <div className="text-[11px] text-slate-400 font-medium truncate">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 mb-1">{act.time}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${act.badgeStyle}`}>
                          {act.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Booking Status (Donut Chart + Trophy Banner) */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-[#082C43] font-display">
                  Booking Status
                </h3>
              </div>

              {/* Donut Chart with Legend Row */}
              <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* SVG Donut Ring */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="11" fill="none" />
                    {/* Confirmed segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10B981"
                      strokeWidth="11"
                      strokeDasharray={currentMetrics.bookingStatus.confirmedDash}
                      strokeDashoffset="0"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Pending segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F59E0B"
                      strokeWidth="11"
                      strokeDasharray={currentMetrics.bookingStatus.pendingDash}
                      strokeDashoffset="-150"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Cancelled segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#EF4444"
                      strokeWidth="11"
                      strokeDasharray={currentMetrics.bookingStatus.cancelledDash}
                      strokeDashoffset="-195"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Others segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3B82F6"
                      strokeWidth="11"
                      strokeDasharray={currentMetrics.bookingStatus.othersDash}
                      strokeDashoffset="-225"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-black text-[#082C43] font-display">
                      {currentMetrics.bookingStatus.total}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Total Bookings</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Confirmed</span>
                    </div>
                    <span className="font-bold text-[#082C43]">{currentMetrics.bookingStatus.confirmed}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Pending</span>
                    </div>
                    <span className="font-bold text-[#082C43]">{currentMetrics.bookingStatus.pending}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-600">Cancelled</span>
                    </div>
                    <span className="font-bold text-[#082C43]">{currentMetrics.bookingStatus.cancelled}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-slate-600">Others</span>
                    </div>
                    <span className="font-bold text-[#082C43]">{currentMetrics.bookingStatus.others}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Conversion Capsule */}
            <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{currentMetrics.conversionRateText}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
                <span>{currentMetrics.conversionTrend}</span>
              </div>
            </div>
          </div>

          {/* 3. Team & User Overview (2x2 Grid) */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE7DA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-[#082C43] font-display">
                    Team & User Overview
                  </h3>
                </div>
                <Link
                  to="/admin/users"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 2x2 Grid Tiles */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Staff */}
                <div className="bg-[#F0F7FF] border border-[#E1EFFE] p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">Staff</span>
                    <div className="text-xl font-black text-[#082C43] font-display">{currentMetrics.teamOverview.staff}</div>
                    <span className="text-[10px] font-bold text-emerald-600">{currentMetrics.teamOverview.staffTrend}</span>
                  </div>
                </div>

                {/* Managers */}
                <div className="bg-[#FAF5FF] border border-[#F3E8FF] p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">Managers</span>
                    <div className="text-xl font-black text-[#082C43] font-display">{currentMetrics.teamOverview.managers}</div>
                    <span className="text-[10px] font-bold text-slate-400">{currentMetrics.teamOverview.managersTrend}</span>
                  </div>
                </div>

                {/* Agents */}
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">Agents</span>
                    <div className="text-xl font-black text-[#082C43] font-display">{currentMetrics.teamOverview.agents}</div>
                    <span className="text-[10px] font-bold text-emerald-600">{currentMetrics.teamOverview.agentsTrend}</span>
                  </div>
                </div>

                {/* Others */}
                <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">Others</span>
                    <div className="text-xl font-black text-[#082C43] font-display">{currentMetrics.teamOverview.others}</div>
                    <span className="text-[10px] font-bold text-emerald-600">{currentMetrics.teamOverview.othersTrend}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
