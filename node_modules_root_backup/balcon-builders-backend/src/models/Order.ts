import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Project } from './Project';
import { Quote } from './Quote';

export interface OrderAttributes {
  id: number;
  projectId: number;
  userId: number;
  quoteId?: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  items: any; // JSON field for order line items
  shippingAddress?: any; // JSON field for shipping address
  billingAddress?: any; // JSON field for billing address
  paymentTerms?: string;
  notes?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public quoteId?: number;
  public orderNumber!: string;
  public status!: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public subtotal!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public amountPaid!: number;
  public items!: any;
  public shippingAddress?: any;
  public billingAddress?: any;
  public paymentTerms?: string;
  public notes?: string;
  public estimatedDelivery?: Date;
  public actualDelivery?: Date;
  public confirmedAt?: Date;
  public shippedAt?: Date;
  public deliveredAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly project?: Project;
  public readonly quote?: Quote;
  
  public static associations: {
    user: Association<Order, User>;
    project: Association<Order, Project>;
    quote: Association<Order, Quote>;
  };

  public get balanceRemaining(): number {
    return this.totalAmount - this.amountPaid;
  }

  public get isPaid(): boolean {
    return this.amountPaid >= this.totalAmount;
  }

  public get isOverdue(): boolean {
    if (!this.estimatedDelivery || this.status === 'delivered' || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    return new Date() > this.estimatedDelivery;
  }

  public get daysUntilDelivery(): number | null {
    if (!this.estimatedDelivery || this.status === 'delivered' || this.status === 'completed' || this.status === 'cancelled') {
      return null;
    }
    const today = new Date();
    const delivery = new Date(this.estimatedDelivery);
    const diffTime = delivery.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public get fulfillmentTime(): number | null {
    if (!this.confirmedAt || !this.deliveredAt) {
      return null;
    }
    const diffTime = this.deliveredAt.getTime() - this.confirmedAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    quoteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'quotes',
        key: 'id',
      },
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    amountPaid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidItems(value: any) {
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
      type: DataTypes.JSONB,
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 200],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
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
      beforeValidate: (order: Order) => {
        // Auto-calculate total amount
        order.totalAmount = order.subtotal + order.taxAmount;
      },
    },
  }
);

export default Order;
