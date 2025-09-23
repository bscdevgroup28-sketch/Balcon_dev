"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metrics_1 = require("../monitoring/metrics");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json(metrics_1.metrics.snapshot());
});
router.get('/prometheus', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics_1.metrics.toPrometheus());
});
exports.default = router;
