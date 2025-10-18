class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private installPrompt: any = null;
  private isInstalled = false;

  constructor() {
    this.initializePWA();
  }

  // Initialize PWA features
  private async initializePWA(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdateHandling();
        this.checkInstallStatus();
        this.setupNotifications();
      } catch (error) {
        // PWA initialization failed
      }
    } else {
      // Service Worker not supported
    }
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Service Worker registered

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle controlled state changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      // Service Worker registration failed
      throw error;
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Install prompt available
      event.preventDefault();
      this.installPrompt = event;
      this.notifyInstallAvailable();
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      this.isInstalled = true;
      this.installPrompt = null;
      this.notifyAppInstalled();
    });
  }

  // Setup update handling
  private setupUpdateHandling(): void {
    // Check for updates periodically
    setInterval(() => {
      if (this.registration) {
        this.registration.update();
      }
    }, 60000); // Check every minute

    // Handle message from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('📦 Cache updated');
        this.notifyCacheUpdated();
      }
    });
  }

  // Check if app is already installed
  private checkInstallStatus(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 Running as installed PWA');
    }
  }

  // Setup push notifications
  private async setupNotifications(): Promise<void> {
    if ('Notification' in window && 'PushManager' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        await this.subscribeToPushNotifications();
      } else {
        console.log('⚠️ Notification permission denied');
      }
    }
  }

  // Subscribe to push notifications
  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || 'demo-key'
        )
      });

      console.log('📬 Push subscription created');
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
    }
  }

  // Public methods

  // Trigger app install
  public async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('⚠️ Install prompt not available');
      return false;
    }

    try {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted install');
        this.installPrompt = null;
        return true;
      } else {
        console.log('❌ User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('❌ Install failed:', error);
      return false;
    }
  }

  // Update app
  public async updateApp(): Promise<void> {
    if (!this.registration || !this.updateAvailable) {
      console.log('⚠️ No update available');
      return;
    }

    try {
      const waiting = this.registration.waiting;
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('❌ Update failed:', error);
    }
  }

  // Check if install is available
  public isInstallAvailable(): boolean {
    return this.installPrompt !== null;
  }

  // Check if update is available
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  // Check if app is installed
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  // Send notification
  public async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      } catch (error) {
        console.error('❌ Notification failed:', error);
      }
    }
  }

  // Add to home screen prompt
  public showAddToHomeScreen(): void {
    if (this.isInstallAvailable()) {
      this.installApp();
    } else {
      // Show manual instructions for different browsers
      this.showManualInstallInstructions();
    }
  }

  // Cache management
  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ Cache cleared');
      } catch (error) {
        console.error('❌ Cache clear failed:', error);
      }
    }
  }

  // Get cache size
  public async getCacheSize(): Promise<number> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
        }

        return totalSize;
      } catch (error) {
        console.error('❌ Cache size calculation failed:', error);
        return 0;
      }
    }
    return 0;
  }

  // Enable offline mode
  public enableOfflineMode(): void {
    document.body.classList.add('offline-mode');
    console.log('📱 Offline mode enabled');
  }

  // Disable offline mode
  public disableOfflineMode(): void {
    document.body.classList.remove('offline-mode');
    console.log('🌐 Online mode enabled');
  }

  // Private helper methods

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    // Return ArrayBuffer to satisfy older lib.dom BufferSource typing in TS 4.8
    return outputArray.buffer as ArrayBuffer;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // Send to Phase 5B backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        console.log('✅ Subscription sent to server');
      } else {
        console.error('❌ Failed to send subscription to server');
      }
    } catch (error) {
      console.error('❌ Error sending subscription:', error);
    }
  }

  private notifyInstallAvailable(): void {
    // Dispatch custom event for install availability
    window.dispatchEvent(new CustomEvent('pwa:installAvailable'));
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update availability
    window.dispatchEvent(new CustomEvent('pwa:updateAvailable'));
  }

  private notifyAppInstalled(): void {
    // Dispatch custom event for app installation
    window.dispatchEvent(new CustomEvent('pwa:appInstalled'));
  }

  private notifyCacheUpdated(): void {
    // Dispatch custom event for cache update
    window.dispatchEvent(new CustomEvent('pwa:cacheUpdated'));
  }

  private showManualInstallInstructions(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('chrome')) {
      instructions = 'Chrome: Menu → More tools → Create shortcut → Check "Open as window"';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Firefox: Menu → Page → Install this site as an app';
    } else if (userAgent.includes('safari')) {
      instructions = 'Safari: Share button → Add to Home Screen';
    } else if (userAgent.includes('edge')) {
      instructions = 'Edge: Menu → Apps → Install this site as an app';
    } else {
      instructions = 'Look for "Install" or "Add to Home Screen" in your browser menu';
    }

    alert(`To install Bal-Con Builders:\n\n${instructions}`);
  }
}

// Create singleton instance
export const pwaService = new PWAService();
export default pwaService;
