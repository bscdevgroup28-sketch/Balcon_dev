"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateDailyKpis = aggregateDailyKpis;
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
// Aggregates metrics for a given UTC day (defaults to yesterday) and upserts snapshot
async function aggregateDailyKpis(targetDate) {
    const day = (0, date_fns_1.startOfDay)(targetDate || (0, date_fns_1.subDays)(new Date(), 1));
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const dayStr = day.toISOString().substring(0, 10);
    logger_1.logger.info('[kpi] Aggregating daily KPIs', { day: dayStr });
    // Quote events
    const quotesSent = await models_1.EventLog.count({ where: { name: 'quote.sent', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const quotesAccepted = await models_1.EventLog.count({ where: { name: 'quote.accepted', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const quoteConversionRate = quotesSent === 0 ? 0 : quotesAccepted / quotesSent;
    // Orders
    const ordersCreated = await models_1.EventLog.count({ where: { name: 'order.created', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const ordersDelivered = await models_1.EventLog.count({ where: { name: 'order.delivered', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    // Average order cycle (from created to delivered) for deliveries completed that day
    const deliveredOrderEvents = await models_1.EventLog.findAll({ where: { name: 'order.delivered', timestamp: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } }, attributes: ['payload'] });
    let avgOrderCycleDays = null;
    if (deliveredOrderEvents.length > 0) {
        const durations = [];
        for (const ev of deliveredOrderEvents) {
            const payload = ev.payload || {};
            if (payload.createdAt && payload.deliveredAt) {
                const diffMs = new Date(payload.deliveredAt).getTime() - new Date(payload.createdAt).getTime();
                durations.push(diffMs / (1000 * 60 * 60 * 24));
            }
        }
        if (durations.length) {
            avgOrderCycleDays = durations.reduce((a, b) => a + b, 0) / durations.length;
        }
    }
    // Inventory net change (sum of in minus out quantities for the day)
    const inventoryIn = await models_1.InventoryTransaction.sum('quantity', { where: { direction: 'in', createdAt: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const inventoryOut = await models_1.InventoryTransaction.sum('quantity', { where: { direction: 'out', createdAt: { [sequelize_1.Op.gte]: day, [sequelize_1.Op.lt]: nextDay } } });
    const inventoryNetChange = (inventoryIn || 0) - (inventoryOut || 0);
    const existing = await models_1.KpiDailySnapshot.findOne({ where: { date: dayStr } });
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
    }
    else {
        await models_1.KpiDailySnapshot.create({
            date: dayStr,
            quotesSent,
            quotesAccepted,
            quoteConversionRate,
            ordersCreated,
            ordersDelivered,
            avgOrderCycleDays: avgOrderCycleDays ?? undefined,
            inventoryNetChange
        });
    }
    logger_1.logger.info('[kpi] Aggregation complete', { day: dayStr });
    return { day: dayStr, quotesSent, quotesAccepted, ordersCreated, ordersDelivered };
}
// Allow script execution: ts-node src/scripts/jobs/aggregateDailyKpis.ts
if (require.main === module) {
    aggregateDailyKpis().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
