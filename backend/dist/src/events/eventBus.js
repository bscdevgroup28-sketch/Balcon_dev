"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
exports.createEvent = createEvent;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const EventLog_1 = require("../models/EventLog");
const InventoryTransaction_1 = require("../models/InventoryTransaction");
const Material_1 = require("../models/Material");
const advancedMetrics_1 = require("../monitoring/advancedMetrics");
class EventBus extends events_1.EventEmitter {
    emitEvent(event) {
        super.emit(event.name, event);
        try {
            advancedMetrics_1.domainEventsTotal.inc({ event: event.name });
        }
        catch { /* metric failure ignored */ }
        // Optional debug log
        if (process.env.EVENT_LOG_VERBOSE === 'true') {
            logger_1.logger.debug(`Event emitted: ${event.name}`, { event });
        }
        // Fire and forget persistence (non-blocking)
        setImmediate(async () => {
            const start = process.hrtime.bigint();
            try {
                await EventLog_1.EventLog.create({
                    name: event.name,
                    version: event.version,
                    timestamp: new Date(event.timestamp),
                    payload: event.payload,
                    correlationId: event.correlationId
                });
                const diff = process.hrtime.bigint() - start;
                const seconds = Number(diff) / 1000000000;
                try {
                    advancedMetrics_1.domainEventPersistDuration.observe({ event: event.name, outcome: 'success' }, seconds);
                }
                catch { /* metric observe failed */ }
            }
            catch (e) {
                logger_1.logger.warn('Failed to persist domain event', { name: event.name, error: e.message });
                const diff = process.hrtime.bigint() - start;
                const seconds = Number(diff) / 1000000000;
                try {
                    advancedMetrics_1.domainEventPersistDuration.observe({ event: event.name, outcome: 'error' }, seconds);
                }
                catch { /* metric observe failed */ }
            }
        });
    }
    onEvent(name, handler) {
        super.on(name, handler);
    }
}
exports.eventBus = new EventBus();
// Verbose logging flag handled inside emitEvent; no onAny support in native EventEmitter.
// Helper to create standardized events
function createEvent(name, payload, correlationId) {
    return { name, payload, timestamp: new Date().toISOString(), correlationId, version: 'v1' };
}
exports.default = exports.eventBus;
// Inventory transaction persistence listener
exports.eventBus.onEvent('inventory.transaction.recorded', async (evt) => {
    try {
        const { materialId, direction, quantity, resultingStock, type, referenceType, referenceId, notes, userId } = evt.payload || {};
        if (!materialId || quantity === undefined || !direction)
            return;
        // Basic validation
        const material = await Material_1.Material.findByPk(materialId);
        if (!material)
            return;
        await InventoryTransaction_1.InventoryTransaction.create({
            materialId,
            direction,
            quantity,
            resultingStock,
            type: type || 'adjustment',
            referenceType,
            referenceId,
            notes,
            userId
        });
    }
    catch (err) {
        logger_1.logger.warn('Failed to persist inventory transaction from event', { error: err.message });
    }
});
