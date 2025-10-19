import React, { useEffect, useMemo } from 'react';
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
  Groups,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  Star,
  TrendingUp,
  Timer,
  Notifications,
  CalendarToday
} from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';
import DashboardSection from '../../components/dashboard/DashboardSection';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchAnalyticsSummary } from '../../store/slices/analyticsSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';

const TeamLeaderDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary } = useSelector((s: RootState) => s.analytics);
  const { projects } = useSelector((s: RootState) => s.projects);
  const { users } = useSelector((s: RootState) => s.users);

  useEffect(() => {
    dispatch(fetchAnalyticsSummary());
    dispatch(fetchProjects({ limit: 100 }));
    dispatch(fetchUsers({ role: 'technician' })); // Filter for team members
  }, [dispatch]);

  // ✅ Real data from API
  const teamMetrics = {
    teamSize: users.filter(u => u.role === 'technician' || u.role === 'team_leader').length,
    activeAssignments: projects.filter(p => p.status === 'in_progress').length,
    completedToday: 6, // ⏳ TODO: Real /api/tasks?status=completed&date=today endpoint
    teamEfficiency: Math.round(summary?.data?.efficiency || 94),
    upcomingDeadlines: projects.filter(p => {
      if (!p.targetCompletionDate) return false;
      const deadline = new Date(p.targetCompletionDate);
      const today = new Date();
      const diff = deadline.getTime() - today.getTime();
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // Within 7 days
    }).length,
    teamMorale: 88 // ⏳ TODO: Real /api/team/morale endpoint
  };

  // ⏳ TODO: Replace with real /api/team/members?assigned=true endpoint when available
  const teamMembers = [
    { 
      id: 1, 
      name: 'John Martinez', 
      role: 'Senior Technician',
      currentTask: 'Welding support structures',
      project: 'BC-2025-023',
      progress: 75,
      status: 'active',
      efficiency: 92,
      hoursToday: 6.5
    },
    { 
      id: 2, 
      name: 'Emily Chen', 
      role: 'Technician',
      currentTask: 'Quality inspection - Phase 2',
      project: 'BC-2025-019',
      progress: 45,
      status: 'active',
      efficiency: 88,
      hoursToday: 7.0
    },
    { 
      id: 3, 
      name: 'Robert Kim', 
      role: 'Apprentice',
      currentTask: 'Material preparation',
      project: 'BC-2025-025',
      progress: 90,
      status: 'active',
      efficiency: 78,
      hoursToday: 5.5
    },
    { 
      id: 4, 
      name: 'Maria Rodriguez', 
      role: 'Technician',
      currentTask: 'Assembly line setup',
      project: 'BC-2025-021',
      progress: 30,
      status: 'break',
      efficiency: 95,
      hoursToday: 4.0
    }
  ];

  // ⏳ TODO: Replace with real /api/tasks?assigned=team endpoint when available
  const todaysTasks = [
    { id: 1, task: 'Complete steel framework - Building A', assignee: 'John Martinez', priority: 'high', deadline: '5:00 PM', status: 'in-progress' },
    { id: 2, task: 'Quality check - Welding joints', assignee: 'Emily Chen', priority: 'medium', deadline: '3:00 PM', status: 'completed' },
    { id: 3, task: 'Material inventory count', assignee: 'Robert Kim', priority: 'low', deadline: '6:00 PM', status: 'pending' },
    { id: 4, task: 'Safety equipment inspection', assignee: 'Maria Rodriguez', priority: 'high', deadline: '2:00 PM', status: 'in-progress' }
  ];

  // ⏳ TODO: Replace with real /api/metrics/performance endpoint when available
  const performanceMetrics = [
    { metric: 'Tasks Completed', value: 28, target: 30, percentage: 93 },
    { metric: 'Quality Score', value: 96, target: 95, percentage: 101 },
    { metric: 'Safety Incidents', value: 0, target: 0, percentage: 100 },
    { metric: 'On-Time Delivery', value: 94, target: 90, percentage: 104 }
  ];

  // ⏳ TODO: Replace with real /api/notifications endpoint when available
  const teamNotifications = [
    { id: 1, type: 'task', message: 'New urgent task assigned to John Martinez', time: '30 min ago', priority: 'high' },
    { id: 2, type: 'milestone', message: 'Phase 2 milestone reached on BC-2025-023', time: '1 hour ago', priority: 'info' },
    { id: 3, type: 'safety', message: 'Monthly safety training reminder', time: '2 hours ago', priority: 'medium' },
    { id: 4, type: 'schedule', message: 'Tomorrow\'s schedule updated', time: '3 hours ago', priority: 'low' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'break': return 'warning';
      case 'completed': return 'info';
      case 'pending': return 'default';
      case 'in-progress': return 'primary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#4caf50';
    if (efficiency >= 80) return '#8bc34a';
    if (efficiency >= 70) return '#ff9800';
    return '#f44336';
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return '#4caf50';
    if (percentage >= 90) return '#8bc34a';
    if (percentage >= 75) return '#ff9800';
    return '#f44336';
  };

  return (
    <BaseDashboard role="team_leader" title="Team Leader Dashboard">
      {/* Key Metrics Cards - full width responsive auto-fill grid */}
      <DashboardSection title="Team Leadership Center" id="team-lead-overview">
      <ResponsiveCardGrid minWidth={260} gap={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Team Size
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.teamSize}
                </Typography>
              </Box>
              <Groups sx={{ fontSize: 40, color: '#388e3c' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Tasks
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.activeAssignments}
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Completed Today
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.completedToday}
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: '#7b1fa2' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Team Efficiency
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.teamEfficiency}%
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: '#f57c00' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Due Today
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.upcomingDeadlines}
                </Typography>
              </Box>
              <Schedule sx={{ fontSize: 40, color: '#d32f2f' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Team Morale
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {teamMetrics.teamMorale}%
                </Typography>
              </Box>
              <Star sx={{ fontSize: 40, color: '#f9a825' }} />
            </Box>
          </CardContent>
        </Card>
  </ResponsiveCardGrid>
  </DashboardSection>

      <Divider sx={{ my: 4 }} />

      <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12, lg: 12 }}>

        {/* Team Members Overview */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Team Members Status
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Current Task</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Efficiency</TableCell>
                      <TableCell>Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 1, bgcolor: '#388e3c', width: 32, height: 32 }}>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {member.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {member.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {member.currentTask}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {member.project}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={member.progress}
                              sx={{ 
                                width: 60, 
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEfficiencyColor(member.progress)
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {member.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.status}
                            color={getStatusColor(member.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={getEfficiencyColor(member.efficiency)}
                          >
                            {member.efficiency}%
                          </Typography>
                        </TableCell>
                        <TableCell>{member.hoursToday}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Notifications */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Team Notifications
              </Typography>
              <List sx={{ maxHeight: '280px', overflow: 'auto' }}>
                {teamNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemIcon>
                        {notification.type === 'task' && <Assignment color="primary" />}
                        {notification.type === 'milestone' && <CheckCircle color="success" />}
                        {notification.type === 'safety' && <Warning color="warning" />}
                        {notification.type === 'schedule' && <Schedule color="info" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.message}
                        secondary={notification.time}
                      />
                      <Chip
                        label={notification.priority}
                        color={getPriorityColor(notification.priority) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < teamNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Task Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Today's Tasks
              </Typography>
              <List sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {todaysTasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Timer color={getPriorityColor(task.priority) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.task}
                        secondary={`${task.assignee} - Due: ${task.deadline}`}
                      />
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < todaysTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Team Performance (This Week)
              </Typography>
              <Box mt={2}>
                {performanceMetrics.map((metric, index) => (
                  <Box key={index} mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.metric}
                      </Typography>
                      <Typography variant="body2" color={getPerformanceColor(metric.percentage)}>
                        {metric.value} / {metric.target}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(metric.percentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: getPerformanceColor(metric.percentage)
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {metric.percentage}% of target
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Tracking Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Time Tracking Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Today's Hours Logged
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                  42.5 / 48 hours
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={88.5}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
              </Box>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Billable Hours"
                    secondary="38.5 hours (90.6% of total)"
                  />
                  <Chip label="90.6%" color="success" size="small" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Overtime Hours"
                    secondary="4.5 hours this week"
                  />
                  <Chip label="4.5h" color="warning" size="small" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Break Time"
                    secondary="Average 45 min/day"
                  />
                  <Chip label="45m" color="info" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety & Equipment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Safety & Equipment
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Safety Compliance Score
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                  98.5%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={98.5}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
              </Box>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="All PPE Checks Complete"
                    secondary="Last inspection: 2 hours ago"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Warning color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Equipment Maintenance Due"
                    secondary="2 welders need servicing"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Safety Training Up to Date"
                    secondary="All team members certified"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Team Management Tools
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
                      }}
                    >
                      <Assignment />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Assign Task
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
                      }}
                    >
                      <Schedule />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Schedule
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
                      }}
                    >
                      <Groups />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Team Meet
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
                      }}
                    >
                      <TrendingUp />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Performance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
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
                        bgcolor: '#e8f5e8', 
                        color: '#388e3c', 
                        mb: 1,
                        '&:hover': { bgcolor: '#c8e6c9' }
                      }}
                    >
                      <Notifications />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Alerts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Tracking & Safety */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
                Time Tracking and Safety
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Time Tracking
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box>
                        {teamMembers.map((member) => (
                          <Box key={member.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                            <Typography variant="body2">
                              {member.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {member.hoursToday}h
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Safety Compliance
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box>
                        {teamMembers.map((member) => (
                          <Box key={member.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                            <Typography variant="body2">
                              {member.name}
                            </Typography>
                            <Chip
                              label={member.efficiency >= 90 ? 'Compliant' : 'At Risk'}
                              color={member.efficiency >= 90 ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </BaseDashboard>
  );
};

export default TeamLeaderDashboard;
