import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Context providers for Phase 5D integration
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Enhanced components and pages
import Layout from './components/layout/Layout';
import LoginEnhanced from './pages/auth/LoginEnhanced';
import Register from './pages/auth/Register';

// Dashboard components
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import OfficeManagerDashboard from './pages/dashboard/OfficeManagerDashboard';
import ShopManagerDashboard from './pages/dashboard/ShopManagerDashboard';
import ProjectManagerDashboard from './pages/dashboard/ProjectManagerDashboard';
import TeamLeaderDashboard from './pages/dashboard/TeamLeaderDashboard';
import TechnicianDashboard from './pages/dashboard/TechnicianDashboard';

// Page components
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectWizard from './components/projects/ProjectWizard';
import QuotesPage from './pages/quotes/QuotesPage';
import OrdersPage from './pages/orders/OrdersPage';
import ProfilePage from './pages/profile/ProfilePage';
import MaterialsPage from './pages/materials/MaterialsPage';
import UsersPage from './pages/admin/UsersPage';

// Phase 5C Enhanced Components
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import NotificationsPanel from './components/notifications/NotificationsPanel';
import EnhancedProjectManagement from './components/projects/EnhancedProjectManagement';
import MobileDashboard from './components/mobile/MobileDashboard';
import Phase5CTestSuite from './components/testing/Phase5CTestSuite';

// Enhanced global components
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotificationProvider from './components/feedback/NotificationProvider';
import OnboardingTour from './components/onboarding/OnboardingTour';
import FeatureDiscovery from './components/help/FeatureDiscovery';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import HelpCenter from './components/help/HelpCenter';
import DemoAccountSelector from './components/demo/DemoAccountSelector';

import { RootState } from './store/store';
import { getDashboardPath } from './utils/roleUtils';
import { UserRole } from './types/auth';

// Enhanced App Router with Phase 5D integration
const EnhancedAppRouter: React.FC = () => {
  const { user: authUser, isAuthenticated } = useAuth();
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
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginEnhanced />} />
      <Route path="/register" element={<Register />} />
      
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
              <HelpCenter />
              <OnboardingTour 
                open={false} 
                onClose={() => {}} 
                userType={user?.role === 'admin' ? 'admin' : 'customer'} 
              />
              <FeatureDiscovery tips={[]} />
              <PWAInstallBanner />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// Main App component with Phase 5D integration
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <NotificationProvider>
          <EnhancedAppRouter />
        </NotificationProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
