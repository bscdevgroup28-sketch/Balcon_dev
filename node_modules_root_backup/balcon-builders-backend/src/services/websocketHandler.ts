import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface SocketUser {
  id: number;
  email: string;
  role: string;
}

interface AuthenticatedSocket {
  user?: SocketUser;
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
  to: (room: string) => any;
  handshake: any;
}

export class WebSocketHandler {
  private io: any; // Socket.IO Server
  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId

  constructor(io: any) {
    this.io = io;
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    // Authentication middleware for WebSocket connections
    this.io.use((socket: any, next: any) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'balcon-secret-2024') as any;
        socket.user = decoded;
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });

    logger.info('🔌 WebSocket handlers initialized');
  }

  private handleConnection(socket: any): void {
    if (!socket.user) return;

    const userId = socket.user.id;
    const userEmail = socket.user.email;

    // Store user connection
    this.connectedUsers.set(userId, socket.id);

    logger.info(`🔌 WebSocket connected: ${userEmail} (${socket.id})`);

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
      logger.info(`🔌 WebSocket disconnected: ${userEmail} (${socket.id})`);
    });
  }

  private setupSocketEvents(socket: any): void {
    if (!socket.user) return;

    // Project updates
    socket.on('join_project', (projectId: number) => {
      socket.join(`project_${projectId}`);
      logger.info(`👤 ${socket.user!.email} joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId: number) => {
      socket.leave(`project_${projectId}`);
      logger.info(`👤 ${socket.user!.email} left project room: ${projectId}`);
    });

    // Real-time collaboration
    socket.on('project_activity', (data: {
      projectId: number;
      action: string;
      details: any;
    }) => {
      const activity = {
        ...data,
        userId: socket.user!.id,
        userEmail: socket.user!.email,
        timestamp: new Date().toISOString()
      };

      // Broadcast to project room
      socket.to(`project_${data.projectId}`).emit('project_update', activity);
      logger.info(`📋 Project activity broadcast: ${data.action} on project ${data.projectId}`);
    });

    // Notification acknowledgment
    socket.on('notification_read', (notificationId: string) => {
      logger.info(`📧 Notification marked as read: ${notificationId} by ${socket.user!.email}`);
    });

    // Typing indicators for chat/comments (future feature)
    socket.on('typing', (data: { projectId: number; isTyping: boolean }) => {
      socket.to(`project_${data.projectId}`).emit('user_typing', {
        userId: socket.user!.id,
        userEmail: socket.user!.email,
        isTyping: data.isTyping
      });
    });

    // Real-time quote updates
    socket.on('join_quote', (quoteId: number) => {
      socket.join(`quote_${quoteId}`);
      logger.info(`💰 ${socket.user!.email} joined quote room: ${quoteId}`);
    });

    socket.on('leave_quote', (quoteId: number) => {
      socket.leave(`quote_${quoteId}`);
      logger.info(`💰 ${socket.user!.email} left quote room: ${quoteId}`);
    });
  }

  // Public methods for emitting events from other parts of the application

  // Send notification to specific user
  public sendNotificationToUser(userId: number, notification: any): void {
    this.io.to(`user_${userId}`).emit('new_notification', notification);
    logger.info(`📧 Real-time notification sent to user: ${userId}`);
  }

  // Send notification to multiple users
  public sendNotificationToUsers(userIds: number[], notification: any): void {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Broadcast to all connected users
  public broadcastNotification(notification: any): void {
    this.io.emit('broadcast_notification', notification);
    logger.info(`📢 Broadcast notification sent to all connected users`);
  }

  // Send project update to project participants
  public sendProjectUpdate(projectId: number, update: any): void {
    this.io.to(`project_${projectId}`).emit('project_update', {
      ...update,
      timestamp: new Date().toISOString()
    });
    logger.info(`📋 Real-time project update sent: Project ${projectId}`);
  }

  // Send quote update to quote participants
  public sendQuoteUpdate(quoteId: number, update: any): void {
    this.io.to(`quote_${quoteId}`).emit('quote_update', {
      ...update,
      timestamp: new Date().toISOString()
    });
    logger.info(`💰 Real-time quote update sent: Quote ${quoteId}`);
  }

  // Send system alert to specific role
  public sendRoleAlert(role: string, alert: any): void {
    this.io.to(`role_${role}`).emit('system_alert', {
      ...alert,
      timestamp: new Date().toISOString()
    });
    logger.info(`🚨 System alert sent to role: ${role}`);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get online users
  public getOnlineUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Send real-time analytics update (for dashboard)
  public sendAnalyticsUpdate(data: any): void {
    this.io.emit('analytics_update', {
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.info(`📊 Real-time analytics update sent`);
  }

  // Send system status update
  public sendSystemStatus(status: any): void {
    this.io.emit('system_status', {
      ...status,
      timestamp: new Date().toISOString(),
      onlineUsers: this.getOnlineUsersCount()
    });
    logger.info(`🔧 System status update sent`);
  }
}

export default WebSocketHandler;
