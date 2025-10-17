"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const date_fns_1 = require("date-fns");
// Minimal attribute models (standalone) to avoid importing full domain
class EventLog extends sequelize_1.Model {
}
class InventoryTransaction extends sequelize_1.Model {
}
class KpiDailySnapshot extends sequelize_1.Model {
}
async function main() {
    const dbPath = process.env.KPI_DB_PATH || './kpi_isolated.sqlite';
    const sequelize = new sequelize_1.Sequelize(`sqlite:${dbPath}`, { logging: false });
    EventLog.init({
        id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: sequelize_1.DataTypes.STRING },
        version: { type: sequelize_1.DataTypes.STRING },
        timestamp: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        payload: { type: sequelize_1.DataTypes.JSON },
        correlationId: { type: sequelize_1.DataTypes.STRING }
    }, { sequelize, tableName: 'event_log', timestamps: true });
    InventoryTransaction.init({
        id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        materialId: { type: sequelize_1.DataTypes.INTEGER },
        type: { type: sequelize_1.DataTypes.STRING },
        direction: { type: sequelize_1.DataTypes.STRING },
        quantity: { type: sequelize_1.DataTypes.INTEGER },
        resultingStock: { type: sequelize_1.DataTypes.INTEGER }
    }, { sequelize, tableName: 'inventory_transactions', timestamps: true });
    KpiDailySnapshot.init({
        id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        date: { type: sequelize_1.DataTypes.STRING, unique: true },
        quotesSent: { type: sequelize_1.DataTypes.INTEGER },
        quotesAccepted: { type: sequelize_1.DataTypes.INTEGER },
        quoteConversionRate: { type: sequelize_1.DataTypes.FLOAT },
        ordersCreated: { type: sequelize_1.DataTypes.INTEGER },
        ordersDelivered: { type: sequelize_1.DataTypes.INTEGER },
        avgOrderCycleDays: { type: sequelize_1.DataTypes.FLOAT },
        inventoryNetChange: { type: sequelize_1.DataTypes.INTEGER }
    }, { sequelize, tableName: 'kpi_daily_snapshots', timestamps: true });
    await sequelize.sync({ force: true });
    // Seed synthetic data for yesterday
    const now = new Date();
    const day = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1));
    const created = new Date(day.getTime() + 60 * 60 * 1000);
    const delivered = new Date(created.getTime() + 6 * 60 * 60 * 1000);
    await EventLog.bulkCreate([
        { name: 'quote.sent', timestamp: created, payload: { id: 1 } },
        { name: 'quote.accepted', timestamp: new Date(created.getTime() + 10 * 60 * 1000), payload: { id: 1 } },
        { name: 'order.created', timestamp: created, payload: { id: 10, createdAt: created.toISOString() } },
        { name: 'order.delivered', timestamp: delivered, payload: { id: 10, createdAt: created.toISOString(), deliveredAt: delivered.toISOString() } }
    ]);
    await InventoryTransaction.bulkCreate([
        { materialId: 1, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 },
        { materialId: 1, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 }
    ]);
    // Aggregate
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const quotesSent = await EventLog.count({ where: { name: 'quote.sent', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const quotesAccepted = await EventLog.count({ where: { name: 'quote.accepted', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const ordersCreated = await EventLog.count({ where: { name: 'order.created', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const ordersDelivered = await EventLog.count({ where: { name: 'order.delivered', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const deliveredEvents = await EventLog.findAll({ where: { name: 'order.delivered', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    let avgOrderCycleDays = null;
    if (deliveredEvents.length) {
        const durations = [];
        for (const ev of deliveredEvents) {
            const payload = ev.payload || {};
            if (payload.createdAt && payload.deliveredAt) {
                durations.push((new Date(payload.deliveredAt).getTime() - new Date(payload.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            }
        }
        if (durations.length)
            avgOrderCycleDays = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    const inventoryIn = await InventoryTransaction.sum('quantity', { where: { direction: 'in', createdAt: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const inventoryOut = await InventoryTransaction.sum('quantity', { where: { direction: 'out', createdAt: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const inventoryNetChange = (inventoryIn || 0) - (inventoryOut || 0);
    const dayStr = day.toISOString().substring(0, 10);
    await KpiDailySnapshot.create({ date: dayStr, quotesSent, quotesAccepted, quoteConversionRate: quotesSent ? quotesAccepted / quotesSent : 0, ordersCreated, ordersDelivered, avgOrderCycleDays: avgOrderCycleDays ?? undefined, inventoryNetChange });
    const snapshot = await KpiDailySnapshot.findOne({ where: { date: dayStr } });
    console.log('[kpi:isolate] snapshot =>', snapshot?.toJSON());
    await sequelize.close();
}
if (require.main === module) {
    main().catch(e => { console.error(e); process.exit(1); });
}
