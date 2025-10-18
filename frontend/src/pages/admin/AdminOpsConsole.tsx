import React from 'react';
import { Box, Button, Card, CardContent, Grid, Typography, TextField } from '@mui/material';
import api from '../../services/api';

const AdminOpsConsole: React.FC = () => {
  const [summary, setSummary] = React.useState<any>(null);
  const [jobs, setJobs] = React.useState<any>(null);
  const [deliveryId, setDeliveryId] = React.useState('');
  const [tags, setTags] = React.useState('');

  const load = async () => {
    const s = await api.get('/ops/summary');
    setSummary(s.data);
    const j = await api.get('/ops/jobs/status');
    setJobs(j.data);
  };
  React.useEffect(() => { load().catch(()=>{}); }, []);

  const invalidate = async () => {
    const arr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!arr.length) return;
    await api.post('/ops/cache/invalidate', { tags: arr });
  };
  const redeliver = async () => {
    if (!deliveryId) return;
    await api.post('/ops/webhooks/redeliver', { deliveryId: Number(deliveryId) });
  };
  const pause = async () => { await api.post('/ops/jobs/pause', {}); await load(); };
  const resume = async () => { await api.post('/ops/jobs/resume', {}); await load(); };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Admin Ops Console</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">System Summary</Typography>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{summary ? JSON.stringify(summary.metrics?.gauges || {}, null, 2) : 'Loading...'}</pre>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Job Queue</Typography>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{jobs ? JSON.stringify(jobs, null, 2) : 'Loading...'}</pre>
              <Box display="flex" gap={1}>
                <Button variant="outlined" onClick={pause}>Pause</Button>
                <Button variant="contained" onClick={resume}>Resume</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Cache Invalidation</Typography>
              <Box display="flex" gap={1} mt={1}>
                <TextField label="Tags (comma-separated)" size="small" fullWidth value={tags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} />
                <Button variant="contained" onClick={invalidate}>Invalidate</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Webhook Redelivery</Typography>
              <Box display="flex" gap={1} mt={1}>
                <TextField label="Delivery ID" size="small" fullWidth value={deliveryId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliveryId(e.target.value)} />
                <Button variant="contained" onClick={redeliver}>Re-Deliver</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOpsConsole;
