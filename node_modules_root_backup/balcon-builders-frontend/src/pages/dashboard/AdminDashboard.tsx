import React, { useEffect } from 'react';
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
} from '@mui/material';
import {
  People,
  Assignment,
  RequestQuote,
  ShoppingCart,
  TrendingUp,
  AttachMoney,
  Visibility,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System overview and management tools
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {adminStats.totalUsers}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => navigate('/admin/users')}
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Active Projects
                </Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {adminStats.activeProjects}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => navigate('/admin/projects')}
              >
                View Projects
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RequestQuote color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Pending Quotes
                </Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {adminStats.pendingQuotes}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => navigate('/admin/quotes')}
              >
                Review Quotes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Revenue (MTD)
                </Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                ${adminStats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Month to date
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Growth
                </Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                +{adminStats.monthlyGrowth}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
