"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Material = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Material extends sequelize_1.Model {
    // Associations will be defined in index.ts
    // Computed properties
    get isLowStock() {
        return this.currentStock <= this.minimumStock;
    }
    get needsReorder() {
        return this.currentStock <= this.reorderPoint;
    }
    get stockStatus() {
        if (this.currentStock <= this.reorderPoint) {
            return 'critical';
        }
        else if (this.currentStock <= this.minimumStock) {
            return 'low';
        }
        return 'normal';
    }
    get profitMargin() {
        if (this.unitCost === 0)
            return 0;
        return ((this.sellingPrice - this.unitCost) / this.unitCost) * 100;
    }
}
exports.Material = Material;
Material.init({
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
    unitOfMeasure: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 50],
        },
    },
    currentStock: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    minimumStock: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    reorderPoint: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    unitCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    markupPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 999.99,
        },
    },
    sellingPrice: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    supplierName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 200],
        },
    },
    supplierContact: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100],
        },
    },
    supplierEmail: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    leadTimeDays: {
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
    // createdAt / updatedAt provided automatically
}, {
    sequelize: database_1.sequelize,
    modelName: 'Material',
    tableName: 'materials',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['name'],
        },
        {
            fields: ['category'],
        },
        {
            fields: ['status'],
        },
        { fields: ['current_stock'] },
        { fields: ['supplier_name'] },
        { fields: ['created_at'] },
    ],
    hooks: {
        beforeValidate: (material) => {
            // Auto-calculate selling price if markup is provided
            if (material.unitCost && material.markupPercentage) {
                material.sellingPrice = material.unitCost * (1 + material.markupPercentage / 100);
            }
        },
    },
});
exports.default = Material;
