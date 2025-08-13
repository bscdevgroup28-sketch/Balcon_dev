"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
        // Check database connection
        await database_1.sequelize.authenticate();
        const responseTime = Date.now() - startTime;
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime,
            version: process.env.npm_package_version || 'unknown',
            environment: process.env.NODE_ENV || 'unknown',
            checks: {
                database: 'healthy',
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            checks: {
                database: 'unhealthy',
            }
        });
    }
});
exports.default = router;
