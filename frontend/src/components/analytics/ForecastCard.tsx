import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import Sparkline from '../charts/Sparkline';

interface ForecastPayload {
  metric: string;
  horizon: number;
  forecasts: { date: string; value: number }[];
  lastHistorical?: string;
  method?: string;
}

export default function ForecastCard({ data, loading, title }: { data: ForecastPayload | null; loading?: boolean; title?: string }) {
  const values = useMemo(() => (data?.forecasts || []).map(f => f.value), [data]);
  const last = values.length ? values[values.length - 1] : undefined;
  const first = values.length ? values[0] : undefined;
  const deltaPct = first && last ? ((last - first) / Math.max(1, first)) * 100 : 0;
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title || '14-Day Forecast'}</Typography>
          <Chip size="small" label={data?.metric || '—'} variant="outlined" />
        </Box>
        {loading ? (
          <Box sx={{ mt: 2, width: '100%', height: 40, bgcolor: 'action.hover', borderRadius: 1 }} />
        ) : (
          <>
            <Box sx={{ mt: 1 }}>
              <Sparkline data={values} width={260} height={48} stroke="#FF6F00" fill="rgba(255,111,0,0.15)" />
            </Box>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Method: {data?.method || 'naive'}</Typography>
              <Typography variant="body2" sx={{ color: deltaPct >= 0 ? 'success.main' : 'error.main' }}>
                {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
