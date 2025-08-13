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
  Divider
} from '@mui/material';
import {
  Assignment,
  Schedule,
  People,
  AttachMoney,
  TrendingUp,
  Warning,
  CheckCircle,
  Phone,
  Email,
  EventNote,
  FileCopy,
  Notifications
} from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';

const OfficeManagerDashboard: React.FC = () => {
  // Mock data for Office Manager specific metrics
  const adminMetrics = {
    pendingQuotes: 12,
    activeProjects: 8,
    overdueInvoices: 3,
    newLeads: 15,
    staffSchedule: 95, // percentage filled
    documentsPending: 7
  };

  const recentActivities = [
    { id: 1, type: 'quote', description: 'Quote #QT-2025-045 submitted to Johnson Construction', time: '2 hours ago', status: 'pending' },
    { id: 2, type: 'invoice', description: 'Invoice #INV-2025-089 overdue by 5 days', time: '3 hours ago', status: 'overdue' },
    { id: 3, type: 'lead', description: 'New lead: Downtown Office Complex renovation', time: '4 hours ago', status: 'new' },
    { id: 4, type: 'schedule', description: 'Team A schedule updated for next week', time: '6 hours ago', status: 'completed' }
  ];

  const pendingTasks = [
    { id: 1, task: 'Process insurance claim for Project #BC-2025-023', priority: 'high', deadline: 'Today' },
    { id: 2, task: 'Schedule client meeting for Heritage Mall project', priority: 'medium', deadline: 'Tomorrow' },
    { id: 3, task: 'Review and approve timesheet submissions', priority: 'medium', deadline: 'Aug 14' },
    { id: 4, task: 'Update project documentation for compliance audit', priority: 'low', deadline: 'Aug 16' }
  ];

  const staffOverview = [
    { name: 'Mike Chen', role: 'Project Manager', status: 'Available', projects: 3 },
    { name: 'Sarah Williams', role: 'Team Leader', status: 'On Site', projects: 2 },
    { name: 'David Rodriguez', role: 'Technician', status: 'Available', projects: 1 },
    { name: 'Lisa Thompson', role: 'Team Leader', status: 'Meeting', projects: 4 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'new': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'On Site': return 'info';
      case 'Meeting': return 'warning';
      case 'Unavailable': return 'error';
      default: return 'default';
    }
  };

  return (
    <BaseDashboard role="office_manager" title="Office Manager Dashboard">
      <Grid container spacing={3}>
        {/* Administrative Metrics */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
            Administrative Overview
          </Typography>
        </Grid>

        {/* Key Metrics Cards */}
        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending Quotes
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.pendingQuotes}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: '#7b1fa2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Projects
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.activeProjects}
                  </Typography>
                </Box>
                <EventNote sx={{ fontSize: 40, color: '#388e3c' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Overdue Invoices
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.overdueInvoices}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#d32f2f' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    New Leads
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.newLeads}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Staff Schedule
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.staffSchedule}%
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: '#f57c00' }} />
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
                    Pending Docs
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {adminMetrics.documentsPending}
                  </Typography>
                </Box>
                <FileCopy sx={{ fontSize: 40, color: '#7b1fa2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                Recent Administrative Activities
              </Typography>
              <List sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.type === 'quote' && <Assignment color="primary" />}
                        {activity.type === 'invoice' && <AttachMoney color="error" />}
                        {activity.type === 'lead' && <TrendingUp color="info" />}
                        {activity.type === 'schedule' && <Schedule color="success" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={activity.time}
                      />
                      <Chip
                        label={activity.status}
                        color={getStatusColor(activity.status) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                Priority Tasks
              </Typography>
              <List sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {pendingTasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications color={getPriorityColor(task.priority) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.task}
                        secondary={`Due: ${task.deadline}`}
                      />
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < pendingTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Staff Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                Staff Overview
              </Typography>
              <Grid container spacing={2}>
                {staffOverview.map((staff, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ mr: 2, bgcolor: '#7b1fa2' }}>
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {staff.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {staff.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={staff.status}
                          color={getStaffStatusColor(staff.status) as any}
                          size="small"
                        />
                        <Typography variant="body2">
                          {staff.projects} project{staff.projects !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Utilization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                Weekly Schedule Utilization
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Current Week: {adminMetrics.staffSchedule}% scheduled
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={adminMetrics.staffSchedule}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      backgroundColor: adminMetrics.staffSchedule > 90 ? '#4caf50' : adminMetrics.staffSchedule > 75 ? '#ff9800' : '#f44336'
                    }
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Target: 85-95% utilization
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e1bee7', 
                        color: '#7b1fa2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ce93d8' }
                      }}
                    >
                      <Assignment />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      New Quote
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e1bee7', 
                        color: '#7b1fa2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ce93d8' }
                      }}
                    >
                      <Schedule />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Schedule
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e1bee7', 
                        color: '#7b1fa2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ce93d8' }
                      }}
                    >
                      <AttachMoney />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Invoicing
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#e1bee7', 
                        color: '#7b1fa2', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ce93d8' }
                      }}
                    >
                      <People />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Staff
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

export default OfficeManagerDashboard;
