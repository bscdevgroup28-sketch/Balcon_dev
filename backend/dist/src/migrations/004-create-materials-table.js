"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    // Create materials table
    await queryInterface.createTable('materials', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 200],
            },
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        category: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 100],
            },
        },
        unit_of_measure: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 50],
            },
        },
        current_stock: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        minimum_stock: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        reorder_point: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        unit_cost: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        markup_percentage: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 999.99,
            },
        },
        selling_price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        supplier_name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 200],
            },
        },
        supplier_contact: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 100],
            },
        },
        supplier_email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        lead_time_days: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7,
            validate: {
                min: 0,
            },
        },
        location: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 100],
            },
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'discontinued'),
            allowNull: false,
            defaultValue: 'active',
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    });
    // Create indexes for better performance
    await queryInterface.addIndex('materials', ['name'], {
        name: 'materials_name_idx',
    });
    await queryInterface.addIndex('materials', ['category'], {
        name: 'materials_category_idx',
    });
    await queryInterface.addIndex('materials', ['status'], {
        name: 'materials_status_idx',
    });
    await queryInterface.addIndex('materials', ['current_stock'], {
        name: 'materials_current_stock_idx',
    });
    await queryInterface.addIndex('materials', ['supplier_name'], {
        name: 'materials_supplier_name_idx',
    });
    await queryInterface.addIndex('materials', ['created_at'], {
        name: 'materials_created_at_idx',
    });
};
exports.up = up;
const down = async (queryInterface) => {
    // Remove indexes first
    await queryInterface.removeIndex('materials', 'materials_name_idx');
    await queryInterface.removeIndex('materials', 'materials_category_idx');
    await queryInterface.removeIndex('materials', 'materials_status_idx');
    await queryInterface.removeIndex('materials', 'materials_current_stock_idx');
    await queryInterface.removeIndex('materials', 'materials_supplier_name_idx');
    await queryInterface.removeIndex('materials', 'materials_created_at_idx');
    // Drop the table
    await queryInterface.dropTable('materials');
};
exports.down = down;
