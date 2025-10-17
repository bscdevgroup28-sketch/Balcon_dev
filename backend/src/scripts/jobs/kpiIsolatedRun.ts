import { Sequelize, DataTypes, Op, Model } from 'sequelize';
import { startOfDay, subDays } from 'date-fns';

// Minimal attribute models (standalone) to avoid importing full domain
class EventLog extends Model {}
class InventoryTransaction extends Model {}
class KpiDailySnapshot extends Model {}

async function main() {
  const dbPath = process.env.KPI_DB_PATH || './kpi_isolated.sqlite';
  const sequelize = new Sequelize(`sqlite:${dbPath}`, { logging: false });

  EventLog.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    version: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    payload: { type: DataTypes.JSON },
    correlationId: { type: DataTypes.STRING }
  }, { sequelize, tableName: 'event_log', timestamps: true });

  InventoryTransaction.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    materialId: { type: DataTypes.INTEGER },
    type: { type: DataTypes.STRING },
    direction: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER },
    resultingStock: { type: DataTypes.INTEGER }
  }, { sequelize, tableName: 'inventory_transactions', timestamps: true });

  KpiDailySnapshot.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.STRING, unique: true },
    quotesSent: { type: DataTypes.INTEGER },
    quotesAccepted: { type: DataTypes.INTEGER },
    quoteConversionRate: { type: DataTypes.FLOAT },
    ordersCreated: { type: DataTypes.INTEGER },
    ordersDelivered: { type: DataTypes.INTEGER },
    avgOrderCycleDays: { type: DataTypes.FLOAT },
    inventoryNetChange: { type: DataTypes.INTEGER }
  }, { sequelize, tableName: 'kpi_daily_snapshots', timestamps: true });

  await sequelize.sync({ force: true });

  // Seed synthetic data for yesterday
  const now = new Date();
  const day = startOfDay(subDays(now, 1));
  const created = new Date(day.getTime() + 60 * 60 * 1000);
  const delivered = new Date(created.getTime() + 6 * 60 * 60 * 1000);
  await EventLog.bulkCreate([
    { name: 'quote.sent', timestamp: created, payload: { id: 1 } },
    { name: 'quote.accepted', timestamp: new Date(created.getTime() + 10*60*1000), payload: { id: 1 } },
    { name: 'order.created', timestamp: created, payload: { id: 10, createdAt: created.toISOString() } },
    { name: 'order.delivered', timestamp: delivered, payload: { id: 10, createdAt: created.toISOString(), deliveredAt: delivered.toISOString() } }
  ] as any);
  await InventoryTransaction.bulkCreate([
    { materialId: 1, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 },
    { materialId: 1, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 }
  ] as any);

  // Aggregate
  const nextDay = new Date(day.getTime() + 24*60*60*1000);
  const quotesSent = await EventLog.count({ where: { name: 'quote.sent', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const quotesAccepted = await EventLog.count({ where: { name: 'quote.accepted', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const ordersCreated = await EventLog.count({ where: { name: 'order.created', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const ordersDelivered = await EventLog.count({ where: { name: 'order.delivered', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  const deliveredEvents = await EventLog.findAll({ where: { name: 'order.delivered', timestamp: { [Op.gte]: day, [Op.lt]: nextDay } } });
  let avgOrderCycleDays: number | null = null;
  if (deliveredEvents.length) {
    const durations: number[] = [];
    for (const ev of deliveredEvents) {
      const payload: any = (ev as any).payload || {};
      if (payload.createdAt && payload.deliveredAt) {
        durations.push((new Date(payload.deliveredAt).getTime() - new Date(payload.createdAt).getTime())/(1000*60*60*24));
      }
    }
    if (durations.length) avgOrderCycleDays = durations.reduce((a,b)=>a+b,0)/durations.length;
  }
  const inventoryIn = await InventoryTransaction.sum('quantity', { where: { direction: 'in', createdAt: { [Op.gte]: day, [Op.lt]: nextDay } } }) as number | null;
  const inventoryOut = await InventoryTransaction.sum('quantity', { where: { direction: 'out', createdAt: { [Op.gte]: day, [Op.lt]: nextDay } } }) as number | null;
  const inventoryNetChange = (inventoryIn || 0) - (inventoryOut || 0);
  const dayStr = day.toISOString().substring(0,10);
  await KpiDailySnapshot.create({ date: dayStr, quotesSent, quotesAccepted, quoteConversionRate: quotesSent? quotesAccepted/quotesSent:0, ordersCreated, ordersDelivered, avgOrderCycleDays: avgOrderCycleDays ?? undefined, inventoryNetChange } as any);

  const snapshot = await KpiDailySnapshot.findOne({ where: { date: dayStr } });
  console.log('[kpi:isolate] snapshot =>', snapshot?.toJSON());
  await sequelize.close();
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

export {}; 