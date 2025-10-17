"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
// Baseline schema migration (snapshot). Future changes should be incremental.
// NOTE: If tables already exist (dev/test), this migration should be considered applied manually; ensure fresh environments run migrations from scratch.
async function up(qi) {
    // Collect existing tables once for idempotency. Different dialects may return case variations; normalize to lowercase.
    let existing = [];
    try {
        const tables = await qi.showAllTables();
        existing = (tables || []).map((t) => (typeof t === 'string' ? t : '')).filter(Boolean).map((t) => t.toLowerCase());
    }
    catch { /* ignore – fallback to attempt creation */ }
    const hasTable = (name) => existing.includes(name.toLowerCase());
    async function safeCreateTable(name, attrs) {
        if (hasTable(name)) {
            // eslint-disable-next-line no-console
            console.info(`[baseline-migration] Table ${name} already exists – skipping creation`);
            return false;
        }
        await qi.createTable(name, attrs);
        existing.push(name.toLowerCase());
        return true;
    }
    async function safeAddIndex(table, cols) {
        try {
            await qi.addIndex(table, cols);
        }
        catch (err) {
            const msg = err?.message || '';
            if (/already exists|duplicate/i.test(msg)) {
                // eslint-disable-next-line no-console
                console.info(`[baseline-migration] Index on ${table}(${cols.join(',')}) already exists – skipping`);
                return;
            }
            // Re-throw non-duplicate errors.
            throw err;
        }
    }
    // Users (enhanced)
    await safeCreateTable('users', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        firstName: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        lastName: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, unique: true },
        role: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        permissions: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        passwordHash: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
        isActive: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        lastLoginAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
    });
    if (hasTable('users')) {
        await safeAddIndex('users', ['email']);
    }
    // Projects
    await safeCreateTable('projects', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        assignedSalesRepId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        inquiryNumber: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
        title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
        description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        projectType: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        status: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        priority: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        requirements: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
        materials: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        startDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        targetCompletionDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        actualCompletionDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    if (hasTable('projects')) {
        await safeAddIndex('projects', ['inquiryNumber']);
        await safeAddIndex('projects', ['userId']);
        await safeAddIndex('projects', ['assignedSalesRepId']);
    }
    // Quotes
    await safeCreateTable('quotes', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        quoteNumber: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
        status: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        items: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        subtotal: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        taxAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        totalAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        validUntil: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        terms: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        taxRate: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0.0825 },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    if (hasTable('quotes')) {
        await safeAddIndex('quotes', ['quoteNumber']);
        await safeAddIndex('quotes', ['projectId']);
        await safeAddIndex('quotes', ['userId']);
    }
    // Orders
    await safeCreateTable('orders', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        quoteId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        orderNumber: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
        status: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        items: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        subtotal: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        taxAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        totalAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
        amountPaid: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        priority: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        estimatedDelivery: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        confirmedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        shippedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        deliveredAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    if (hasTable('orders')) {
        await safeAddIndex('orders', ['orderNumber']);
        await safeAddIndex('orders', ['projectId']);
        await safeAddIndex('orders', ['userId']);
    }
    // Work Orders
    await safeCreateTable('work_orders', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
        description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        priority: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
        status: { type: sequelize_1.DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
        estimatedHours: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
        actualHours: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
        dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        startDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        assignedUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    if (hasTable('work_orders')) {
        await safeAddIndex('work_orders', ['projectId']);
        await safeAddIndex('work_orders', ['assignedUserId']);
    }
    // Sequences
    await safeCreateTable('sequences', {
        name: { type: sequelize_1.DataTypes.STRING(100), primaryKey: true },
        nextValue: { type: sequelize_1.DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
}
async function down(qi) {
    await qi.dropTable('sequences');
    await qi.dropTable('work_orders');
    await qi.dropTable('orders');
    await qi.dropTable('quotes');
    await qi.dropTable('projects');
    await qi.dropTable('users');
}
