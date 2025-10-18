import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Divider } from '@mui/material';

interface MetricAnomalies {
  mean: number;
  stdDev: number;
  anomalies: { date: string; value: number; zScore: number; fallback?: boolean }[];
  latest?: number;
}

interface AnomaliesData {
  range: string;
  metrics: Record<string, MetricAnomalies>;
  generatedAt: string;
}

const metricLabels: Record<string, string> = {
  quotesSent: 'Quotes Sent',
  quotesAccepted: 'Quotes Accepted',
  ordersCreated: 'Orders Created',
  ordersDelivered: 'Orders Delivered',
  inventoryNetChange: 'Inventory Net Change',
};

export default function AnomaliesPanel({ data, loading }: { data: AnomaliesData | null; loading?: boolean }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Recent Anomalies</Typography>
          <Chip size="small" label={data ? data.range : '—'} variant="outlined" />
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading && (
          <Box sx={{ height: 80, bgcolor: 'action.hover', borderRadius: 1 }} />
        )}
        {!loading && data && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {Object.entries(data.metrics).map(([k, v]) => (
              <Box key={k} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {metricLabels[k] || k}
                </Typography>
                {v.anomalies && v.anomalies.length > 0 ? (
                  <>
                    {v.anomalies.slice(0, 2).map((a, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{a.date}</Typography>
                        <Chip size="small" color={Math.abs(a.zScore) >= 2.5 ? 'error' : 'warning'} label={`z=${a.zScore}`} />
                      </Box>
                    ))}
                    {v.anomalies.length > 2 && (
                      <Typography variant="caption" color="text.secondary">+{v.anomalies.length - 2} more</Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">No anomalies</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
