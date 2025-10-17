import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { EventLog } from '../models/EventLog';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { Material } from '../models/Material';
import { domainEventsTotal, domainEventPersistDuration } from '../monitoring/advancedMetrics';

export interface DomainEvent<TPayload = any> {
  name: string; // e.g., 'project.created'
  version?: string; // e.g., 'v1'
  timestamp: string;
  payload: TPayload;
  correlationId?: string;
}

class EventBus extends EventEmitter {
  emitEvent<T>(event: DomainEvent<T>) {
    super.emit(event.name, event);
    try {
      domainEventsTotal.inc({ event: event.name });
    } catch {/* metric failure ignored */}
    // Optional debug log
    if (process.env.EVENT_LOG_VERBOSE === 'true') {
      logger.debug(`Event emitted: ${event.name}`, { event });
    }
    // Fire and forget persistence (non-blocking)
    setImmediate(async () => {
      const start = process.hrtime.bigint();
      try {
        await EventLog.create({
          name: event.name,
          version: event.version,
          timestamp: new Date(event.timestamp),
          payload: event.payload as any,
          correlationId: event.correlationId
        });
        const diff = process.hrtime.bigint() - start;
        const seconds = Number(diff) / 1_000_000_000;
  try { domainEventPersistDuration.observe({ event: event.name, outcome: 'success' }, seconds); } catch { /* metric observe failed */ }
      } catch (e) {
        logger.warn('Failed to persist domain event', { name: event.name, error: (e as any).message });
        const diff = process.hrtime.bigint() - start;
        const seconds = Number(diff) / 1_000_000_000;
  try { domainEventPersistDuration.observe({ event: event.name, outcome: 'error' }, seconds); } catch { /* metric observe failed */ }
      }
    });
  }
  onEvent<T>(name: string, handler: (e: DomainEvent<T>) => void) {
    super.on(name, handler as any);
  }
}

export const eventBus = new EventBus();

// Verbose logging flag handled inside emitEvent; no onAny support in native EventEmitter.

// Helper to create standardized events
export function createEvent<T>(name: string, payload: T, correlationId?: string): DomainEvent<T> {
  return { name, payload, timestamp: new Date().toISOString(), correlationId, version: 'v1' };
}

export default eventBus;

// Inventory transaction persistence listener
eventBus.onEvent('inventory.transaction.recorded', async (evt) => {
  try {
    const { materialId, direction, quantity, resultingStock, type, referenceType, referenceId, notes, userId } = (evt as any).payload || {};
    if (!materialId || quantity === undefined || !direction) return;

    // Basic validation
    const material = await Material.findByPk(materialId);
    if (!material) return;

    await InventoryTransaction.create({
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
  } catch (err) {
    logger.warn('Failed to persist inventory transaction from event', { error: (err as any).message });
  }
});
