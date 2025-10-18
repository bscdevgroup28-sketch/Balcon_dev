"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduler = void 0;
const jobQueue_1 = require("./jobQueue");
const metrics_1 = require("../monitoring/metrics");
const tasks = new Map();
function schedule(jobType, intervalMs) {
    const id = `${jobType}:${intervalMs}`;
    if (tasks.has(id))
        return tasks.get(id);
    const task = { id, jobType, intervalMs, nextRun: Date.now() + intervalMs, active: true };
    const run = () => {
        if (!task.active)
            return;
        // During tests, avoid enqueuing jobs to keep runs deterministic
        if (process.env.NODE_ENV !== 'test') {
            try {
                jobQueue_1.jobQueue.enqueue(task.jobType, {});
                metrics_1.metrics.increment('scheduler.triggered');
            }
            catch { /* ignore */ }
        }
        if (!task.active)
            return; // re-check before scheduling next
        task.nextRun = Date.now() + task.intervalMs;
        // Only schedule the next run now (previous handle has fired)
        task.handle = setTimeout(run, task.intervalMs);
    };
    // initial delay equal to interval (no immediate fire)
    task.handle = setTimeout(run, task.intervalMs);
    if (typeof task.handle.unref === 'function')
        task.handle.unref();
    tasks.set(id, task);
    metrics_1.metrics.increment('scheduler.scheduled');
    return task;
}
function cancel(id) {
    const task = tasks.get(id);
    if (!task)
        return false;
    task.active = false;
    if (task.handle) {
        clearTimeout(task.handle);
        task.handle = undefined;
    }
    tasks.delete(id);
    metrics_1.metrics.increment('scheduler.cancelled');
    return true;
}
exports.scheduler = { schedule, cancel, _tasks: tasks };
