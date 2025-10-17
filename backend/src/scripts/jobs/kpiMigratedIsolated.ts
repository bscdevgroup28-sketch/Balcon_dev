// Run migrations against a fresh sqlite DB, seed minimal event/inventory data, then aggregate KPIs.
// Usage: ts-node src/scripts/jobs/kpiMigratedIsolated.ts kpi_kpiagg.sqlite
const dbFileArg = process.argv[2] || 'kpi_kpiagg.sqlite';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `sqlite:./${dbFileArg}`;
}
import { runAllMigrations } from '../migrationLoader';

async function main() {
  await runAllMigrations();
  // Import models after migrations
  const { EventLog, InventoryTransaction, Material } = await import('../../models');
  const { aggregateDailyKpis } = await import('./aggregateDailyKpis');
  // Seed only if empty
  const evCount = await EventLog.count();
  if (evCount === 0) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24*60*60*1000 + 60*60*1000);
    const createdAt = yesterday;
    const deliveredAt = new Date(yesterday.getTime() + 6*60*60*1000);
    await EventLog.bulkCreate([
      { name: 'quote.sent', timestamp: createdAt, payload: { id: 1 } },
      { name: 'quote.accepted', timestamp: new Date(createdAt.getTime() + 10*60*1000), payload: { id: 1 } },
      { name: 'order.created', timestamp: createdAt, payload: { id: 10, createdAt: createdAt.toISOString() } },
      { name: 'order.delivered', timestamp: deliveredAt, payload: { id: 10, createdAt: createdAt.toISOString(), deliveredAt: deliveredAt.toISOString() } }
    ] as any);
    // Ensure a material exists for FK (id=1)
    const material = await Material.create({
      name: 'Test Material',
      category: 'general',
      unitOfMeasure: 'unit',
      currentStock: 100,
      minimumStock: 10,
      reorderPoint: 20,
      unitCost: 5,
      markupPercentage: 20,
      sellingPrice: 6, // will be recalculated by hook but provide anyway
      leadTimeDays: 7,
      status: 'active'
    } as any);
    await InventoryTransaction.bulkCreate([
      { materialId: material.id, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 } as any,
      { materialId: material.id, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 } as any,
    ]);
  }
  const result = await aggregateDailyKpis();
  console.log('[kpi:migrated-isolated] result:', result);
}

main().catch(e => { console.error(e); process.exit(1); });