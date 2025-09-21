import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Check } from '../ui/icons';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import pwaService from '../../services/pwaService';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  position?: 'top' | 'bottom' | 'modal';
  showFeatures?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onDismiss,
  position = 'bottom',
  showFeatures = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsInstalled(pwaService.isAppInstalled());
    setIsVisible(pwaService.isInstallAvailable() && !pwaService.isAppInstalled());

    // Listen for PWA events
    const handleInstallAvailable = () => {
      if (!pwaService.isAppInstalled()) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setIsInstalling(false);
    };

    window.addEventListener('pwa:installAvailable', handleInstallAvailable);
    window.addEventListener('pwa:appInstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa:installAvailable', handleInstallAvailable);
      window.removeEventListener('pwa:appInstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaService.installApp();
      if (!success) {
        // Show manual instructions
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  const features = [
    { icon: <Smartphone className="w-4 h-4" />, text: 'Works offline' },
    { icon: <Monitor className="w-4 h-4" />, text: 'Native app experience' },
    { icon: <Download className="w-4 h-4" />, text: 'Fast loading' },
    { icon: <Check className="w-4 h-4" />, text: 'Push notifications' }
  ];

  const bannerContent = (
    <Card className={`
      ${position === 'modal' ? 'max-w-md mx-auto' : 'w-full'}
      bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl
    `}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">BC</span>
            </div>
            <div>
              <h3 className="font-semibold">Install Bal-Con Builders</h3>
              <p className="text-blue-100 text-sm">Get the full app experience</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {showFeatures && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="text-blue-200">{feature.icon}</span>
                <span className="text-blue-100">{feature.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install App
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-white/30 text-white hover:bg-white/20"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </Card>
  );

  if (position === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        {bannerContent}
      </div>
    );
  }

  return (
    <div className={`
      fixed left-0 right-0 p-4 z-50 animate-slide-up
      ${position === 'top' ? 'top-0' : 'bottom-0'}
    `}>
      {bannerContent}
    </div>
  );
};

// PWA Status Indicator Component
export const PWAStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState({
    isInstalled: false,
    isOnline: true,
    updateAvailable: false
  });

  useEffect(() => {
    // Initial status
    setStatus({
      isInstalled: pwaService.isAppInstalled(),
      isOnline: navigator.onLine,
      updateAvailable: pwaService.isUpdateAvailable()
    });

    // Listen for status changes
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
    const handleUpdateAvailable = () => setStatus(prev => ({ ...prev, updateAvailable: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa:updateAvailable', handleUpdateAvailable);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa:updateAvailable', handleUpdateAvailable);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {status.isInstalled && (
        <Badge variant="success" className="text-xs">
          <Monitor className="w-3 h-3 mr-1" />
          Installed
        </Badge>
      )}
      
      <Badge 
        variant={status.isOnline ? 'success' : 'warning'} 
        className="text-xs"
      >
        <div className={`w-2 h-2 rounded-full mr-1 ${
          status.isOnline ? 'bg-green-400' : 'bg-yellow-400'
        }`} />
        {status.isOnline ? 'Online' : 'Offline'}
      </Badge>

      {status.updateAvailable && (
        <div 
          className="cursor-pointer" 
          onClick={() => pwaService.updateApp()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && pwaService.updateApp()}
        >
          <Badge variant="info" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Update Available
          </Badge>
        </div>
      )}
    </div>
  );
};

// PWA Features Showcase Component
export const PWAFeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-blue-500" />,
      title: 'Mobile First',
      description: 'Optimized for mobile devices with touch-friendly interface'
    },
    {
      icon: <Monitor className="w-8 h-8 text-green-500" />,
      title: 'Cross Platform',
      description: 'Works seamlessly on desktop, tablet, and mobile devices'
    },
    {
      icon: <Download className="w-8 h-8 text-purple-500" />,
      title: 'Offline Ready',
      description: 'Access your data and continue working even without internet'
    },
    {
      icon: <Check className="w-8 h-8 text-orange-500" />,
      title: 'Push Notifications',
      description: 'Stay updated with real-time project and order notifications'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-sm">{feature.description}</p>
        </Card>
      ))}
    </div>
  );
};

export default PWAInstallBanner;
