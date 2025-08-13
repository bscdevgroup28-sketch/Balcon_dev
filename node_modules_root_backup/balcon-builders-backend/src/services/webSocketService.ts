import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/UserEnhanced';
import { Project } from '../models/ProjectEnhanced';
import { ProjectActivity } from '../models/ProjectActivity';
import { logger } from '../utils/logger';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'balcon-builders-secret-key-2025';

// Socket user interface
interface SocketUser {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

// Extended socket interface
interface AuthenticatedSocket extends SocketIOServer {
  user?: SocketUser;
  userId?: number;
}

// Real-time notification types
export interface NotificationData {
  type: 'project_update' | 'assignment' | 'status_change' | 'message' | 'system';
  title: string;
  message: string;
  projectId?: number;
  userId?: number;
  metadata?: any;
  timestamp: Date;
}

// WebSocket service class
export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<number, string[]> = new Map(); // userId -> socketIds[]

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('✅ WebSocket service initialized');
  }

  // Setup authentication middleware
  private setupMiddleware(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        if (!decoded || decoded.type !== 'access') {
          return next(new Error('Invalid token'));
        }

        // Find user
        const user = await User.findByPk(decoded.userId);
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
      } catch (error) {
        logger.warn('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });
  }

  // Handle new connection
  private handleConnection(socket: any): void {
    const user = socket.user as SocketUser;
    logger.info(`User connected: ${user.email} (${user.role}) - Socket: ${socket.id}`);

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
  private setupSocketEventListeners(socket: any): void {
    const user = socket.user as SocketUser;

    // Join project rooms
    socket.on('join_project', async (projectId: number) => {
      try {
        const project = await Project.findByPk(projectId);
        if (!project) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        // Check if user can access project
        const userRecord = await User.findByPk(user.id);
        if (!userRecord?.canAccessProject(projectId)) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        socket.join(`project:${projectId}`);
        socket.emit('joined_project', { projectId, projectTitle: project.title });
        
        logger.info(`User ${user.email} joined project room: ${projectId}`);
      } catch (error) {
        logger.error('Join project error:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // Leave project rooms
    socket.on('leave_project', (projectId: number) => {
      socket.leave(`project:${projectId}`);
      socket.emit('left_project', { projectId });
      
      logger.info(`User ${user.email} left project room: ${projectId}`);
    });

    // Handle project updates
    socket.on('project_update', async (data: { projectId: number; update: any; activityType: string }) => {
      try {
        const { projectId, update, activityType } = data;

        // Verify user can update project
        const userRecord = await User.findByPk(user.id);
        if (!userRecord?.canAccessProject(projectId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create activity record
        await ProjectActivity.create({
          projectId,
          userId: user.id,
          activityType: activityType as any,
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

        logger.info(`Project ${projectId} updated by user ${user.email}`);
      } catch (error) {
        logger.error('Project update error:', error);
        socket.emit('error', { message: 'Failed to update project' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { projectId: number }) => {
      socket.to(`project:${data.projectId}`).emit('user_typing', {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        projectId: data.projectId
      });
    });

    socket.on('typing_stop', (data: { projectId: number }) => {
      socket.to(`project:${data.projectId}`).emit('user_stopped_typing', {
        userId: user.id,
        projectId: data.projectId
      });
    });
  }

  // Handle disconnection
  private handleDisconnection(socket: any): void {
    const user = socket.user as SocketUser;
    if (!user) return;

    logger.info(`User disconnected: ${user.email} - Socket: ${socket.id}`);

    // Remove socket from connected users
    const userSockets = this.connectedUsers.get(user.id) || [];
    const updatedSockets = userSockets.filter(id => id !== socket.id);
    
    if (updatedSockets.length === 0) {
      this.connectedUsers.delete(user.id);
    } else {
      this.connectedUsers.set(user.id, updatedSockets);
    }
  }

  // Public methods for sending notifications

  // Send notification to specific user
  public notifyUser(userId: number, notification: NotificationData): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
    logger.info(`Notification sent to user ${userId}: ${notification.title}`);
  }

  // Send notification to users with specific role
  public notifyRole(role: string, notification: NotificationData): void {
    this.io.to(`role:${role}`).emit('notification', notification);
    logger.info(`Notification sent to role ${role}: ${notification.title}`);
  }

  // Send notification to project participants
  public notifyProject(projectId: number, notification: NotificationData): void {
    this.io.to(`project:${projectId}`).emit('notification', notification);
    logger.info(`Notification sent to project ${projectId}: ${notification.title}`);
  }

  // Broadcast system-wide notification
  public broadcastNotification(notification: NotificationData): void {
    this.io.emit('notification', notification);
    logger.info(`System notification broadcasted: ${notification.title}`);
  }

  // Send project activity update
  public async broadcastProjectActivity(projectId: number, activity: ProjectActivity): Promise<void> {
    try {
      // Get activity with user details
      const activityWithUser = await ProjectActivity.findByPk(activity.id, {
        include: [
          {
            model: User,
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
    } catch (error) {
      logger.error('Broadcast project activity error:', error);
    }
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users for a specific project
  public getProjectParticipants(projectId: number): number {
    const sockets = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
    return sockets ? sockets.size : 0;
  }

  // Check if user is online
  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get socket instance for advanced usage
  public getSocketIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let webSocketService: WebSocketService;

// Initialize WebSocket service
export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
};

// Get WebSocket service instance
export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return webSocketService;
};

export default WebSocketService;
