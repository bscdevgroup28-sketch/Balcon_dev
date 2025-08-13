import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

interface NotificationsPanelProps {
  isRealTime?: boolean;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isRealTime = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    if (isRealTime) {
      // Simulate real-time notifications
      const interval = setInterval(() => {
        addMockNotification();
      }, 15000); // Add a new notification every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Mock notifications for Phase 5C demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Project Completed',
          message: 'Downtown Office Building Renovation has been completed successfully',
          read: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          metadata: { projectId: 1 }
        },
        {
          id: '2',
          type: 'warning',
          title: 'Budget Alert',
          message: 'Residential Balcony Installation is approaching budget limit',
          read: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          metadata: { projectId: 2, budget: 85 }
        },
        {
          id: '3',
          type: 'info',
          title: 'New Team Member',
          message: 'Sarah Johnson has joined as Senior Project Manager',
          read: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          metadata: { userId: 7 }
        },
        {
          id: '4',
          type: 'error',
          title: 'Material Shortage',
          message: 'Critical materials needed for Emergency Balcony Repair',
          read: false,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          metadata: { projectId: 3, priority: 'high' }
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMockNotification = () => {
    const mockNotifications = [
      {
        type: 'info' as const,
        title: 'System Update',
        message: 'System maintenance scheduled for tonight at 2 AM EST'
      },
      {
        type: 'success' as const,
        title: 'Payment Received',
        message: 'Payment of $25,000 received from client ABC Corp'
      },
      {
        type: 'warning' as const,
        title: 'Weather Alert',
        message: 'Rain forecasted - outdoor work may be delayed'
      }
    ];

    const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      ...randomNotification,
      read: false,
      createdAt: new Date(),
      metadata: { realTime: true }
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Notifications</span>
            {isRealTime && (
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-normal">Live</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                    getNotificationColor(notification.type)
                  } ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="mt-2">
                          <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;
