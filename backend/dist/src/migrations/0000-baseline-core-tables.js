"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
// Baseline creation of core tables (users, projects) to allow later add-column migrations
// Idempotent: skips creation if table already exists.
async function ensureTable(qi, name, define) {
    const tables = await qi.showAllTables();
    const list = Array.isArray(tables) ? tables.map(t => (typeof t === 'string' ? t : '')) : [];
    if (list.includes(name))
        return false;
    await define();
    return true;
}
async function up(queryInterface) {
    // users (pre-sales fields, minimal)
    await ensureTable(queryInterface, 'users', async () => {
        await queryInterface.createTable('users', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            email: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
            firstName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            lastName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            phone: { type: sequelize_1.DataTypes.STRING },
            company: { type: sequelize_1.DataTypes.STRING },
            role: { type: sequelize_1.DataTypes.ENUM('admin', 'user', 'sales', 'fabrication', 'owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician'), allowNull: false, defaultValue: 'user' },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            isSalesRep: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            salesCapacity: { type: sequelize_1.DataTypes.INTEGER },
            lastLoginAt: { type: sequelize_1.DataTypes.DATE },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_idx' });
    });
    // projects (pre-inquiry enhancements)
    await ensureTable(queryInterface, 'projects', async () => {
        await queryInterface.createTable('projects', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
            inquiryNumber: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
            title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            projectType: { type: sequelize_1.DataTypes.ENUM('residential', 'commercial', 'industrial'), allowNull: false },
            status: { type: sequelize_1.DataTypes.ENUM('inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'), allowNull: false, defaultValue: 'inquiry' },
            priority: { type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'), allowNull: false, defaultValue: 'medium' },
            estimatedBudget: { type: sequelize_1.DataTypes.DECIMAL(12, 2) },
            actualCost: { type: sequelize_1.DataTypes.DECIMAL(12, 2) },
            startDate: { type: sequelize_1.DataTypes.DATE },
            targetCompletionDate: { type: sequelize_1.DataTypes.DATE },
            actualCompletionDate: { type: sequelize_1.DataTypes.DATE },
            location: { type: sequelize_1.DataTypes.STRING },
            requirements: { type: sequelize_1.DataTypes.JSON, allowNull: false, defaultValue: {} },
            materials: { type: sequelize_1.DataTypes.JSON, defaultValue: [] },
            notes: { type: sequelize_1.DataTypes.TEXT },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('projects', ['inquiryNumber'], { unique: true, name: 'projects_inquiry_number_idx_base' });
    });
}
async function down(queryInterface) {
    // Intentionally DO NOT drop baseline tables automatically to avoid data loss if rolled back inadvertently.
    // Could implement conditional drop if absolutely required.
}
