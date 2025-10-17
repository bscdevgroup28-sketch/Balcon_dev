"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(qi) {
    const add = async (table, cols) => {
        try {
            await qi.addIndex(table, cols);
        }
        catch (e) {
            if (!/exists/i.test(e.message))
                throw e;
        }
    };
    await add('orders', ['status']);
    await add('orders', ['createdAt']);
    await add('work_orders', ['status']);
    await add('quotes', ['status']);
}
async function down(qi) {
    const drop = async (table, cols) => {
        try {
            await qi.removeIndex(table, cols);
        }
        catch { /* ignore */ }
    };
    await drop('orders', ['status']);
    await drop('orders', ['createdAt']);
    await drop('work_orders', ['status']);
    await drop('quotes', ['status']);
}
