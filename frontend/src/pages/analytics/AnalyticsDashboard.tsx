import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Grid, Select, MenuItem, FormControl, InputLabel, Chip, Tooltip, IconButton, Divider, CircularProgress, Button, LinearProgress, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import dayjs from 'dayjs';
import { useNotification } from '../../components/feedback/NotificationProvider';

interface TrendPoint {
  date: string;
  quotesSent: number;
  quotesAccepted: number;
  quoteConversionRate: number;
  ordersCreated: number;
  ordersDelivered: number;
  avgOrderCycleDays: number | null;
  inventoryNetChange: number;
  rolling?: {
    quotesSent: number; quotesAccepted: number; ordersCreated: number; ordersDelivered: number; inventoryNetChange: number;
  };
  delta?: {
    quotesSent: number; quotesAccepted: number; ordersCreated: number; ordersDelivered: number; inventoryNetChange: number;
  };
}

interface TrendsResponse {
  range: string;
  points: TrendPoint[];
  generatedAt: string;
}

interface DistributionResponse {
  field: string;
  counts: Record<string, number>;
  total: number;
  generatedAt: string;
}

interface SummaryResponse {
  data: any;
  generatedAt: string;
}

interface ExportJob {
  id: number;
  status: 'pending' | 'processing' | 'partial' | 'completed' | 'failed';
  type: string;
  progress?: number;
  error?: string;
  downloadUrl?: string;
  format?: 'csv' | 'jsonl';
  compression?: 'none' | 'gzip';
}

const fetchJson = async <T,>(url: string, token: string): Promise<T> => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
};

const API_BASE = '/api/analytics';

const rangeOptions = [ { value: '30d', label: '30 Days' }, { value: '90d', label: '90 Days' }, { value: '365d', label: '12 Months' } ];

// Basic sparkline component (inline SVG) to avoid heavy deps
const Sparkline: React.FC<{ values: number[]; color?: string; height?: number }> = ({ values, color = '#1976d2', height = 32 }) => {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const d = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const number = (v: any, d = 0) => typeof v === 'number' ? v.toFixed(d) : '-';

const AnalyticsDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [distribution, setDistribution] = useState<DistributionResponse | null>(null);
  const [range, setRange] = useState('30d');
  const [field, setField] = useState('category');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportJobs, setExportJobs] = useState<Record<string, ExportJob>>({});
  const [exportFormat, setExportFormat] = useState<'csv' | 'jsonl'>('csv');
  const [exportCompression, setExportCompression] = useState<'none' | 'gzip'>('none');
  const { showSuccess, showError: showErrorDialog, showWarning } = useNotification();

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [s, t, d] = await Promise.all([
        fetchJson<SummaryResponse>(`${API_BASE}/summary`, token),
        fetchJson<TrendsResponse>(`${API_BASE}/trends?range=${range}`, token),
        fetchJson<DistributionResponse>(`${API_BASE}/distribution/materials?field=${field}`, token)
      ]);
      setSummary(s); setTrends(t); setDistribution(d);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  }, [token, range, field]);

  useEffect(() => { load(); }, [load]);

  // Helper to map status -> progress
  const getProgressForStatus = useCallback((status: string): number => {
    switch (status) {
      case 'pending': return 10;
      case 'processing': return 50;
      case 'partial': return 75;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  }, []);

  const activeStatuses = useMemo(() => ['pending','processing','partial'], []);

  // Poller defined before startExport so startExport can depend on it cleanly
  const pollExportStatus = useCallback((jobId: number, type: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/exports/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to check export status');
        const raw = await response.json();
        // Map backend fields (resultUrl, errorMessage) -> frontend expectations
        const mapped: Partial<ExportJob> = {
          id: raw.id,
          status: raw.status,
          type: raw.type,
          downloadUrl: raw.resultUrl,
          error: raw.errorMessage,
        };
        setExportJobs(prev => {
          const prevJob = prev[type];
            return {
              ...prev,
              [type]: {
                ...prevJob,
                ...mapped,
                progress: getProgressForStatus(mapped.status || prevJob?.status || 'pending')
              }
            };
        });

        const status = raw.status as ExportJob['status'];
        if (status === 'completed' && raw.resultUrl) {
          const jobEntry = exportJobs[type];
          const extension = jobEntry?.format === 'jsonl' ? 'jsonl' : 'csv';
          // Auto download
          const link = document.createElement('a');
          link.href = raw.resultUrl;
          link.download = `${type}_${new Date().toISOString().split('T')[0]}.${extension}`;
          link.click();
          showSuccess(`${type.replace('_',' ')} export ready`, 'Export Complete');
        } else if (status === 'failed') {
          showWarning(`Export failed: ${raw.errorMessage || 'Unknown error'}`, 'Export Failed');
        } else if (activeStatuses.includes(status)) {
          setTimeout(poll, 2000);
        }
      } catch (err: any) {
        // Only surface as dialog if still active
        showErrorDialog({
          title: 'Export Polling Error',
          message: err.message || 'Failed while checking export status',
          canRetry: true,
          onRetry: () => pollExportStatus(jobId, type),
          reportable: true,
          errorCode: 'EXPORT_POLL'
        });
      }
    };
    poll();
  }, [token, getProgressForStatus, showSuccess, showWarning, showErrorDialog, exportJobs, activeStatuses]);

  const startExport = useCallback(async (type: 'materials_csv' | 'orders_csv' | 'projects_csv') => {
    // Prevent duplicate if active
    const existing = exportJobs[type];
    if (existing && existing.status && activeStatuses.includes(existing.status)) {
      showWarning('An export for this type is already in progress.', 'Export In Progress');
      return;
    }
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          params: { format: exportFormat, compression: exportCompression }
        })
      });
      if (!response.ok) throw new Error('Failed to start export');
      const job = await response.json();
      setExportJobs(prev => ({
        ...prev,
        [type]: { ...job, progress: 0, format: exportFormat, compression: exportCompression }
      }));
      pollExportStatus(job.id, type);
    } catch (err: any) {
      showErrorDialog({
        title: 'Failed to Start Export',
        message: err.message || 'Unknown error occurred while starting export',
        canRetry: true,
        onRetry: () => startExport(type),
        reportable: true,
        errorCode: 'EXPORT_START'
      });
    }
  }, [token, exportFormat, exportCompression, pollExportStatus, exportJobs, showWarning, showErrorDialog, activeStatuses]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+R or Cmd+R to refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        load();
      }
      // Ctrl+E or Cmd+E to start materials export
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        startExport('materials_csv');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [load, startExport]);

  const exportCsv = (type: 'trends' | 'distribution') => {
    const url = type === 'trends' ? `${API_BASE}/trends.csv?range=${range}` : `${API_BASE}/distribution/materials.csv?field=${field}`;
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', ''); link.setAttribute('target','_blank');
    link.click();
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <AssessmentIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>Analytics Dashboard</Typography>
        <Tooltip title={"Shortcuts: Ctrl/Cmd+R refresh • Ctrl/Cmd+E export materials"}>
          <IconButton size="small"><HelpOutlineIcon fontSize="inherit" /></IconButton>
        </Tooltip>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading} variant="outlined" size="small">Refresh</Button>
        <Box flexGrow={1} />
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel id="format-label">Format</InputLabel>
          <Select labelId="format-label" value={exportFormat} label="Format" onChange={e => setExportFormat(e.target.value as any)}>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="jsonl">JSONL</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="compression-label">Compression</InputLabel>
          <Select labelId="compression-label" value={exportCompression} label="Compression" onChange={e => setExportCompression(e.target.value as any)}>
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="gzip">GZip</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="range-label">Range</InputLabel>
          <Select labelId="range-label" value={range} label="Range" onChange={e => setRange(e.target.value)}>
            {rangeOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="field-label">Distribution</InputLabel>
          <Select labelId="field-label" value={field} label="Distribution" onChange={e => setField(e.target.value)}>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      {loading && <Box display="flex" alignItems="center" gap={1} mb={2}><CircularProgress size={20} /> <Typography variant="body2">Loading...</Typography></Box>}
      
      {/* Export Progress */}
      {Object.entries(exportJobs).length > 0 && (
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>Export Progress</Typography>
          {Object.entries(exportJobs).map(([type, job]) => (
            <Box key={type} mb={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="body2">{type.replace('_', ' ').toUpperCase()}</Typography>
                <Chip 
                  size="small" 
                  label={job.status} 
                  color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'primary'} 
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={job.progress || 0} 
                sx={{ height: 8, borderRadius: 4 }} 
              />
              {job.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {job.error}
                </Alert>
              )}
            </Box>
          ))}
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}><TimelineIcon color="action" /><Typography variant="subtitle1" fontWeight={600}>Summary</Typography></Box>
              {!summary && <Typography variant="body2" color="text.secondary">No summary available</Typography>}
              {summary && summary.data && (
                <Box display="grid" gridTemplateColumns="1fr 1fr" rowGap={0.5} columnGap={1} fontSize={13}>
                  <span>Quotes Sent</span><strong>{number(summary.data.quotesSent)}</strong>
                  <span>Quotes Accepted</span><strong>{number(summary.data.quotesAccepted)}</strong>
                  <span>Conversion %</span><strong>{number(Number(summary.data.quoteConversionRate) * 100, 1)}</strong>
                  <span>Orders Created</span><strong>{number(summary.data.ordersCreated)}</strong>
                  <span>Orders Delivered</span><strong>{number(summary.data.ordersDelivered)}</strong>
                  <span>Avg Cycle Days</span><strong>{number(Number(summary.data.avgOrderCycleDays),1)}</strong>
                  <span>Inventory Net</span><strong>{number(Number(summary.data.inventoryNetChange),1)}</strong>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">Gen: {summary?.generatedAt && dayjs(summary.generatedAt).format('MMM D HH:mm:ss')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}><TimelineIcon color="action" /><Typography variant="subtitle1" fontWeight={600}>Trends</Typography></Box>
              {!trends && <Typography variant="body2" color="text.secondary">No trends</Typography>}
              {trends && (
                <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1}>
                  {['quotesSent','quotesAccepted','ordersCreated','ordersDelivered','inventoryNetChange'].map(key => {
                    const values = trends.points.map(p => (p as any)[key]);
                    return (
                      <Box key={key}>
                        <Typography variant="caption" fontWeight={600}>{key}</Typography>
                        <Sparkline values={values} />
                        <Typography variant="caption" color="text.secondary">Last: {values[values.length - 1]}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" gap={1}>
                <Tooltip title="Export Materials CSV">
                  <IconButton 
                    size="small" 
                    onClick={() => startExport('materials_csv')}
                    disabled={exportJobs['materials_csv']?.status === 'processing'}
                  >
                    {exportJobs['materials_csv']?.status === 'processing' ? 
                      <CircularProgress size={16} /> : 
                      <DownloadIcon fontSize="small" />
                    }
                  </IconButton>
                </Tooltip>
                <Tooltip title="Quick CSV Download">
                  <IconButton size="small" onClick={() => exportCsv('trends')}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" ml={1} color="text.secondary">Updated: {trends?.generatedAt && dayjs(trends.generatedAt).format('MMM D HH:mm')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}><PieChartIcon color="action" /><Typography variant="subtitle1" fontWeight={600}>Distribution ({field})</Typography></Box>
              {!distribution && <Typography variant="body2" color="text.secondary">No distribution</Typography>}
              {distribution && (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {Object.entries(distribution.counts).map(([k, v]) => (
                    <Chip key={k} label={`${k}: ${v}`} size="small" />
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" gap={1}>
                <Tooltip title="Export Orders CSV">
                  <IconButton 
                    size="small" 
                    onClick={() => startExport('orders_csv')}
                    disabled={exportJobs['orders_csv']?.status === 'processing'}
                  >
                    {exportJobs['orders_csv']?.status === 'processing' ? 
                      <CircularProgress size={16} /> : 
                      <DownloadIcon fontSize="small" />
                    }
                  </IconButton>
                </Tooltip>
                <Tooltip title="Quick CSV Download">
                  <IconButton size="small" onClick={() => exportCsv('distribution')}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" ml={1} color="text.secondary">Updated: {distribution?.generatedAt && dayjs(distribution.generatedAt).format('MMM D HH:mm')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
