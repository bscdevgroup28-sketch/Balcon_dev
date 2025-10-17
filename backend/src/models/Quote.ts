import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './UserEnhanced';
import { Project } from './Project';

export interface QuoteAttributes {
  id: number;
  projectId: number;
  userId: number;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: Date;
  items: any; // JSON field for quote line items
  terms?: string;
  notes?: string;
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteCreationAttributes extends Optional<QuoteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Quote extends Model<QuoteAttributes, QuoteCreationAttributes> implements QuoteAttributes {
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public quoteNumber!: string;
  public status!: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  public subtotal!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public validUntil!: Date;
  public items!: any;
  public terms?: string;
  public notes?: string;
  public sentAt?: Date;
  public viewedAt?: Date;
  public respondedAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly project?: Project;
  
  public static associations: {
    user: Association<Quote, User>;
    project: Association<Quote, Project>;
  };

  public get isExpired(): boolean {
    return new Date() > this.validUntil;
  }

  public get daysUntilExpiry(): number {
    const today = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public get responseTime(): number | null {
    if (!this.sentAt || !this.respondedAt) {
      return null;
    }
    const diffTime = this.respondedAt.getTime() - this.sentAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
  }
}

Quote.init(
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
        model: 'enhanced_users', // TODO: future alignment to 'users' table via migration
        key: 'id',
      },
    },
    quoteNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'draft',
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
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
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
    terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    respondedAt: {
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
      beforeValidate: (quote: Quote) => {
        // Auto-calculate total amount
        quote.totalAmount = quote.subtotal + quote.taxAmount;
      },
    },
  }
);

export default Quote;
