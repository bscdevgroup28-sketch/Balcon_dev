import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Business,
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { BaseDashboard } from '../../components/dashboard/BaseDashboard';
import { BusinessMetricsCard } from '../../components/dashboard/BusinessDashboardComponents';

const OwnerDashboard: React.FC = () => {
  // Mock data for demonstration - will be replaced with API calls
  const executiveKPIs = {
    totalRevenue: 2450000,
    monthlyRevenue: 245000,
    quarterlyGrowth: 18.5,
    yearlyGrowth: 32.1,
    profitMargin: 24.8,
    customerAcquisition: 12,
    pipelineValue: 1850000,
    activeProjects: 24,
    completedProjects: 89,
    avgProjectValue: 102000,
  };

  const recentMetrics = [
    {
      title: 'Monthly Revenue',
      value: '$245K',
      change: '+12.5%',
      trend: 'up',
      period: 'vs last month'
    },
    {
      title: 'Profit Margin',
      value: '24.8%',
      change: '+2.1%',
      trend: 'up',
      period: 'vs last quarter'
    },
    {
      title: 'Customer Acquisition',
      value: '12',
      change: '-3',
      trend: 'down',
      period: 'vs last month'
    },
    {
      title: 'Project Completion Rate',
      value: '94.2%',
      change: '+1.8%',
      trend: 'up',
      period: 'vs last quarter'
    }
  ];

  const strategicAlerts = [
    {
      type: 'opportunity',
      message: 'Q4 pipeline 25% above target - consider expanding capacity',
      priority: 'high',
      timestamp: '2 hours ago'
    },
    {
      type: 'warning',
      message: 'Customer acquisition cost increased 15% this month',
      priority: 'medium',
      timestamp: '1 day ago'
    },
    {
      type: 'info',
      message: 'New competitor analysis report available',
      priority: 'low',
      timestamp: '3 days ago'
    }
  ];

  const topPerformingProjects = [
    {
      name: 'Austin Logistics Center',
      value: 450000,
      margin: 28.5,
      status: 'In Progress',
      completion: 75
    },
    {
      name: 'Houston Manufacturing Hub',
      value: 680000,
      margin: 31.2,
      status: 'Design Phase',
      completion: 25
    },
    {
      name: 'Dallas Retail Complex',
      value: 320000,
      margin: 22.1,
      status: 'Near Completion',
      completion: 95
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp color="success" />;
      case 'warning': return <Warning color="warning" />;
      default: return <CheckCircle color="info" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  return (
    <BaseDashboard 
      title="Executive Dashboard" 
      subtitle="Strategic business overview and key performance indicators"
      role="owner"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Schedule />}>
            Strategic Planning
          </Button>
          <Button variant="contained" startIcon={<AttachMoney />}>
            Financial Reports
          </Button>
        </Box>
      }
    >
  <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
        {/* Executive KPI Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Executive KPI Overview
          </Typography>
          <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
            <Grid item xs={12} sm={6} md={3}>
              <BusinessMetricsCard
                title="Total Revenue"
                value={`$${(executiveKPIs.totalRevenue / 1000000).toFixed(1)}M`}
                subtitle="Year to date"
                icon={<AttachMoney />}
                color="success"
                trend={{ direction: 'up', percentage: executiveKPIs.yearlyGrowth }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <BusinessMetricsCard
                title="Monthly Revenue"
                value={`$${(executiveKPIs.monthlyRevenue / 1000).toFixed(0)}K`}
                subtitle="Current month"
                icon={<TrendingUp />}
                color="primary"
                trend={{ direction: 'up', percentage: 12.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <BusinessMetricsCard
                title="Profit Margin"
                value={`${executiveKPIs.profitMargin}%`}
                subtitle="Company average"
                icon={<Business />}
                color="info"
                trend={{ direction: 'up', percentage: 2.1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <BusinessMetricsCard
                title="Pipeline Value"
                value={`$${(executiveKPIs.pipelineValue / 1000000).toFixed(1)}M`}
                subtitle="Active opportunities"
                icon={<Assignment />}
                color="warning"
                trend={{ direction: 'up', percentage: 25.3 }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Performance Metrics */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                {recentMetrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1, 
                      backgroundColor: 'background.default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {metric.title}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {metric.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.period}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          icon={metric.trend === 'up' ? <ArrowUpward /> : <ArrowDownward />}
                          label={metric.change}
                          color={metric.trend === 'up' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Strategic Alerts */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategic Alerts
              </Typography>
              <List>
                {strategicAlerts.map((alert, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getAlertIcon(alert.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {alert.message}
                            </Typography>
                            <Chip
                              label={alert.priority}
                              size="small"
                              color={getAlertColor(alert.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={alert.timestamp}
                      />
                    </ListItem>
                    {index < strategicAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performing Projects */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Projects
              </Typography>
              <Grid container spacing={2}>
                {topPerformingProjects.map((project, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 2, 
                      backgroundColor: 'background.default',
                      height: '100%'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="h4" color="success.main" sx={{ mb: 1 }}>
                        ${(project.value / 1000).toFixed(0)}K
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Profit Margin: {project.margin}%
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Progress</Typography>
                          <Typography variant="body2">{project.completion}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={project.completion}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Strategic Initiatives & Goals */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategic Initiatives
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Q4 Growth Target
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={78}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    78%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  $1.85M of $2.4M target achieved
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Market Expansion
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={65}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color="secondary"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    65%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  3 of 5 target markets entered
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Digital Transformation
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={42}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color="info"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    42%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  6 of 12 initiatives completed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Performance Overview */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Performance Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      94.2%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      On-Time Delivery
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      4.8/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer Satisfaction
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      87%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resource Utilization
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Projects
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Indicators */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Indicators
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    <Typography variant="body2">High Risk Projects</Typography>
                  </Box>
                  <Chip label="2" color="error" size="small" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    <Typography variant="body2">Overdue Invoices</Typography>
                  </Box>
                  <Chip label="5" color="warning" size="small" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="info" />
                    <Typography variant="body2">Low Stock Alerts</Typography>
                  </Box>
                  <Chip label="8" color="info" size="small" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="body2">Compliance Status</Typography>
                  </Box>
                  <Chip label="Good" color="success" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Intelligence */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Intelligence
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                      +15.2%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Market Growth Rate
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Construction industry YOY
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      3.2x
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Competitive Advantage
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      vs regional competitors
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      89%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Market Share
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Local market penetration
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </BaseDashboard>
  );
};

export default OwnerDashboard;
