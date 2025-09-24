import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  List,
  Alert,
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
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
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

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if user needs onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Mock data for demonstration (enhanced for business value)
  const dashboardStats = {
    activeProjects: 3,
    pendingQuotes: 2,
    activeOrders: 1,
    completedProjects: 8,
  };

  // Enhanced project data
  const activeProjects = [
    {
      id: 1,
      title: 'Metal Warehouse Structure',
      type: 'Commercial',
      status: 'In Progress',
      progress: 75,
      estimatedCompletion: 'March 15, 2025',
      location: 'Houston, TX',
      salesRep: {
        name: 'John Smith',
        avatar: ''
      },
      lastUpdate: '2 days ago'
    },
    {
      id: 2,
      title: 'Residential Garage',
      type: 'Residential',
      status: 'Quoted',
      progress: 45,
      estimatedCompletion: 'April 1, 2025',
      location: 'Austin, TX',
      salesRep: {
        name: 'Sarah Johnson',
        avatar: ''
      },
      lastUpdate: '1 week ago'
    },
    {
      id: 3,
      title: 'Industrial Storage Unit',
      type: 'Industrial',
      status: 'Inquiry',
      progress: 20,
      estimatedCompletion: 'TBD',
      location: 'Dallas, TX',
      salesRep: {
        name: 'Mike Wilson',
        avatar: ''
      },
      lastUpdate: '3 days ago'
    }
  ];

  // Sample sales rep data
  const assignedSalesRep = {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@balconbuilders.com',
    phone: '(979) 627-9310',
    avatar: '',
    specialties: ['Commercial', 'Industrial', 'Custom Designs'],
    activeProjects: 12,
    responseTime: '< 2 hours'
  };

  // Sample notifications
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success' as const,
      title: 'Quote Approved',
      message: 'Your Metal Warehouse quote has been approved and moved to production.',
      timestamp: '2 hours ago',
      actionable: true
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Project Update',
      message: 'Construction milestone reached for Residential Garage project.',
      timestamp: '1 day ago',
      actionable: false
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Weather Alert',
      message: 'Potential weather delays for outdoor construction activities.',
      timestamp: '2 days ago',
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
        
        {/* Alert for important updates */}
        {notifications.some(n => n.type === 'warning') && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have important project updates. Check your notifications below.
          </Alert>
        )}
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
