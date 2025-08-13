class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private listeners: { [event: string]: Function[] } = {};
  private token: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // Connect to WebSocket server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
        // Connect to Phase 5B WebSocket server
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8082';
        this.ws = new WebSocket(wsUrl);

        // Send authentication token after connection
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Send authentication
          this.send('authenticate', { token });
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;
          this.emit('disconnected', event);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
  }

  // Send message to server
  send(event: string, data?: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
      this.ws.send(message);
    } else {
      console.warn('WebSocket not connected, message not sent:', event, data);
    }
  }

  // Handle incoming messages
  private handleMessage(message: any): void {
    const { event, data } = message;
    
    switch (event) {
      case 'connected':
        console.log('🎉 WebSocket authentication successful');
        break;
      case 'project_update':
        this.emit('projectUpdate', data);
        break;
      case 'new_notification':
        this.emit('notification', data);
        break;
      case 'user_activity':
        this.emit('userActivity', data);
        break;
      case 'analytics_update':
        this.emit('analyticsUpdate', data);
        break;
      case 'system_alert':
        this.emit('systemAlert', data);
        break;
      default:
        this.emit(event, data);
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

  private emit(event: string, data?: any): void {
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
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
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
    this.send('join_project', projectId);
  }

  leaveProject(projectId: number): void {
    this.send('leave_project', projectId);
  }

  sendProjectActivity(projectId: number, action: string, details: any): void {
    this.send('project_activity', { projectId, action, details });
  }

  // Notification methods
  markNotificationRead(notificationId: string): void {
    this.send('notification_read', notificationId);
  }

  // Typing indicators
  sendTyping(projectId: number, isTyping: boolean): void {
    this.send('typing', { projectId, isTyping });
  }

  // Quote methods
  joinQuote(quoteId: number): void {
    this.send('join_quote', quoteId);
  }

  leaveQuote(quoteId: number): void {
    this.send('leave_quote', quoteId);
  }

  // Connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'disconnecting';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Setup browser event listeners
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, could pause reconnection attempts
        console.log('📱 Page hidden - WebSocket activity reduced');
      } else {
        // Page is visible again, ensure connection
        console.log('📱 Page visible - WebSocket activity resumed');
        if (!this.isConnected() && this.token) {
          this.connect(this.token).catch(console.error);
        }
      }
    });

    // Handle network changes
    window.addEventListener('online', () => {
      console.log('🌐 Network online - attempting WebSocket reconnection');
      if (!this.isConnected() && this.token) {
        this.connect(this.token).catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network offline - WebSocket will be disconnected');
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  // Mock real-time data for Phase 5C demo
  startMockUpdates(): void {
    // Simulate project updates
    setInterval(() => {
      if (this.isConnected()) {
        this.emit('projectUpdate', {
          projectId: Math.floor(Math.random() * 3) + 1,
          type: 'progress',
          progress: Math.floor(Math.random() * 100),
          timestamp: new Date().toISOString()
        });
      }
    }, 30000);

    // Simulate notifications
    setInterval(() => {
      if (this.isConnected()) {
        const notifications = [
          { type: 'info', title: 'System Update', message: 'New features available' },
          { type: 'success', title: 'Task Completed', message: 'Quality inspection passed' },
          { type: 'warning', title: 'Weather Alert', message: 'Rain expected tomorrow' }
        ];
        
        const notification = notifications[Math.floor(Math.random() * notifications.length)];
        this.emit('notification', {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        });
      }
    }, 45000);
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
