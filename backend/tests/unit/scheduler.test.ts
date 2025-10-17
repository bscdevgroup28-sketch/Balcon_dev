import { describe, it, expect, beforeAll, afterEach, jest } from '@jest/globals';
import { scheduler } from '../../src/jobs/scheduler';
import { jobQueue } from '../../src/jobs/jobQueue';

// Spy on enqueue
const enqueueSpy = jest.spyOn(jobQueue, 'enqueue');

describe('Scheduler', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Cancel all active tasks
    for (const id of Array.from((scheduler as any)._tasks.keys()) as string[]) {
      scheduler.cancel(id as string);
    }
    enqueueSpy.mockClear();
  });

  it('schedules and triggers a recurring job', () => {
    const task = scheduler.schedule('kpi.snapshot', 1000);
    expect(task).toBeDefined();
    // Fast-forward 3 intervals
    jest.advanceTimersByTime(3100);
    // At least 3 enqueues expected
    const calls = enqueueSpy.mock.calls.filter(c => c[0] === 'kpi.snapshot');
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  it('cancels a scheduled job', () => {
  const task = scheduler.schedule('kpi.snapshot', 300);
    // Fast forward exactly first interval
    jest.advanceTimersByTime(300);
    // Run pending timers (the first firing)
    jest.runOnlyPendingTimers();
  const countAtFirstFire = enqueueSpy.mock.calls.length;
  expect(countAtFirstFire).toBeGreaterThanOrEqual(1);
    const cancelled = scheduler.cancel(task.id);
    expect(cancelled).toBe(true);
    // Advance beyond another interval; no new enqueue should happen
    jest.advanceTimersByTime(1000);
    jest.runOnlyPendingTimers();
    const countAfter = enqueueSpy.mock.calls.length;
    expect(countAfter).toBe(countAtFirstFire);
  });
});
