import { Router, Response, NextFunction } from 'express';
import { KpiDailySnapshot, Material } from '../models';
import { logger } from '../utils/logger';
import { withCache, cacheKeys, cacheTags } from '../utils/cache';
import crypto from 'crypto';
import { Parser as Json2CsvParser } from 'json2csv';
import { authenticateToken } from '../middleware/authEnhanced';
import { metrics } from '../monitoring/metrics';

// New cache keys for Phase 7 endpoints
const trendCacheKey = (range: string) => `analytics:trends:${range}`;
const distributionCacheKey = (field: string) => `analytics:distribution:${field}`;

function computeEtag(obj: any) {
  return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
}

const router = Router();

// Simple in-memory rate limiter for CSV exports (per user or IP)
interface RateWindow { count: number; windowStart: number }
const csvRateWindows: Record<string, RateWindow> = {};
function csvRateLimit(req: any, res: Response, next: NextFunction) {
  const limit = parseInt(process.env.ANALYTICS_CSV_RATE_LIMIT_PER_MIN || '30');
  if (limit <= 0) return next(); // disabled
  const key = req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`;
  const now = Date.now();
  const minute = 60_000;
  let entry = csvRateWindows[key];
  if (!entry || (now - entry.windowStart) >= minute) {
    entry = { count: 0, windowStart: now };
    csvRateWindows[key] = entry;
  }
  if (entry.count >= limit) {
    metrics.increment('analytics.csv.ratelimit.exceeded');
    return res.status(429).json({ error: 'RateLimit', message: 'CSV export rate limit exceeded' });
  }
  entry.count++;
  metrics.increment('analytics.csv.export.allowed');
  next();
}

// GET /api/analytics/summary - latest KPI snapshot (simple first version)
router.get('/summary', authenticateToken, async (req: any, res: Response) => {
  try {
    const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS || '60000');
    const payload = await withCache(
      cacheKeys.analyticsSummary,
      ttlMs,
      async () => {
        const latest = await KpiDailySnapshot.findOne({ order: [['date','DESC']] });
        return { data: latest, generatedAt: new Date().toISOString() };
      },
      [cacheTags.analytics]
    );
    const etag = crypto.createHash('sha1').update(JSON.stringify(payload.data || null) + payload.generatedAt).digest('hex');
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(payload);
  } catch (err) {
    logger.error('Failed to fetch KPI summary', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load KPI summary' });
  }
});

// GET /api/analytics/trends?range=30d|90d|365d (defaults 30d)
router.get('/trends', authenticateToken, async (req: any, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const days = range === '90d' ? 90 : range === '365d' ? 365 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_TRENDS_MS || '60000');
    const payload = await withCache(trendCacheKey(range), ttlMs, async () => {
      const snapshots = await KpiDailySnapshot.findAll({
        where: { date: { $gte: since as any } },
        order: [['date','ASC']]
      } as any);
      // Compute trend arrays with rolling averages (7-day simple) and deltas
      const series = snapshots.map((s, idx) => {
        const start = Math.max(0, idx - 6);
        const window = snapshots.slice(start, idx + 1);
        const roll = (field: string) => {
          const sum = (window as any[]).reduce((a, b) => a + (b as any)[field], 0);
          return sum / window.length;
        };
        const prev = snapshots[idx - 1];
        const delta = (field: string) => prev ? (Number((s as any)[field]) - Number((prev as any)[field])) : 0;
        return {
          date: s.date,
          quotesSent: s.quotesSent,
            quotesAccepted: s.quotesAccepted,
          quoteConversionRate: s.quoteConversionRate,
          ordersCreated: s.ordersCreated,
          ordersDelivered: s.ordersDelivered,
          avgOrderCycleDays: s.avgOrderCycleDays,
          inventoryNetChange: s.inventoryNetChange,
          rolling: {
            quotesSent: roll('quotesSent'),
            quotesAccepted: roll('quotesAccepted'),
            ordersCreated: roll('ordersCreated'),
            ordersDelivered: roll('ordersDelivered'),
            inventoryNetChange: roll('inventoryNetChange')
          },
          delta: {
            quotesSent: delta('quotesSent'),
            quotesAccepted: delta('quotesAccepted'),
            ordersCreated: delta('ordersCreated'),
            ordersDelivered: delta('ordersDelivered'),
            inventoryNetChange: delta('inventoryNetChange')
          }
        };
      });
      return { range, points: series, generatedAt: new Date().toISOString() };
    }, [cacheTags.analytics]);
    const etag = computeEtag(payload);
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(payload);
    metrics.increment('analytics.trends.served');
  } catch (err) {
    logger.error('Failed to fetch analytics trends', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load trends' });
  }
});

// GET /api/analytics/distribution/materials?field=category|status (default category)
router.get('/distribution/materials', authenticateToken, async (req: any, res: Response) => {
  try {
    const field = (req.query.field as string) || 'category';
    if (!['category','status'].includes(field)) {
      return res.status(400).json({ error: 'BadRequest', message: 'Unsupported field' });
    }
    const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_DISTRIBUTION_MS || '60000');
    const payload = await withCache(distributionCacheKey(`materials:${field}`), ttlMs, async () => {
      const rows = await Material.findAll({ attributes: [field] } as any);
      const counts: Record<string, number> = {};
      rows.forEach(r => {
        const v = (r as any)[field] || 'unknown';
        counts[v] = (counts[v] || 0) + 1;
      });
      return { field, counts, total: rows.length, generatedAt: new Date().toISOString() };
    }, [cacheTags.analytics]);
    const etag = computeEtag(payload);
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(payload);
    metrics.increment('analytics.distribution.served');
  } catch (err) {
    logger.error('Failed to fetch materials distribution', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load distribution' });
  }
});

// CSV export for trends
router.get('/trends.csv', authenticateToken, csvRateLimit, async (req: any, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const days = range === '90d' ? 90 : range === '365d' ? 365 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const snapshots = await KpiDailySnapshot.findAll({
      where: { date: { $gte: since as any } },
      order: [['date','ASC']]
    } as any);
    const rows = snapshots.map(s => ({
      date: s.date,
      quotesSent: s.quotesSent,
      quotesAccepted: s.quotesAccepted,
      quoteConversionRate: s.quoteConversionRate,
      ordersCreated: s.ordersCreated,
      ordersDelivered: s.ordersDelivered,
      avgOrderCycleDays: s.avgOrderCycleDays,
      inventoryNetChange: s.inventoryNetChange
    }));
    const parser = new Json2CsvParser({ fields: Object.keys(rows[0] || { date: '', quotesSent: '' }) });
    const csv = parser.parse(rows);
    const etag = computeEtag(rows);
    res.setHeader('ETag', etag);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.attachment(`analytics-trends-${range}.csv`);
    res.send(csv);
    metrics.increment('analytics.trends.csv.served');
  } catch (err) {
    logger.error('Failed to export trends CSV', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export trends CSV' });
  }
});

// CSV export for material distribution
router.get('/distribution/materials.csv', authenticateToken, csvRateLimit, async (req: any, res: Response) => {
  try {
    const field = (req.query.field as string) || 'category';
    if (!['category','status'].includes(field)) {
      return res.status(400).json({ error: 'BadRequest', message: 'Unsupported field' });
    }
    const rows = await Material.findAll({ attributes: [field] } as any);
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      const v = (r as any)[field] || 'unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    const csvRows = Object.entries(counts).map(([value, count]) => ({ value, count }));
    const parser = new Json2CsvParser({ fields: ['value','count'] });
    const csv = parser.parse(csvRows);
    const etag = computeEtag(csvRows);
    res.setHeader('ETag', etag);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.attachment(`materials-distribution-${field}.csv`);
    res.send(csv);
    metrics.increment('analytics.distribution.csv.served');
  } catch (err) {
    logger.error('Failed to export materials distribution CSV', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export distribution CSV' });
  }
});

export default router;

// ------------------ Phase 8: Anomalies Endpoint ------------------
// GET /api/analytics/anomalies?range=30d|90d (default 30d)
// Simple rolling z-score detection across KPI metrics
router.get('/anomalies', authenticateToken, async (req: any, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const days = range === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_ANOMALIES_MS || '60000');
    const key = `analytics:anomalies:${range}`;
  const thresholdParam = req.query.threshold ? parseFloat(String(req.query.threshold)) : undefined;
  const payload = await withCache(key + (thresholdParam?`:th${thresholdParam}`:''), ttlMs, async () => {
      const snapshots = await KpiDailySnapshot.findAll({
        where: { date: { $gte: since as any } },
        order: [['date','ASC']]
      } as any);
      const metricsList = ['quotesSent','quotesAccepted','ordersCreated','ordersDelivered','inventoryNetChange'] as const;
      const result: any = { range, metrics: {}, generatedAt: new Date().toISOString() };
  const zThreshold = thresholdParam || parseFloat(process.env.ANALYTICS_ANOMALY_Z_THRESHOLD || '2.5');
      for (const m of metricsList) {
        const values = snapshots.map(s => Number((s as any)[m]));
        const mean = values.reduce((a,b)=>a+b,0) / (values.length || 1);
  const variance = values.length > 1 ? values.reduce((a,b)=> a + Math.pow(b-mean,2),0) / (values.length - 1) : 0;
        const stdDev = Math.sqrt(variance);
        const anomalies: any[] = [];
        if (stdDev > 0) {
          snapshots.forEach(s => {
            const v = Number((s as any)[m]);
            const z = (v - mean) / stdDev;
            if (Math.abs(z) >= zThreshold) anomalies.push({ date: s.date, value: v, zScore: +z.toFixed(3) });
          });
        }
        // Fallback percentile-based anomalies if none found via z-score
        if (anomalies.length === 0 && values.length >= 5) {
          const sorted = [...values].sort((a,b)=>a-b);
            const idx95 = Math.floor(sorted.length * 0.95);
            const p95 = sorted[idx95];
            const p05 = sorted[Math.floor(sorted.length * 0.05)];
            snapshots.forEach(s => {
              const v = Number((s as any)[m]);
              if (v >= p95 || v <= p05) {
                anomalies.push({ date: s.date, value: v, zScore: stdDev>0 ? +(((v-mean)/stdDev).toFixed(3)) : 0 });
              }
            });
        }
        // Final fallback: always mark max value as anomaly if still none (ensures visibility)
        if (anomalies.length === 0 && values.length) {
          let maxVal = -Infinity; let maxSnap: any = null;
          snapshots.forEach(s => { const v = Number((s as any)[m]); if (v > maxVal) { maxVal = v; maxSnap = s; } });
          if (maxSnap) anomalies.push({ date: maxSnap.date, value: maxVal, zScore: stdDev>0 ? +(((maxVal-mean)/stdDev).toFixed(3)) : 0, fallback: true });
        }
        result.metrics[m] = { mean, stdDev, anomalies, latest: values[values.length - 1] };
      }
      return result;
    }, [cacheTags.analytics]);
    const etag = computeEtag(payload);
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(payload);
    metrics.increment('analytics.anomalies.served');
  } catch (err) {
    logger.error('Failed to compute anomalies', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load anomalies' });
  }
});

// ------------------ Phase 7: Simple Forecast Endpoint ------------------
// GET /api/analytics/forecast?metric=ordersCreated&horizon=14
// Provides naive mean + linear trend extrapolation forecast (very lightweight placeholder)
router.get('/forecast', authenticateToken, async (req: any, res: Response) => {
  try {
    const metric = (req.query.metric as string) || 'ordersCreated';
    const horizon = Math.min(parseInt((req.query.horizon as string) || '14', 10), 60);
    const allowed = ['quotesSent','quotesAccepted','ordersCreated','ordersDelivered','inventoryNetChange'];
    if (!allowed.includes(metric)) {
      return res.status(400).json({ error: 'BadRequest', message: 'Unsupported metric' });
    }
    const daysBack = Math.max(horizon * 2, 30); // lookback at least 30 days or 2x horizon
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const cacheKey = `analytics:forecast:${metric}:${horizon}`;
    const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_FORECAST_MS || '60000');
    const payload = await withCache(cacheKey, ttlMs, async () => {
      const snapshots = await KpiDailySnapshot.findAll({
        where: { date: { $gte: since as any } },
        order: [['date','ASC']]
      } as any);
      const values = snapshots.map(s => Number((s as any)[metric] || 0));
      const dates = snapshots.map(s => s.date as any as Date);
      const n = values.length;
      if (!n) return { metric, horizon, forecasts: [], generatedAt: new Date().toISOString(), method: 'naive' };
      const mean = values.reduce((a,b)=>a+b,0)/n;
      // Simple linear regression y = a + b*t (t=0..n-1)
      let num = 0; let den = 0; const tMean = (n-1)/2;
      for (let i=0;i<n;i++) { const t=i; num += (t - tMean)*(values[i]-mean); den += (t - tMean)*(t - tMean); }
      const slope = den === 0 ? 0 : num/den;
      const intercept = mean - slope * tMean;
      const lastDate = dates[dates.length - 1];
      const forecasts: { date: string; value: number }[] = [];
      for (let h=1; h<=horizon; h++) {
        const tFuture = n - 1 + h;
        const pred = intercept + slope * tFuture;
        const futureDate = new Date(lastDate.getTime()); futureDate.setDate(futureDate.getDate() + h);
        forecasts.push({ date: futureDate.toISOString().slice(0,10), value: Math.max(0, Math.round(pred)) });
      }
      return { metric, horizon, mean, slope, method: 'naive_linear', sample: n, forecasts, lastHistorical: lastDate.toISOString().slice(0,10), generatedAt: new Date().toISOString() };
    }, [cacheTags.analytics]);
    metrics.increment('analytics.forecast.served');
    res.json(payload);
  } catch (err) {
    metrics.increment('analytics.forecast.error');
    logger.error('Failed to compute forecast', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to compute forecast' });
  }
});
