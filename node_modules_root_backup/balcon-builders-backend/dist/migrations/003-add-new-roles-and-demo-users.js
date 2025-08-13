"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    // First, add the new role enum values to the existing enum type
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'owner';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'office_manager';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'shop_manager';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'project_manager';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'team_leader';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'technician';`);
    // Insert demo users for each role
    await queryInterface.bulkInsert('Users', [
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
    await queryInterface.bulkDelete('Users', {
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
