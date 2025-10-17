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
  Divider,
  Button
} from '@mui/material';
import {
  Build,
  Assignment,
  CheckCircle,
  Schedule,
  PlayArrow,
  Pause,
  Stop,
  Timer,
  Construction,
  SettingsApplications,
  Notifications,
  AccessTime,
  CameraAlt,
  Warning
} from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';
import DashboardSection from '../../components/dashboard/DashboardSection';
import WeatherWidget from '../../components/dashboard/WeatherWidget';

const TechnicianDashboard: React.FC = () => {
  // Mock data for Technician specific metrics
  const technicianMetrics = {
    assignedTasks: 5,
    completedToday: 3,
    hoursWorked: 6.5,
    efficiency: 92,
    currentProject: 'BC-2025-023',
    nextDeadline: '2:30 PM'
  };

  const currentTasks = [
    { 
      id: 1, 
      title: 'Weld support beams - Section A', 
      project: 'BC-2025-023',
      priority: 'high',
      estimatedTime: '4h',
      timeSpent: '2.5h',
      progress: 65,
      status: 'in-progress',
      dueTime: '5:00 PM',
      location: 'Bay 3'
    },
    { 
      id: 2, 
      title: 'Quality inspection - Joints 15-20', 
      project: 'BC-2025-023',
      priority: 'medium',
      estimatedTime: '1.5h',
      timeSpent: '0h',
      progress: 0,
      status: 'pending',
      dueTime: '3:30 PM',
      location: 'Quality Station'
    },
    { 
      id: 3, 
      title: 'Material preparation - Steel plates', 
      project: 'BC-2025-019',
      priority: 'low',
      estimatedTime: '2h',
      timeSpent: '0h',
      progress: 0,
      status: 'scheduled',
      dueTime: 'Tomorrow 9:00 AM',
      location: 'Storage Area'
    }
  ];

  const completedTasks = [
    { task: 'Mount bracket assemblies', project: 'BC-2025-023', completedAt: '11:30 AM', timeSpent: '1.5h' },
    { task: 'Safety equipment check', project: 'General', completedAt: '9:15 AM', timeSpent: '0.5h' },
    { task: 'Tool inventory', project: 'General', completedAt: '8:30 AM', timeSpent: '0.5h' }
  ];

  const workTimeTracker = {
    clockedIn: '7:30 AM',
    currentTime: '2:15 PM',
    totalHours: 6.75,
    breakTime: 0.5,
    productiveTime: 6.25,
    currentActivity: 'Welding support beams'
  };

  const announcements = [
    { id: 1, title: 'Weekly safety meeting', message: 'Tomorrow at 8:00 AM in conference room', priority: 'medium', time: '1 hour ago' },
    { id: 2, title: 'New tools available', message: 'Updated welding equipment in Bay 1', priority: 'info', time: '3 hours ago' },
    { id: 3, title: 'Project deadline reminder', message: 'BC-2025-023 Phase 2 due Friday', priority: 'high', time: '5 hours ago' }
  ];

  const quickActions = [
    { name: 'Clock In/Out', icon: AccessTime, color: '#1976d2' },
    { name: 'Take Photo', icon: CameraAlt, color: '#388e3c' },
    { name: 'Report Issue', icon: Notifications, color: '#f57c00' },
    { name: 'Request Help', icon: Build, color: '#7b1fa2' }
  ];

  const equipmentStatus = [
    { id: 1, name: 'Welding Machine', status: 'Operational', lastServiced: '2023-10-01' },
    { id: 2, name: 'Air Compressor', status: 'Maintenance Required', lastServiced: '2023-09-15' },
    { id: 3, name: 'Forklift', status: 'Operational', lastServiced: '2023-08-20' }
  ];

  const safetyChecklist = [
    { id: 1, item: 'Safety glasses', checked: true },
    { id: 2, item: 'Gloves', checked: true },
    { id: 3, item: 'Helmet', checked: false },
    { id: 4, item: 'Ear protection', checked: true }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'primary';
      case 'pending': return 'warning';
      case 'scheduled': return 'info';
      case 'completed': return 'success';
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#4caf50';
    if (progress >= 50) return '#ff9800';
    if (progress >= 25) return '#2196f3';
    return '#9e9e9e';
  };

  return (
    <BaseDashboard role="technician" title="Technician Dashboard">
      {/* Weather Widget - Critical for Field Work */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <WeatherWidget
            location="Austin, TX"
            showWorkability={true}
            useMockData={true}
          />
        </Grid>
      </Grid>

      {/* Quick Status Cards - full width responsive auto-fill grid */}
      <DashboardSection title="My Work Center" id="tech-work-center">
        <ResponsiveCardGrid minWidth={260} gap={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Assigned Tasks
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.assignedTasks}
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, color: '#d32f2f' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Completed Today
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.completedToday}
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: '#388e3c' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Hours Worked
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.hoursWorked}h
                </Typography>
              </Box>
              <Timer sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Efficiency
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.efficiency}%
                </Typography>
              </Box>
              <Build sx={{ fontSize: 40, color: '#f57c00' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Current Project
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.currentProject}
                </Typography>
              </Box>
              <Construction sx={{ fontSize: 40, color: '#7b1fa2' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Next Deadline
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {technicianMetrics.nextDeadline}
                </Typography>
              </Box>
              <Schedule sx={{ fontSize: 40, color: '#f9a825' }} />
            </Box>
          </CardContent>
        </Card>
        </ResponsiveCardGrid>
      </DashboardSection>

      <Divider sx={{ my: 4 }} />

      <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>

        {/* Active Work Timer */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Work Timer
              </Typography>
              <Box textAlign="center" mt={2}>
                <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                  {workTimeTracker.totalHours.toFixed(1)}h
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  Clocked in at {workTimeTracker.clockedIn}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Current: {workTimeTracker.currentActivity}
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={1} mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                  >
                    Start Task
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Pause />}
                    sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
                  >
                    Break
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Stop />}
                    sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
                  >
                    End Day
                  </Button>
                </Box>

                <Box mt={3}>
                  <Typography variant="body2" color="textSecondary">
                    Productive Time: {workTimeTracker.productiveTime}h | Break Time: {workTimeTracker.breakTime}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2} mt={1}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<action.icon />}
                      sx={{
                        height: 60,
                        borderColor: action.color,
                        color: action.color,
                        '&:hover': {
                          borderColor: action.color,
                          backgroundColor: `${action.color}10`
                        }
                      }}
                    >
                      {action.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Equipment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Equipment Status
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Welding Machine #3"
                    secondary="Last serviced: Yesterday - All systems green"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Warning color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Grinder Station 2"
                    secondary="Maintenance due in 3 days - Schedule service"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Safety Gear"
                    secondary="All PPE checked and compliant"
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Equipment Notes
                </Typography>
                <Typography variant="caption" display="block">
                  • New welding tips available in storage
                </Typography>
                <Typography variant="caption" display="block">
                  • Crane inspection scheduled for Friday
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Checklist */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Daily Safety Checklist
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="PPE Inspection"
                    secondary="Hard hat, gloves, safety glasses - All checked"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Work Area Safety"
                    secondary="No hazards identified, area cleared"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Equipment Safety"
                    secondary="All tools inspected and safe to use"
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Safety Score: 98/100
                </Typography>
                <Typography variant="caption" display="block">
                  • Perfect attendance on safety meetings
                </Typography>
                <Typography variant="caption" display="block">
                  • No safety incidents this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Tasks */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                My Current Tasks
              </Typography>
              <List>
                {currentTasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <Box width="100%">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            {task.project} - {task.location}
                          </Typography>
                          <Typography variant="body2">
                            Due: {task.dueTime}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" mb={1}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progress}
                            sx={{ 
                              flexGrow: 1, 
                              mr: 2,
                              height: 8,
                              borderRadius: 4,
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: getProgressColor(task.progress)
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {task.progress}%
                          </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" gap={1}>
                            <Chip
                              label={task.priority}
                              color={getPriorityColor(task.priority) as any}
                              size="small"
                            />
                            <Chip
                              label={`${task.timeSpent} / ${task.estimatedTime}`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          
                          <Box display="flex" gap={1}>
                            {task.status === 'pending' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PlayArrow />}
                                sx={{ bgcolor: '#4caf50' }}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'in-progress' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Pause />}
                                sx={{ bgcolor: '#ff9800' }}
                              >
                                Pause
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SettingsApplications />}
                            >
                              Details
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < currentTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity & Announcements */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
            {/* Completed Today */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    Completed Today
                  </Typography>
                  <List dense>
                    {completedTasks.map((task, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={task.task}
                            secondary={`${task.project} - ${task.completedAt} (${task.timeSpent})`}
                          />
                        </ListItem>
                        {index < completedTasks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Announcements */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    Announcements
                  </Typography>
                  <List dense>
                    {announcements.map((announcement, index) => (
                      <React.Fragment key={announcement.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Notifications color={getPriorityColor(announcement.priority) as any} fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={announcement.title}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {announcement.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {announcement.time}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < announcements.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Equipment & Safety */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600, mt: 4 }}>
            Equipment Status & Safety Checklist
          </Typography>
        </Grid>

        {/* Equipment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Equipment Status
              </Typography>
              <List dense>
                {equipmentStatus.map((equipment) => (
                  <ListItem key={equipment.id}>
                    <ListItemIcon>
                      <Build fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={equipment.name}
                      secondary={`Status: ${equipment.status} - Last Serviced: ${equipment.lastServiced}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Checklist */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
                Safety Checklist
              </Typography>
              <List dense>
                {safetyChecklist.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      {item.checked ? <CheckCircle color="success" fontSize="small" /> : <Build fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.item}
                      secondary={item.checked ? 'Checked' : 'Not Checked'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </BaseDashboard>
  );
};

export default TechnicianDashboard;
