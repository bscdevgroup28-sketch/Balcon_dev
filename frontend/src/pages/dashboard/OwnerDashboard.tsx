import React, { useEffect, useMemo } from 'react';
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
  Alert,
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
  Lightbulb,
} from '@mui/icons-material';
import { BaseDashboard } from '../../components/dashboard/BaseDashboard';
import DashboardSection from '../../components/dashboard/DashboardSection';
import { BusinessMetricsCard } from '../../components/dashboard/BusinessDashboardComponents';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';
import HealthScoreRing from '../../components/dashboard/HealthScoreRing';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchAnalyticsSummary, fetchAnalyticsTrends, fetchAnalyticsAnomalies, fetchAnalyticsForecast } from '../../store/slices/analyticsSlice';
import api from '../../services/api';
import { useNotification } from '../../components/feedback/NotificationProvider';
import AnomaliesPanel from '../../components/analytics/AnomaliesPanel';
import ForecastCard from '../../components/analytics/ForecastCard';
import Sparkline from '../../components/charts/Sparkline';
import AttentionList from '../../components/common/AttentionList';

const OwnerDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { summary, trends, loadingSummary, loadingTrends, anomalies, loadingAnomalies, forecast, loadingForecast } = useSelector((s: RootState) => s.analytics);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    dispatch(fetchAnalyticsSummary() as any);
    dispatch(fetchAnalyticsTrends('30d') as any);
    dispatch(fetchAnalyticsAnomalies({ range: '30d' }) as any);
    dispatch(fetchAnalyticsForecast({ metric: 'ordersCreated', horizon: 14 }) as any);
  }, [dispatch]);

  const trendSeries = useMemo(() => {
    const pts = trends?.points || [];
    return {
      ordersCreated: pts.map((p: any) => Number(p.ordersCreated) || 0),
      ordersDelivered: pts.map((p: any) => Number(p.ordersDelivered) || 0),
      quotesSent: pts.map((p: any) => Number(p.quotesSent) || 0),
      quotesAccepted: pts.map((p: any) => Number(p.quotesAccepted) || 0),
    };
  }, [trends]);

  const handleDownloadCsv = async () => {
    try {
      const res = await api.get('/analytics/trends.csv', { params: { range: '30d' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-trends-30d.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Trends CSV downloaded');
    } catch (e: any) {
      showError({ title: 'Download failed', message: e?.message || 'Could not download CSV', reportable: true });
    }
  };

  const handleDownloadMaterialsCsv = async () => {
    try {
      const res = await api.get('/analytics/distribution/materials.csv', { params: { field: 'category' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'materials-distribution-category.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Materials distribution CSV downloaded');
    } catch (e: any) {
      showError({ title: 'Download failed', message: e?.message || 'Could not download materials CSV', reportable: true });
    }
  };

  // Fallback mock data while loading or if API empty
  const executiveKPIs = {
    totalRevenue: summary?.data?.totalRevenue ?? 2450000,
    monthlyRevenue: summary?.data?.monthlyRevenue ?? 245000,
    quarterlyGrowth: summary?.data?.quarterlyGrowth ?? 18.5,
    yearlyGrowth: summary?.data?.yearlyGrowth ?? 32.1,
    profitMargin: summary?.data?.profitMargin ?? 24.8,
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

  // Render attention list near top
  const attentionSection = (
    <Card sx={{ mb: 3 }} aria-label="attention-section">
      <CardContent>
        <Typography variant="h6" gutterBottom>Needs Your Attention</Typography>
        <AttentionList limit={8} />
      </CardContent>
    </Card>
  );

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
      {attentionSection}
  <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
        {/* Business Health Score - Featured at Top */}
        <Grid item xs={12} lg={6}>
          <HealthScoreRing
            overall={92}
            breakdown={[
              {
                name: 'On-time Delivery',
                score: 95,
                trend: 'up',
                trendValue: 3,
                description: 'Projects completed on schedule',
              },
              {
                name: 'Budget Adherence',
                score: 88,
                trend: 'flat',
                trendValue: 0,
                description: 'Projects within budget targets',
              },
              {
                name: 'Customer Satisfaction',
                score: 94,
                trend: 'up',
                trendValue: 5,
                description: 'Client feedback scores',
              },
              {
                name: 'Safety Compliance',
                score: 91,
                trend: 'down',
                trendValue: -2,
                description: 'Zero-incident work days',
              },
            ]}
            size="large"
            showTrends={true}
          />
        </Grid>

        {/* Predictive Analytics Card */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lightbulb sx={{ fontSize: 32 }} />
                <Typography variant="h6" fontWeight={600}>
                  AI-Powered Insights
                </Typography>
              </Box>

              <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                $2.8M
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                Projected Q4 Revenue
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp />
                <Typography variant="body2">
                  +18% vs. Q3 projection
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Recommended Actions:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0.5, px: 0 }}>
                  <Typography variant="body2">• Hire 2 additional technicians for capacity</Typography>
                </ListItem>
                <ListItem sx={{ py: 0.5, px: 0 }}>
                  <Typography variant="body2">• Lock in steel prices before Q4 increase</Typography>
                </ListItem>
                <ListItem sx={{ py: 0.5, px: 0 }}>
                  <Typography variant="body2">• Focus marketing on commercial sector (32% ROI)</Typography>
                </ListItem>
              </List>

              <Alert
                severity="warning"
                icon={<Warning />}
                sx={{
                  mt: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: '#FFD700',
                  },
                }}
              >
                <Typography variant="caption" fontWeight={600}>
                  Material costs trending up 8% - Update quotes accordingly
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Executive KPI Cards */}
        <Grid item xs={12}>
          <DashboardSection title="Executive KPI Overview" id="owner-kpi-overview">
          <ResponsiveCardGrid minWidth={260} gap={3}>
            <BusinessMetricsCard
              title="Total Revenue"
              value={`$${(executiveKPIs.totalRevenue / 1000000).toFixed(1)}M`}
              loading={loadingSummary}
              subtitle="Year to date"
              icon={<AttachMoney />}
              color="success"
              trend={{ direction: 'up', percentage: executiveKPIs.yearlyGrowth }}
            />
            <BusinessMetricsCard
              title="Monthly Revenue"
              value={`$${(executiveKPIs.monthlyRevenue / 1000).toFixed(0)}K`}
              loading={loadingSummary}
              subtitle="Current month"
              icon={<TrendingUp />}
              color="primary"
              trend={{ direction: 'up', percentage: 12.5 }}
            />
            <BusinessMetricsCard
              title="Profit Margin"
              value={`${executiveKPIs.profitMargin}%`}
              loading={loadingSummary}
              subtitle="Company average"
              icon={<Business />}
              color="info"
              trend={{ direction: 'up', percentage: 2.1 }}
            />
            <BusinessMetricsCard
              title="Pipeline Value"
              value={`$${(executiveKPIs.pipelineValue / 1000000).toFixed(1)}M`}
              subtitle="Active opportunities"
              icon={<Assignment />}
              color="warning"
              trend={{ direction: 'up', percentage: 25.3 }}
            />
          </ResponsiveCardGrid>
          </DashboardSection>
        </Grid>

        {/* Recent Performance Metrics with Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom>
                  Recent Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={handleDownloadCsv} size="small" variant="outlined">Trends CSV</Button>
                  <Button onClick={handleDownloadMaterialsCsv} size="small" variant="outlined">Materials CSV</Button>
                </Box>
              </Box>
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
                      <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Chip
                          icon={metric.trend === 'up' ? <ArrowUpward /> : <ArrowDownward />}
                          label={metric.change}
                          color={metric.trend === 'up' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                        <Box sx={{ opacity: loadingTrends ? 0.5 : 1 }}>
                          <Sparkline
                            data={
                              index === 0 ? trendSeries.ordersCreated :
                              index === 1 ? trendSeries.ordersDelivered :
                              index === 2 ? trendSeries.quotesSent :
                              trendSeries.quotesAccepted
                            }
                            width={140}
                            height={36}
                            stroke="#2E7D32"
                            fill="rgba(46,125,50,0.15)"
                          />
                        </Box>
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
                    {index < strategicAlerts.length - 1 && (
                      <ListItem component="li" sx={{ p: 0 }} disableGutters>
                        <Divider flexItem aria-hidden="true" />
                      </ListItem>
                    )}
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
                          aria-label={`Progress for ${project.name}`}
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
                    aria-label="Q4 Growth Target progress"
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
                    aria-label="Market Expansion progress"
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
                    aria-label="Digital Transformation progress"
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

        {/* Anomalies Panel */}
        <Grid item xs={12}>
          <AnomaliesPanel data={anomalies} loading={loadingAnomalies} />
        </Grid>

        {/* Simple Forecast */}
        <Grid item xs={12} lg={6}>
          <ForecastCard data={forecast} loading={loadingForecast} title="Orders Created – 14d Forecast" />
        </Grid>
      </Grid>
    </BaseDashboard>
  );
};

export default OwnerDashboard;
