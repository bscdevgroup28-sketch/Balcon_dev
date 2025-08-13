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
// Get all projects with enhanced filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type, priority, assignedTo, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const whereClause = {};
        // Apply filters
        if (status)
            whereClause.status = status;
        if (type)
            whereClause.type = type;
        if (priority)
            whereClause.priority = priority;
        if (assignedTo) {
            whereClause[sequelize_1.Op.or] = [
                { assignedProjectManager: assignedTo },
                { assignedSalesRep: assignedTo },
                { assignedTeamLeader: assignedTo }
            ];
        }
        // Search functionality
        if (search) {
            whereClause[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { customerName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { projectNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }
            ];
        }
        const { count, rows: projects } = await ProjectEnhanced_1.default.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: UserEnhanced_1.default,
                    as: 'projectManager',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'salesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'teamLeader',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        res.json({
            success: true,
            data: {
                projects,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    pages: Math.ceil(count / Number(limit))
                }
            }
        });
        logger_1.logger.info(`📊 Retrieved ${projects.length} projects for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Get project by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectEnhanced_1.default.findByPk(id, {
            include: [
                {
                    model: UserEnhanced_1.default,
                    as: 'projectManager',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'salesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'teamLeader',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                },
                {
                    model: ProjectActivity_1.default,
                    as: 'activities',
                    include: [{
                            model: UserEnhanced_1.default,
                            as: 'user',
                            attributes: ['id', 'firstName', 'lastName', 'email']
                        }],
                    order: [['createdAt', 'DESC']],
                    limit: 20
                }
            ]
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
                message: `No project found with ID: ${id}`
            });
        }
        res.json({
            success: true,
            data: project
        });
        logger_1.logger.info(`📊 Retrieved project details: ${project.projectNumber} for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Create new project (requires project management permissions)
router.post('/', (0, authEnhanced_1.requirePermission)('manage_projects'), async (req, res) => {
    try {
        const projectData = req.body;
        // Generate project number if not provided
        if (!projectData.projectNumber) {
            const count = await ProjectEnhanced_1.default.count();
            projectData.projectNumber = `PROJ-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
        }
        // Generate inquiry number if not provided
        if (!projectData.inquiryNumber) {
            const count = await ProjectEnhanced_1.default.count();
            projectData.inquiryNumber = `INQ-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
        }
        const project = await ProjectEnhanced_1.default.create(projectData);
        // Create activity log
        await ProjectActivity_1.default.create({
            projectId: project.id,
            userId: req.user.id,
            activityType: 'created',
            description: `Project created: ${project.title}`,
            metadata: {
                projectNumber: project.projectNumber,
                createdBy: req.user.email
            }
        });
        // Fetch the complete project with associations
        const completeProject = await ProjectEnhanced_1.default.findByPk(project.id, {
            include: [
                {
                    model: UserEnhanced_1.default,
                    as: 'projectManager',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'salesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'teamLeader',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });
        res.status(201).json({
            success: true,
            data: completeProject,
            message: 'Project created successfully'
        });
        logger_1.logger.info(`✅ Created new project: ${project.projectNumber} by user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create project',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Update project
router.put('/:id', (0, authEnhanced_1.requirePermission)('manage_projects'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const project = await ProjectEnhanced_1.default.findByPk(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
                message: `No project found with ID: ${id}`
            });
        }
        // Store original values for activity logging
        const originalValues = { ...project.toJSON() };
        // Update the project
        await project.update(updates);
        // Create activity log for significant changes
        const changes = Object.keys(updates).filter(key => originalValues[key] !== updates[key]);
        if (changes.length > 0) {
            await ProjectActivity_1.default.create({
                projectId: project.id,
                userId: req.user.id,
                activityType: 'updated',
                description: `Project updated: ${changes.join(', ')}`,
                metadata: {
                    changes,
                    updatedBy: req.user.email,
                    previousValues: changes.reduce((acc, key) => {
                        acc[key] = originalValues[key];
                        return acc;
                    }, {}),
                    newValues: changes.reduce((acc, key) => {
                        acc[key] = updates[key];
                        return acc;
                    }, {})
                }
            });
        }
        // Fetch updated project with associations
        const updatedProject = await ProjectEnhanced_1.default.findByPk(id, {
            include: [
                {
                    model: UserEnhanced_1.default,
                    as: 'projectManager',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'salesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: UserEnhanced_1.default,
                    as: 'teamLeader',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });
        res.json({
            success: true,
            data: updatedProject,
            message: 'Project updated successfully'
        });
        logger_1.logger.info(`✅ Updated project: ${project.projectNumber} by user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update project',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Get project activities
router.get('/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows: activities } = await ProjectActivity_1.default.findAndCountAll({
            where: { projectId: id },
            include: [{
                    model: UserEnhanced_1.default,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                }],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    pages: Math.ceil(count / Number(limit))
                }
            }
        });
        logger_1.logger.info(`📊 Retrieved ${activities.length} activities for project: ${id}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching project activities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project activities',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Add activity to project
router.post('/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const { activityType, description, metadata } = req.body;
        const activity = await ProjectActivity_1.default.create({
            projectId: Number(id),
            userId: req.user.id,
            activityType,
            description,
            metadata: metadata || {}
        });
        const completeActivity = await ProjectActivity_1.default.findByPk(activity.id, {
            include: [{
                    model: UserEnhanced_1.default,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                }]
        });
        res.status(201).json({
            success: true,
            data: completeActivity,
            message: 'Activity added successfully'
        });
        logger_1.logger.info(`✅ Added activity to project ${id}: ${activityType} by user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error adding project activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add project activity',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Delete project (admin only)
router.delete('/:id', (0, authEnhanced_1.requireRole)(['owner']), async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectEnhanced_1.default.findByPk(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
                message: `No project found with ID: ${id}`
            });
        }
        await project.destroy();
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
        logger_1.logger.info(`🗑️  Deleted project: ${project.projectNumber} by user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete project',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
