import { metrics } from '../monitoring/metrics';
import { EventEmitter } from 'events';
import { JobRecord } from '../models';

export interface Job<T=any> { id: string; type: string; payload: T; attempts: number; maxAttempts: number; enqueuedAt: number; scheduledFor?: number }
export type JobHandler = (job: Job) => Promise<void>;

interface QueueOptions { concurrency?: number }

export class InMemoryJobQueue extends EventEmitter {
  private queue: Job[] = [];
  private running = 0;
  private handlers: Map<string, JobHandler> = new Map();
  private concurrency: number;
  private nextTimer: NodeJS.Timeout | null = null;
  private paused = false;

  constructor(opts: QueueOptions = {}) {
    super();
    this.concurrency = opts.concurrency || 2;
    metrics.registerGauge('jobs.queue.length', () => this.queue.length);
    metrics.registerGauge('jobs.queue.running', () => this.running);
    // Oldest pending age (ms)
    try {
      metrics.registerGauge('jobs.pending.oldest_age_ms', () => {
        if (process.env.PERSIST_JOBS === 'true') {
          // Updated dynamically via async sampler; return last sampled value
          return (this as any)._oldestPendingAgeMs || 0;
        }
        if (!this.queue.length) return 0;
        const oldest = this.queue.reduce((m, j) => Math.min(m, j.enqueuedAt), Date.now());
        return Date.now() - oldest;
      });
    } catch { /* ignore */ }

    // Async sampler for oldest pending age when persistence enabled
    if (process.env.PERSIST_JOBS === 'true') {
      const sample = async () => {
        try {
          const rec = await JobRecord.findOne({ where: { status: 'pending' } as any, order: [['enqueuedAt','ASC']] });
          if (rec) (this as any)._oldestPendingAgeMs = Date.now() - rec.enqueuedAt.getTime();
          else (this as any)._oldestPendingAgeMs = 0;
        } catch { /* silent */ }
      };
      setInterval(sample, parseInt(process.env.JOBS_OLDEST_AGE_SAMPLE_MS || '30000')).unref?.();
      sample();

      // Graceful shutdown: on SIGINT/SIGTERM flip running jobs back to pending for recovery
      const graceful = async () => {
        try {
          await JobRecord.update({ status: 'pending' }, { where: { status: 'running' } as any });
        } catch { /* ignore */ }
        process.exit(0);
      };
      if (!process.env.JOBQUEUE_NO_SIG) {
        process.once('SIGINT', graceful);
        process.once('SIGTERM', graceful);
      }
    }
  }

  register(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  pause() {
    this.paused = true;
    this.emit('paused');
  }

  resume() {
    this.paused = false;
    this.emit('resumed');
    this.drain();
  }

  getStats() {
    return { queued: this.queue.length, running: this.running, handlers: Array.from(this.handlers.keys()), concurrency: this.concurrency, paused: this.paused };
  }

  async recoverPersisted() {
    if (process.env.PERSIST_JOBS !== 'true') return;
    try {
      const records = await JobRecord.findAll({ where: { status: 'pending' } as any });
      for (const r of records) {
        const job: Job = { id: `${r.id}`, type: r.type, payload: r.payload, attempts: r.attempts, maxAttempts: r.maxAttempts, enqueuedAt: r.enqueuedAt.getTime(), scheduledFor: r.scheduledFor?.getTime() };
        this.queue.push(job);
      }
      // Reset any stuck running to pending (lightweight recovery)
      await JobRecord.update({ status: 'pending' }, { where: { status: 'running' } as any });
      this.drain();
    } catch { /* ignore */ }
  }

  enqueue<T=any>(type: string, payload: T, maxAttempts = 3, delayMs = 0): Job {
    const now = Date.now();
    const job: Job<T> = { id: `${now}-${Math.random().toString(36).slice(2)}`, type, payload, attempts: 0, maxAttempts, enqueuedAt: now };
    if (delayMs > 0) {
      job.scheduledFor = now + delayMs;
    }
    this.queue.push(job);
    metrics.increment('jobs.enqueued');
    // Persist (best effort; ignore failures) if persistent mode flag set
    if (process.env.PERSIST_JOBS === 'true') {
      JobRecord.create({ type, payload, maxAttempts, scheduledFor: job.scheduledFor ? new Date(job.scheduledFor) : null }).catch(()=>{});
    }
    this.drain();
    return job;
  }

  private drain() {
    if (this.paused) return;
    // Sort queue so earliest scheduled time first
    this.queue.sort((a,b) => (a.scheduledFor || a.enqueuedAt) - (b.scheduledFor || b.enqueuedAt));
    while (this.running < this.concurrency && this.queue.length) {
      const job = this.queue[0];
      if (job.scheduledFor && job.scheduledFor > Date.now()) {
        // Schedule a wake-up if not already set or new job earlier than previous timer
        const delay = job.scheduledFor - Date.now();
        if (!this.nextTimer || delay < (this as any)._nextDelay) {
          if (this.nextTimer) clearTimeout(this.nextTimer);
          (this as any)._nextDelay = delay;
          this.nextTimer = setTimeout(() => { this.nextTimer = null; this.drain(); }, delay).unref?.() as any;
        }
        break; // earliest job not ready yet
      }
      this.queue.shift();
      this.run(job);
    }
  }

  private async run(job: Job) {
    this.running++;
    try {
      job.attempts++;
      const handler = this.handlers.get(job.type);
      if (!handler) throw new Error(`No handler for job type ${job.type}`);
      if (process.env.PERSIST_JOBS === 'true') {
        // Best effort update
        JobRecord.update({ status: 'running', attempts: job.attempts }, { where: { id: parseInt(job.id.split('-')[0],10) } }).catch(()=>{});
      }
  await handler(job);
      const latency = Date.now() - job.enqueuedAt;
  try { (metrics as any).observe('jobs.latency.ms', latency); } catch { /* ignore */ }
      metrics.increment('jobs.processed');
      this.emit('processed', job);
      if (process.env.PERSIST_JOBS === 'true') {
        JobRecord.update({ status: 'completed' }, { where: { id: parseInt(job.id.split('-')[0],10) } }).catch(()=>{});
      }
    } catch (err) {
      metrics.increment('jobs.failed');
      this.emit('failed', job, err);
      if (job.attempts < job.maxAttempts) {
        metrics.increment('jobs.retried');
        this.queue.push(job);
        if (process.env.PERSIST_JOBS === 'true') JobRecord.update({ status: 'pending', attempts: job.attempts }, { where: { id: parseInt(job.id.split('-')[0],10) } }).catch(()=>{});
      } else {
        this.emit('dead', job);
        if (process.env.PERSIST_JOBS === 'true') JobRecord.update({ status: 'failed' }, { where: { id: parseInt(job.id.split('-')[0],10) } }).catch(()=>{});
      }
    } finally {
      this.running--;
      this.drain();
    }
  }
}

export const jobQueue = new InMemoryJobQueue({ concurrency: parseInt(process.env.JOBS_CONCURRENCY || '2') });
