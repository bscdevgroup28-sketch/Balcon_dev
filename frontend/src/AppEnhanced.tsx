import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotificationProvider from './components/feedback/NotificationProvider';
import OnboardingTour from './components/onboarding/OnboardingTour';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import HelpCenter from './components/help/HelpCenter';
import LoadingScreen from './components/common/LoadingScreen';
import usePrefetchCoordinator from './hooks/usePrefetchCoordinator';
import { RootState } from './store/store';
import { getDashboardPath } from './utils/roleUtils';
import { UserRole } from './types/auth';
// Context providers for Phase 5D integration
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Keep all lazy imports after static ones per import/first rule

// Lazily loaded components/pages (code splitting)
const Layout = lazy(() => import('./components/layout/Layout'));
const LoginEnhanced = lazy(() => import('./pages/auth/LoginEnhanced'));
const Register = lazy(() => import('./pages/auth/Register'));

// Dashboard components
const CustomerDashboard = lazy(() => import('./pages/dashboard/CustomerDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const OwnerDashboard = lazy(() => import('./pages/dashboard/OwnerDashboard'));
const OfficeManagerDashboard = lazy(() => import('./pages/dashboard/OfficeManagerDashboard'));
const ShopManagerDashboard = lazy(() => import('./pages/dashboard/ShopManagerDashboard'));
const ProjectManagerDashboard = lazy(() => import('./pages/dashboard/ProjectManagerDashboard'));
const TeamLeaderDashboard = lazy(() => import('./pages/dashboard/TeamLeaderDashboard'));
const TechnicianDashboard = lazy(() => import('./pages/dashboard/TechnicianDashboard'));

// Page components
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const ProjectWizard = lazy(() => import('./components/projects/ProjectWizard'));
const QuotesPage = lazy(() => import('./pages/quotes/QuotesPage'));
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const MaterialsPage = lazy(() => import('./pages/materials/MaterialsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminOpsConsole = lazy(() => import('./pages/admin/AdminOpsConsole'));

// Phase 5C Enhanced Components
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const NotificationsPanel = lazy(() => import('./components/notifications/NotificationsPanel'));
const RealTimeNotifications = lazy(() => import('./components/notifications/RealTimeNotifications'));
const EnhancedProjectManagement = lazy(() => import('./components/projects/EnhancedProjectManagement'));
const MobileDashboard = lazy(() => import('./components/mobile/MobileDashboard'));
const Phase5CTestSuite = lazy(() => import('./components/testing/Phase5CTestSuite'));
const ApprovalPage = lazy(() => import('./pages/portal/ApprovalPage'));

// Feature discovery lazy component (non-critical, gated by flag)
const FeatureDiscoveryLazy = React.lazy(() => import('./components/help/FeatureDiscovery'));

// Enhanced App Router with Phase 5D integration
const EnhancedAppRouter: React.FC = () => {
  const { user: authUser } = useAuth();
  const { user: reduxUser } = useSelector((state: RootState) => state.auth);
  
  // Use integrated auth user if available, fallback to Redux user
  const user = authUser || reduxUser;

  // Landing page component for demo selection
  const LandingPage = () => (
    <LoginEnhanced />
  );

  // Dynamic dashboard redirect based on user role
  const DashboardRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    const dashboardPath = getDashboardPath(user.role as UserRole);
    return <Navigate to={dashboardPath} replace />;
  };

  return (
    <Suspense fallback={<LoadingScreen /> }>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginEnhanced />} />
      <Route path="/register" element={<Register />} />
  <Route path="/portal/approval/:token" element={<ApprovalPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Dynamic Dashboard Route */}
                <Route path="/home" element={<DashboardRedirect />} />
                
                {/* Phase 5C Enhanced Routes */}
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/enhanced-projects" element={<EnhancedProjectManagement />} />
                <Route 
                  path="/mobile" 
                  element={
                    <MobileDashboard 
                      userRole={user?.role || 'customer'} 
                      userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'} 
                    />
                  } 
                />
                <Route path="/notifications" element={<NotificationsPanel />} />
                
                {/* Testing and Development Routes */}
                <Route path="/test-suite" element={<Phase5CTestSuite />} />
                
                {/* Role-Specific Dashboard Routes */}
                <Route 
                  path="/owner/*" 
                  element={
                    <ProtectedRoute requiredRoles={['owner']}>
                      <Routes>
                        <Route path="/" element={<OwnerDashboard />} />
                        <Route path="/financial" element={<div>Financial Overview</div>} />
                        <Route path="/strategy" element={<div>Strategic Metrics</div>} />
                        <Route path="/reports" element={<div>Executive Reports</div>} />
                        <Route path="/analytics" element={<AnalyticsDashboard />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/office/*" 
                  element={
                    <ProtectedRoute requiredRoles={['office_manager']}>
                      <Routes>
                        <Route path="/" element={<OfficeManagerDashboard />} />
                        <Route path="/customers" element={<div>Customer Management</div>} />
                        <Route path="/schedule" element={<div>Scheduling</div>} />
                        <Route path="/communications" element={<div>Communications</div>} />
                        <Route path="/projects" element={<EnhancedProjectManagement />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/shop/*" 
                  element={
                    <ProtectedRoute requiredRoles={['shop_manager']}>
                      <Routes>
                        <Route path="/" element={<ShopManagerDashboard />} />
                        <Route path="/production" element={<div>Production Management</div>} />
                        <Route path="/inventory" element={<div>Inventory Control</div>} />
                        <Route path="/quality" element={<div>Quality Control</div>} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/project-manager/*" 
                  element={
                    <ProtectedRoute requiredRoles={['project_manager']}>
                      <Routes>
                        <Route path="/" element={<ProjectManagerDashboard />} />
                        <Route path="/portfolio" element={<div>Project Portfolio</div>} />
                        <Route path="/timeline" element={<div>Timeline Management</div>} />
                        <Route path="/resources" element={<div>Resource Planning</div>} />
                        <Route path="/enhanced" element={<EnhancedProjectManagement />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/team-leader/*" 
                  element={
                    <ProtectedRoute requiredRoles={['team_leader']}>
                      <Routes>
                        <Route path="/" element={<TeamLeaderDashboard />} />
                        <Route path="/team" element={<div>Team Management</div>} />
                        <Route path="/tasks" element={<div>Task Coordination</div>} />
                        <Route path="/field" element={<div>Field Operations</div>} />
                        <Route 
                          path="/mobile" 
                          element={
                            <MobileDashboard 
                              userRole="team_leader" 
                              userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Team Leader'} 
                            />
                          } 
                        />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/technician/*" 
                  element={
                    <ProtectedRoute requiredRoles={['technician']}>
                      <Routes>
                        <Route path="/" element={<TechnicianDashboard />} />
                        <Route path="/tasks" element={<div>My Tasks</div>} />
                        <Route path="/documentation" element={<div>Field Documentation</div>} />
                        <Route path="/chat" element={<div>Team Chat</div>} />
                        <Route 
                          path="/mobile" 
                          element={
                            <MobileDashboard 
                              userRole="technician" 
                              userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Technician'} 
                            />
                          } 
                        />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                {/* Customer Routes */}
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<ProjectWizard />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/edit" element={<ProjectWizard />} />
                <Route path="/quotes" element={<QuotesPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/settings" element={<div>System Settings</div>} />
                        <Route path="/ops" element={<AdminOpsConsole />} />
                        <Route path="/analytics" element={<AnalyticsDashboard />} />
                        <Route path="/projects" element={<EnhancedProjectManagement />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback */}
                <Route path="*" element={<DashboardRedirect />} />
              </Routes>
              
              {/* Enhanced Global Components */}
              <RealTimeNotifications />
              <HelpCenter />
              <OnboardingTour 
                open={false} 
                onClose={() => {}} 
                userType={user?.role === 'admin' ? 'admin' : 'customer'} 
              />
              {/* Feature Discovery gated by flag */}
              <FlaggedFeatureDiscovery />
              <PWAInstallBanner />
            </Layout>
          </ProtectedRoute>
        }
      />
      </Routes>
    </Suspense>
  );
};

// Main App component with Phase 5D integration
const App: React.FC = () => {
  // We don't have direct access to user here until contexts resolve; defer hook invocation inside provider tree.
  return (
    <Suspense fallback={<LoadingScreen /> }>
      <AuthProvider>
        <WebSocketProvider>
          <AppProvider>
            <NotificationProvider>
              <PrefetchWrapper>
                <EnhancedAppRouter />
              </PrefetchWrapper>
            </NotificationProvider>
          </AppProvider>
        </WebSocketProvider>
      </AuthProvider>
    </Suspense>
  );
};

// Wrapper component to access auth context after providers and run prefetch coordinator
const PrefetchWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Load feature flags for prefetch control
  const { flags } = useFeatureFlags(['prefetch.v2']);
  if (typeof window !== 'undefined') {
    // Expose to prefetch hook
    (window as any).__FF_PREFETCH_V2__ = flags['prefetch.v2'] !== false; // default true if undefined
  }
  usePrefetchCoordinator({ userRole: user?.role, delayMs: 1200 });
  return <>{children}</>;
};

// Gated Feature Discovery component
const FlaggedFeatureDiscovery: React.FC = () => {
  const { flags, loading } = useFeatureFlags(['feature.discovery']);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!flags['feature.discovery']) return;
    const run = () => setReady(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 4000 });
    } else {
      setTimeout(run, 2000);
    }
  }, [flags]);
  if (loading || !flags['feature.discovery'] || !ready) return null;
  return <Suspense fallback={null}><FeatureDiscoveryLazy tips={[]} /></Suspense>;
};

export default App;
