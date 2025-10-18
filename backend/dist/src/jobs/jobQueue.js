"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = exports.InMemoryJobQueue = void 0;
const metrics_1 = require("../monitoring/metrics");
const events_1 = require("events");
const models_1 = require("../models");
class InMemoryJobQueue extends events_1.EventEmitter {
    constructor(opts = {}) {
        super();
        this.queue = [];
        this.running = 0;
        this.handlers = new Map();
        this.nextTimer = null;
        this.paused = false;
        this.concurrency = opts.concurrency || 2;
        metrics_1.metrics.registerGauge('jobs.queue.length', () => this.queue.length);
        metrics_1.metrics.registerGauge('jobs.queue.running', () => this.running);
        // Oldest pending age (ms)
        try {
            metrics_1.metrics.registerGauge('jobs.pending.oldest_age_ms', () => {
                if (process.env.PERSIST_JOBS === 'true') {
                    // Updated dynamically via async sampler; return last sampled value
                    return this._oldestPendingAgeMs || 0;
                }
                if (!this.queue.length)
                    return 0;
                const oldest = this.queue.reduce((m, j) => Math.min(m, j.enqueuedAt), Date.now());
                return Date.now() - oldest;
            });
        }
        catch { /* ignore */ }
        // Async sampler for oldest pending age when persistence enabled
        if (process.env.PERSIST_JOBS === 'true') {
            const sample = async () => {
                try {
                    const rec = await models_1.JobRecord.findOne({ where: { status: 'pending' }, order: [['enqueuedAt', 'ASC']] });
                    if (rec)
                        this._oldestPendingAgeMs = Date.now() - rec.enqueuedAt.getTime();
                    else
                        this._oldestPendingAgeMs = 0;
                }
                catch { /* silent */ }
            };
            setInterval(sample, parseInt(process.env.JOBS_OLDEST_AGE_SAMPLE_MS || '30000')).unref?.();
            sample();
            // Graceful shutdown: on SIGINT/SIGTERM flip running jobs back to pending for recovery
            const graceful = async () => {
                try {
                    await models_1.JobRecord.update({ status: 'pending' }, { where: { status: 'running' } });
                }
                catch { /* ignore */ }
                process.exit(0);
            };
            if (!process.env.JOBQUEUE_NO_SIG) {
                process.once('SIGINT', graceful);
                process.once('SIGTERM', graceful);
            }
        }
    }
    register(type, handler) {
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
        if (process.env.PERSIST_JOBS !== 'true')
            return;
        try {
            const records = await models_1.JobRecord.findAll({ where: { status: 'pending' } });
            for (const r of records) {
                const job = { id: `${r.id}`, type: r.type, payload: r.payload, attempts: r.attempts, maxAttempts: r.maxAttempts, enqueuedAt: r.enqueuedAt.getTime(), scheduledFor: r.scheduledFor?.getTime() };
                this.queue.push(job);
            }
            // Reset any stuck running to pending (lightweight recovery)
            await models_1.JobRecord.update({ status: 'pending' }, { where: { status: 'running' } });
            this.drain();
        }
        catch { /* ignore */ }
    }
    enqueue(type, payload, maxAttempts = 3, delayMs = 0) {
        const now = Date.now();
        const job = { id: `${now}-${Math.random().toString(36).slice(2)}`, type, payload, attempts: 0, maxAttempts, enqueuedAt: now };
        if (delayMs > 0) {
            job.scheduledFor = now + delayMs;
        }
        this.queue.push(job);
        metrics_1.metrics.increment('jobs.enqueued');
        // Persist (best effort; ignore failures) if persistent mode flag set
        if (process.env.PERSIST_JOBS === 'true') {
            models_1.JobRecord.create({ type, payload, maxAttempts, scheduledFor: job.scheduledFor ? new Date(job.scheduledFor) : null }).catch(() => { });
        }
        this.drain();
        return job;
    }
    drain() {
        if (this.paused)
            return;
        // Sort queue so earliest scheduled time first
        this.queue.sort((a, b) => (a.scheduledFor || a.enqueuedAt) - (b.scheduledFor || b.enqueuedAt));
        while (this.running < this.concurrency && this.queue.length) {
            const job = this.queue[0];
            if (job.scheduledFor && job.scheduledFor > Date.now()) {
                // Schedule a wake-up if not already set or new job earlier than previous timer
                const delay = job.scheduledFor - Date.now();
                if (!this.nextTimer || delay < this._nextDelay) {
                    if (this.nextTimer)
                        clearTimeout(this.nextTimer);
                    this._nextDelay = delay;
                    this.nextTimer = setTimeout(() => { this.nextTimer = null; this.drain(); }, delay).unref?.();
                }
                break; // earliest job not ready yet
            }
            this.queue.shift();
            this.run(job);
        }
    }
    async run(job) {
        this.running++;
        try {
            job.attempts++;
            const handler = this.handlers.get(job.type);
            if (!handler)
                throw new Error(`No handler for job type ${job.type}`);
            if (process.env.PERSIST_JOBS === 'true') {
                // Best effort update
                models_1.JobRecord.update({ status: 'running', attempts: job.attempts }, { where: { id: parseInt(job.id.split('-')[0], 10) } }).catch(() => { });
            }
            await handler(job);
            const latency = Date.now() - job.enqueuedAt;
            try {
                metrics_1.metrics.observe('jobs.latency.ms', latency);
            }
            catch { /* ignore */ }
            metrics_1.metrics.increment('jobs.processed');
            this.emit('processed', job);
            if (process.env.PERSIST_JOBS === 'true') {
                models_1.JobRecord.update({ status: 'completed' }, { where: { id: parseInt(job.id.split('-')[0], 10) } }).catch(() => { });
            }
        }
        catch (err) {
            metrics_1.metrics.increment('jobs.failed');
            this.emit('failed', job, err);
            if (job.attempts < job.maxAttempts) {
                metrics_1.metrics.increment('jobs.retried');
                this.queue.push(job);
                if (process.env.PERSIST_JOBS === 'true')
                    models_1.JobRecord.update({ status: 'pending', attempts: job.attempts }, { where: { id: parseInt(job.id.split('-')[0], 10) } }).catch(() => { });
            }
            else {
                this.emit('dead', job);
                if (process.env.PERSIST_JOBS === 'true')
                    models_1.JobRecord.update({ status: 'failed' }, { where: { id: parseInt(job.id.split('-')[0], 10) } }).catch(() => { });
            }
        }
        finally {
            this.running--;
            this.drain();
        }
    }
}
exports.InMemoryJobQueue = InMemoryJobQueue;
exports.jobQueue = new InMemoryJobQueue({ concurrency: parseInt(process.env.JOBS_CONCURRENCY || '2') });
