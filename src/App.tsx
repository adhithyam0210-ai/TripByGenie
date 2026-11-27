import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { SplashScreen } from './components/common/SplashScreen';

// Public Pages
import { Home } from './pages/public/Home';
import { Destinations } from './pages/public/Destinations';
import { DestinationDetail } from './pages/public/DestinationDetail';
import { Packages } from './pages/public/Packages';
import { PackageDetail } from './pages/public/PackageDetail';
import { Honeymoon } from './pages/public/Honeymoon';
import { GroupTours } from './pages/public/GroupTours';
import { Services } from './pages/public/Services';
import { MICE } from './pages/public/MICE';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { TermsOfService } from './pages/public/TermsOfService';
import { CancellationPolicy } from './pages/public/CancellationPolicy';

// Auth Pages
import { Login } from './pages/auth/Login';
import { StaffLogin } from './pages/auth/StaffLogin';
import { Signup } from './pages/auth/Signup';
import { ActivateAccount } from './pages/auth/ActivateAccount';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerEnquiries } from './pages/customer/CustomerEnquiries';
import { CustomerBookings } from './pages/customer/CustomerBookings';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { CustomerDocuments } from './pages/customer/CustomerDocuments';
import { CustomerSupport } from './pages/customer/CustomerSupport';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffLeads } from './pages/staff/StaffLeads';
import { StaffFollowUps } from './pages/staff/StaffFollowUps';
import { StaffBookings } from './pages/staff/StaffBookings';
import { StaffProfile } from './pages/staff/StaffProfile';

// Operations Logistics Pages
import { OperationsDashboard } from './pages/operations/OperationsDashboard';
import { OperationsBookings } from './pages/operations/OperationsBookings';

// Agent Pages
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentMarketplace } from './pages/agent/AgentMarketplace';
import { AgentPurchases } from './pages/agent/AgentPurchases';
import { AgentBookings } from './pages/agent/AgentBookings';
import { AgentTransactions } from './pages/agent/AgentTransactions';
import { AgentProfile } from './pages/agent/AgentProfile';
import { AgentDocuments } from './pages/agent/AgentDocuments';
import { AgentCustomers } from './pages/agent/AgentCustomers';

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
import { AdminUsers } from './pages/admin/AdminUsers';

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
    // Super Admin has universal access to all dashboards and role tabs
    if (user.role === 'admin') {
      return <>{children}</>;
    }
    // Redirect to their appropriate dashboard
    switch (user.role) {
      case 'manager':
        return <Navigate to="/manager/dashboard" replace />;
      case 'staff':
      case 'sales':
        return <Navigate to="/staff/dashboard" replace />;
      case 'operations':
        return <Navigate to="/operations/dashboard" replace />;
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
      case 'manager': return '/manager/dashboard';
      case 'staff':
      case 'sales': return '/staff/dashboard';
      case 'operations': return '/operations/dashboard';
      case 'agent': return '/agent/dashboard';
      default: return '/customer/dashboard';
    }
  };

  const authRedirect = getAuthRedirect();

  return (
    <>
      <ScrollToTop />
      <SplashScreen />
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
        <Route path="/mice" element={<MICE />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/terms-and-conditions" element={<Navigate to="/terms-of-service" replace />} />
        <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />
        <Route path="/cancellation" element={<Navigate to="/cancellation-policy" replace />} />

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
        path="/staff-login" 
        element={<StaffLogin />} 
      />
      <Route 
        path="/signup" 
        element={authRedirect ? <Navigate to={authRedirect} replace /> : <Signup />} 
      />
      <Route 
        path="/activate-account" 
        element={<ActivateAccount />} 
      />
      <Route 
        path="/activate" 
        element={<Navigate to="/activate-account" replace />} 
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
      <Route
        path="/customer/documents"
        element={
          <ProtectedRoute allowedRoles={['customer', 'operations', 'admin', 'manager']}>
            <CustomerDocuments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/support"
        element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'manager', 'operations']}>
            <CustomerSupport />
          </ProtectedRoute>
        }
      />

      {/* Operations Logistics Routes */}
      <Route path="/operations" element={<Navigate to="/operations/dashboard" replace />} />
      <Route
        path="/operations/dashboard"
        element={
          <ProtectedRoute allowedRoles={['operations', 'manager', 'admin']}>
            <OperationsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations/bookings"
        element={
          <ProtectedRoute allowedRoles={['operations', 'manager', 'admin']}>
            <OperationsBookings />
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff', 'sales', 'manager', 'admin']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/leads"
        element={
          <ProtectedRoute allowedRoles={['staff', 'sales', 'manager', 'admin']}>
            <StaffLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/follow-ups"
        element={
          <ProtectedRoute allowedRoles={['staff', 'sales', 'manager', 'admin']}>
            <StaffFollowUps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/bookings"
        element={
          <ProtectedRoute allowedRoles={['staff', 'sales', 'manager', 'admin']}>
            <StaffBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/profile"
        element={
          <ProtectedRoute allowedRoles={['staff', 'sales', 'manager', 'admin']}>
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
          <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
            <AgentMarketplace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/purchases"
        element={
          <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
            <AgentPurchases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
            <AgentBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/transactions"
        element={
          <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
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
      <Route
        path="/agent/documents"
        element={
          <ProtectedRoute allowedRoles={['agent', 'admin', 'manager']}>
            <AgentDocuments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/customers"
        element={
          <ProtectedRoute allowedRoles={['agent', 'admin', 'manager']}>
            <AgentCustomers />
          </ProtectedRoute>
        }
      />

      {/* Super Admin & ID Management Routes */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leads"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminAgents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminPackages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/group-tours"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminPackages initialViewMode="group" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/destinations"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminDestinations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/banners"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminBanners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Manager Operations Routes (Mirror operational tools with Manager branding) */}
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/leads"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/staff"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/agents"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminAgents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/customers"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/packages"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminPackages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/group-tours"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminPackages initialViewMode="group" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/destinations"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminDestinations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/banners"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminBanners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/bookings"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/payments"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
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
