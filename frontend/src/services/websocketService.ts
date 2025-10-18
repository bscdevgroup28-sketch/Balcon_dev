import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/api';

// Notification data interface
export interface NotificationData {
  type: 'project_update' | 'assignment' | 'status_change' | 'message' | 'system';
  title: string;
  message: string;
  projectId?: number;
  userId?: number;
  metadata?: any;
  timestamp: Date;
}

// Project activity interface
export interface ProjectActivityData {
  id: number;
  activityType: string;
  description: string;
  metadata?: any;
  timestamp: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  formattedMessage: string;
}

// WebSocket service class using Socket.IO
class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private listeners: { [event: string]: Function[] } = {};
  private token: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // Connect to Socket.IO server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.token = token;

      try {
        // Connect to Socket.IO server
  const serverUrl = SOCKET_BASE_URL;
  this.socket = io(serverUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('✅ Socket.IO connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          // Refresh analytics on (re)connect to ensure dashboard data is up to date
          try { this.refreshAnalytics(); } catch {}
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.IO disconnected:', reason);
          this.isConnecting = false;
          this.emit('disconnected', reason);

          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            // Server disconnected, don't reconnect automatically
            return;
          }

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        });

        // Setup message handlers
        this.setupMessageHandlers();

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Setup message event handlers
  private setupMessageHandlers(): void {
    if (!this.socket) return;

    // Connection confirmation
    this.socket.on('connected', (data) => {
      console.log('🎉 Socket.IO authentication successful:', data);
      this.emit('authenticated', data);
    });

    // Notifications
    this.socket.on('notification', (notification: NotificationData) => {
      this.emit('notification', notification);
    });

    // Project updates
    this.socket.on('project_updated', (data) => {
      this.emit('projectUpdate', data);
      try { this.refreshAnalytics(); } catch {}
    });

    // Project activities
    this.socket.on('project_activity', (activity: ProjectActivityData) => {
      this.emit('projectActivity', activity);
      try { this.refreshAnalytics(); } catch {}
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('userTyping', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('userStoppedTyping', data);
    });

    // Order and inventory signals (if emitted by server)
    this.socket.on('order_updated', () => { try { this.refreshAnalytics(); } catch {} });
    this.socket.on('inventory_changed', () => { try { this.refreshAnalytics(); } catch {} });

  // Backend-wide analytics update hint (legacy/aux handlers)
  this.socket.on('analytics_update', () => { try { this.refreshAnalytics(); } catch {} });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      this.emit('socketError', error);
    });
  }

  private refreshAnalytics(): void {
    // Lazy import redux store to avoid circular deps at module init
    import('../store/store').then(({ store }: any) => {
      import('../store/slices/analyticsSlice').then(({ fetchAnalyticsSummary, fetchAnalyticsTrends, fetchAnalyticsAnomalies, fetchAnalyticsForecast }) => {
        const dispatch = store.dispatch as any;
        dispatch(fetchAnalyticsSummary());
        dispatch(fetchAnalyticsTrends('30d'));
        dispatch(fetchAnalyticsAnomalies({ range: '30d' }));
        dispatch(fetchAnalyticsForecast({ metric: 'ordersCreated', horizon: 14 }));
      });
    }).catch(() => {/* noop */});
  }

  // Disconnect from Socket.IO
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
  }

  // Send message to server
  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO not connected, message not sent:', event, data);
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emitLocal(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Auto-reconnect logic
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emitLocal('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Attempting Socket.IO reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Project-specific methods
  joinProject(projectId: number): void {
    this.emit('join_project', projectId);
  }

  leaveProject(projectId: number): void {
    this.emit('leave_project', projectId);
  }

  updateProject(projectId: number, update: any, activityType: string): void {
    this.emit('project_update', { projectId, update, activityType });
  }

  // Typing indicators
  startTyping(projectId: number): void {
    this.emit('typing_start', { projectId });
  }

  stopTyping(projectId: number): void {
    this.emit('typing_stop', { projectId });
  }

  // Connection status
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Setup browser event listeners
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 Page hidden - Socket.IO activity reduced');
      } else {
        console.log('📱 Page visible - Socket.IO activity resumed');
        if (!this.isConnected() && this.token) {
          this.connect(this.token).catch(console.error);
        }
      }
    });

    // Handle network changes
    window.addEventListener('online', () => {
      console.log('🌐 Network online - attempting Socket.IO reconnection');
      if (!this.isConnected() && this.token) {
        this.connect(this.token).catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network offline - Socket.IO will be disconnected');
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  // Get socket instance for advanced usage
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
