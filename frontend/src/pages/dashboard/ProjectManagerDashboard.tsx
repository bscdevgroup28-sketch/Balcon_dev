import React, { Suspense, lazy } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Assignment, Groups, Schedule, AttachMoney, TrendingUp, Flag } from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';
import PanelSkeleton from '../../components/loading/PanelSkeleton';

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
  // Mock data for Project Manager specific metrics
  const projectMetrics = {
    activeProjects: 5,
    onTimeProjects: 4,
    totalBudget: 2450000,
    budgetUtilization: 73,
    teamMembers: 18,
    upcomingMilestones: 7
  };

  const activeProjects = [
    { 
      id: 'BC-2025-023', 
      name: 'Heritage Mall Renovation', 
      client: 'Johnson Construction',
      progress: 68, 
      budget: 850000, 
      spent: 580000, 
      deadline: '2025-09-15',
      status: 'on-track',
      team: 6,
      phase: 'Construction'
    },
    { 
      id: 'BC-2025-019', 
      name: 'Downtown Office Complex', 
      client: 'Metro Development',
      progress: 45, 
      budget: 1200000, 
      spent: 480000, 
      deadline: '2025-11-30',
      status: 'at-risk',
      team: 8,
      phase: 'Fabrication'
    },
    { 
      id: 'BC-2025-025', 
      name: 'Industrial Warehouse', 
      client: 'Storage Solutions Inc',
      progress: 89, 
      budget: 650000, 
      spent: 520000, 
      deadline: '2025-08-30',
      status: 'ahead',
      team: 4,
      phase: 'Finishing'
    }
  ];

  const upcomingMilestones = [
    { project: 'BC-2025-023', milestone: 'Phase 2 Completion', date: '2025-08-20', status: 'upcoming' },
    { project: 'BC-2025-019', milestone: 'Structural Review', date: '2025-08-18', status: 'overdue' },
    { project: 'BC-2025-025', milestone: 'Final Inspection', date: '2025-08-25', status: 'upcoming' },
    { project: 'BC-2025-021', milestone: 'Client Approval', date: '2025-08-16', status: 'today' }
  ];

  const teamOverview = [
    { name: 'Sarah Williams', role: 'Team Leader', projects: 2, utilization: 95, status: 'on-site' },
    { name: 'Mike Chen', role: 'Senior Technician', projects: 3, utilization: 88, status: 'available' },
    { name: 'David Rodriguez', role: 'Technician', projects: 2, utilization: 92, status: 'on-site' },
    { name: 'Lisa Thompson', role: 'Quality Inspector', projects: 4, utilization: 76, status: 'in-office' }
  ];

  const riskAlerts = [
    { id: 1, project: 'BC-2025-019', risk: 'Material delivery delay expected', severity: 'high', impact: 'Schedule delay of 3-5 days' },
    { id: 2, project: 'BC-2025-023', risk: 'Weather conditions affecting outdoor work', severity: 'medium', impact: 'Potential 1-2 day delay' },
    { id: 3, project: 'BC-2025-025', risk: 'Client change request pending approval', severity: 'low', impact: 'Budget increase of 5%' }
  ];

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
  <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
        {/* Project Overview */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
            Project Portfolio Overview
          </Typography>
        </Grid>

        {/* Key Metrics Cards */}
        <Grid item xs={12} md={6} lg={2}>
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
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
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
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
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
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
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
        </Grid>

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
