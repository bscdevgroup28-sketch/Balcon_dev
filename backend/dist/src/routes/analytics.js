"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
const authEnhanced_1 = require("../middleware/authEnhanced");
const ProjectEnhanced_1 = __importDefault(require("../models/ProjectEnhanced"));
const UserEnhanced_1 = __importDefault(require("../models/UserEnhanced"));
const ProjectActivity_1 = __importDefault(require("../models/ProjectActivity"));
const router = express_1.default.Router();
// Dashboard overview statistics
router.get('/dashboard', (0, authEnhanced_1.requirePermission)('view_all_data'), async (req, res) => {
    try {
        // Get basic project counts
        const totalProjects = await ProjectEnhanced_1.default.count();
        const activeProjects = await ProjectEnhanced_1.default.count({
            where: { status: ['in_progress', 'planning', 'approved'] }
        });
        const completedProjects = await ProjectEnhanced_1.default.count({
            where: { status: 'completed' }
        });
        const pendingQuotes = await ProjectEnhanced_1.default.count({
            where: { status: 'quoted' }
        });
        // Get revenue statistics
        const totalRevenue = await ProjectEnhanced_1.default.sum('quotedAmount', {
            where: { status: 'completed' }
        }) || 0;
        const pendingRevenue = await ProjectEnhanced_1.default.sum('quotedAmount', {
            where: { status: ['approved', 'in_progress'] }
        }) || 0;
        const potentialRevenue = await ProjectEnhanced_1.default.sum('quotedAmount', {
            where: { status: 'quoted' }
        }) || 0;
        // Get project distribution by type
        const projectsByType = await ProjectEnhanced_1.default.findAll({
            attributes: [
                'type',
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quotedAmount')), 'revenue']
            ],
            group: ['type'],
            raw: true
        });
        // Get project distribution by status
        const projectsByStatus = await ProjectEnhanced_1.default.findAll({
            attributes: [
                'status',
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quotedAmount')), 'revenue']
            ],
            group: ['status'],
            raw: true
        });
        // Get recent activities
        const recentActivities = await ProjectActivity_1.default.findAll({
            include: [
                {
                    model: UserEnhanced_1.default,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                },
                {
                    model: ProjectEnhanced_1.default,
                    as: 'project',
                    attributes: ['id', 'projectNumber', 'title']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        // Get top performing users
        const topUsers = await UserEnhanced_1.default.findAll({
            attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'role',
                'projectsAssigned',
                'projectsCompleted',
                'totalRevenue'
            ],
            where: {
                role: ['project_manager', 'office_manager', 'team_leader']
            },
            order: [['totalRevenue', 'DESC']],
            limit: 5
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalProjects,
                    activeProjects,
                    completedProjects,
                    pendingQuotes,
                    totalRevenue,
                    pendingRevenue,
                    potentialRevenue,
                    completionRate: totalProjects > 0 ? (completedProjects / totalProjects * 100).toFixed(1) : 0
                },
                projectsByType,
                projectsByStatus,
                recentActivities,
                topUsers
            }
        });
        logger_1.logger.info(`📊 Dashboard analytics retrieved for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard analytics',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Revenue analytics over time
router.get('/revenue', (0, authEnhanced_1.requirePermission)('access_financials'), async (req, res) => {
    try {
        const { period = 'month', year = new Date().getFullYear() } = req.query;
        let groupBy;
        switch (period) {
            case 'day':
                groupBy = 'DATE(createdAt)';
                break;
            case 'week':
                groupBy = 'YEARWEEK(createdAt)';
                break;
            case 'month':
                groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
                break;
            case 'quarter':
                groupBy = 'CONCAT(YEAR(createdAt), "-Q", QUARTER(createdAt))';
                break;
            default:
                groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        }
        const revenueData = await ProjectEnhanced_1.default.findAll({
            attributes: [
                [(0, sequelize_1.literal)(groupBy), 'period'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'projectCount'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quotedAmount')), 'revenue'],
                [(0, sequelize_1.fn)('AVG', (0, sequelize_1.col)('quotedAmount')), 'averageValue']
            ],
            where: {
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(`${year}-01-01`),
                    [sequelize_1.Op.lt]: new Date(`${Number(year) + 1}-01-01`)
                },
                status: {
                    [sequelize_1.Op.in]: ['completed', 'in_progress', 'approved']
                }
            },
            group: [(0, sequelize_1.literal)(groupBy)],
            order: [[(0, sequelize_1.literal)(groupBy), 'ASC']],
            raw: true
        });
        res.json({
            success: true,
            data: {
                period,
                year,
                revenueData
            }
        });
        logger_1.logger.info(`📊 Revenue analytics retrieved for period: ${period}, year: ${year}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching revenue analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue analytics',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// User performance analytics
router.get('/users/:id/performance', (0, authEnhanced_1.requirePermission)('view_all_data'), async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 12 } = req.query;
        const user = await UserEnhanced_1.default.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: `No user found with ID: ${id}`
            });
        }
        // Get user's assigned projects
        const assignedProjects = await ProjectEnhanced_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { assignedProjectManager: id },
                    { assignedSalesRep: id },
                    { assignedTeamLeader: id }
                ]
            },
            include: [{
                    model: ProjectActivity_1.default,
                    as: 'activities',
                    where: { userId: id },
                    required: false
                }]
        });
        // Performance metrics
        const totalAssigned = assignedProjects.length;
        const completed = assignedProjects.filter(p => p.status === 'completed').length;
        const inProgress = assignedProjects.filter(p => p.status === 'in_progress').length;
        const totalRevenue = assignedProjects
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.quotedAmount || 0), 0);
        // Activity over time
        const activityData = await ProjectActivity_1.default.findAll({
            attributes: [
                [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('createdAt'), '%Y-%m'), 'month'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'activityCount']
            ],
            where: { userId: id },
            group: [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('createdAt'), '%Y-%m')],
            order: [[(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('createdAt'), '%Y-%m'), 'DESC']],
            limit: Number(limit),
            raw: true
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: user.role
                },
                performance: {
                    totalAssigned,
                    completed,
                    inProgress,
                    completionRate: totalAssigned > 0 ? (completed / totalAssigned * 100).toFixed(1) : 0,
                    totalRevenue,
                    averageProjectValue: totalAssigned > 0 ? (totalRevenue / totalAssigned).toFixed(2) : 0
                },
                activityData
            }
        });
        logger_1.logger.info(`📊 User performance analytics retrieved for user ID: ${id}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching user performance analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user performance analytics',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Project analytics
router.get('/projects/insights', (0, authEnhanced_1.requirePermission)('view_all_data'), async (req, res) => {
    try {
        // Average project duration
        const completedProjects = await ProjectEnhanced_1.default.findAll({
            where: {
                status: 'completed',
                startDate: { [sequelize_1.Op.ne]: null },
                estimatedCompletionDate: { [sequelize_1.Op.ne]: null }
            },
            attributes: ['startDate', 'estimatedCompletionDate', 'quotedAmount', 'type']
        });
        const projectInsights = {
            averageDuration: 0,
            averageValue: 0,
            typeBreakdown: {},
            seasonalTrends: {}
        };
        if (completedProjects.length > 0) {
            // Calculate average duration
            const totalDuration = completedProjects.reduce((sum, project) => {
                if (project.startDate && project.estimatedCompletionDate) {
                    const duration = new Date(project.estimatedCompletionDate).getTime() - new Date(project.startDate).getTime();
                    return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
                }
                return sum;
            }, 0);
            projectInsights.averageDuration = Math.round(totalDuration / completedProjects.length);
            // Calculate average value
            const totalValue = completedProjects.reduce((sum, p) => sum + (p.quotedAmount || 0), 0);
            projectInsights.averageValue = totalValue / completedProjects.length;
            // Type breakdown
            const typeBreakdown = completedProjects.reduce((acc, project) => {
                const type = project.type || 'unknown';
                if (!acc[type]) {
                    acc[type] = { count: 0, totalValue: 0 };
                }
                acc[type].count++;
                acc[type].totalValue += project.quotedAmount || 0;
                return acc;
            }, {});
            projectInsights.typeBreakdown = typeBreakdown;
        }
        // Seasonal trends (projects created by month)
        const seasonalData = await ProjectEnhanced_1.default.findAll({
            attributes: [
                [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('createdAt')), 'month'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quotedAmount')), 'revenue']
            ],
            where: {
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(new Date().getFullYear() - 1, 0, 1)
                }
            },
            group: [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('createdAt'))],
            raw: true
        });
        projectInsights.seasonalTrends = seasonalData.reduce((acc, item) => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            acc[monthNames[item.month - 1]] = item.count;
            return acc;
        }, {});
        res.json({
            success: true,
            data: projectInsights
        });
        logger_1.logger.info(`📊 Project insights analytics retrieved`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching project insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project insights',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Export data for reports
router.get('/export/:type', (0, authEnhanced_1.requirePermission)('generate_reports'), async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json', startDate, endDate } = req.query;
        let data;
        const whereClause = {};
        if (startDate && endDate) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        switch (type) {
            case 'projects':
                data = await ProjectEnhanced_1.default.findAll({
                    where: whereClause,
                    include: [
                        {
                            model: UserEnhanced_1.default,
                            as: 'projectManager',
                            attributes: ['firstName', 'lastName', 'email']
                        },
                        {
                            model: UserEnhanced_1.default,
                            as: 'salesRep',
                            attributes: ['firstName', 'lastName', 'email']
                        }
                    ]
                });
                break;
            case 'users':
                data = await UserEnhanced_1.default.findAll({
                    where: whereClause,
                    attributes: { exclude: ['passwordHash'] }
                });
                break;
            case 'activities':
                data = await ProjectActivity_1.default.findAll({
                    where: whereClause,
                    include: [
                        {
                            model: UserEnhanced_1.default,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'email']
                        },
                        {
                            model: ProjectEnhanced_1.default,
                            as: 'project',
                            attributes: ['projectNumber', 'title']
                        }
                    ]
                });
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid export type',
                    message: 'Supported types: projects, users, activities'
                });
        }
        if (format === 'csv') {
            // For now, return JSON. In a real implementation, convert to CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-export.json"`);
        }
        res.json({
            success: true,
            exportType: type,
            format,
            recordCount: data.length,
            data
        });
        logger_1.logger.info(`📊 Data export completed: ${type} (${data.length} records) for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export data',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
