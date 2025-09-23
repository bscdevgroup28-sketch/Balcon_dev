"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// removed unused User import
const router = (0, express_1.Router)();
// Demo user credentials for each role
const demoUsers = [
    {
        email: 'owner@demo.com',
        password: 'demo123', // In real app, this would be hashed
        firstName: 'Richard',
        lastName: 'Balcon',
        role: 'owner',
        company: 'Balcon Builders'
    },
    {
        email: 'office@demo.com',
        password: 'demo123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'office_manager',
        company: 'Balcon Builders'
    },
    {
        email: 'shop@demo.com',
        password: 'demo123',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        role: 'shop_manager',
        company: 'Balcon Builders'
    },
    {
        email: 'project@demo.com',
        password: 'demo123',
        firstName: 'Jennifer',
        lastName: 'Chen',
        role: 'project_manager',
        company: 'Balcon Builders'
    },
    {
        email: 'team@demo.com',
        password: 'demo123',
        firstName: 'David',
        lastName: 'Williams',
        role: 'team_leader',
        company: 'Balcon Builders'
    },
    {
        email: 'tech@demo.com',
        password: 'demo123',
        firstName: 'Carlos',
        lastName: 'Martinez',
        role: 'technician',
        company: 'Balcon Builders'
    }
];
/**
 * GET /api/demo/users
 * Get all demo users for the demo account selector
 */
router.get('/users', async (req, res) => {
    try {
        const users = demoUsers.map(user => ({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            company: user.company
        }));
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Error fetching demo users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo users'
        });
    }
});
/**
 * POST /api/demo/login
 * Demo login endpoint that doesn't require real authentication
 */
router.post('/login', async (req, res) => {
    try {
        const { role } = req.body;
        // Find the demo user for this role
        const demoUser = demoUsers.find(user => user.role === role);
        if (!demoUser) {
            return res.status(400).json({
                success: false,
                message: 'Invalid demo role'
            });
        }
        // Create a demo session token (in real app, this would be a JWT)
        const token = `demo_${role}_${Date.now()}`;
        // Return user data
        res.json({
            success: true,
            data: {
                user: {
                    id: Math.floor(Math.random() * 1000) + 100, // Demo ID
                    email: demoUser.email,
                    firstName: demoUser.firstName,
                    lastName: demoUser.lastName,
                    role: demoUser.role,
                    company: demoUser.company,
                    isActive: true
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Error in demo login:', error);
        res.status(500).json({
            success: false,
            message: 'Demo login failed'
        });
    }
});
/**
 * GET /api/demo/metrics/:role
 * Get demo metrics for a specific role dashboard
 */
router.get('/metrics/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const metrics = getDemoMetrics(role);
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching demo metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo metrics'
        });
    }
});
/**
 * GET /api/demo/projects
 * Get demo project data
 */
router.get('/projects', async (req, res) => {
    try {
        const projects = [
            {
                id: 'BC-2025-023',
                name: 'Heritage Mall Renovation',
                client: 'Johnson Construction',
                status: 'in_progress',
                progress: 68,
                budget: 850000,
                spent: 580000,
                deadline: '2025-09-15',
                team: 6,
                phase: 'Construction'
            },
            {
                id: 'BC-2025-019',
                name: 'Downtown Office Complex',
                client: 'Metro Development',
                status: 'at_risk',
                progress: 45,
                budget: 1200000,
                spent: 480000,
                deadline: '2025-11-30',
                team: 8,
                phase: 'Fabrication'
            },
            {
                id: 'BC-2025-025',
                name: 'Industrial Warehouse',
                client: 'Storage Solutions Inc',
                status: 'ahead',
                progress: 89,
                budget: 650000,
                spent: 520000,
                deadline: '2025-08-30',
                team: 4,
                phase: 'Finishing'
            }
        ];
        res.json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        console.error('Error fetching demo projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo projects'
        });
    }
});
// Helper function to get role-specific metrics
function getDemoMetrics(role) {
    switch (role) {
        case 'owner':
            return {
                totalRevenue: 8750000,
                monthlyRevenue: 1250000,
                activeProjects: 8,
                completedProjects: 24,
                profitMargin: 18.5,
                clientSatisfaction: 96.2,
                employeeCount: 42,
                equipmentUtilization: 87.3
            };
        case 'office_manager':
            return {
                pendingQuotes: 12,
                activeProjects: 8,
                overdueInvoices: 3,
                newLeads: 15,
                staffSchedule: 95,
                documentsPending: 7
            };
        case 'shop_manager':
            return {
                activeJobs: 6,
                equipmentUtilization: 87,
                safetyScore: 94,
                qualityScore: 96,
                productionEfficiency: 89,
                pendingMaintenance: 3
            };
        case 'project_manager':
            return {
                activeProjects: 5,
                onTimeProjects: 4,
                totalBudget: 2450000,
                budgetUtilization: 73,
                teamMembers: 18,
                upcomingMilestones: 7
            };
        case 'team_leader':
            return {
                teamSize: 8,
                activeAssignments: 12,
                completedToday: 6,
                teamEfficiency: 94,
                upcomingDeadlines: 4,
                teamMorale: 88
            };
        case 'technician':
            return {
                assignedTasks: 5,
                completedToday: 3,
                hoursWorked: 6.5,
                efficiency: 92,
                currentProject: 'BC-2025-023',
                nextDeadline: '2:30 PM'
            };
        default:
            return {};
    }
}
exports.default = router;
