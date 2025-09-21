import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';

export interface MaterialAttributes {
  id: number;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string; // e.g., 'sqft', 'linear_ft', 'pieces', 'gallons', etc.
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  unitCost: number;
  markupPercentage: number;
  sellingPrice: number;
  supplierName?: string;
  supplierContact?: string;
  supplierEmail?: string;
  leadTimeDays: number; // days to receive from supplier
  location?: string; // warehouse location
  status: 'active' | 'inactive' | 'discontinued';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public category!: string;
  public unitOfMeasure!: string;
  public currentStock!: number;
  public minimumStock!: number;
  public reorderPoint!: number;
  public unitCost!: number;
  public markupPercentage!: number;
  public sellingPrice!: number;
  public supplierName?: string;
  public supplierContact?: string;
  public supplierEmail?: string;
  public leadTimeDays!: number;
  public location?: string;
  public status!: 'active' | 'inactive' | 'discontinued';
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations will be defined in index.ts

  // Computed properties
  public get isLowStock(): boolean {
    return this.currentStock <= this.minimumStock;
  }

  public get needsReorder(): boolean {
    return this.currentStock <= this.reorderPoint;
  }

  public get stockStatus(): 'normal' | 'low' | 'critical' {
    if (this.currentStock <= this.reorderPoint) {
      return 'critical';
    } else if (this.currentStock <= this.minimumStock) {
      return 'low';
    }
    return 'normal';
  }

  public get profitMargin(): number {
    if (this.unitCost === 0) return 0;
    return ((this.sellingPrice - this.unitCost) / this.unitCost) * 100;
  }
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    unitOfMeasure: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    currentStock: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minimumStock: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    reorderPoint: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    markupPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 999.99,
      },
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    supplierName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 200],
      },
    },
    supplierContact: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    supplierEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    leadTimeDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      validate: {
        min: 0,
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
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
    modelName: 'Material',
    tableName: 'materials',
    timestamps: true,
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
      {
        fields: ['currentStock'],
      },
      {
        fields: ['supplierName'],
      },
      {
        fields: ['createdAt'],
      },
    ],
    hooks: {
      beforeValidate: (material: Material) => {
        // Auto-calculate selling price if markup is provided
        if (material.unitCost && material.markupPercentage) {
          material.sellingPrice = material.unitCost * (1 + material.markupPercentage / 100);
        }
      },
    },
  }
);

export default Material;