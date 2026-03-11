import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cacheService } from '../services/cacheService';
import { authCacheService } from '../services/authCacheService';
import { serviceWorkerService } from '../services/serviceWorkerService';

interface CacheContextType {
  // Cache status
  isCacheSupported: {
    localStorage: boolean;
    sessionStorage: boolean;
    serviceWorker: boolean;
  };
  isPrivateMode: boolean;
  isOffline: boolean;
  
  // Cache statistics
  cacheSize: {
    local: number;
    session: number;
    memory: number;
  };
  
  // Service worker
  serviceWorkerRegistered: boolean;
  updateAvailable: boolean;
  
  // Actions
  clearAllCache: () => void;
  clearAuthCache: () => void;
  applyServiceWorkerUpdate: () => Promise<boolean>;
  registerServiceWorker: () => Promise<boolean>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Cache support status
  const [isCacheSupported, setIsCacheSupported] = useState(cacheService.isCachingSupported());
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Cache statistics
  const [cacheSize, setCacheSize] = useState(cacheService.getCacheSize());
  
  // Service worker status
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Initialize service worker
  useEffect(() => {
    const initServiceWorker = async () => {
      // Only attempt Service Worker registration in supported environments
      if ('serviceWorker' in navigator && !isStackBlitzEnvironment()) {
        const registered = await serviceWorkerService.register();
        setServiceWorkerRegistered(registered);
        
        // Only set up update listeners if registration was successful
        if (registered) {
          serviceWorkerService.onUpdateAvailable(() => {
            setUpdateAvailable(true);
          });
        }
      } else {
        console.info('Service Worker registration skipped: unsupported environment');
      }
    };
    
    initServiceWorker();
  }, []);
  
  // Helper function to detect StackBlitz environment
  const isStackBlitzEnvironment = (): boolean => {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('stackblitz') ||
      window.location.hostname.includes('webcontainer') ||
      // Check for StackBlitz-specific global variables
      (window as any).__stackblitz__ !== undefined
    );
  };

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update cache statistics periodically
  useEffect(() => {
    const updateCacheStats = () => {
      setCacheSize(cacheService.getCacheSize());
    };
    
    // Update immediately
    updateCacheStats();
    
    // Then update every minute
    const intervalId = setInterval(updateCacheStats, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Detect private mode
  useEffect(() => {
    const detectPrivateMode = async () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        setIsPrivateMode(false);
      } catch (e) {
        setIsPrivateMode(true);
      }
    };
    
    detectPrivateMode();
  }, []);

  // Clear all cache
  const clearAllCache = () => {
    cacheService.clear();
    cacheService.clear(undefined, { storage: 'session' });
    
    // Update cache statistics
    setCacheSize(cacheService.getCacheSize());
  };

  // Clear auth cache
  const clearAuthCache = () => {
    authCacheService.clearAuthCache();
    
    // Update cache statistics
    setCacheSize(cacheService.getCacheSize());
  };

  // Apply service worker update
  const applyServiceWorkerUpdate = async () => {
    const applied = await serviceWorkerService.applyUpdates();
    if (applied) {
      setUpdateAvailable(false);
    }
    return applied;
  };

  // Register service worker
  const registerServiceWorker = async () => {
    const registered = await serviceWorkerService.register();
    setServiceWorkerRegistered(registered);
    return registered;
  };

  const value = {
    isCacheSupported,
    isPrivateMode,
    isOffline,
    cacheSize,
    serviceWorkerRegistered,
    updateAvailable,
    clearAllCache,
    clearAuthCache,
    applyServiceWorkerUpdate,
    registerServiceWorker
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};