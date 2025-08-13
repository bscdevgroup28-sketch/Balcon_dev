import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'user' | 'sales' | 'fabrication' | 'owner' | 'office_manager' | 'shop_manager' | 'project_manager' | 'team_leader' | 'technician';
  isActive: boolean;
  isSalesRep: boolean;
  salesCapacity?: number; // How many projects can this sales rep handle
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public company?: string;
  public role!: 'admin' | 'user' | 'sales' | 'fabrication' | 'owner' | 'office_manager' | 'shop_manager' | 'project_manager' | 'team_leader' | 'technician';
  public isActive!: boolean;
  public isSalesRep!: boolean;
  public salesCapacity?: number;
  public lastLoginAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/i, // Basic international phone format
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'sales', 'fabrication', 'owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician'),
      allowNull: false,
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isSalesRep: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    salesCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 100,
      },
    },
    lastLoginAt: {
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
