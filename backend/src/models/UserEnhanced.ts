import { DataTypes, Model, Optional, Association, Op } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

// Enhanced User interface with authentication and business fields
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'office_manager' | 'shop_manager' | 'project_manager' | 'team_leader' | 'technician' | 'customer';
  
  // Authentication fields
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
  
  // Profile information
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  profileImageUrl?: string;
  
  // Business information
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  salary?: number;
  
  // System permissions
  permissions: string[];
  canAccessFinancials: boolean;
  canManageProjects: boolean;
  canManageUsers: boolean;
  
  // Business metrics
  projectsAssigned?: number;
  projectsCompleted?: number;
  totalRevenue?: number;
  performanceRating?: number;
  mustChangePassword?: boolean;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'owner' | 'office_manager' | 'shop_manager' | 'project_manager' | 'team_leader' | 'technician' | 'customer';
  
  // Authentication fields
  public isActive!: boolean;
  public isVerified!: boolean;
  public lastLoginAt?: Date;
  public passwordResetToken?: string;
  public passwordResetExpiresAt?: Date;
  public emailVerificationToken?: string;
  public emailVerificationExpiresAt?: Date;
  
  // Profile information
  public phone?: string;
  public address?: string;
  public dateOfBirth?: Date;
  public profileImageUrl?: string;
  
  // Business information
  public employeeId?: string;
  public department?: string;
  public position?: string;
  public hireDate?: Date;
  public salary?: number;
  
  // System permissions
  public permissions!: string[];
  public canAccessFinancials!: boolean;
  public canManageProjects!: boolean;
  public canManageUsers!: boolean;
  
  // Business metrics
  public projectsAssigned?: number;
  public projectsCompleted?: number;
  public totalRevenue?: number;
  public performanceRating?: number;
  public mustChangePassword?: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    assignedProjects: Association<User, any>;
    managedProjects: Association<User, any>;
    ledProjects: Association<User, any>;
  };

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(password, salt);
  }

  public async updatePassword(newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.save();
  }

  public async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getDisplayRole(): string {
    const roleNames = {
      'owner': 'Owner/Executive',
      'office_manager': 'Office Manager',
      'shop_manager': 'Shop Manager',
      'project_manager': 'Project Manager',
      'team_leader': 'Team Leader',
      'technician': 'Technician',
      'customer': 'Customer'
    };
    return roleNames[this.role] || this.role;
  }

  public hasPermission(permission: string): boolean {
    return this.permissions.includes(permission) || this.role === 'owner';
  }

  public canAccessProject(projectId: number): boolean {
    // Owners and office managers can access all projects
    if (this.role === 'owner' || this.role === 'office_manager') {
      return true;
    }
    
    // Project managers can access projects they manage
    if (this.role === 'project_manager' && this.canManageProjects) {
      return true;
    }
    
    // Team leaders and technicians can access assigned projects
    return this.role === 'team_leader' || this.role === 'technician';
  }

  public isPasswordResetValid(): boolean {
    return !!(this.passwordResetToken && 
              this.passwordResetExpiresAt && 
              this.passwordResetExpiresAt > new Date());
  }

  public isEmailVerificationValid(): boolean {
    return !!(this.emailVerificationToken && 
              this.emailVerificationExpiresAt && 
              this.emailVerificationExpiresAt > new Date());
  }

  public getDefaultPermissions(): string[] {
    const rolePermissions = {
      'owner': [
        'view_all_data',
        'manage_users',
        'manage_projects',
        'access_financials',
        'generate_reports',
        'system_admin'
      ],
      'office_manager': [
        'view_projects',
        'manage_customers',
        'manage_communications',
        'view_reports',
        'schedule_management'
      ],
      'shop_manager': [
        'view_projects',
        'manage_inventory',
        'manage_production',
        'view_team_performance',
        'quality_control'
      ],
      'project_manager': [
        'view_projects',
        'manage_assigned_projects',
        'view_team_members',
        'create_reports',
        'budget_tracking'
      ],
      'team_leader': [
        'view_assigned_projects',
        'manage_team_tasks',
        'update_project_status',
        'view_team_schedule'
      ],
      'technician': [
        'view_assigned_tasks',
        'update_task_status',
        'submit_reports',
        'view_project_details'
      ],
      'customer': [
        'view_own_projects',
        'submit_inquiries',
        'view_project_status'
      ]
    };
    
    return rolePermissions[this.role] || [];
  }

  // Static methods
  public static async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }

  public static async createWithPassword(userData: Partial<UserCreationAttributes>, password: string): Promise<User> {
    const user = new User(userData as UserCreationAttributes);
    await user.setPassword(password);
    user.permissions = user.getDefaultPermissions();
    return user.save();
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
    set(value: string) {
      this.setDataValue('email', value.toLowerCase());
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  },
  role: {
    type: DataTypes.ENUM('owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician', 'customer'),
    allowNull: false,
    defaultValue: 'customer',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  passwordResetExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  emailVerificationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/i,
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profileImageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  hireDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  canAccessFinancials: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  canManageProjects: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  canManageUsers: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  projectsAssigned: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  projectsCompleted: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0,
  },
  performanceRating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5,
    },
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'must_change_password'
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'enhanced_users',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
    {
      fields: ['employee_id'],
      unique: true,
    },
    {
      fields: ['role'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['is_verified'],
    },
    {
      fields: ['password_reset_token'],
    },
    {
      fields: ['email_verification_token'],
    },
  ],
  scopes: {
    active: {
      where: {
        isActive: true,
      },
    },
    verified: {
      where: {
        isVerified: true,
      },
    },
    employees: {
      where: {
        role: {
          [Op.ne]: 'customer',
        },
      },
    },
  },
});

export default User;
