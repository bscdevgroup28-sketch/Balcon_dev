"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const featureFlagService_1 = require("../services/featureFlagService");
const authEnhanced_1 = require("../middleware/authEnhanced");
const securityAudit_1 = require("../utils/securityAudit");
// NOTE: In a production system, add authentication & role-based guard middleware here.
const router = (0, express_1.Router)();
router.get('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)('feature.flag.list'), async (req, res) => {
    const flags = await (0, featureFlagService_1.getAllFlags)();
    res.json(flags.map(f => ({
        key: f.key,
        enabled: f.enabled,
        rolloutStrategy: f.rolloutStrategy,
        percentage: f.percentage,
        audienceRoles: f.audienceRoles,
        description: f.description,
        updatedAt: f.updatedAt
    })));
});
router.get('/check/:key', async (req, res) => {
    const { key } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const enabled = await (0, featureFlagService_1.isFeatureEnabled)(key, { userRole, userId });
    res.json({ key, enabled });
});
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)('feature.flag.upsert'), async (req, res) => {
    try {
        const flag = await (0, featureFlagService_1.upsertFlag)(req.body);
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'feature.flag.upsert',
            outcome: 'success',
            meta: { key: flag.key, enabled: flag.enabled, strategy: flag.rolloutStrategy }
        });
        res.status(200).json(flag);
    }
    catch (e) {
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'feature.flag.upsert',
            outcome: 'failure',
            meta: { error: e.message, bodyKeys: Object.keys(req.body || {}) }
        });
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
