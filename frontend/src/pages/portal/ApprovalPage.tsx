import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Alert, Stack } from '@mui/material';
import api from '../../services/api';

const ApprovalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [info, setInfo] = useState<any>(null);
  const [done, setDone] = useState<string| null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/approvals/${token}`);
        setInfo(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.reason || e?.message || 'Failed to load approval');
      } finally { setLoading(false); }
    })();
  }, [token]);

  const submit = async (decision: 'approve'|'reject') => {
    try {
      await api.post(`/approvals/${token}/decision`, { decision });
      setDone(decision);
    } catch (e: any) {
      setError(e?.response?.data?.reason || e?.message || 'Failed to submit decision');
    }
  };

  if (loading) return <Box p={3}><Typography>Loading…</Typography></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;
  if (done) return <Box p={3}><Alert severity="success">Thank you. Your decision "{done}" has been recorded.</Alert></Box>;

  return (
    <Box p={3} display="flex" justifyContent="center">
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Project Approval</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please review and submit your decision.
          </Typography>
          <Stack spacing={2} sx={{ my: 2 }}>
            <Typography>Project ID: {info?.projectId}</Typography>
            {info?.quoteId && <Typography>Quote ID: {info.quoteId}</Typography>}
            {info?.orderId && <Typography>Order ID: {info.orderId}</Typography>}
            <Typography>Expires: {new Date(info?.expiresAt).toLocaleString()}</Typography>
          </Stack>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="success" onClick={() => submit('approve')}>Approve</Button>
            <Button variant="outlined" color="error" onClick={() => submit('reject')}>Reject</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApprovalPage;
