import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useNotification } from '../../components/feedback/NotificationProvider';

interface Subscription {
  id: number; eventType: string; targetUrl: string; isActive: boolean; failureCount: number; lastSuccessAt?: string; lastFailureAt?: string; secret?: string;
}
interface Delivery { id: number; subscriptionId: number; eventType: string; status: string; attemptCount: number; responseCode?: number; errorMessage?: string; nextRetryAt?: string; createdAt?: string; }

const eventOptions = [ 'export.started', 'export.completed', 'export.failed' ];

const WebhooksAdmin: React.FC = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingDeliv, setLoadingDeliv] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState('export.completed');
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [deliveryFilterStatus, setDeliveryFilterStatus] = useState<string>('');
  const [deliveryFilterEvent, setDeliveryFilterEvent] = useState<string>('');

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch('/api/webhooks', { credentials: 'include' }); // Use httpOnly cookie
      if (!res.ok) throw new Error('Failed to load subscriptions');
      setSubs(await res.json());
    } catch (e:any) { showWarning(e.message, 'Load Subscriptions'); } finally { setLoadingSubs(false); }
  }, [showWarning]);

  const fetchDeliveries = useCallback( async () => {
    setLoadingDeliv(true);
    try {
      const params = new URLSearchParams();
      if (deliveryFilterStatus) params.set('status', deliveryFilterStatus);
      if (deliveryFilterEvent) params.set('eventType', deliveryFilterEvent);
      const res = await fetch(`/api/webhooks/deliveries?${params.toString()}`, { credentials: 'include' }); // Use httpOnly cookie
      if (!res.ok) throw new Error('Failed to load deliveries');
      setDeliveries(await res.json());
    } catch (e:any) { showWarning(e.message, 'Load Deliveries'); } finally { setLoadingDeliv(false); }
  }, [deliveryFilterStatus, deliveryFilterEvent, showWarning]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);
  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const createSub = async () => {
    if (!newUrl) { showWarning('Target URL required', 'Create Subscription'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ eventType: newEvent, targetUrl: newUrl }) });
      if (!res.ok) throw new Error('Failed to create subscription');
      const created = await res.json();
      setSubs(prev => [created, ...prev]);
      showSuccess('Subscription created', 'Webhook');
      setCreateOpen(false); setNewUrl('');
    } catch (e:any) { showError({ title: 'Create Failed', message: e.message }); } finally { setCreating(false); }
  };

  const toggleActive = async (s: Subscription) => {
    try {
      const res = await fetch(`/api/webhooks/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isActive: !s.isActive }) });
      if (!res.ok) throw new Error('Toggle failed');
      setSubs(prev => prev.map(p => p.id === s.id ? { ...p, isActive: !p.isActive } : p));
      showSuccess(!s.isActive ? 'Subscription enabled' : 'Subscription disabled');
    } catch (e:any) { showWarning(e.message, 'Toggle Active'); }
  };

  const rotateSecret = async (s: Subscription) => {
    try {
      const res = await fetch(`/api/webhooks/${s.id}/rotate-secret`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Rotate failed');
      const js = await res.json();
      showSuccess('Secret rotated');
      // Only show secret one time in a dialog
      showWarning(`New secret: ${js.secret}`, 'Store Secret Securely');
    } catch (e:any) { showWarning(e.message, 'Rotate Secret'); }
  };

  const retryDelivery = async (d: Delivery) => {
    try {
      const res = await fetch(`/api/webhooks/deliveries/${d.id}/retry`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Retry failed');
      showSuccess('Retry enqueued');
      fetchDeliveries();
    } catch (e:any) { showWarning(e.message, 'Retry Delivery'); }
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={600}>Webhooks Admin</Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setCreateOpen(true)}>New Subscription</Button>
        <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => { fetchSubs(); fetchDeliveries(); }}>Refresh</Button>
        <Box flexGrow={1} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="filter-status-label">Delivery Status</InputLabel>
          <Select labelId="filter-status-label" value={deliveryFilterStatus} label="Delivery Status" onChange={e => setDeliveryFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-event-label">Event</InputLabel>
          <Select labelId="filter-event-label" value={deliveryFilterEvent} label="Event" onChange={e => setDeliveryFilterEvent(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {eventOptions.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>Subscriptions</Typography>
                {loadingSubs && <CircularProgress size={18} />}
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Fail</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subs.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.id}</TableCell>
                      <TableCell>{s.eventType}</TableCell>
                      <TableCell>
                        <Tooltip title={s.targetUrl}><span style={{ maxWidth: 140, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>{s.targetUrl}</span></Tooltip>
                      </TableCell>
                      <TableCell>{s.isActive ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" color="default" label="Inactive" />}</TableCell>
                      <TableCell>{s.failureCount}</TableCell>
                      <TableCell>
                        <Tooltip title={s.isActive ? 'Disable' : 'Enable'}>
                          <IconButton size="small" onClick={() => toggleActive(s)}>{s.isActive ? <LinkOffIcon fontSize="small" /> : <LinkIcon fontSize="small" />}</IconButton>
                        </Tooltip>
                        <Tooltip title="Rotate Secret">
                          <IconButton size="small" onClick={() => rotateSecret(s)}><VpnKeyIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!subs.length && !loadingSubs && (
                    <TableRow>
                      {/* @ts-ignore MUI TableCell supports colSpan at runtime */}
                      <TableCell colSpan={6}>
                        <Typography variant="caption" color="text.secondary">No subscriptions</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>Recent Deliveries</Typography>
                {loadingDeliv && <CircularProgress size={18} />}
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Sub</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Resp</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Retry At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{d.subscriptionId}</TableCell>
                      <TableCell>{d.eventType}</TableCell>
                      <TableCell>{d.status === 'delivered' ? <Chip size="small" color="success" label="Delivered" /> : d.status === 'failed' ? <Chip size="small" color="error" label="Failed" /> : <Chip size="small" color="warning" label={d.status} />}</TableCell>
                      <TableCell>{d.responseCode || '-'}</TableCell>
                      <TableCell>{d.attemptCount}</TableCell>
                      <TableCell>{d.nextRetryAt ? new Date(d.nextRetryAt).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>
                        {d.status === 'failed' && (
                          <Tooltip title="Retry">
                            <IconButton size="small" onClick={() => retryDelivery(d)}><ReplayIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!deliveries.length && !loadingDeliv && (
                    <TableRow>
                      {/* @ts-ignore MUI TableCell supports colSpan at runtime */}
                      <TableCell colSpan={8}>
                        <Typography variant="caption" color="text.secondary">No deliveries</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Webhook Subscription</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl size="small" fullWidth>
              <InputLabel id="event-label">Event</InputLabel>
              <Select labelId="event-label" label="Event" value={newEvent} onChange={e => setNewEvent(e.target.value)}>
                {eventOptions.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Target URL" fullWidth value={newUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)} placeholder="https://example.com/webhook-endpoint" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createSub} variant="contained" disabled={creating}>{creating ? <CircularProgress size={16} /> : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebhooksAdmin;
