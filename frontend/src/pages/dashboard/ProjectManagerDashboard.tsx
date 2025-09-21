import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Assignment,
  Timeline,
  Groups,
  Schedule,
  Warning,
  CheckCircle,
  AttachMoney,
  TrendingUp,
  CalendarToday,
  Build,
  AccountBalance,
  Flag
} from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';

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

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
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
      <Grid container spacing={3}>
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

        {/* Active Projects Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Active Projects
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Deadline</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {project.id} - {project.client}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={project.progress}
                              sx={{ 
                                width: 60, 
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: project.progress >= 80 ? '#4caf50' : project.progress >= 50 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {project.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(project.spent)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            of {formatCurrency(project.budget)}
                          </Typography>
                        </TableCell>
                        <TableCell>{project.team} members</TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            color={getProjectStatusColor(project.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{project.deadline}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Milestones */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Upcoming Milestones
              </Typography>
              <List sx={{ maxHeight: '280px', overflow: 'auto' }}>
                {upcomingMilestones.map((milestone, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Flag color={getMilestoneStatusColor(milestone.status) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.milestone}
                        secondary={`${milestone.project} - ${milestone.date}`}
                      />
                      <Chip
                        label={milestone.status}
                        color={getMilestoneStatusColor(milestone.status) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < upcomingMilestones.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Team Overview
              </Typography>
              <List>
                {teamOverview.map((member, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <ListItemText
                        primary={member.name}
                        secondary={`${member.role} - ${member.projects} projects`}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end">
                        <Chip
                          label={member.status}
                          color={getTeamStatusColor(member.status) as any}
                          size="small"
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption">
                          {member.utilization}% util.
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < teamOverview.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Risk Alerts
              </Typography>
              <List sx={{ maxHeight: '280px', overflow: 'auto' }}>
                {riskAlerts.map((risk, index) => (
                  <React.Fragment key={risk.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Warning color={getRiskSeverityColor(risk.severity) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={risk.risk}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {risk.project}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Impact: {risk.impact}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={risk.severity}
                        color={getRiskSeverityColor(risk.severity) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < riskAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Budget Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Spent</TableCell>
                      <TableCell>Utilization</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {project.id} - {project.client}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(project.budget)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(project.spent)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((project.spent / project.budget) * 100, 100)}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: (project.spent / project.budget) * 100 >= 80 ? '#4caf50' : (project.spent / project.budget) * 100 >= 50 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(project.spent / project.budget) * 100 >= 100 ? 'Over Budget' : 'On Track'}
                            color={(project.spent / project.budget) * 100 >= 100 ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Allocation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Resource Allocation
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Team Utilization Overview
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={78}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  78% Average Utilization (Target: 85%)
                </Typography>
              </Box>
              <List dense>
                {teamOverview.slice(0, 3).map((member, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight="medium">
                            {member.name}
                          </Typography>
                          <Chip
                            label={`${member.utilization}%`}
                            size="small"
                            color={member.utilization >= 85 ? 'success' : member.utilization >= 70 ? 'warning' : 'error'}
                          />
                        </Box>
                      }
                      secondary={`${member.role} • ${member.projects} active projects`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Client Communication */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Client Communication
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CalendarToday color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Weekly Progress Meeting"
                    secondary="Heritage Mall Renovation - Tomorrow 2:00 PM"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Warning color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Change Order Pending"
                    secondary="Downtown Office Complex - Awaiting approval"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Final Inspection Scheduled"
                    secondary="Industrial Warehouse - Aug 25, 2025"
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Communication Summary
                </Typography>
                <Typography variant="caption" display="block">
                  • 3 meetings scheduled this week
                </Typography>
                <Typography variant="caption" display="block">
                  • 2 change orders pending approval
                </Typography>
                <Typography variant="caption" display="block">
                  • 5 client emails responded today
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Project Management Tools
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <Assignment />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      New Project
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <Timeline />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Timeline
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <Groups />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Team
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <AttachMoney />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Budget
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <CalendarToday />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Calendar
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                    >
                      <Warning />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Risks
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Allocation */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Resource Allocation
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team Member</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Utilization</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Projects</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamOverview.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {member.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={member.utilization}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: member.utilization >= 80 ? '#4caf50' : member.utilization >= 50 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.status}
                            color={getTeamStatusColor(member.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {member.projects} project{member.projects !== 1 ? 's' : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </BaseDashboard>
  );
};

export default ProjectManagerDashboard;
