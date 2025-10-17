import React, { useEffect, useState } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import api from '../../services/api';

interface HealthResponse {
  status: string;
  responseTime?: number;
  checks?: { database?: string };
  timestamp?: string;
}

const HealthStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setError(null);
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (e: any) {
      setError(e.message || 'unreachable');
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const color = health?.status === 'healthy' ? 'success' : error ? 'error' : 'warning';
  const label = health?.status === 'healthy' ? 'API: Healthy' : error ? 'API: Down' : 'API: ?';

  return (
    <Tooltip title={error ? `Error: ${error}` : `Last check: ${health?.timestamp || 'n/a'}`}> 
      <Box sx={{ display: 'inline-flex' }}>
        <Chip size="small" color={color as any} label={label} onClick={fetchHealth} variant="outlined" />
      </Box>
    </Tooltip>
  );
};

export default HealthStatus;