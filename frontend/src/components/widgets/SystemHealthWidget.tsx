import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Alert, Card, CardContent, Grid } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import api from '../../services/api';

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  database?: {
    ok: boolean;
    message?: string;
  };
  migrations?: {
    status: string;
    pending?: number;
  };
  redis?: {
    ok: boolean;
    message?: string;
  };
}

export const SystemHealthWidget = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/api/health/deep');
        setHealth(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch health:', err);
        setError('Unable to fetch system health status');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const getStatusIcon = (ok: boolean | undefined) => {
    if (ok === undefined) return <Warning color="warning" />;
    return ok ? <CheckCircle color="success" /> : <ErrorIcon color="error" />;
  };

  const getStatusColor = (ok: boolean | undefined): "success" | "error" | "warning" => {
    if (ok === undefined) return "warning";
    return ok ? "success" : "error";
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Database Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {getStatusIcon(health?.database?.ok)}
                <Typography variant="h6">Database</Typography>
              </Box>
              <Chip
                label={health?.database?.ok ? 'Connected' : 'Disconnected'}
                color={getStatusColor(health?.database?.ok)}
                size="small"
              />
              {health?.database?.message && (
                <Typography variant="caption" display="block" mt={1} color="text.secondary">
                  {health.database.message}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Migrations Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {getStatusIcon(health?.migrations?.status === 'up-to-date')}
                <Typography variant="h6">Migrations</Typography>
              </Box>
              <Chip
                label={
                  health?.migrations?.status === 'up-to-date'
                    ? 'Up to Date'
                    : health?.migrations?.pending
                    ? `${health.migrations.pending} Pending`
                    : 'Unknown'
                }
                color={
                  health?.migrations?.status === 'up-to-date'
                    ? 'success'
                    : health?.migrations?.pending
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Redis Status (if available) */}
        {health?.redis && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  {getStatusIcon(health.redis.ok)}
                  <Typography variant="h6">Redis Cache</Typography>
                </Box>
                <Chip
                  label={health.redis.ok ? 'Connected' : 'Disconnected'}
                  color={getStatusColor(health.redis.ok)}
                  size="small"
                />
                {health.redis.message && (
                  <Typography variant="caption" display="block" mt={1} color="text.secondary">
                    {health.redis.message}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* System Info */}
        <Grid item xs={12} md={health?.redis ? 6 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Info</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip
                    label={health?.status || 'Unknown'}
                    color={health?.status === 'healthy' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Uptime:</Typography>
                  <Typography variant="body2">
                    {health?.uptime ? formatUptime(health.uptime) : 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Last Check:</Typography>
                  <Typography variant="body2">
                    {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        Auto-refreshes every 30 seconds
      </Typography>
    </Box>
  );
};
