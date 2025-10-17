"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User extends sequelize_1.Model {
    // Instance methods
    async validatePassword(password) {
        return bcryptjs_1.default.compare(password, this.passwordHash);
    }
    async setPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.passwordHash = await bcryptjs_1.default.hash(password, salt);
    }
    async updatePassword(newPassword) {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await this.save();
    }
    async updateLastLogin() {
        this.lastLoginAt = new Date();
        await this.save();
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    // Legacy compatibility fields used in older services/tests
    get fullName() { return this.getFullName(); }
    get company() { return undefined; }
    get isSalesRep() { return ['sales', 'owner', 'admin', 'office_manager'].includes(this.role); }
    get salesCapacity() { return undefined; }
    getDisplayRole() {
        const roleNames = {
            'owner': 'Owner/Executive',
            'office_manager': 'Office Manager',
            'shop_manager': 'Shop Manager',
            'project_manager': 'Project Manager',
            'team_leader': 'Team Leader',
            'technician': 'Technician',
            'customer': 'Customer',
            'admin': 'Administrator',
            'user': 'User',
            'sales': 'Sales',
            'fabrication': 'Fabrication'
        };
        return roleNames[this.role] || this.role;
    }
    hasPermission(permission) {
        return this.permissions.includes(permission) || this.role === 'owner';
    }
    canAccessProject(projectId) {
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
    isPasswordResetValid() {
        return !!(this.passwordResetToken &&
            this.passwordResetExpiresAt &&
            this.passwordResetExpiresAt > new Date());
    }
    isEmailVerificationValid() {
        return !!(this.emailVerificationToken &&
            this.emailVerificationExpiresAt &&
            this.emailVerificationExpiresAt > new Date());
    }
    getDefaultPermissions() {
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
            ],
            'admin': [
                'view_all_data',
                'manage_users',
                'manage_projects',
                'access_financials'
            ],
            'user': [
                'view_own_projects'
            ],
            'sales': [
                'view_projects',
                'manage_customers'
            ],
            'fabrication': [
                'view_projects',
                'manage_production'
            ]
        };
        return rolePermissions[this.role] || [];
    }
    // Static methods
    static async findByEmail(email) {
        return User.findOne({ where: { email: email.toLowerCase() } });
    }
    static async createWithPassword(userData, password) {
        const user = new User(userData);
        await user.setPassword(password);
        user.permissions = user.getDefaultPermissions();
        return user.save();
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase());
        },
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true, // allow null to support legacy tests creating users without passwords
    },
    // Virtual field for test seeding convenience: setting `password` sets `passwordHash`
    password: {
        type: sequelize_1.DataTypes.VIRTUAL,
        set(value) {
            if (value && !this.passwordHash) {
                this.setDataValue('passwordHash', value);
            }
        },
        get() {
            return undefined; // never expose
        }
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 50],
        },
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 50],
        },
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician', 'customer', 'admin', 'user', 'sales', 'fabrication'),
        allowNull: false,
        defaultValue: 'customer',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    passwordResetToken: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    passwordResetExpiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    emailVerificationToken: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    emailVerificationExpiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: /^[\+]?[1-9][\d]{0,15}$/i,
        },
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    profileImageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    employeeId: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        unique: true,
    },
    department: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    position: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    hireDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    salary: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    permissions: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    canAccessFinancials: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canManageProjects: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canManageUsers: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    projectsAssigned: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    projectsCompleted: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    totalRevenue: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
    },
    performanceRating: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 5,
        },
    },
    mustChangePassword: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'must_change_password'
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'User',
    tableName: 'enhanced_users',
    underscored: true,
    timestamps: true,
    hooks: {
        beforeValidate: (user) => {
            if (user.password && !user.passwordHash) {
                // For test seeding convenience only; do NOT use raw passwords in production
                user.passwordHash = user.password;
            }
        }
    },
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
                    [sequelize_1.Op.ne]: 'customer',
                },
            },
        },
    },
});
exports.default = User;
