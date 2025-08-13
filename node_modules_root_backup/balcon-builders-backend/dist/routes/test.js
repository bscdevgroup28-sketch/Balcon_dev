"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sprint4Validation_1 = require("../controllers/sprint4Validation");
const router = (0, express_1.Router)();
// Simple test endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Bal-Con Builders API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: [
            '/api/test',
            '/api/projects',
            '/api/quotes',
            '/health'
        ]
    });
});
// Test data endpoint
router.get('/data', (req, res) => {
    res.json({
        users: [
            { id: 1, name: 'John Smith', email: 'john@example.com', role: 'admin' },
            { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user' }
        ],
        projects: [
            { id: 1, title: 'Metal Warehouse Structure', type: 'commercial', status: 'in_progress' },
            { id: 2, title: 'Residential Garage', type: 'residential', status: 'quoted' }
        ],
        quotes: [
            { id: 1, projectId: 1, amount: 25000, status: 'accepted' },
            { id: 2, projectId: 2, amount: 8500, status: 'sent' }
        ]
    });
});
// Sprint 4 feature validation
router.get('/sprint4', sprint4Validation_1.testSprint4Features);
// Create test data for Sprint 4
router.post('/sprint4/setup', sprint4Validation_1.createTestData);
exports.default = router;
