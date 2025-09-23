import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  People,
  Assignment,
  RequestQuote,
  TrendingUp,
  AttachMoney,
  Visibility,
  Edit,
  Warning,
  CheckCircle,
  Schedule,
  Security,
  Storage,
  Cloud,
  Settings,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BaseDashboard from '../../components/dashboard/BaseDashboard';
import ResponsiveCardGrid from '../../components/dashboard/ResponsiveCardGrid';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const adminStats = {
    totalUsers: 156,
    activeProjects: 24,
    pendingQuotes: 12,
    totalRevenue: 125000,
    monthlyGrowth: 15.5,
  };

  const recentUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', company: 'Smith Construction', joinDate: '2024-08-07' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@techinc.com', company: 'Tech Industries Inc.', joinDate: '2024-08-06' },
    { id: 3, name: 'Mike Wilson', email: 'mike@wilson.com', company: 'Wilson Builders', joinDate: '2024-08-05' },
  ];

  const urgentTasks = [
    { id: 1, type: 'quote', title: 'Quote #QT-2024-012 needs review', priority: 'high', dueDate: 'Today' },
    { id: 2, type: 'project', title: 'Industrial Complex - Phase 2 approval', priority: 'medium', dueDate: 'Tomorrow' },
    { id: 3, type: 'order', title: 'Order #OR-2024-008 delivery issue', priority: 'high', dueDate: 'Today' },
  ];

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'Low inventory: Steel beams (Grade A)', timestamp: '1 hour ago' },
    { id: 2, type: 'info', message: 'Scheduled maintenance completed', timestamp: '3 hours ago' },
    { id: 3, type: 'error', message: 'Payment gateway timeout reported', timestamp: '5 hours ago' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Warning color="error" />;
      case 'info': return <CheckCircle color="info" />;
      default: return <CheckCircle />;
    }
  };

  return (
    <BaseDashboard role="admin" title="Admin Dashboard" subtitle="System administration center and operational overview">
      {/* System Overview */}
      <Typography variant="h5" gutterBottom sx={{ color: '#424242', fontWeight: 600, mb: 3 }}>
        System Administration Center
      </Typography>

      {/* Stats Cards - full width responsive auto-fill grid */}
      <ResponsiveCardGrid minWidth={250} gap={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h3" color="primary">{adminStats.totalUsers}</Typography>
            <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/admin/users')}>
              Manage Users
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Projects</Typography>
            </Box>
            <Typography variant="h3" color="secondary">{adminStats.activeProjects}</Typography>
            <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/admin/projects')}>
              View Projects
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RequestQuote color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Quotes</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">{adminStats.pendingQuotes}</Typography>
            <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/admin/quotes')}>
              Review Quotes
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Revenue (MTD)</Typography>
            </Box>
            <Typography variant="h3" color="success.main">${adminStats.totalRevenue.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Month to date</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Growth</Typography>
            </Box>
            <Typography variant="h3" color="info.main">+{adminStats.monthlyGrowth}%</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>vs last month</Typography>
          </CardContent>
        </Card>
      </ResponsiveCardGrid>

      <Divider sx={{ my: 4 }} />

  <Grid container spacing={3} columns={{ xs: 12 }}>
        {/* Recent Users */}
  <Grid item xs={12} md={6} lg={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Recent Users
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/admin/users')}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.company}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.joinDate}</Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Urgent Tasks */}
  <Grid item xs={12} md={6} lg={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Urgent Tasks
            </Typography>
            <List>
              {urgentTasks.map((task) => (
                <ListItem key={task.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {task.title}
                        </Typography>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority) as any}
                        />
                      </Box>
                    }
                    secondary={`Due: ${task.dueDate}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* System Alerts */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Alerts
            </Typography>
            <List>
              {systemAlerts.map((alert) => (
                <ListItem key={alert.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getAlertIcon(alert.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={alert.timestamp}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System Health & Security */}
  <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#424242', fontWeight: 600 }}>
                System Health
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Overall System Status
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  98.5% Uptime
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
                    primary="Database"
                    secondary="All systems operational"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Services"
                    secondary="Response time: 45ms"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Warning color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup System"
                    secondary="Last backup: 2 hours ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security & Audit */}
  <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#424242', fontWeight: 600 }}>
                Security Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Security Score
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                  94/100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={94}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#2196f3'
                    }
                  }}
                />
              </Box>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Security color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Failed Login Attempts"
                    secondary="3 attempts in last 24h"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Storage color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Encryption"
                    secondary="All sensitive data encrypted"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Cloud color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cloud Services"
                    secondary="All integrations active"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Admin Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#424242', fontWeight: 600 }}>
                Administrative Tools
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
                      <People />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      User Management
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
                      <Security />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Security
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
                      <Storage />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Database
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
                      <Settings />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Settings
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
                      <Assessment />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Reports
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
                      <Cloud />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Integrations
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

export default AdminDashboard;
