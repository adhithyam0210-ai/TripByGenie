import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ScrollToTop } from './components/common/ScrollToTop';

// Public Pages
import { Home } from './pages/public/Home';
import { Destinations } from './pages/public/Destinations';
import { DestinationDetail } from './pages/public/DestinationDetail';
import { Packages } from './pages/public/Packages';
import { PackageDetail } from './pages/public/PackageDetail';
import { Honeymoon } from './pages/public/Honeymoon';
import { GroupTours } from './pages/public/GroupTours';
import { Services } from './pages/public/Services';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerEnquiries } from './pages/customer/CustomerEnquiries';
import { CustomerBookings } from './pages/customer/CustomerBookings';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffLeads } from './pages/staff/StaffLeads';
import { StaffFollowUps } from './pages/staff/StaffFollowUps';
import { StaffBookings } from './pages/staff/StaffBookings';
import { StaffProfile } from './pages/staff/StaffProfile';

// Agent Pages
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentMarketplace } from './pages/agent/AgentMarketplace';
import { AgentPurchases } from './pages/agent/AgentPurchases';
import { AgentBookings } from './pages/agent/AgentBookings';
import { AgentTransactions } from './pages/agent/AgentTransactions';
import { AgentProfile } from './pages/agent/AgentProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLeads } from './pages/admin/AdminLeads';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminAgents } from './pages/admin/AdminAgents';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminDestinations } from './pages/admin/AdminDestinations';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-brand-coral border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Authenticating Travel Genie Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />;
      case 'agent':
        return <Navigate to="/agent/dashboard" replace />;
      case 'customer':
      default:
        return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Helper for auth page redirects if already logged in
  const getAuthRedirect = () => {
    if (!isAuthenticated || !user) return null;
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'staff': return '/staff/dashboard';
      case 'agent': return '/agent/dashboard';
      default: return '/customer/dashboard';
    }
  };

  const authRedirect = getAuthRedirect();

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Pages with Top Bar, Nav Menu, and Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/packages/:slug" element={<PackageDetail />} />
        <Route path="/honeymoon" element={<Honeymoon />} />
        <Route path="/group-tours" element={<GroupTours />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Direct destination URLs matching tripbygenie.in/:slug/ */}
        <Route path="/australia" element={<Navigate to="/destinations/australia" replace />} />
        <Route path="/singapore" element={<Navigate to="/destinations/singapore" replace />} />
        <Route path="/kerala" element={<Navigate to="/destinations/kerala" replace />} />
        <Route path="/bali" element={<Navigate to="/destinations/bali" replace />} />
        <Route path="/maldives" element={<Navigate to="/destinations/maldives" replace />} />
        <Route path="/switzerland" element={<Navigate to="/destinations/switzerland" replace />} />
        <Route path="/dubai" element={<Navigate to="/destinations/dubai" replace />} />
        <Route path="/thailand" element={<Navigate to="/destinations/thailand" replace />} />
        <Route path="/malaysia" element={<Navigate to="/destinations/malaysia" replace />} />
        <Route path="/vietnam" element={<Navigate to="/destinations/vietnam" replace />} />
        <Route path="/japan" element={<Navigate to="/destinations/japan" replace />} />
      </Route>

      {/* Auth Pages */}
      <Route 
        path="/login" 
        element={authRedirect ? <Navigate to={authRedirect} replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={authRedirect ? <Navigate to={authRedirect} replace /> : <Signup />} 
      />

      {/* Customer Routes */}
      <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/enquiries"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerEnquiries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/payments"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/leads"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/follow-ups"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffFollowUps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/bookings"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/profile"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffProfile />
          </ProtectedRoute>
        }
      />

      {/* Agent Routes */}
      <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
      <Route
        path="/agent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/marketplace"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentMarketplace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/purchases"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentPurchases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/transactions"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/profile"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentProfile />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leads"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAgents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPackages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/destinations"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDestinations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/banners"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBanners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};
