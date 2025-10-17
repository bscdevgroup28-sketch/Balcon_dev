import { sequelize } from '../../config/database';
import { EventLog, InventoryTransaction, KpiDailySnapshot, Material } from '../../models';
import { aggregateDailyKpis } from '../../scripts/jobs/aggregateDailyKpis';
import { startOfDay } from 'date-fns';

// Unit-ish test: sets up in-memory sqlite (if configured) and validates aggregation math.

describe('aggregateDailyKpis', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = 'sqlite::memory:';
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { await sequelize.close(); });

  test('computes counts, conversion rate, inventory net, and avg cycle', async () => {
    const baseDay = startOfDay(new Date()); // today

    // Seed events
    await EventLog.bulkCreate([
      { name: 'quote.sent', timestamp: new Date(baseDay.getTime() + 5*60*1000), payload: {} },
      { name: 'quote.sent', timestamp: new Date(baseDay.getTime() + 10*60*1000), payload: {} },
      { name: 'quote.accepted', timestamp: new Date(baseDay.getTime() + 20*60*1000), payload: {} },
      { name: 'order.created', timestamp: new Date(baseDay.getTime() + 30*60*1000), payload: { id: 1, createdAt: new Date(baseDay.getTime() + 30*60*1000).toISOString() } },
      { name: 'order.delivered', timestamp: new Date(baseDay.getTime() + 6*60*60*1000), payload: { id: 1, createdAt: new Date(baseDay.getTime() + 30*60*1000).toISOString(), deliveredAt: new Date(baseDay.getTime() + 6*60*60*1000).toISOString() } }
    ] as any);

    // Minimal material for FK
    const material: any = await Material.create({ name: 'Mat', category: 'cat', unitOfMeasure: 'unit', currentStock: 0, minimumStock: 0, reorderPoint: 0, unitCost: 1, markupPercentage: 0, sellingPrice: 1, leadTimeDays: 1, status: 'active' });

    await InventoryTransaction.bulkCreate([
      { materialId: material.id, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 10 },
      { materialId: material.id, type: 'consumption', direction: 'out', quantity: 3, resultingStock: 7 }
    ] as any);

    const result = await aggregateDailyKpis(baseDay);

    expect(result.quotesSent).toBe(2);
    expect(result.quotesAccepted).toBe(1);
    expect(result.ordersCreated).toBe(1);
    expect(result.ordersDelivered).toBe(1);

    const snapshot = await KpiDailySnapshot.findOne({ where: { date: result.day } });
    expect(snapshot).toBeTruthy();
    expect(Number(snapshot!.quoteConversionRate)).toBeCloseTo(0.5);
    expect(Number(snapshot!.inventoryNetChange)).toBe(7); // 10 in - 3 out
  });
});
