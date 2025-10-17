import { startOfDay, subDays } from 'date-fns';
import { Op } from 'sequelize';
import { EventLog, InventoryTransaction, KpiDailySnapshot } from '../../models';
import { logger } from '../../utils/logger';

// Aggregates metrics for a given UTC day (defaults to yesterday) and upserts snapshot
export async function aggregateDailyKpis(targetDate?: Date) {
  const day = startOfDay(targetDate || subDays(new Date(), 1));
  const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  const dayStr = day.toISOString().substring(0,10);

  logger.info('[kpi] Aggregating daily KPIs', { day: dayStr });

  // Quote events
  const quotesSent = await EventLog.count({ where: { name: 'quote.sent', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const quotesAccepted = await EventLog.count({ where: { name: 'quote.accepted', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const quoteConversionRate = quotesSent === 0 ? 0 : quotesAccepted / quotesSent;

  // Orders
  const ordersCreated = await EventLog.count({ where: { name: 'order.created', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const ordersDelivered = await EventLog.count({ where: { name: 'order.delivered', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });

  // Average order cycle (from created to delivered) for deliveries completed that day
  const deliveredOrderEvents = await EventLog.findAll({ where: { name: 'order.delivered', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } }, attributes: ['payload'] });
  let avgOrderCycleDays: number | null = null;
  if (deliveredOrderEvents.length > 0) {
    const durations: number[] = [];
    for (const ev of deliveredOrderEvents) {
      const payload: any = ev.payload || {};
      if (payload.createdAt && payload.deliveredAt) {
        const diffMs = new Date(payload.deliveredAt).getTime() - new Date(payload.createdAt).getTime();
        durations.push(diffMs / (1000*60*60*24));
      }
    }
    if (durations.length) {
      avgOrderCycleDays = durations.reduce((a,b)=>a+b,0)/durations.length;
    }
  }

  // Inventory net change (sum of in minus out quantities for the day)
  const inventoryIn = await InventoryTransaction.sum('quantity', { where: { direction: 'in', createdAt: { [Op.gte]: day, [Op.lt]: nextDay } } }) as number | null;
  const inventoryOut = await InventoryTransaction.sum('quantity', { where: { direction: 'out', createdAt: { [Op.gte]: day, [Op.lt]: nextDay } } }) as number | null;
  const inventoryNetChange = (inventoryIn || 0) - (inventoryOut || 0);

  const existing = await KpiDailySnapshot.findOne({ where: { date: dayStr } });
  if (existing) {
    await existing.update({
      quotesSent,
      quotesAccepted,
      quoteConversionRate,
      ordersCreated,
      ordersDelivered,
      avgOrderCycleDays: avgOrderCycleDays ?? undefined,
      inventoryNetChange
    });
  } else {
    await KpiDailySnapshot.create({
      date: dayStr as any,
      quotesSent,
      quotesAccepted,
      quoteConversionRate,
      ordersCreated,
      ordersDelivered,
      avgOrderCycleDays: avgOrderCycleDays ?? undefined,
      inventoryNetChange
    } as any);
  }

  logger.info('[kpi] Aggregation complete', { day: dayStr });
  return { day: dayStr, quotesSent, quotesAccepted, ordersCreated, ordersDelivered };
}

// Allow script execution: ts-node src/scripts/jobs/aggregateDailyKpis.ts
if (require.main === module) {
  aggregateDailyKpis().then(()=>process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}