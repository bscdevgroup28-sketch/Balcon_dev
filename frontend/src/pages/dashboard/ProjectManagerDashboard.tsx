import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Grid, Card, CardContent, Typography, Box, Divider } from '@mui/material';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';
import DashboardSection from '../../components/dashboard/DashboardSection';
import { Assignment, Groups, Schedule, AttachMoney, TrendingUp, Flag } from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';
import PanelSkeleton from '../../components/loading/PanelSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchAnalyticsSummary, fetchAnalyticsTrends } from '../../store/slices/analyticsSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import Sparkline from '../../components/charts/Sparkline';
import AttentionList from '../../components/common/AttentionList';

// Lazy-loaded panel components (granular code splitting)
const ActiveProjectsPanel = lazy(() => import('./projectManagerPanels/ActiveProjectsPanel'));
const UpcomingMilestonesPanel = lazy(() => import('./projectManagerPanels/UpcomingMilestonesPanel'));
const TeamOverviewPanel = lazy(() => import('./projectManagerPanels/TeamOverviewPanel'));
const RiskAlertsPanel = lazy(() => import('./projectManagerPanels/RiskAlertsPanel'));
const BudgetPerformancePanel = lazy(() => import('./projectManagerPanels/BudgetPerformancePanel'));
const ResourceAllocationPanel = lazy(() => import('./projectManagerPanels/ResourceAllocationPanel'));
const ClientCommunicationPanel = lazy(() => import('./projectManagerPanels/ClientCommunicationPanel'));
const ProjectToolsPanel = lazy(() => import('./projectManagerPanels/ProjectToolsPanel'));

const ProjectManagerDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { trends, loadingTrends, summary } = useSelector((s: RootState) => s.analytics);
  const { projects } = useSelector((s: RootState) => s.projects);
  const { users } = useSelector((s: RootState) => s.users);
  
  useEffect(() => {
    dispatch(fetchAnalyticsSummary() as any);
    dispatch(fetchAnalyticsTrends('30d') as any);
    dispatch(fetchProjects({ limit: 50 }) as any);
    dispatch(fetchUsers({ limit: 50 }) as any);
  }, [dispatch]);
  
  const trendSeries = useMemo(() => {
    const pts = trends?.points || [];
    return {
      ordersCreated: pts.map((p: any) => Number(p.ordersCreated) || 0),
      ordersDelivered: pts.map((p: any) => Number(p.ordersDelivered) || 0),
    };
  }, [trends]);
  
  // Calculate metrics from real data
  const projectMetrics = {
    activeProjects: summary?.activeProjects || projects.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length,
    onTimeProjects: projects.filter((p: any) => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate).getTime() > Date.now();
    }).length,
    totalBudget: projects.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0),
    budgetUtilization: 73, // TODO: Calculate from actual spend data
    teamMembers: users.filter((u: any) => u.role !== 'user' && u.role !== 'customer').length,
    upcomingMilestones: 0 // TODO: Add milestone tracking in future iteration
  };

  // Get active projects from real data
  const activeProjects = projects
    .filter((p: any) => p.status === 'active' || p.status === 'in_progress')
    .slice(0, 3)
    .map((p: any) => ({
      id: p.projectId || `BC-${p.id}`,
      name: p.name || 'Untitled Project',
      client: p.customerName || 'Unknown Client',
      progress: p.progress || 0,
      budget: p.budget || 0,
      spent: Math.floor((p.budget || 0) * ((p.progress || 0) / 100) * 0.8), // Estimate
      deadline: p.dueDate || p.estimatedCompletion,
      status: p.progress >= 90 ? 'ahead' : p.progress < 50 ? 'at-risk' : 'on-track',
      team: Math.floor(Math.random() * 5) + 3, // TODO: Add team assignment tracking
      phase: p.status === 'in_progress' ? 'Construction' : 'Planning'
    }));

  // Generate milestones from project due dates
  const upcomingMilestones = projects
    .filter((p: any) => p.dueDate)
    .slice(0, 4)
    .map((p: any) => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        project: p.projectId || `BC-${p.id}`,
        milestone: 'Project Deadline',
        date: p.dueDate,
        status: daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'today' : 'upcoming'
      };
    });

  // Generate team overview from users
  const teamOverview = users
    .filter((u: any) => u.role !== 'user' && u.role !== 'customer')
    .slice(0, 4)
    .map((u: any) => ({
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      role: (u.role || 'user').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      projects: projects.filter((p: any) => p.userId === u.id || p.assignedSalesRepId === u.id).length,
      utilization: Math.floor(Math.random() * 30) + 70, // TODO: Calculate from actual assignment data
      status: u.isActive ? 'available' : 'unavailable'
    }));

  // Generate risk alerts from delayed projects
  const riskAlerts = projects
    .filter((p: any) => {
      if (!p.dueDate) return false;
      const daysUntil = Math.floor((new Date(p.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil < 7 && p.progress < 80;
    })
    .slice(0, 3)
    .map((p: any, idx: number) => ({
      id: idx + 1,
      project: p.projectId || `BC-${p.id}`,
      risk: 'Behind schedule - at risk of missing deadline',
      severity: p.progress < 50 ? 'high' : 'medium',
      impact: `Project ${p.progress}% complete, deadline approaching`
    }));

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'success';
      case 'at-risk': return 'warning';
      case 'ahead': return 'info';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'info';
      case 'today': return 'warning';
      case 'overdue': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const attentionSection = (
    <Card sx={{ mb: 3 }} aria-label="attention-section">
      <CardContent>
        <Typography variant="h6" gutterBottom>Needs Your Attention</Typography>
        <AttentionList limit={8} />
      </CardContent>
    </Card>
  );


  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'on-site': return 'info';
      case 'in-office': return 'default';
      case 'unavailable': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <BaseDashboard role="project_manager" title="Project Manager Dashboard">
      {attentionSection}
      {/* Key Metrics Cards - full width responsive auto-fill grid */}
      <DashboardSection title="Project Portfolio Overview" id="pm-portfolio-overview">
        <ResponsiveCardGrid minWidth={260} gap={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Projects
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {projectMetrics.activeProjects}
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  On Schedule
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {projectMetrics.onTimeProjects}/{projectMetrics.activeProjects}
                </Typography>
              </Box>
              <Schedule sx={{ fontSize: 40, color: '#2e7d32' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Budget
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(projectMetrics.totalBudget)}
                </Typography>
              </Box>
              <AttachMoney sx={{ fontSize: 40, color: '#f57c00' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Budget Used
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {projectMetrics.budgetUtilization}%
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: '#7b1fa2' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              {loadingTrends ? (
                <Box sx={{ width: 180, height: 36, bgcolor: 'action.hover', borderRadius: 1 }} />
              ) : (
                <Sparkline data={trendSeries.ordersCreated} height={36} width={180} stroke="#7b1fa2" fill="rgba(123,31,162,0.12)" />
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Team Members
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {projectMetrics.teamMembers}
                </Typography>
              </Box>
              <Groups sx={{ fontSize: 40, color: '#00695c' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              {loadingTrends ? (
                <Box sx={{ width: 180, height: 36, bgcolor: 'action.hover', borderRadius: 1 }} />
              ) : (
                <Sparkline data={trendSeries.ordersDelivered} height={36} width={180} stroke="#00695c" fill="rgba(0,105,92,0.12)" />
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Milestones
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {projectMetrics.upcomingMilestones}
                </Typography>
              </Box>
              <Flag sx={{ fontSize: 40, color: '#f9a825' }} />
            </Box>
          </CardContent>
        </Card>
        </ResponsiveCardGrid>
      </DashboardSection>

      <Divider sx={{ my: 4 }} />

      <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
        {/* Active Projects Panel (lazy) */}
  <Grid item xs={12} lg={8} data-prefetch-panel="pm:active-projects" aria-labelledby="active-projects-heading">
          <Suspense 
            fallback={
              <Box role="status" aria-live="polite" aria-busy="true">
                <PanelSkeleton variant="table" lines={5} />
              </Box>
            }>
            <ActiveProjectsPanel
              projects={activeProjects as any}
              formatCurrency={formatCurrency}
              getProjectStatusColor={getProjectStatusColor}
            />
          </Suspense>
        </Grid>

        {/* Upcoming Milestones Panel (lazy) */}
  <Grid item xs={12} lg={4} data-prefetch-panel="pm:milestones" aria-labelledby="milestones-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="list" lines={4} /></Box>}>        
            <UpcomingMilestonesPanel
              milestones={upcomingMilestones as any}
              getMilestoneStatusColor={getMilestoneStatusColor}
            />
          </Suspense>
        </Grid>

        {/* Team Overview Panel (lazy) */}
  <Grid item xs={12} md={6} data-prefetch-panel="pm:team" aria-labelledby="team-overview-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="list" lines={4} /></Box>}>        
            <TeamOverviewPanel
              team={teamOverview as any}
              getTeamStatusColor={getTeamStatusColor}
            />
          </Suspense>
        </Grid>

        {/* Risk Alerts Panel (lazy) */}
  <Grid item xs={12} md={6} data-prefetch-panel="pm:risks" aria-labelledby="risk-alerts-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="list" lines={3} /></Box>}>        
            <RiskAlertsPanel
              risks={riskAlerts.map(r => ({ project: r.project, risk: r.risk, level: (r.severity.charAt(0).toUpperCase()+r.severity.slice(1)) as any, owner: 'N/A', due: '—' })) as any}
              getRiskColor={(level: string) => {
                const l = level.toLowerCase();
                if (l === 'critical') return 'error';
                if (l === 'high') return 'error';
                if (l === 'medium') return 'warning';
                if (l === 'low') return 'info';
                return 'default';
              }}
            />
          </Suspense>
        </Grid>

        {/* Budget Performance Panel (lazy) */}
        <Grid item xs={12} aria-labelledby="budget-performance-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="table" lines={4} /></Box>}>        
            <BudgetPerformancePanel
              budgets={activeProjects.map(p => ({ project: p.name, budget: p.budget, spent: p.spent, variance: p.budget - p.spent })) as any}
              formatCurrency={formatCurrency}
            />
          </Suspense>
        </Grid>

        {/* Resource Allocation Panel (lazy) */}
        <Grid item xs={12} md={6} aria-labelledby="resource-allocation-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="table" lines={3} /></Box>}>        
            <ResourceAllocationPanel
              resources={teamOverview.map(m => ({ resource: m.name, type: m.role, allocated: Math.round(m.utilization * 0.4), capacity: 40, critical: m.utilization > 90 })) as any}
            />
          </Suspense>
        </Grid>

        {/* Client Communication Panel (lazy) */}
        <Grid item xs={12} md={6} aria-labelledby="client-communication-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="list" lines={3} /></Box>}>        
            <ClientCommunicationPanel
              communications={[
                { client: 'Heritage Mall Renovation', topic: 'Weekly Progress Meeting', lastContact: 'Today', nextAction: 'Meeting Tomorrow 2PM', status: 'In Progress' },
                { client: 'Downtown Office Complex', topic: 'Change Order Pending', lastContact: 'Yesterday', nextAction: 'Awaiting Approval', status: 'Pending' },
                { client: 'Industrial Warehouse', topic: 'Final Inspection Scheduled', lastContact: 'Today', nextAction: 'Prepare Documentation', status: 'Completed' }
              ] as any}
              getCommStatusColor={(s: string) => {
                const k = s.toLowerCase();
                if (k === 'pending') return 'warning';
                if (k === 'in progress') return 'info';
                if (k === 'completed') return 'success';
                if (k === 'escalated') return 'error';
                return 'default';
              }}
            />
          </Suspense>
        </Grid>

        {/* Project Tools Panel (lazy) */}
        <Grid item xs={12} aria-labelledby="project-tools-heading">
          <Suspense fallback={<Box role="status" aria-live="polite" aria-busy="true"><PanelSkeleton variant="tools" lines={6} /></Box>}>        
            <ProjectToolsPanel onAction={() => { /* placeholder */ }} />
          </Suspense>
        </Grid>

        {/* Detailed Resource Table removed for code-split (can reintroduce if needed) */}
      </Grid>
    </BaseDashboard>
  );
};

export default ProjectManagerDashboard;
