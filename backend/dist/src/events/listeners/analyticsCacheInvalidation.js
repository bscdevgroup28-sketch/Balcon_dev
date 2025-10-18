"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventBus_1 = require("../../events/eventBus");
const cacheInvalidation_1 = require("../../utils/cacheInvalidation");
// Domain events that materially impact analytics
const ANALYTICS_EVENTS = [
    // Project lifecycle
    'project.created', 'project.updated', 'project.deleted',
    // Orders and status transitions
    'order.created', 'order.updated', 'order.deleted', 'order.status.changed', 'order.delivered',
    // Inventory and materials
    'inventory.transaction.recorded', 'material.created', 'material.updated', 'material.deleted', 'material.stock.changed'
];
for (const evt of ANALYTICS_EVENTS) {
    eventBus_1.eventBus.onEvent(evt, async () => {
        // Best-effort, non-blocking
        (0, cacheInvalidation_1.invalidateAnalyticsCaches)(evt).catch(() => { });
    });
}
