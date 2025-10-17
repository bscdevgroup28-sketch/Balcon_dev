import '../bootstrap';
import { aggregateDailyKpis } from './aggregateDailyKpis';
import { EventLog } from '../../models/EventLog';
import { InventoryTransaction } from '../../models/InventoryTransaction';
import { KpiDailySnapshot } from '../../models/KpiDailySnapshot';
import { Material } from '../../models/Material';

// Ensure DATABASE_URL fallback for local invocation
// If isolated run requested, override DB file (done before any connection use ideally)
if (process.env.KPI_ISOLATED_DB === 'true') {
  process.env.DATABASE_URL = 'sqlite://kpi_temp.sqlite';
} else if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('sqlite')) {
  process.env.DATABASE_URL = 'sqlite://enhanced_database.sqlite';
}

Promise.resolve().then(async () => {
  const isolated = process.env.KPI_ISOLATED_DB === 'true';
  if (isolated) {
    // Attempt migration-based setup first
    try {
      const { spawnSync } = await import('child_process');
      const r = spawnSync('node', ['-r', 'ts-node/register', 'src/scripts/migrate.ts', 'up'], { stdio: 'inherit' });
      if (r.status !== 0) {
        console.warn('[kpi] Migration path failed; falling back to direct sync subset');
      }
    } catch (e) {
      console.warn('[kpi] Migration attempt errored, fallback to sync', (e as Error).message);
    }
  }

  // Ensure subset exists (fallback or supplement post-migrations)
  await Material.sync();
  await EventLog.sync();
  await InventoryTransaction.sync();
  await KpiDailySnapshot.sync();

  if (isolated) {
    const existingMaterials = await Material.count();
    if (existingMaterials === 0) {
      const mat = await Material.create({
        name: 'Steel Beam', category: 'Structural', unitOfMeasure: 'pieces', currentStock: 100, minimumStock: 10, reorderPoint: 20,
        unitCost: 50, markupPercentage: 20, sellingPrice: 60, leadTimeDays: 5, status: 'active'
      } as any);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24*60*60*1000 + 60*60*1000);
      const yIso = yesterday.toISOString();
      await EventLog.create({ name: 'quote.sent', timestamp: yesterday, payload: { id: 1 } });
      await EventLog.create({ name: 'quote.accepted', timestamp: new Date(yesterday.getTime() + 10*60*1000), payload: { id: 1 } });
      await EventLog.create({ name: 'order.created', timestamp: yesterday, payload: { id: 10, createdAt: yIso } });
      await EventLog.create({ name: 'order.delivered', timestamp: new Date(yesterday.getTime() + 6*60*60*1000), payload: { id: 10, createdAt: yIso, deliveredAt: new Date(yesterday.getTime() + 6*60*60*1000).toISOString() } });
      await InventoryTransaction.create({ materialId: mat.id, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 } as any);
      await InventoryTransaction.create({ materialId: mat.id, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 } as any);
    }
  }
  return aggregateDailyKpis();
}).then(r => {
  // eslint-disable-next-line no-console
  console.log('[kpi] local aggregation result', r);
  process.exit(0);
}).catch(err => {
  console.error('[kpi] local aggregation failed', err);
  process.exit(1);
});