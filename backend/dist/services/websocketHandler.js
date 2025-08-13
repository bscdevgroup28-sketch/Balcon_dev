"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
class WebSocketHandler {
    constructor(io) {
        this.connectedUsers = new Map(); // userId -> socketId
        this.io = io;
        this.setupWebSocketHandlers();
    }
    setupWebSocketHandlers() {
        // Authentication middleware for WebSocket connections
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'balcon-secret-2024');
                socket.user = decoded;
                next();
            }
            catch (error) {
                logger_1.logger.error('WebSocket authentication failed:', error);
                next(new Error('Invalid authentication token'));
            }
        });
        // Handle connections
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
        logger_1.logger.info('🔌 WebSocket handlers initialized');
    }
    handleConnection(socket) {
        if (!socket.user)
            return;
        const userId = socket.user.id;
        const userEmail = socket.user.email;
        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        logger_1.logger.info(`🔌 WebSocket connected: ${userEmail} (${socket.id})`);
        // Join user-specific room
        socket.join(`user_${userId}`);
        // Join role-specific room for broadcasts
        socket.join(`role_${socket.user.role}`);
        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to Bal-Con Builders real-time system',
            userId: userId,
            timestamp: new Date().toISOString()
        });
        // Handle real-time events
        this.setupSocketEvents(socket);
        // Handle disconnection
        socket.on('disconnect', () => {
            this.connectedUsers.delete(userId);
            logger_1.logger.info(`🔌 WebSocket disconnected: ${userEmail} (${socket.id})`);
        });
    }
    setupSocketEvents(socket) {
        if (!socket.user)
            return;
        // Project updates
        socket.on('join_project', (projectId) => {
            socket.join(`project_${projectId}`);
            logger_1.logger.info(`👤 ${socket.user.email} joined project room: ${projectId}`);
        });
        socket.on('leave_project', (projectId) => {
            socket.leave(`project_${projectId}`);
            logger_1.logger.info(`👤 ${socket.user.email} left project room: ${projectId}`);
        });
        // Real-time collaboration
        socket.on('project_activity', (data) => {
            const activity = {
                ...data,
                userId: socket.user.id,
                userEmail: socket.user.email,
                timestamp: new Date().toISOString()
            };
            // Broadcast to project room
            socket.to(`project_${data.projectId}`).emit('project_update', activity);
            logger_1.logger.info(`📋 Project activity broadcast: ${data.action} on project ${data.projectId}`);
        });
        // Notification acknowledgment
        socket.on('notification_read', (notificationId) => {
            logger_1.logger.info(`📧 Notification marked as read: ${notificationId} by ${socket.user.email}`);
        });
        // Typing indicators for chat/comments (future feature)
        socket.on('typing', (data) => {
            socket.to(`project_${data.projectId}`).emit('user_typing', {
                userId: socket.user.id,
                userEmail: socket.user.email,
                isTyping: data.isTyping
            });
        });
        // Real-time quote updates
        socket.on('join_quote', (quoteId) => {
            socket.join(`quote_${quoteId}`);
            logger_1.logger.info(`💰 ${socket.user.email} joined quote room: ${quoteId}`);
        });
        socket.on('leave_quote', (quoteId) => {
            socket.leave(`quote_${quoteId}`);
            logger_1.logger.info(`💰 ${socket.user.email} left quote room: ${quoteId}`);
        });
    }
    // Public methods for emitting events from other parts of the application
    // Send notification to specific user
    sendNotificationToUser(userId, notification) {
        this.io.to(`user_${userId}`).emit('new_notification', notification);
        logger_1.logger.info(`📧 Real-time notification sent to user: ${userId}`);
    }
    // Send notification to multiple users
    sendNotificationToUsers(userIds, notification) {
        userIds.forEach(userId => {
            this.sendNotificationToUser(userId, notification);
        });
    }
    // Broadcast to all connected users
    broadcastNotification(notification) {
        this.io.emit('broadcast_notification', notification);
        logger_1.logger.info(`📢 Broadcast notification sent to all connected users`);
    }
    // Send project update to project participants
    sendProjectUpdate(projectId, update) {
        this.io.to(`project_${projectId}`).emit('project_update', {
            ...update,
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info(`📋 Real-time project update sent: Project ${projectId}`);
    }
    // Send quote update to quote participants
    sendQuoteUpdate(quoteId, update) {
        this.io.to(`quote_${quoteId}`).emit('quote_update', {
            ...update,
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info(`💰 Real-time quote update sent: Quote ${quoteId}`);
    }
    // Send system alert to specific role
    sendRoleAlert(role, alert) {
        this.io.to(`role_${role}`).emit('system_alert', {
            ...alert,
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info(`🚨 System alert sent to role: ${role}`);
    }
    // Get online users count
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }
    // Get online users
    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    // Send real-time analytics update (for dashboard)
    sendAnalyticsUpdate(data) {
        this.io.emit('analytics_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info(`📊 Real-time analytics update sent`);
    }
    // Send system status update
    sendSystemStatus(status) {
        this.io.emit('system_status', {
            ...status,
            timestamp: new Date().toISOString(),
            onlineUsers: this.getOnlineUsersCount()
        });
        logger_1.logger.info(`🔧 System status update sent`);
    }
}
exports.WebSocketHandler = WebSocketHandler;
exports.default = WebSocketHandler;
