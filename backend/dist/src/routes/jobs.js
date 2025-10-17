"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobQueue_1 = require("../jobs/jobQueue");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const enqueueSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    payload: zod_1.z.any().optional(),
    delayMs: zod_1.z.number().int().min(0).max(1000 * 60 * 60).default(0),
    maxAttempts: zod_1.z.number().int().min(1).max(10).default(3)
});
router.post('/enqueue', (req, res) => {
    try {
        const parsed = enqueueSchema.parse(req.body || {});
        const job = jobQueue_1.jobQueue.enqueue(parsed.type, parsed.payload || {}, parsed.maxAttempts, parsed.delayMs);
        res.status(202).json({ enqueued: true, job: { id: job.id, type: job.type, scheduledFor: job.scheduledFor } });
    }
    catch (e) {
        res.status(400).json({ error: 'ValidationError', message: e.message });
    }
});
exports.default = router;
