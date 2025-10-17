"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quote = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Quote extends sequelize_1.Model {
    get isExpired() {
        return new Date() > this.validUntil;
    }
    get daysUntilExpiry() {
        const today = new Date();
        const expiry = new Date(this.validUntil);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    get responseTime() {
        if (!this.sentAt || !this.respondedAt) {
            return null;
        }
        const diffTime = this.respondedAt.getTime() - this.sentAt.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
    }
}
exports.Quote = Quote;
Quote.init({
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
            model: 'enhanced_users', // TODO: future alignment to 'users' table via migration
            key: 'id',
        },
    },
    quoteNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
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
    validUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
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
    terms: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    sentAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    viewedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    respondedAt: {
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
    modelName: 'Quote',
    tableName: 'quotes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['quoteNumber'],
        },
        {
            fields: ['projectId'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['validUntil'],
        },
        {
            fields: ['createdAt'],
        },
    ],
    hooks: {
        beforeValidate: (quote) => {
            // Auto-calculate total amount
            quote.totalAmount = quote.subtotal + quote.taxAmount;
        },
    },
});
exports.default = Quote;
