"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
        // Extend existing enum (Postgres only). Enum naming may vary; adjust if needed.
        const enumName = 'enum_users_role';
        const roles = ['owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician'];
        for (const r of roles) {
            await queryInterface.sequelize.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${enumName}' AND e.enumlabel='${r}') THEN ALTER TYPE "${enumName}" ADD VALUE '${r}'; END IF; END $$;`);
        }
    }
    else {
        // SQLite / other: skip enum alterations (Sequelize models handle allowed values)
    }
    // Insert demo users for each role (table name is lowercase 'users')
    await queryInterface.bulkInsert('users', [
        {
            email: 'owner@balconbuilders.com',
            firstName: 'Richard',
            lastName: 'Balcon',
            phone: '+1-555-0001',
            company: 'Balcon Builders',
            role: 'owner',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: 'office@balconbuilders.com',
            firstName: 'Sarah',
            lastName: 'Johnson',
            phone: '+1-555-0002',
            company: 'Balcon Builders',
            role: 'office_manager',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: 'shop@balconbuilders.com',
            firstName: 'Mike',
            lastName: 'Rodriguez',
            phone: '+1-555-0003',
            company: 'Balcon Builders',
            role: 'shop_manager',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: 'project@balconbuilders.com',
            firstName: 'Jennifer',
            lastName: 'Chen',
            phone: '+1-555-0004',
            company: 'Balcon Builders',
            role: 'project_manager',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: 'team@balconbuilders.com',
            firstName: 'David',
            lastName: 'Williams',
            phone: '+1-555-0005',
            company: 'Balcon Builders',
            role: 'team_leader',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: 'tech@balconbuilders.com',
            firstName: 'Carlos',
            lastName: 'Martinez',
            phone: '+1-555-0006',
            company: 'Balcon Builders',
            role: 'technician',
            isActive: true,
            isSalesRep: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
};
exports.up = up;
const down = async (queryInterface) => {
    // Remove demo users
    await queryInterface.bulkDelete('users', {
        email: {
            [sequelize_1.Op.in]: [
                'owner@balconbuilders.com',
                'office@balconbuilders.com',
                'shop@balconbuilders.com',
                'project@balconbuilders.com',
                'team@balconbuilders.com',
                'tech@balconbuilders.com'
            ]
        }
    });
    // Note: PostgreSQL doesn't support removing enum values directly
    // In a production environment, you'd need to recreate the enum type
    console.log('Note: New enum values cannot be removed from PostgreSQL enum type without recreating the type');
};
exports.down = down;
