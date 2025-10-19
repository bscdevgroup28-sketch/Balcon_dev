import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Speed,
  Storage,
  Cloud,
  Schedule,
  Code,
  Assessment,
} from '@mui/icons-material';
import api from '../../services/api';

interface HealthCheck {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: number;
  version: string;
  environment: string;
  checks?: {
    database?: string;
  };
}

interface DeepHealthCheck extends HealthCheck {
  ok: boolean;
  latencyMs: number;
  migrations?: {
    pending: number;
    executed: number;
  };
  queue?: {
    handlers: number;
    concurrency: number;
  };
  exports?: {
    running: number;
    failed: number;
  };
  webhooks?: {
    pending: number;
    failed: number;
  };
  error?: string;
}

const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<DeepHealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      setError(null);
      const response = await api.get<DeepHealthCheck>('/health/deep');
      setHealth(response.data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health status');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchHealth();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string | boolean | undefined): 'success' | 'error' | 'warning' => {
    if (typeof status === 'boolean') {
      return status ? 'success' : 'error';
    }
    if (status === 'healthy' || status === 'ready') return 'success';
    if (status === 'degraded') return 'warning';
    return 'error';
  };

  const getStatusIcon = (ok: boolean) => {
    if (ok) return <CheckCircle color="success" />;
    return <Error color="error" />;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchHealth();
  };

  if (loading && !health) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <LinearProgress />
          <Typography align="center" sx={{ mt: 2 }}>
            Loading system health status...
          </Typography>
        </Paper>
      </Container>
    );
  }

  const overallStatus = health?.ok ?? false;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assessment /> System Health Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring of all system components
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Auto-refresh every 5 seconds">
            <Chip 
              label={autoRefresh ? "Auto-Refresh: ON" : "Auto-Refresh: OFF"}
              color={autoRefresh ? "primary" : "default"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Refresh now">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overall Status Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 3, 
          background: overallStatus 
            ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' 
            : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
          border: overallStatus ? '2px solid #4caf50' : '2px solid #f44336'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(overallStatus)}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {overallStatus ? 'All Systems Operational' : 'System Degraded'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={overallStatus ? "HEALTHY" : "DEGRADED"}
            color={overallStatus ? "success" : "error"}
            sx={{ fontSize: '1.1rem', fontWeight: 600, py: 3, px: 2 }}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Core Services */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cloud color="primary" /> Backend API
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right">
                        <Chip 
                          size="small"
                          label={health?.status || 'unknown'}
                          color={getStatusColor(health?.status)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Response Time</strong></TableCell>
                      <TableCell align="right">{health?.latencyMs || 0} ms</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Uptime</strong></TableCell>
                      <TableCell align="right">{formatUptime(health?.uptime || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Environment</strong></TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={health?.environment || 'unknown'} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Version</strong></TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={health?.version || 'unknown'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Database */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage color="primary" /> Database
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Connection</strong></TableCell>
                      <TableCell align="right">
                        <Chip 
                          size="small"
                          label={health?.checks?.database || 'unknown'}
                          color={getStatusColor(health?.checks?.database)}
                          icon={health?.checks?.database === 'healthy' ? <CheckCircle /> : <Error />}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Query Latency</strong></TableCell>
                      <TableCell align="right">{health?.responseTime || 0} ms</TableCell>
                    </TableRow>
                    {health?.migrations && (
                      <>
                        <TableRow>
                          <TableCell><strong>Migrations Executed</strong></TableCell>
                          <TableCell align="right">
                            <Chip size="small" label={health.migrations.executed} color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Migrations Pending</strong></TableCell>
                          <TableCell align="right">
                            <Chip 
                              size="small" 
                              label={health.migrations.pending}
                              color={health.migrations.pending > 0 ? 'warning' : 'success'}
                            />
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Queue */}
        {health?.queue && (
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule color="primary" /> Job Queue
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Registered Handlers</strong></TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={health.queue.handlers} color="info" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Concurrency Limit</strong></TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={health.queue.concurrency} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label="Operational" 
                            color="success"
                            icon={<CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Export Jobs */}
        {health?.exports && (
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code color="primary" /> Export Jobs
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Running Jobs</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.exports.running}
                            color={health.exports.running > 0 ? 'info' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Failed Jobs</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.exports.failed}
                            color={health.exports.failed > 0 ? 'warning' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.exports.failed > 5 ? "Degraded" : "Healthy"} 
                            color={health.exports.failed > 5 ? 'warning' : 'success'}
                            icon={health.exports.failed > 5 ? <Warning /> : <CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Webhooks */}
        {health?.webhooks && (
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed color="primary" /> Webhooks
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Pending Deliveries</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.webhooks.pending}
                            color={health.webhooks.pending > 10 ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Failed Deliveries</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.webhooks.failed}
                            color={health.webhooks.failed > 0 ? 'warning' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right">
                          <Chip 
                            size="small" 
                            label={health.webhooks.failed > 10 ? "Degraded" : "Healthy"} 
                            color={health.webhooks.failed > 10 ? 'warning' : 'success'}
                            icon={health.webhooks.failed > 10 ? <Warning /> : <CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed color="primary" /> Performance Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">API Response Time</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {health?.latencyMs || 0} ms
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, ((health?.latencyMs || 0) / 500) * 100)} 
                  color={(health?.latencyMs || 0) < 200 ? 'success' : (health?.latencyMs || 0) < 500 ? 'warning' : 'error'}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database Query Time</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {health?.responseTime || 0} ms
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, ((health?.responseTime || 0) / 200) * 100)} 
                  color={(health?.responseTime || 0) < 50 ? 'success' : (health?.responseTime || 0) < 200 ? 'warning' : 'error'}
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Target: API &lt; 200ms, DB &lt; 50ms
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer Info */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          System health dashboard updates every 5 seconds • Last refresh: {lastUpdate.toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Bal-Con Builders Management Platform v{health?.version || 'unknown'} • Environment: {health?.environment || 'unknown'}
        </Typography>
      </Paper>
    </Container>
  );
};

export default SystemHealthPage;
