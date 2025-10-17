"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebSocketService = exports.initializeWebSocket = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserEnhanced_1 = require("../models/UserEnhanced");
const ProjectEnhanced_1 = require("../models/ProjectEnhanced");
const ProjectActivity_1 = require("../models/ProjectActivity");
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'balcon-builders-secret-key-2025';
// WebSocket service class
class WebSocketService {
    constructor(server) {
        this.connectedUsers = new Map(); // userId -> socketIds[]
        const origins = environment_1.config.server.frontendOrigins && environment_1.config.server.frontendOrigins.length
            ? environment_1.config.server.frontendOrigins
            : [process.env.FRONTEND_URL || 'http://localhost:3001'];
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: (origin, cb) => {
                    if (!origin)
                        return cb(null, true);
                    if (origins.includes(origin))
                        return cb(null, true);
                    if (environment_1.config.server.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin))
                        return cb(null, true);
                    return cb(new Error('WS origin not allowed'));
                },
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupMiddleware();
        this.setupEventHandlers();
        logger_1.logger.info('✅ WebSocket service initialized');
    }
    // Setup authentication middleware
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                // Verify JWT token
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                if (!decoded || decoded.type !== 'access') {
                    return next(new Error('Invalid token'));
                }
                // Find user
                const user = await UserEnhanced_1.User.findByPk(decoded.userId);
                if (!user || !user.isActive) {
                    return next(new Error('User not found or inactive'));
                }
                // Attach user to socket
                socket.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName
                };
                socket.userId = user.id;
                next();
            }
            catch (error) {
                logger_1.logger.warn('WebSocket authentication failed:', error);
                next(new Error('Authentication failed'));
            }
        });
    }
    // Setup event handlers
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    // Handle new connection
    handleConnection(socket) {
        const user = socket.user;
        logger_1.logger.info(`User connected: ${user.email} (${user.role}) - Socket: ${socket.id}`);
        // Track connected user
        const userSockets = this.connectedUsers.get(user.id) || [];
        userSockets.push(socket.id);
        this.connectedUsers.set(user.id, userSockets);
        // Join user-specific room
        socket.join(`user:${user.id}`);
        // Join role-specific room
        socket.join(`role:${user.role}`);
        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to Bal-Con Builders real-time service',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            timestamp: new Date()
        });
        // Setup event listeners
        this.setupSocketEventListeners(socket);
        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }
    // Setup socket event listeners
    setupSocketEventListeners(socket) {
        const user = socket.user;
        // Join project rooms
        socket.on('join_project', async (projectId) => {
            try {
                const project = await ProjectEnhanced_1.Project.findByPk(projectId);
                if (!project) {
                    socket.emit('error', { message: 'Project not found' });
                    return;
                }
                // Check if user can access project
                const userRecord = await UserEnhanced_1.User.findByPk(user.id);
                if (!userRecord?.canAccessProject(projectId)) {
                    socket.emit('error', { message: 'Access denied to project' });
                    return;
                }
                socket.join(`project:${projectId}`);
                socket.emit('joined_project', { projectId, projectTitle: project.title });
                logger_1.logger.info(`User ${user.email} joined project room: ${projectId}`);
            }
            catch (error) {
                logger_1.logger.error('Join project error:', error);
                socket.emit('error', { message: 'Failed to join project' });
            }
        });
        // Leave project rooms
        socket.on('leave_project', (projectId) => {
            socket.leave(`project:${projectId}`);
            socket.emit('left_project', { projectId });
            logger_1.logger.info(`User ${user.email} left project room: ${projectId}`);
        });
        // Handle project updates
        socket.on('project_update', async (data) => {
            try {
                const { projectId, update, activityType } = data;
                // Verify user can update project
                const userRecord = await UserEnhanced_1.User.findByPk(user.id);
                if (!userRecord?.canAccessProject(projectId)) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                // Create activity record
                await ProjectActivity_1.ProjectActivity.create({
                    projectId,
                    userId: user.id,
                    activityType: activityType,
                    description: `Project updated by ${user.firstName} ${user.lastName}`,
                    metadata: update
                });
                // Broadcast to project room
                socket.to(`project:${projectId}`).emit('project_updated', {
                    projectId,
                    update,
                    updatedBy: {
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        role: user.role
                    },
                    timestamp: new Date()
                });
                logger_1.logger.info(`Project ${projectId} updated by user ${user.email}`);
            }
            catch (error) {
                logger_1.logger.error('Project update error:', error);
                socket.emit('error', { message: 'Failed to update project' });
            }
        });
        // Handle typing indicators
        socket.on('typing_start', (data) => {
            socket.to(`project:${data.projectId}`).emit('user_typing', {
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                projectId: data.projectId
            });
        });
        socket.on('typing_stop', (data) => {
            socket.to(`project:${data.projectId}`).emit('user_stopped_typing', {
                userId: user.id,
                projectId: data.projectId
            });
        });
    }
    // Handle disconnection
    handleDisconnection(socket) {
        const user = socket.user;
        if (!user)
            return;
        logger_1.logger.info(`User disconnected: ${user.email} - Socket: ${socket.id}`);
        // Remove socket from connected users
        const userSockets = this.connectedUsers.get(user.id) || [];
        const updatedSockets = userSockets.filter(id => id !== socket.id);
        if (updatedSockets.length === 0) {
            this.connectedUsers.delete(user.id);
        }
        else {
            this.connectedUsers.set(user.id, updatedSockets);
        }
    }
    // Public methods for sending notifications
    // Send notification to specific user
    notifyUser(userId, notification) {
        this.io.to(`user:${userId}`).emit('notification', notification);
        logger_1.logger.info(`Notification sent to user ${userId}: ${notification.title}`);
    }
    // Send notification to users with specific role
    notifyRole(role, notification) {
        this.io.to(`role:${role}`).emit('notification', notification);
        logger_1.logger.info(`Notification sent to role ${role}: ${notification.title}`);
    }
    // Send notification to project participants
    notifyProject(projectId, notification) {
        this.io.to(`project:${projectId}`).emit('notification', notification);
        logger_1.logger.info(`Notification sent to project ${projectId}: ${notification.title}`);
    }
    // Broadcast system-wide notification
    broadcastNotification(notification) {
        this.io.emit('notification', notification);
        logger_1.logger.info(`System notification broadcasted: ${notification.title}`);
    }
    // Send project activity update
    async broadcastProjectActivity(projectId, activity) {
        try {
            // Get activity with user details
            const activityWithUser = await ProjectActivity_1.ProjectActivity.findByPk(activity.id, {
                include: [
                    {
                        model: UserEnhanced_1.User,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'role']
                    }
                ]
            });
            if (activityWithUser) {
                this.io.to(`project:${projectId}`).emit('project_activity', {
                    id: activityWithUser.id,
                    activityType: activityWithUser.activityType,
                    description: activityWithUser.description,
                    metadata: activityWithUser.metadata,
                    timestamp: activityWithUser.createdAt,
                    user: activityWithUser.user,
                    formattedMessage: activityWithUser.getFormattedMessage()
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Broadcast project activity error:', error);
        }
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    // Get connected users for a specific project
    getProjectParticipants(projectId) {
        const sockets = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
        return sockets ? sockets.size : 0;
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    // Get socket instance for advanced usage
    getSocketIO() {
        return this.io;
    }
}
exports.WebSocketService = WebSocketService;
// Singleton instance
let webSocketService;
// Initialize WebSocket service
const initializeWebSocket = (server) => {
    if (!webSocketService) {
        webSocketService = new WebSocketService(server);
    }
    return webSocketService;
};
exports.initializeWebSocket = initializeWebSocket;
// Get WebSocket service instance
const getWebSocketService = () => {
    if (!webSocketService) {
        throw new Error('WebSocket service not initialized');
    }
    return webSocketService;
};
exports.getWebSocketService = getWebSocketService;
exports.default = WebSocketService;
