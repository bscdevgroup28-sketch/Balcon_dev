"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectNotification = exports.createSystemNotification = void 0;
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const authEnhanced_1 = require("../middleware/authEnhanced");
const router = express_1.default.Router();
let notifications = [];
let notificationIdCounter = 1;
// Get user notifications
router.get('/', async (req, res) => {
    try {
        const { read, type, limit = 50 } = req.query;
        const userId = req.user.id;
        let userNotifications = notifications.filter(n => n.userId === userId);
        // Apply filters
        if (read !== undefined) {
            userNotifications = userNotifications.filter(n => n.read === (read === 'true'));
        }
        if (type) {
            userNotifications = userNotifications.filter(n => n.type === type);
        }
        // Sort by most recent first
        userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Apply limit
        userNotifications = userNotifications.slice(0, Number(limit));
        res.json({
            success: true,
            data: {
                notifications: userNotifications,
                unreadCount: notifications.filter(n => n.userId === userId && !n.read).length
            }
        });
        logger_1.logger.info(`📧 Retrieved ${userNotifications.length} notifications for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = notifications.find(n => n.id === id && n.userId === userId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                message: `No notification found with ID: ${id}`
            });
        }
        notification.read = true;
        res.json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });
        logger_1.logger.info(`📧 Marked notification as read: ${id} for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
    try {
        const userId = req.user.id;
        const userNotifications = notifications.filter(n => n.userId === userId);
        userNotifications.forEach(n => n.read = true);
        res.json({
            success: true,
            message: `Marked ${userNotifications.length} notifications as read`
        });
        logger_1.logger.info(`📧 Marked all notifications as read for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all notifications as read',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Create notification (admin only)
router.post('/', (0, authEnhanced_1.requirePermission)('manage_users'), async (req, res) => {
    try {
        const { userId, type, title, message, metadata } = req.body;
        const notification = {
            id: String(notificationIdCounter++),
            userId,
            type,
            title,
            message,
            read: false,
            createdAt: new Date(),
            metadata
        };
        notifications.push(notification);
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created successfully'
        });
        logger_1.logger.info(`📧 Created notification for user ${userId}: ${title}`);
    }
    catch (error) {
        logger_1.logger.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create notification',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Create broadcast notification (admin only)
router.post('/broadcast', (0, authEnhanced_1.requirePermission)('manage_users'), async (req, res) => {
    try {
        const { type, title, message, metadata, userIds } = req.body;
        const broadcastNotifications = [];
        // If userIds provided, send to specific users, otherwise send to all users
        const targetUserIds = userIds || [1, 2, 3, 4, 5, 6]; // In production, get from database
        targetUserIds.forEach((userId) => {
            const notification = {
                id: String(notificationIdCounter++),
                userId,
                type,
                title,
                message,
                read: false,
                createdAt: new Date(),
                metadata
            };
            broadcastNotifications.push(notification);
            notifications.push(notification);
        });
        res.status(201).json({
            success: true,
            data: {
                notifications: broadcastNotifications,
                count: broadcastNotifications.length
            },
            message: `Broadcast notification sent to ${broadcastNotifications.length} users`
        });
        logger_1.logger.info(`📧 Broadcast notification created: ${title} (${broadcastNotifications.length} recipients)`);
    }
    catch (error) {
        logger_1.logger.error('Error creating broadcast notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create broadcast notification',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notificationIndex = notifications.findIndex(n => n.id === id && n.userId === userId);
        if (notificationIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                message: `No notification found with ID: ${id}`
            });
        }
        notifications.splice(notificationIndex, 1);
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
        logger_1.logger.info(`📧 Deleted notification: ${id} for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Get notification settings (placeholder for user preferences)
router.get('/settings', async (req, res) => {
    try {
        // In production, this would come from user preferences in database
        const settings = {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            notificationTypes: {
                projectUpdates: true,
                systemAlerts: true,
                assignments: true,
                deadlines: true,
                financialAlerts: false
            }
        };
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification settings',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Update notification settings
router.put('/settings', async (req, res) => {
    try {
        const settings = req.body;
        // In production, save to database
        // For now, just return the settings
        res.json({
            success: true,
            data: settings,
            message: 'Notification settings updated successfully'
        });
        logger_1.logger.info(`📧 Updated notification settings for user: ${req.user?.email}`);
    }
    catch (error) {
        logger_1.logger.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification settings',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Utility function to create system notifications
const createSystemNotification = (userId, type, title, message, metadata) => {
    const notification = {
        id: String(notificationIdCounter++),
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: new Date(),
        metadata
    };
    notifications.push(notification);
    logger_1.logger.info(`📧 System notification created for user ${userId}: ${title}`);
    return notification;
};
exports.createSystemNotification = createSystemNotification;
// Helper function to create project-related notifications
const createProjectNotification = (userIds, projectId, projectTitle, action, metadata) => {
    userIds.forEach(userId => {
        (0, exports.createSystemNotification)(userId, 'info', `Project ${action}`, `Project "${projectTitle}" has been ${action}`, { projectId, action, ...metadata });
    });
};
exports.createProjectNotification = createProjectNotification;
exports.default = router;
