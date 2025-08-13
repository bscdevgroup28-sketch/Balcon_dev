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
  Build,
  Engineering,
  Inventory,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  Speed,
  Security,
  Construction,
  HandymanOutlined,
  SettingsApplications
} from '@mui/icons-material';
import BaseDashboard from '../../components/dashboard/BaseDashboard';

const ShopManagerDashboard: React.FC = () => {
  // Mock data for Shop Manager specific metrics
  const shopMetrics = {
    activeJobs: 6,
    equipmentUtilization: 87,
    safetyScore: 94,
    qualityScore: 96,
    productionEfficiency: 89,
    pendingMaintenance: 3
  };

  const activeWorkstations = [
    { id: 1, name: 'CNC Station A', operator: 'John Smith', project: 'BC-2025-023', status: 'running', progress: 75 },
    { id: 2, name: 'Welding Bay 1', operator: 'Mike Johnson', project: 'BC-2025-019', status: 'setup', progress: 10 },
    { id: 3, name: 'Assembly Line', operator: 'Sarah Chen', project: 'BC-2025-025', status: 'running', progress: 45 },
    { id: 4, name: 'Paint Booth', operator: 'David Wilson', project: 'BC-2025-021', status: 'cleaning', progress: 100 },
    { id: 5, name: 'Quality Station', operator: 'Lisa Rodriguez', project: 'BC-2025-023', status: 'inspection', progress: 90 }
  ];

  const equipmentStatus = [
    { name: 'CNC Machine #1', status: 'operational', utilization: 92, nextMaintenance: '3 days' },
    { name: 'Welding Equipment A', status: 'operational', utilization: 78, nextMaintenance: '1 week' },
    { name: 'Overhead Crane', status: 'maintenance', utilization: 0, nextMaintenance: 'Now' },
    { name: 'Air Compressor', status: 'operational', utilization: 85, nextMaintenance: '5 days' },
    { name: 'Paint System', status: 'operational', utilization: 65, nextMaintenance: '2 weeks' }
  ];

  const todaysProduction = [
    { project: 'BC-2025-023', component: 'Steel Framework', planned: 12, completed: 9, efficiency: 75 },
    { project: 'BC-2025-019', component: 'Metal Panels', planned: 24, completed: 28, efficiency: 117 },
    { project: 'BC-2025-025', component: 'Support Beams', planned: 8, completed: 7, efficiency: 88 },
    { project: 'BC-2025-021', component: 'Custom Fixtures', planned: 15, completed: 15, efficiency: 100 }
  ];

  const safetyAlerts = [
    { id: 1, type: 'reminder', message: 'Safety equipment inspection due tomorrow', priority: 'medium', time: '1 hour ago' },
    { id: 2, type: 'incident', message: 'Minor spill reported in Bay 3 - cleaned', priority: 'low', time: '3 hours ago' },
    { id: 3, type: 'training', message: 'Monthly safety training scheduled for Friday', priority: 'info', time: '5 hours ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'operational': return 'success';
      case 'setup': return 'warning';
      case 'cleaning': return 'info';
      case 'inspection': return 'info';
      case 'maintenance': return 'error';
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
    if (efficiency >= 100) return '#4caf50';
    if (efficiency >= 85) return '#8bc34a';
    if (efficiency >= 70) return '#ff9800';
    return '#f44336';
  };

  return (
    <BaseDashboard role="shop_manager" title="Shop Manager Dashboard">
      <Grid container spacing={3}>
        {/* Shop Operations Overview */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
            Shop Operations Control Center
          </Typography>
        </Grid>

        {/* Key Metrics Cards */}
        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Jobs
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.activeJobs}
                  </Typography>
                </Box>
                <Construction sx={{ fontSize: 40, color: '#e65100' }} />
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
                    Equipment Util.
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.equipmentUtilization}%
                  </Typography>
                </Box>
                <Engineering sx={{ fontSize: 40, color: '#2e7d32' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Safety Score
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.safetyScore}%
                  </Typography>
                </Box>
                <Security sx={{ fontSize: 40, color: '#1976d2' }} />
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
                    Quality Score
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.qualityScore}%
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: '#7b1fa2' }} />
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
                    Production Eff.
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.productionEfficiency}%
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, color: '#f57c00' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending Maint.
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {shopMetrics.pendingMaintenance}
                  </Typography>
                </Box>
                <Build sx={{ fontSize: 40, color: '#d32f2f' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Workstations */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
                Active Workstations
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Workstation</TableCell>
                      <TableCell>Operator</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeWorkstations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell>{station.name}</TableCell>
                        <TableCell>{station.operator}</TableCell>
                        <TableCell>{station.project}</TableCell>
                        <TableCell>
                          <Chip
                            label={station.status}
                            color={getStatusColor(station.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={station.progress}
                              sx={{ 
                                width: 60, 
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEfficiencyColor(station.progress)
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {station.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Alerts */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
                Safety & Alerts
              </Typography>
              <List sx={{ maxHeight: '280px', overflow: 'auto' }}>
                {safetyAlerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem>
                      <ListItemIcon>
                        {alert.type === 'reminder' && <Schedule color="warning" />}
                        {alert.type === 'incident' && <Warning color="error" />}
                        {alert.type === 'training' && <Security color="info" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.time}
                      />
                      <Chip
                        label={alert.priority}
                        color={getPriorityColor(alert.priority) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < safetyAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Equipment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
                Equipment Status
              </Typography>
              <List>
                {equipmentStatus.map((equipment, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Engineering color={getStatusColor(equipment.status) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={equipment.name}
                        secondary={`Next maintenance: ${equipment.nextMaintenance}`}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end">
                        <Chip
                          label={equipment.status}
                          color={getStatusColor(equipment.status) as any}
                          size="small"
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption">
                          {equipment.utilization}% util.
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < equipmentStatus.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Production */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
                Today's Production
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Component</TableCell>
                      <TableCell align="center">Planned</TableCell>
                      <TableCell align="center">Completed</TableCell>
                      <TableCell align="center">Efficiency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaysProduction.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.component}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.project}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.planned}</TableCell>
                        <TableCell align="center">{item.completed}</TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={getEfficiencyColor(item.efficiency)}
                          >
                            {item.efficiency}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 600 }}>
                Shop Controls
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
                      }}
                    >
                      <Engineering />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Equipment
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
                      }}
                    >
                      <Inventory />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Inventory
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
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
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
                      }}
                    >
                      <Security />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Safety
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
                      }}
                    >
                      <Assessment />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Quality
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Box textAlign="center">
                    <IconButton 
                      sx={{ 
                        bgcolor: '#fff3e0', 
                        color: '#e65100', 
                        mb: 1,
                        '&:hover': { bgcolor: '#ffcc02' }
                      }}
                    >
                      <Build />
                    </IconButton>
                    <Typography variant="caption" display="block">
                      Maintenance
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

export default ShopManagerDashboard;
