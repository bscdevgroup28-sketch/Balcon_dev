import { Router } from 'express';
import { jobQueue } from '../jobs/jobQueue';
import { z } from 'zod';

const router = Router();

const enqueueSchema = z.object({
  type: z.string().min(1),
  payload: z.any().optional(),
  delayMs: z.number().int().min(0).max(1000 * 60 * 60).default(0),
  maxAttempts: z.number().int().min(1).max(10).default(3)
});

router.post('/enqueue', (req, res) => {
  try {
    const parsed = enqueueSchema.parse(req.body || {});
    const job = jobQueue.enqueue(parsed.type, parsed.payload || {}, parsed.maxAttempts, parsed.delayMs);
    res.status(202).json({ enqueued: true, job: { id: job.id, type: job.type, scheduledFor: job.scheduledFor } });
  } catch (e: any) {
    res.status(400).json({ error: 'ValidationError', message: e.message });
  }
});

export default router;
