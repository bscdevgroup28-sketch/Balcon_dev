"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const salesAssignment_1 = require("../services/salesAssignment");
const emailNotification_1 = require("../services/emailNotification");
const router = (0, express_1.Router)();
// GET /api/projects - Get all projects with filtering and pagination
router.get('/', (0, validation_1.validate)({ query: validation_2.projectQuerySchema }), async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, projectType, priority, userId, search, } = req.validatedQuery;
        const offset = (page - 1) * limit;
        const where = {};
        // Apply filters
        if (status)
            where.status = status;
        if (projectType)
            where.projectType = projectType;
        if (priority)
            where.priority = priority;
        if (userId)
            where.userId = userId;
        // Apply search
        if (search) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { location: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const { count, rows: projects } = await models_1.Project.findAndCountAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.User,
                    as: 'assignedSalesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    required: false, // LEFT JOIN - projects without assigned sales rep will still be returned
                }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });
        const totalPages = Math.ceil(count / limit);
        res.json({
            data: projects,
            meta: {
                total: count,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching projects:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch projects',
        });
    }
});
// GET /api/projects/:id - Get a specific project
router.get('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const project = await models_1.Project.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.User,
                    as: 'assignedSalesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    required: false,
                }
            ],
        });
        if (!project) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Project not found',
            });
        }
        res.json({ data: project });
    }
    catch (error) {
        logger_1.logger.error('Error fetching project:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch project',
        });
    }
});
// POST /api/projects - Create a new project
router.post('/', (0, validation_1.validate)({ body: validation_2.createProjectSchema }), async (req, res) => {
    try {
        const projectData = req.validatedBody;
        // For now, we'll use a default user ID of 1
        // In a real app, this would come from authentication middleware
        const userId = 1;
        // Generate inquiry number
        const inquiryNumber = await (0, salesAssignment_1.generateInquiryNumber)();
        const project = await models_1.Project.create({
            ...projectData,
            userId,
            inquiryNumber,
            status: 'inquiry',
            startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
            targetCompletionDate: projectData.targetCompletionDate ? new Date(projectData.targetCompletionDate) : undefined,
        });
        // Auto-assign sales representative
        const assignedSalesRep = await (0, salesAssignment_1.autoAssignSalesRep)(project.id);
        // Get user for notifications (using default user for now)
        const user = await models_1.User.findByPk(userId);
        // Send notification emails
        try {
            if (user) {
                // Notify admins of new inquiry
                await emailNotification_1.emailService.notifyNewInquiry(project.toJSON(), user);
                // If sales rep was assigned, notify them
                if (assignedSalesRep) {
                    await emailNotification_1.emailService.notifyStatusChange(project.toJSON(), user, 'none', 'assigned');
                }
                // Send confirmation to customer
                await emailNotification_1.emailService.notifyStatusChange(project.toJSON(), user, 'none', 'inquiry');
            }
        }
        catch (emailError) {
            // Log email errors but don't fail the project creation
            logger_1.logger.error('Failed to send notification emails:', emailError);
        }
        const createdProject = await models_1.Project.findByPk(project.id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.User,
                    as: 'assignedSalesRep',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
                }
            ],
        });
        logger_1.logger.info(`Project created with inquiry number: ${inquiryNumber}`, {
            projectId: project.id,
            userId,
            inquiryNumber,
            assignedSalesRep: assignedSalesRep?.id
        });
        res.status(201).json({
            data: createdProject,
            message: 'Project created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating project:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create project',
        });
    }
});
// PUT /api/projects/:id - Update a project
router.put('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateProjectSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const updateData = req.validatedBody;
        const project = await models_1.Project.findByPk(id);
        if (!project) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Project not found',
            });
        }
        // Convert date strings to Date objects
        const processedUpdateData = {
            ...updateData,
            startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
            targetCompletionDate: updateData.targetCompletionDate ? new Date(updateData.targetCompletionDate) : undefined,
            actualCompletionDate: updateData.actualCompletionDate ? new Date(updateData.actualCompletionDate) : undefined,
        };
        await project.update(processedUpdateData);
        const updatedProject = await models_1.Project.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
            ],
        });
        logger_1.logger.info('Project updated', { projectId: id });
        res.json({
            data: updatedProject,
            message: 'Project updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating project:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update project',
        });
    }
});
// DELETE /api/projects/:id - Delete a project
router.delete('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const project = await models_1.Project.findByPk(id);
        if (!project) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Project not found',
            });
        }
        await project.destroy();
        logger_1.logger.info('Project deleted', { projectId: id });
        res.json({
            message: 'Project deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting project:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete project',
        });
    }
});
exports.default = router;
