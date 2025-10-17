import { describe, it, expect } from '@jest/globals';
import { InMemoryJobQueue } from '../../src/jobs/jobQueue';

describe('InMemoryJobQueue', () => {
  it('processes a job successfully', async () => {
    const q = new InMemoryJobQueue({ concurrency: 1 });
    let processed = 0;
    q.register('test.echo', async () => { processed++; });
    q.enqueue('test.echo', { msg: 'hello' });
    await new Promise(r => setTimeout(r, 50));
    expect(processed).toBe(1);
  });

  it('retries and marks dead after maxAttempts', async () => {
    const q = new InMemoryJobQueue({ concurrency: 1 });
    let attempts = 0; let dead = 0;
    q.on('dead', () => dead++);
    q.register('test.fail', async () => { attempts++; throw new Error('boom'); });
    q.enqueue('test.fail', { x: 1 }, 2);
    await new Promise(r => setTimeout(r, 120));
    expect(attempts).toBe(2);
    expect(dead).toBe(1);
  });
});
