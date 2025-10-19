import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  List,
  Fab,
} from '@mui/material';
import {
  Assignment,
  RequestQuote,
  ShoppingCart,
  Build,
  Add,
  Phone,
  Email,
  AttachMoney,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { fetchProjects } from '../../store/slices/projectsSlice';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import FeatureDiscovery, { dashboardTips } from '../../components/help/FeatureDiscovery';
import ProjectStatusCard from '../../components/projects/ProjectStatusCard';
import {
  BusinessMetricsCard,
  QuickActionCard,
  NotificationItem,
  SalesRepContactCard,
} from '../../components/dashboard/BusinessDashboardComponents';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';
import DashboardSection from '../../components/dashboard/DashboardSection';
import ProjectTimeline from '../../components/projects/ProjectTimeline';
import ProgressPhotosGallery from '../../components/projects/ProgressPhotosGallery';
import BudgetBreakdownCard from '../../components/dashboard/BudgetBreakdownCard';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { projects } = useSelector((state: RootState) => state.projects);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Fetch projects on mount
  useEffect(() => {
    dispatch(fetchProjects({ limit: 20 }));
  }, [dispatch]);
  
  // Check if user needs onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Calculate dashboard stats from real projects
  const dashboardStats = {
    activeProjects: projects.filter(p => p.status === 'in_progress' || p.status === 'in_production').length,
    pendingQuotes: projects.filter(p => p.status === 'inquiry' || p.status === 'design').length,
    activeOrders: projects.filter(p => p.status === 'approved' || p.status === 'in_production').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
  };

  // Get active projects from Redux state
  const activeProjects = projects
    .filter(p => p.status !== 'completed' && p.status !== 'cancelled')
    .slice(0, 3)
    .map((project: any) => ({
      id: project.id,
      title: project.name || project.title || 'Untitled Project',
      type: project.type || 'Commercial',
      status: project.status || 'In Progress',
      progress: project.progress || 0,
      estimatedCompletion: project.estimatedCompletion || project.dueDate || 'TBD',
      location: project.location || 'N/A',
      salesRep: project.assignedSalesRep || { name: 'Unassigned', avatar: '' },
      lastUpdate: project.updatedAt || 'Unknown'
    }));

  // Sample sales rep data (will be replaced with actual user data in future iteration)
  const assignedSalesRep = {
    id: '1',
    name: 'Sales Representative',
    email: 'sales@balconbuilders.com',
    phone: '(979) 627-9310',
    avatar: '',
    specialties: ['Commercial', 'Industrial', 'Custom Designs'],
    activeProjects: dashboardStats.activeProjects,
    responseTime: '< 2 hours'
  };

  // Sample notifications (will be replaced with real notification system in future iteration)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success' as const,
      title: 'Welcome!',
      message: 'Your dashboard is now using real project data.',
      timestamp: 'Just now',
      actionable: false
    }
  ]);

  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleContactRep = (projectId: number) => {
    // Find the project and show contact options
    const project = activeProjects.find(p => p.id === projectId);
    if (project?.salesRep) {
      // Could open a modal or navigate to contact page
      window.open(`mailto:${assignedSalesRep.email}?subject=Regarding Project: ${project.title}`);
    }
  };

  const handleNotificationAction = (notificationId: string) => {
    // Handle notification actions
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      // Navigate to relevant page or show action dialog
      navigate('/projects');
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }} data-testid="welcome-section">
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your projects, review quotes, and stay connected with our team
        </Typography>
      </Box>

      {/* Business Metrics */}
      <Box sx={{ mb: 4 }} data-testid="dashboard-stats">
        <DashboardSection title="Your Account Overview" id="customer-metrics-overview">
        <ResponsiveCardGrid minWidth={260} gap={3}>
          <BusinessMetricsCard
            title="Active Projects"
            value={dashboardStats.activeProjects}
            subtitle="Currently in progress"
            icon={<Assignment />}
            color="primary"
            trend={{ direction: 'up', percentage: 15 }}
            actionButton={{
              label: "View All",
              onClick: () => navigate('/projects')
            }}
          />
          <BusinessMetricsCard
            title="Pending Quotes"
            value={dashboardStats.pendingQuotes}
            subtitle="Awaiting your review"
            icon={<RequestQuote />}
            color="warning"
            actionButton={{
              label: "Review Quotes",
              onClick: () => navigate('/quotes')
            }}
          />
          <BusinessMetricsCard
            title="Active Orders"
            value={dashboardStats.activeOrders}
            subtitle="In production/shipping"
            icon={<ShoppingCart />}
            color="success"
            actionButton={{
              label: "Track Orders",
              onClick: () => navigate('/orders')
            }}
          />
          <BusinessMetricsCard
            title="Project Value"
            value="$245K"
            subtitle="Total active project value"
            icon={<AttachMoney />}
            color="info"
            trend={{ direction: 'up', percentage: 8 }}
          />
        </ResponsiveCardGrid>
        </DashboardSection>
      </Box>

  <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
        {/* Active Projects Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Active Projects
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/projects/new')}
              >
                New Project
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {activeProjects.map((project) => (
                <Grid item xs={12} md={6} key={project.id}>
                  <ProjectStatusCard
                    project={project}
                    onViewDetails={handleViewProject}
                    onContactRep={handleContactRep}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Enhanced Project Details for Primary Project */}
          {activeProjects.length > 0 && (
            <>
              {/* Project Timeline */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {activeProjects[0].title} - Construction Timeline
                </Typography>
                <ProjectTimeline
                  phases={[
                    {
                      id: '1',
                      label: 'Design & Planning',
                      description: 'Blueprint finalization and permit acquisition',
                      status: 'completed',
                      startDate: 'Jan 5, 2025',
                      endDate: 'Jan 20, 2025',
                      details: ['Blueprints approved', 'Permits obtained', 'Site prepared'],
                    },
                    {
                      id: '2',
                      label: 'Foundation & Framing',
                      description: 'Concrete foundation and steel frame installation',
                      status: 'in-progress',
                      progress: 75,
                      startDate: 'Jan 22, 2025',
                      endDate: 'Feb 28, 2025',
                      details: ['Foundation complete', 'Steel frame 75% erected', 'On schedule'],
                    },
                    {
                      id: '3',
                      label: 'Roofing & Walls',
                      description: 'Metal roofing and wall panel installation',
                      status: 'upcoming',
                      startDate: 'Mar 1, 2025',
                      endDate: 'Mar 15, 2025',
                    },
                    {
                      id: '4',
                      label: 'Electrical & Finishing',
                      description: 'Electrical systems and final touches',
                      status: 'upcoming',
                      startDate: 'Mar 16, 2025',
                      endDate: 'Mar 30, 2025',
                    },
                  ]}
                  orientation="vertical"
                />
              </Paper>

              {/* Progress Photos */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <ProgressPhotosGallery
                  photos={[
                    {
                      id: '1',
                      url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
                      thumbnail: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
                      title: 'Site Preparation Complete',
                      description: 'Ground leveled and ready for foundation',
                      timestamp: 'Jan 18, 2025',
                      phase: 'Foundation',
                      weather: 'sunny',
                      tags: ['site-prep', 'foundation'],
                    },
                    {
                      id: '2',
                      url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
                      thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400',
                      title: 'Foundation Pour',
                      description: 'Concrete foundation successfully poured',
                      timestamp: 'Jan 25, 2025',
                      phase: 'Foundation',
                      weather: 'cloudy',
                      tags: ['concrete', 'foundation'],
                    },
                    {
                      id: '3',
                      url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
                      thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
                      title: 'Steel Frame Rising',
                      description: 'Main structural steel frame 50% complete',
                      timestamp: 'Feb 10, 2025',
                      phase: 'Framing',
                      weather: 'sunny',
                      tags: ['steel', 'framing', 'structure'],
                    },
                    {
                      id: '4',
                      url: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800',
                      thumbnail: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=400',
                      title: 'Frame Nearly Complete',
                      description: 'Steel framework 75% erected - ahead of schedule',
                      timestamp: 'Feb 20, 2025',
                      phase: 'Framing',
                      weather: 'sunny',
                      tags: ['steel', 'progress', 'milestone'],
                    },
                  ]}
                  showBeforeAfter={true}
                  columns={2}
                />
              </Paper>

              {/* Budget Breakdown */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <BudgetBreakdownCard
                  totalBudget={85000}
                  spentAmount={63750}
                  targetBudget={88000}
                  categories={[
                    { name: 'Materials', amount: 38250, percentage: 45 },
                    { name: 'Labor', amount: 23800, percentage: 28 },
                    { name: 'Equipment', amount: 12750, percentage: 15 },
                    { name: 'Permits & Fees', amount: 4250, percentage: 5 },
                    { name: 'Contingency', amount: 5950, percentage: 7 },
                  ]}
                  showVariance={true}
                />
              </Paper>
            </>
          )}

          {/* Notifications */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications
            </Typography>
            <List>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  timestamp={notification.timestamp}
                  actionable={notification.actionable}
                  onAction={() => handleNotificationAction(notification.id)}
                  onDismiss={handleDismissNotification}
                />
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Sales Rep Contact */}
          <Box sx={{ mb: 3 }}>
            <SalesRepContactCard salesRep={assignedSalesRep} />
          </Box>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <QuickActionCard
                  title="Start New Project"
                  description="Begin your next metal building project with our guided wizard"
                  icon={<Assignment />}
                  actionLabel="Get Started"
                  onAction={() => navigate('/projects/new')}
                  color="primary"
                  featured={true}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RequestQuote />}
                  onClick={() => navigate('/quotes')}
                  size="small"
                >
                  Quotes
                </Button>
              </Grid>
              
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Build />}
                  onClick={() => navigate('/materials')}
                  size="small"
                >
                  Materials
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Company Contact */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our team is here to support you throughout your project.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Phone />}
                href="tel:+19796279310"
                size="small"
                sx={{ flex: 1 }}
              >
                Call Us
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                href="mailto:info@balconbuilders.com"
                size="small"
                sx={{ flex: 1 }}
              >
                Email
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary" display="block">
              Business Hours: Mon-Thu 8AM-4PM, Fri 8AM-12PM
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button for Quick Project Start */}
      <Fab
        color="primary"
        aria-label="start new project"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/projects/new')}
      >
        <Add />
      </Fab>

      {/* Onboarding Tour */}
      <OnboardingTour
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userType="customer"
      />

      {/* Feature Discovery */}
      <FeatureDiscovery
        tips={dashboardTips}
        autoStart={false}
        showButton={true}
      />
    </Box>
  );
};

export default CustomerDashboard;
