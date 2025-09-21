import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import NotificationsPanel from '../notifications/NotificationsPanel';
import EnhancedProjectManagement from '../projects/EnhancedProjectManagement';

interface MobileDashboardProps {
  userRole: string;
  userName: string;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ userRole, userName }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'projects', label: '📋 Projects', icon: '📋' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
    { id: 'notifications', label: '🔔 Alerts', icon: '🔔' },
  ];

  const quickActions = [
    { label: 'New Project', icon: '➕', action: () => console.log('New Project') },
    { label: 'Create Quote', icon: '💰', action: () => console.log('Create Quote') },
    { label: 'Upload Files', icon: '📁', action: () => console.log('Upload Files') },
    { label: 'Team Chat', icon: '💬', action: () => console.log('Team Chat') },
  ];

  const overviewStats = [
    { label: 'Active Projects', value: '12', change: '+2', icon: '📋' },
    { label: 'This Month Revenue', value: '$85K', change: '+15%', icon: '💰' },
    { label: 'Team Members', value: '15', change: '+1', icon: '👥' },
    { label: 'Completion Rate', value: '94%', change: '+3%', icon: '✅' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-3 rounded-lg text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </span>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-blue-100 mt-1">
          {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
        <div className="mt-4">
          <p className="text-sm text-blue-100">Today's Progress</p>
          <div className="w-full bg-blue-400 rounded-full h-2 mt-1">
            <div className="bg-white h-2 rounded-full" style={{ width: '68%' }}></div>
          </div>
          <p className="text-xs text-blue-100 mt-1">68% of daily tasks completed</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        {overviewStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                onClick={action.action}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
              <span>📈</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Project progress updated</p>
                <p className="text-xs text-gray-600">Downtown Renovation - 75% complete</p>
              </div>
              <span className="text-xs text-gray-500">2h</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
              <span>💰</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-gray-600">$25,000 from MetroTech Solutions</p>
              </div>
              <span className="text-xs text-gray-500">4h</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
              <span>⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Weather alert</p>
                <p className="text-xs text-gray-600">Rain expected - outdoor work affected</p>
              </div>
              <span className="text-xs text-gray-500">6h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'projects':
        return <EnhancedProjectManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'notifications':
        return <NotificationsPanel isRealTime={true} />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progressive Web App features */}
      {isMobile && (
        <div className="bg-blue-600 text-white p-2 text-center text-sm">
          📱 Mobile-Optimized Experience | 
          {isOnline ? ' 🟢 Online' : ' 🔴 Offline Mode'}
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20">
        {renderTabContent()}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label.split(' ')[1]}</span>
                {activeTab === tab.id && (
                  <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Main Content Area */}
      {!isMobile && (
        <div className="ml-64 p-6">
          {renderTabContent()}
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Working offline</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
