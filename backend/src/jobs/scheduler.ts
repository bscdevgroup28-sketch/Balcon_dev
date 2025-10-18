import { jobQueue } from './jobQueue';
import { metrics } from '../monitoring/metrics';

interface ScheduledTask {
  id: string;
  jobType: string;
  intervalMs: number;
  nextRun: number;
  handle?: NodeJS.Timeout;
  active: boolean;
}

const tasks: Map<string, ScheduledTask> = new Map();

function schedule(jobType: string, intervalMs: number): ScheduledTask {
  const id = `${jobType}:${intervalMs}`;
  if (tasks.has(id)) return tasks.get(id)!;
  const task: ScheduledTask = { id, jobType, intervalMs, nextRun: Date.now() + intervalMs, active: true };
  const run = () => {
    if (!task.active) return;
    // Enqueue the job; unit tests expect triggers to happen even under NODE_ENV=test
    try {
      jobQueue.enqueue(task.jobType, {});
      metrics.increment('scheduler.triggered');
    } catch { /* ignore */ }
    if (!task.active) return; // re-check before scheduling next
    task.nextRun = Date.now() + task.intervalMs;
    // Only schedule the next run now (previous handle has fired)
    task.handle = setTimeout(run, task.intervalMs);
  };
  // initial delay equal to interval (no immediate fire)
  task.handle = setTimeout(run, task.intervalMs);
  if (typeof task.handle.unref === 'function') task.handle.unref();
  tasks.set(id, task);
  metrics.increment('scheduler.scheduled');
  return task;
}

function cancel(id: string) {
  const task = tasks.get(id);
  if (!task) return false;
  task.active = false;
  if (task.handle) { clearTimeout(task.handle); task.handle = undefined; }
  tasks.delete(id);
  metrics.increment('scheduler.cancelled');
  return true;
}

export const scheduler = { schedule, cancel, _tasks: tasks };
