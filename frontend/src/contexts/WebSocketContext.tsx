import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import webSocketService, { NotificationData, ProjectActivityData } from '../services/websocketService';

// WebSocket context interface
interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  notifications: NotificationData[];
  projectActivities: ProjectActivityData[];
  subscribeToProject: (projectId: number) => void;
  unsubscribeFromProject: (projectId: number) => void;
  updateProject: (projectId: number, update: any, activityType: string) => void;
  startTyping: (projectId: number) => void;
  stopTyping: (projectId: number) => void;
  clearNotifications: () => void;
  markNotificationRead: (index: number) => void;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [projectActivities, setProjectActivities] = useState<ProjectActivityData[]>([]);

  // Setup WebSocket event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setConnectionState('error');
    };

    const handleNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
    };

    const handleProjectActivity = (activity: ProjectActivityData) => {
      setProjectActivities(prev => [activity, ...prev]);
    };

    // Subscribe to WebSocket events
    webSocketService.on('connected', handleConnected);
    webSocketService.on('authenticated', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('socketError', handleError);
    webSocketService.on('notification', handleNotification);
    webSocketService.on('projectActivity', handleProjectActivity);

    // Update connection state periodically
    const interval = setInterval(() => {
      setConnectionState(webSocketService.getConnectionState());
      setIsConnected(webSocketService.isConnected());
    }, 1000);

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('authenticated', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
      webSocketService.off('socketError', handleError);
      webSocketService.off('notification', handleNotification);
      webSocketService.off('projectActivity', handleProjectActivity);
      clearInterval(interval);
    };
  }, []);

  // WebSocket methods
  const subscribeToProject = (projectId: number) => {
    webSocketService.joinProject(projectId);
  };

  const unsubscribeFromProject = (projectId: number) => {
    webSocketService.leaveProject(projectId);
  };

  const updateProject = (projectId: number, update: any, activityType: string) => {
    webSocketService.updateProject(projectId, update, activityType);
  };

  const startTyping = (projectId: number) => {
    webSocketService.startTyping(projectId);
  };

  const stopTyping = (projectId: number) => {
    webSocketService.stopTyping(projectId);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationRead = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Context value
  const contextValue: WebSocketContextType = {
    isConnected,
    connectionState,
    notifications,
    projectActivities,
    subscribeToProject,
    unsubscribeFromProject,
    updateProject,
    startTyping,
    stopTyping,
    clearNotifications,
    markNotificationRead,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;