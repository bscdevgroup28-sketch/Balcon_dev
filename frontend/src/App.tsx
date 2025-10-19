import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import OfficeManagerDashboard from './pages/dashboard/OfficeManagerDashboard';
import ShopManagerDashboard from './pages/dashboard/ShopManagerDashboard';
import ProjectManagerDashboard from './pages/dashboard/ProjectManagerDashboard';
import TeamLeaderDashboard from './pages/dashboard/TeamLeaderDashboard';
import TechnicianDashboard from './pages/dashboard/TechnicianDashboard';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectWizard from './components/projects/ProjectWizard';
import QuotesPage from './pages/quotes/QuotesPage';
import OrdersPage from './pages/orders/OrdersPage';
import ProfilePage from './pages/profile/ProfilePage';
import MaterialsPage from './pages/materials/MaterialsPage';
import UsersPage from './pages/admin/UsersPage';
import WebhooksAdmin from './pages/webhooks/WebhooksAdmin';
import SystemHealthPage from './pages/system/SystemHealthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotificationProvider from './components/feedback/NotificationProvider';
import HelpCenter from './components/help/HelpCenter';
import { RootState } from './store/store';
import { getDashboardPath } from './utils/roleUtils';
import { LayoutDensityProvider } from './theme/LayoutDensityContext';

const App: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Landing page component for demo selection
  const LandingPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Login />
    </div>
  );

  // Dynamic dashboard redirect based on user role
  const DashboardRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  };

  return (
    <NotificationProvider>
      <LayoutDensityProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
  <Route path="/reset-password" element={<ResetPassword />} />
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
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  
                  {/* Admin Routes */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/users" element={<UsersPage />} />
                          <Route path="/webhooks" element={<WebhooksAdmin />} />
                          <Route path="/settings" element={<div>System Settings</div>} />
                        </Routes>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* System Health Route (Admin/Owner only) */}
                  <Route 
                    path="/system/health" 
                    element={
                      <ProtectedRoute requiredRoles={['admin', 'owner']}>
                        <SystemHealthPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Fallback */}
                  <Route path="*" element={<DashboardRedirect />} />
                </Routes>
                
                {/* Global Components */}
                <HelpCenter />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      </LayoutDensityProvider>
    </NotificationProvider>
  );
};

export default App;
