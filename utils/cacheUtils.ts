import { cacheService } from '../services/cacheService';

/**
 * Utility functions for working with cache
 */

/**
 * Check if browser is in private/incognito mode
 */
export const isPrivateMode = (): Promise<boolean> => {
  return new Promise(resolve => {
    const yes = () => resolve(true);
    const no = () => resolve(false);
    
    // Safari
    if (window.safari) {
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        no();
      } catch (e) {
        yes();
      }
      return;
    }
    
    // Firefox
    if (navigator.userAgent.includes('Firefox')) {
      const db = indexedDB.open('test');
      db.onerror = yes;
      db.onsuccess = no;
      return;
    }
    
    // Chrome
    if (navigator.userAgent.includes('Chrome')) {
      const fs = window.webkitRequestFileSystem || (window as any).webkitRequestFileSystem;
      if (!fs) {
        no();
        return;
      }
      fs(window.TEMPORARY, 100, no, yes);
      return;
    }
    
    // IE/Edge
    if (window.indexedDB && /Edge/.test(navigator.userAgent)) {
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        no();
      } catch (e) {
        yes();
      }
      return;
    }
    
    // Default
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
      no();
    } catch (e) {
      yes();
    }
  });
};

/**
 * Get available storage space (approximate)
 */
export const getAvailableStorageSpace = async (): Promise<{ 
  quota: number; 
  usage: number; 
  available: number; 
  percentUsed: number;
}> => {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota, usage } = await navigator.storage.estimate();
      
      if (quota && usage) {
        return {
          quota,
          usage,
          available: quota - usage,
          percentUsed: (usage / quota) * 100
        };
      }
    } catch (error) {
      console.error('Error estimating storage:', error);
    }
  }
  
  // Fallback - try to estimate based on localStorage
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    
    // Assume 5MB quota for localStorage (common limit)
    const quota = 5 * 1024 * 1024;
    
    return {
      quota,
      usage: totalSize,
      available: quota - totalSize,
      percentUsed: (totalSize / quota) * 100
    };
  } catch (error) {
    console.error('Error estimating localStorage size:', error);
  }
  
  // Default fallback
  return {
    quota: 0,
    usage: 0,
    available: 0,
    percentUsed: 0
  };
};

/**
 * Check if a URL is cacheable
 */
export const isUrlCacheable = (url: string): boolean => {
  // Skip non-GET URLs
  if (url.includes('?method=') && !url.includes('?method=GET')) {
    return false;
  }
  
  // Skip authentication endpoints
  if (url.includes('/auth/') || url.includes('/login') || url.includes('/logout')) {
    return false;
  }
  
  // Skip API endpoints that shouldn't be cached
  const nonCacheableEndpoints = [
    '/api/user',
    '/api/profile',
    '/api/settings',
    '/api/payment'
  ];
  
  if (nonCacheableEndpoints.some(endpoint => url.includes(endpoint))) {
    return false;
  }
  
  return true;
};

/**
 * Get cache expiration time for a URL
 */
export const getCacheExpiration = (url: string): number => {
  // Static assets
  if (/\.(css|js)$/.test(url)) {
    return 7 * 24 * 60 * 60 * 1000; // 7 days
  }
  
  // Images
  if (/\.(jpe?g|png|gif|svg|webp)$/.test(url)) {
    return 30 * 24 * 60 * 60 * 1000; // 30 days
  }
  
  // Fonts
  if (/\.(woff2?|ttf|otf|eot)$/.test(url)) {
    return 365 * 24 * 60 * 60 * 1000; // 1 year
  }
  
  // API endpoints
  if (url.includes('/api/categories')) {
    return 60 * 60 * 1000; // 1 hour
  }
  
  if (url.includes('/api/questions')) {
    return 24 * 60 * 60 * 1000; // 24 hours
  }
  
  // Default
  return 5 * 60 * 1000; // 5 minutes
};

/**
 * Create a cache key from a URL
 */
export const createCacheKey = (url: string): string => {
  // Remove protocol and domain
  let key = url.replace(/^(https?:\/\/[^/]+)/, '');
  
  // Remove query parameters except essential ones
  const urlObj = new URL(url);
  const essentialParams = ['id', 'category', 'type'];
  
  const params = new URLSearchParams();
  essentialParams.forEach(param => {
    if (urlObj.searchParams.has(param)) {
      params.set(param, urlObj.searchParams.get(param)!);
    }
  });
  
  // Add essential params back if any
  if (params.toString()) {
    key = `${key.split('?')[0]}?${params.toString()}`;
  } else {
    key = key.split('?')[0];
  }
  
  return `url_${key}`;
};

/**
 * Prefetch and cache URLs
 */
export const prefetchAndCache = async (urls: string[]): Promise<void> => {
  if (!urls || urls.length === 0) return;
  
  // Filter out non-cacheable URLs
  const cacheableUrls = urls.filter(isUrlCacheable);
  
  // Fetch and cache in parallel
  await Promise.all(
    cacheableUrls.map(async url => {
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          const cacheKey = createCacheKey(url);
          const expiration = getCacheExpiration(url);
          
          // For JSON responses
          if (response.headers.get('Content-Type')?.includes('application/json')) {
            const data = await response.json();
            cacheService.set(cacheKey, data, { expiration });
          }
          
          // For other responses, cache in Service Worker if available
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const cache = await caches.open('prefetch-cache');
            await cache.put(url, response);
          }
        }
      } catch (error) {
        console.error(`Error prefetching ${url}:`, error);
      }
    })
  );
};

/**
 * Detect browser storage limits
 */
export const detectStorageLimits = async (): Promise<{
  localStorage: number;
  sessionStorage: number;
  indexedDB: number;
  cacheStorage: number;
}> => {
  // Default estimates based on common browser limits
  const limits = {
    localStorage: 5 * 1024 * 1024, // 5MB
    sessionStorage: 5 * 1024 * 1024, // 5MB
    indexedDB: 50 * 1024 * 1024, // 50MB
    cacheStorage: 50 * 1024 * 1024 // 50MB
  };
  
  // Try to get more accurate estimates
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      if (quota) {
        // Distribute quota among storage types based on common ratios
        limits.indexedDB = quota * 0.6; // 60% of quota
        limits.cacheStorage = quota * 0.3; // 30% of quota
        limits.localStorage = quota * 0.05; // 5% of quota
        limits.sessionStorage = quota * 0.05; // 5% of quota
      }
    } catch (error) {
      console.error('Error estimating storage:', error);
    }
  }
  
  return limits;
};