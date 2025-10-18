import { eventBus } from '../../events/eventBus';
import { invalidateAnalyticsCaches } from '../../utils/cacheInvalidation';

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
  eventBus.onEvent(evt, async () => {
    // Best-effort, non-blocking
    invalidateAnalyticsCaches(evt).catch(()=>{});
  });
}

export {}; // side-effect module
