"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const jobQueue_1 = require("../jobs/jobQueue");
const authEnhanced_1 = require("../middleware/authEnhanced");
const metrics_1 = require("../monitoring/metrics");
const storage_1 = require("../services/storage");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const webhooks_1 = require("../services/webhooks");
const router = (0, express_1.Router)();
// GET /api/exports - list recent jobs (query: limit, status, type)
router.get('/', authEnhanced_1.authenticateToken, async (req, res) => {
    const where = {};
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.type)
        where.type = req.query.type;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const jobs = await models_1.ExportJob.findAll({ where, order: [['id', 'DESC']], limit });
    res.json(jobs.map(j => ({ id: j.id, type: j.type, status: j.status, createdAt: j.createdAt, startedAt: j.startedAt, completedAt: j.completedAt })));
});
// POST /api/exports - create export job
router.post('/', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const { type, params } = req.body || {};
        if (!['materials_csv', 'orders_csv', 'projects_csv'].includes(type)) {
            return res.status(400).json({ error: 'BadRequest', message: 'Unsupported export type' });
        }
        // Extended parameters: format (csv|jsonl) and compression (none|gzip)
        const fmt = params?.format || 'csv';
        if (!['csv', 'jsonl'].includes(fmt))
            return res.status(400).json({ error: 'BadRequest', message: 'Invalid format' });
        const compression = params?.compression || 'none';
        if (!['none', 'gzip'].includes(compression))
            return res.status(400).json({ error: 'BadRequest', message: 'Invalid compression' });
        // Basic incremental support: if params.since provided, store it
        const ej = await models_1.ExportJob.create({ type, params: { ...params, format: fmt, compression }, status: 'pending', attempts: 0, startedAt: new Date() });
        // enqueue immediate (no delay) for tests predictability
        jobQueue_1.jobQueue.enqueue('export.generate', { exportJobId: ej.id }, 3, 0);
        metrics_1.metrics.increment('exports.enqueued');
        (0, webhooks_1.publishEvent)('export.started', { id: ej.id, type: ej.type });
        res.status(202).json({ id: ej.id, status: ej.status });
    }
    catch (err) {
        res.status(500).json({ error: 'InternalServerError', message: 'Failed to enqueue export' });
    }
});
// GET /api/exports/:id - fetch job status
router.get('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const ej = await models_1.ExportJob.findByPk(req.params.id);
    if (!ej)
        return res.status(404).json({ error: 'NotFound', message: 'Export job not found' });
    // If using S3 and resultUrl is present, optionally refresh presigned URL when near expiration
    try {
        if (process.env.STORAGE_DRIVER === 's3' && ej.fileKey && ej.resultUrl) {
            // Heuristic: our S3 provider issues URLs with Expires param; if older than 10 minutes regenerate
            const updatedAgeMs = Date.now() - new Date(ej.updatedAt).getTime();
            const maxAge = (parseInt(process.env.S3_PRESIGN_REFRESH_MS || '600000')); // 10m default
            if (updatedAgeMs > maxAge) {
                const storage = (0, storage_1.getStorage)();
                const freshUrl = await storage.getDownloadUrl(ej.fileKey);
                await ej.update({ resultUrl: freshUrl });
            }
        }
    }
    catch (err) {
        // Log but do not fail status retrieval
        console.error('presign refresh failed', err);
    }
    const parts = (ej.params && ej.params.parts) || undefined;
    res.json({ id: ej.id, type: ej.type, status: ej.status, resultUrl: ej.resultUrl, errorMessage: ej.errorMessage, parts });
});
// GET /api/exports/download/:key - stream stored CSV (local driver only)
router.get('/download/:key', authEnhanced_1.authenticateToken, async (req, res) => {
    const key = req.params.key;
    const root = process.cwd();
    const baseDir = root.endsWith(path_1.default.sep + 'backend') ? path_1.default.join(root, 'exports') : path_1.default.join(root, 'backend', 'exports');
    const filePath = path_1.default.join(baseDir, key);
    if (!fs_1.default.existsSync(filePath))
        return res.status(404).json({ error: 'NotFound', message: 'File not found' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${path_1.default.basename(key)}"`);
    fs_1.default.createReadStream(filePath).pipe(res);
});
// POST /api/exports/token - issue one-time download token for a given fileKey
router.post('/token', authEnhanced_1.authenticateToken, async (req, res) => {
    const { fileKey, ttlSeconds = 300 } = req.body || {};
    if (!fileKey)
        return res.status(400).json({ error: 'BadRequest', message: 'fileKey required' });
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + Math.min(ttlSeconds, 3600) * 1000);
    await models_1.DownloadToken.create({ token, fileKey, expiresAt });
    res.json({ token, expiresAt });
});
// GET /api/exports/token/:token - redeem download token (no auth) -> stream file
router.get('/token/:token', async (req, res) => {
    const dt = await models_1.DownloadToken.findOne({ where: { token: req.params.token } });
    if (!dt)
        return res.status(404).json({ error: 'NotFound', message: 'Token not found' });
    if (dt.usedAt)
        return res.status(410).json({ error: 'Gone', message: 'Token already used' });
    if (dt.expiresAt.getTime() < Date.now())
        return res.status(410).json({ error: 'Expired', message: 'Token expired' });
    const root = process.cwd();
    const baseDir = root.endsWith(path_1.default.sep + 'backend') ? path_1.default.join(root, 'exports') : path_1.default.join(root, 'backend', 'exports');
    const filePath = path_1.default.join(baseDir, dt.fileKey);
    if (!fs_1.default.existsSync(filePath))
        return res.status(404).json({ error: 'NotFound', message: 'File not found' });
    await dt.update({ usedAt: new Date() });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${path_1.default.basename(dt.fileKey)}"`);
    fs_1.default.createReadStream(filePath).pipe(res);
});
// GET /api/exports/:id/archive - download consolidated zip of multi-part export
router.get('/:id/archive', authEnhanced_1.authenticateToken, async (req, res) => {
    const ej = await models_1.ExportJob.findByPk(req.params.id);
    if (!ej)
        return res.status(404).json({ error: 'NotFound', message: 'Export job not found' });
    if (ej.status !== 'completed')
        return res.status(400).json({ error: 'BadRequest', message: 'Export not completed' });
    const parts = (ej.params && ej.params.parts) || [];
    if (!parts.length)
        return res.status(400).json({ error: 'BadRequest', message: 'No parts to archive' });
    const root = process.cwd();
    const baseDir = root.endsWith(path_1.default.sep + 'backend') ? path_1.default.join(root, 'exports') : path_1.default.join(root, 'backend', 'exports');
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="export-${ej.id}.zip"`);
    archive.pipe(res);
    for (const part of parts) {
        const filePath = path_1.default.join(baseDir, part.fileKey);
        if (fs_1.default.existsSync(filePath)) {
            archive.file(filePath, { name: part.fileKey });
        }
    }
    await archive.finalize();
    metrics_1.metrics.increment('exports.archived');
});
exports.default = router;
