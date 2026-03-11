/**
 * Service for managing the Service Worker registration and updates
 */
class ServiceWorkerService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable: boolean = false;
  private updateCallbacks: (() => void)[] = [];
  
  /**
   * Register the service worker
   */
  public async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker is not supported in this browser');
      return false;
    }
    
    // Check if we're in a development environment that doesn't support Service Workers
    if (import.meta.env.DEV && window.location.hostname === 'localhost') {
      // Additional check for StackBlitz/WebContainer environment
      try {
        // Test if Service Worker registration is actually supported
        const testRegistration = navigator.serviceWorker.register;
        if (!testRegistration) {
          console.warn('Service Worker registration is not available in this environment');
          return false;
        }
      } catch (error) {
        console.warn('Service Worker is not supported in this development environment:', error);
        return false;
      }
    }
    
    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', this.registration.scope);
      
      // Set up update listeners
      this.setupUpdateListeners();
      
      return true;
    } catch (error) {
      // Check if this is a known environment limitation
      if (error instanceof Error && error.message.includes('StackBlitz')) {
        console.warn('Service Worker registration skipped: StackBlitz environment detected');
      } else {
        console.error('Service Worker registration failed:', error);
      }
      return false;
    }
  }

  /**
   * Set up listeners for service worker updates
   */
  private setupUpdateListeners(): void {
    if (!this.registration) return;
    
    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and ready to take over
            this.updateAvailable = true;
            this.notifyUpdateAvailable();
          }
        });
      }
    });
    
    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // This fires when the service worker controlling this page changes
      // (i.e. when a new service worker has skipped waiting and become active)
      console.log('Service Worker controller changed');
    });
  }

  /**
   * Check for service worker updates
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    
    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('Error checking for Service Worker updates:', error);
      return false;
    }
  }

  /**
   * Apply available updates
   */
  public async applyUpdates(): Promise<boolean> {
    if (!this.registration || !this.updateAvailable) {
      return false;
    }
    
    try {
      const worker = this.registration.waiting;
      
      if (worker) {
        // Send message to skip waiting
        worker.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error applying Service Worker updates:', error);
      return false;
    }
  }

  /**
   * Subscribe to update notifications
   */
  public onUpdateAvailable(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers about available updates
   */
  private notifyUpdateAvailable(): void {
    this.updateCallbacks.forEach(callback => callback());
  }

  /**
   * Unregister the service worker
   */
  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    
    try {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        console.log('Service Worker unregistered successfully');
      }
      return success;
    } catch (error) {
      console.error('Error unregistering Service Worker:', error);
      return false;
    }
  }

  /**
   * Send a message to the service worker
   */
  public async sendMessage(message: any): Promise<any> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      return null;
    }
    
    try {
      // Create a message channel
      const messageChannel = new MessageChannel();
      
      // Set up promise to wait for response
      const messagePromise = new Promise(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data);
        };
      });
      
      // Send the message
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      
      // Wait for response with timeout
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => resolve({ error: 'Timeout waiting for Service Worker response' }), 3000);
      });
      
      return Promise.race([messagePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error sending message to Service Worker:', error);
      return null;
    }
  }

  /**
   * Check if the app is installed (PWA)
   */
  public isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }

  /**
   * Get cache storage usage
   */
  public async getCacheStorageUsage(): Promise<{ name: string, size: number }[]> {
    if (!('caches' in window)) {
      return [];
    }
    
    try {
      const cacheNames = await caches.keys();
      const cacheInfos = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          // Estimate size (this is approximate)
          let size = 0;
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              size += blob.size;
            }
          }
          
          return { name, size };
        })
      );
      
      return cacheInfos;
    } catch (error) {
      console.error('Error getting cache storage usage:', error);
      return [];
    }
  }

  /**
   * Clear a specific cache
   */
  public async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }
    
    try {
      await caches.delete(cacheName);
      return true;
    } catch (error) {
      console.error(`Error clearing cache ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  public async clearAllCaches(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return true;
    } catch (error) {
      console.error('Error clearing all caches:', error);
      return false;
    }
  }
}

// Export singleton instance
export const serviceWorkerService = new ServiceWorkerService();