"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Order extends sequelize_1.Model {
    get balanceRemaining() {
        return this.totalAmount - this.amountPaid;
    }
    get isPaid() {
        return this.amountPaid >= this.totalAmount;
    }
    get isOverdue() {
        if (!this.estimatedDelivery || this.status === 'delivered' || this.status === 'completed' || this.status === 'cancelled') {
            return false;
        }
        return new Date() > this.estimatedDelivery;
    }
    get daysUntilDelivery() {
        if (!this.estimatedDelivery || this.status === 'delivered' || this.status === 'completed' || this.status === 'cancelled') {
            return null;
        }
        const today = new Date();
        const delivery = new Date(this.estimatedDelivery);
        const diffTime = delivery.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    get fulfillmentTime() {
        if (!this.confirmedAt || !this.deliveredAt) {
            return null;
        }
        const diffTime = this.deliveredAt.getTime() - this.confirmedAt.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
    }
}
exports.Order = Order;
Order.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    projectId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id',
        },
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enhanced_users', // TODO: future alignment to 'users'
            key: 'id',
        },
    },
    quoteId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'quotes',
            key: 'id',
        },
    },
    orderNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
    },
    subtotal: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    amountPaid: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    items: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        validate: {
            isValidItems(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Items must be an array');
                }
                for (const item of value) {
                    if (!item.description || !item.quantity || !item.unitPrice) {
                        throw new Error('Each item must have description, quantity, and unitPrice');
                    }
                }
            },
        },
    },
    shippingAddress: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    billingAddress: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    paymentTerms: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 200],
        },
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    estimatedDelivery: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    actualDelivery: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    confirmedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    shippedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    deliveredAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['orderNumber'],
        },
        {
            fields: ['projectId'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['quoteId'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['priority'],
        },
        {
            fields: ['estimatedDelivery'],
        },
        {
            fields: ['createdAt'],
        },
    ],
    hooks: {
        beforeValidate: (order) => {
            // Auto-calculate total amount
            order.totalAmount = order.subtotal + order.taxAmount;
        },
    },
});
exports.default = Order;
