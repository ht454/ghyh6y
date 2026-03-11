import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';

// Cache version - increment when making breaking changes to cache structure
const CACHE_VERSION = '1.0.0';

// Cache keys
const CACHE_KEYS = {
  AUTH_USER: 'auth_user',
  AUTH_SESSION: 'auth_session',
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  CATEGORIES: 'categories',
  QUESTIONS: 'questions',
  GAME_SESSION: 'game_session',
  SITE_CONFIG: 'site_config',
  NAVIGATION: 'navigation',
  FORM_DATA: 'form_data',
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  AUTH: 24 * 60 * 60 * 1000, // 24 hours
  USER_PROFILE: 30 * 60 * 1000, // 30 minutes
  CATEGORIES: 60 * 60 * 1000, // 1 hour
  QUESTIONS: 15 * 60 * 1000, // 15 minutes
  GAME_SESSION: 5 * 60 * 1000, // 5 minutes
  SITE_CONFIG: 12 * 60 * 60 * 1000, // 12 hours
  NAVIGATION: 6 * 60 * 60 * 1000, // 6 hours
  FORM_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Cache storage types
type StorageType = 'local' | 'session' | 'memory';

// Cache item interface
interface CacheItem<T> {
  version: string;
  data: T;
  timestamp: number;
  expiration: number;
}

// In-memory cache for data that shouldn't be persisted
const memoryCache = new Map<string, CacheItem<any>>();

// Form data cache for auto-recovery
interface FormDataCache {
  [formId: string]: {
    data: Record<string, any>;
    timestamp: number;
  };
}

/**
 * Cache service for managing application data caching
 */
class CacheService {
  private isPrivateMode: boolean = false;
  private networkStatus: 'online' | 'offline' = 'online';
  private cacheVersion: string = CACHE_VERSION;
  
  constructor() {
    this.detectPrivateMode();
    this.setupNetworkListeners();
    this.cleanupExpiredCache();
  }

  /**
   * Detect if browser is in private/incognito mode
   */
  private async detectPrivateMode(): Promise<void> {
    try {
      // Try to use localStorage as a test
      localStorage.setItem('cache_test', 'test');
      localStorage.removeItem('cache_test');
      this.isPrivateMode = false;
    } catch (e) {
      console.warn('Private browsing mode detected, using memory cache only');
      this.isPrivateMode = true;
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.networkStatus = 'online';
        this.syncCacheWithServer();
      });
      
      window.addEventListener('offline', () => {
        this.networkStatus = 'offline';
        console.warn('Network is offline, using cached data only');
      });
      
      this.networkStatus = navigator.onLine ? 'online' : 'offline';
    }
  }

  /**
   * Get the appropriate storage based on type and availability
   */
  private getStorage(type: StorageType): Storage | Map<string, CacheItem<any>> {
    if (this.isPrivateMode || type === 'memory') {
      return memoryCache;
    }
    
    if (type === 'session' && typeof sessionStorage !== 'undefined') {
      return sessionStorage;
    }
    
    if (type === 'local' && typeof localStorage !== 'undefined') {
      return localStorage;
    }
    
    return memoryCache;
  }

  /**
   * Set an item in the cache
   */
  public set<T>(
    key: string, 
    data: T, 
    options: { 
      storage?: StorageType; 
      expiration?: number;
      secure?: boolean;
    } = {}
  ): void {
    try {
      const { 
        storage = 'local', 
        expiration = CACHE_EXPIRATION.AUTH,
        secure = false
      } = options;
      
      const cacheItem: CacheItem<T> = {
        version: this.cacheVersion,
        data,
        timestamp: Date.now(),
        expiration
      };
      
      const storageObj = this.getStorage(storage);
      
      if (storageObj instanceof Map) {
        // Memory cache
        storageObj.set(key, cacheItem);
      } else {
        // Web Storage (localStorage/sessionStorage)
        try {
          if (secure) {
            // For secure data, only store non-sensitive parts or encrypted data
            const secureData = this.secureData(data);
            storageObj.setItem(key, JSON.stringify({
              ...cacheItem,
              data: secureData
            }));
          } else {
            storageObj.setItem(key, JSON.stringify(cacheItem));
          }
        } catch (storageError) {
          console.error(`Error writing to storage for key ${key}:`, storageError);
          // Fallback to memory cache
          memoryCache.set(key, cacheItem);
        }
      }
      
      // Log cache operation in development
      if (import.meta.env.DEV) {
        console.log(`Cache SET: ${key}`, { storage, expiration });
      }
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
      // Fallback to memory cache
      memoryCache.set(key, {
        version: this.cacheVersion,
        data,
        timestamp: Date.now(),
        expiration: options.expiration || CACHE_EXPIRATION.AUTH
      });
    }
  }

  /**
   * Get an item from the cache
   */
  public get<T>(
    key: string, 
    options: { 
      storage?: StorageType;
      fallback?: () => Promise<T>;
      secure?: boolean;
    } = {}
  ): T | null {
    try {
      const { 
        storage = 'local',
        secure = false
      } = options;
      
      const storageObj = this.getStorage(storage);
      let cacheItem: CacheItem<T> | null = null;
      
      if (storageObj instanceof Map) {
        // Memory cache
        cacheItem = storageObj.get(key) || null;
      } else {
        // Web Storage (localStorage/sessionStorage)
        try {
          const item = storageObj.getItem(key);
          if (item) {
            cacheItem = JSON.parse(item);
          }
        } catch (parseError) {
          console.error(`Error parsing cache for key ${key}:`, parseError);
          this.remove(key, { storage });
          return null;
        }
      }
      
      // If no cache item found or cache is expired
      if (!cacheItem || Date.now() > cacheItem.timestamp + cacheItem.expiration) {
        if (options.fallback && this.networkStatus === 'online') {
          // If fallback function provided and online, fetch fresh data
          options.fallback().then(data => {
            this.set(key, data, { storage, secure });
          }).catch(error => {
            console.error(`Fallback error for key ${key}:`, error);
          });
        }
        
        if (cacheItem && Date.now() > cacheItem.timestamp + cacheItem.expiration) {
          // If cache expired, remove it
          this.remove(key, { storage });
          
          // But still return expired data if we're offline (better than nothing)
          if (this.networkStatus === 'offline') {
            console.warn(`Using expired cache for ${key} because we're offline`);
            return secure ? this.restoreSecureData(cacheItem.data) : cacheItem.data;
          }
          
          return null;
        }
        
        return null;
      }
      
      // Check cache version
      if (cacheItem.version !== this.cacheVersion) {
        console.warn(`Cache version mismatch for ${key}, clearing cache`);
        this.remove(key, { storage });
        return null;
      }
      
      // Log cache hit in development
      if (import.meta.env.DEV) {
        console.log(`Cache HIT: ${key}`, { storage });
      }
      
      return secure ? this.restoreSecureData(cacheItem.data) : cacheItem.data;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from the cache
   */
  public remove(key: string, options: { storage?: StorageType } = {}): void {
    try {
      const { storage = 'local' } = options;
      const storageObj = this.getStorage(storage);
      
      if (storageObj instanceof Map) {
        // Memory cache
        storageObj.delete(key);
      } else {
        // Web Storage (localStorage/sessionStorage)
        try {
          storageObj.removeItem(key);
        } catch (storageError) {
          console.error(`Error removing from storage for key ${key}:`, storageError);
        }
      }
      
      // Log cache operation in development
      if (import.meta.env.DEV) {
        console.log(`Cache REMOVE: ${key}`, { storage });
      }
    } catch (error) {
      console.error(`Error removing cache for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache or cache for a specific prefix
   */
  public clear(prefix?: string, options: { storage?: StorageType } = {}): void {
    try {
      const { storage = 'local' } = options;
      const storageObj = this.getStorage(storage);
      
      if (storageObj instanceof Map) {
        // Memory cache
        if (prefix) {
          // Clear only items with the specified prefix
          Array.from(storageObj.keys())
            .filter(key => key.startsWith(prefix))
            .forEach(key => storageObj.delete(key));
        } else {
          // Clear all items
          storageObj.clear();
        }
      } else {
        // Web Storage (localStorage/sessionStorage)
        if (prefix) {
          // Clear only items with the specified prefix
          const keysToRemove: string[] = [];
          for (let i = 0; i < storageObj.length; i++) {
            const key = storageObj.key(i);
            if (key && key.startsWith(prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => storageObj.removeItem(key));
        } else {
          // Clear all items
          storageObj.clear();
        }
      }
      
      // Log cache operation in development
      if (import.meta.env.DEV) {
        console.log(`Cache CLEAR${prefix ? ` with prefix ${prefix}` : ''}`, { storage });
      }
    } catch (error) {
      console.error(`Error clearing cache${prefix ? ` with prefix ${prefix}` : ''}:`, error);
    }
  }

  /**
   * Clean up expired cache items
   */
  public cleanupExpiredCache(): void {
    try {
      // Clean up localStorage
      if (typeof localStorage !== 'undefined' && !this.isPrivateMode) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              const item = localStorage.getItem(key);
              if (item) {
                const cacheItem = JSON.parse(item);
                if (cacheItem.timestamp && cacheItem.expiration) {
                  if (Date.now() > cacheItem.timestamp + cacheItem.expiration) {
                    localStorage.removeItem(key);
                    if (import.meta.env.DEV) {
                      console.log(`Cleaned up expired cache: ${key}`);
                    }
                  }
                }
              }
            } catch (e) {
              // Skip non-cache items
            }
          }
        }
      }
      
      // Clean up sessionStorage
      if (typeof sessionStorage !== 'undefined' && !this.isPrivateMode) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            try {
              const item = sessionStorage.getItem(key);
              if (item) {
                const cacheItem = JSON.parse(item);
                if (cacheItem.timestamp && cacheItem.expiration) {
                  if (Date.now() > cacheItem.timestamp + cacheItem.expiration) {
                    sessionStorage.removeItem(key);
                    if (import.meta.env.DEV) {
                      console.log(`Cleaned up expired cache: ${key}`);
                    }
                  }
                }
              }
            } catch (e) {
              // Skip non-cache items
            }
          }
        }
      }
      
      // Clean up memory cache
      for (const [key, value] of memoryCache.entries()) {
        if (Date.now() > value.timestamp + value.expiration) {
          memoryCache.delete(key);
          if (import.meta.env.DEV) {
            console.log(`Cleaned up expired memory cache: ${key}`);
          }
        }
      }
      
      // Schedule next cleanup
      setTimeout(() => this.cleanupExpiredCache(), 15 * 60 * 1000); // Run every 15 minutes
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Sync cache with server when coming back online
   */
  private async syncCacheWithServer(): Promise<void> {
    try {
      console.log('Network is back online, syncing cache with server...');
      
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Refresh user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          this.set(CACHE_KEYS.USER_PROFILE, profile, { 
            expiration: CACHE_EXPIRATION.USER_PROFILE 
          });
        }
        
        // Refresh categories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true);
          
        if (categories) {
          this.set(CACHE_KEYS.CATEGORIES, categories, { 
            expiration: CACHE_EXPIRATION.CATEGORIES 
          });
        }
      }
    } catch (error) {
      console.error('Error syncing cache with server:', error);
    }
  }

  /**
   * Secure sensitive data before storing in cache
   * This is a simple implementation - in production, use proper encryption
   */
  private secureData<T>(data: T): any {
    if (!data) return null;
    
    // For user data, only store non-sensitive parts
    if (typeof data === 'object' && data !== null) {
      if ('password' in data) {
        const secureData = { ...data };
        delete secureData.password;
        return secureData;
      }
      
      // For auth session, only store session ID and expiry
      if ('access_token' in data && 'refresh_token' in data) {
        return {
          sessionId: (data as any).session_id || 'session-id',
          expiresAt: (data as any).expires_at || Date.now() + 3600000,
        };
      }
    }
    
    return data;
  }

  /**
   * Restore secure data when retrieving from cache
   */
  private restoreSecureData<T>(data: any): T {
    return data as T;
  }

  /**
   * Cache user authentication data
   */
  public cacheAuthUser(user: User | null): void {
    if (user) {
      this.set(CACHE_KEYS.AUTH_USER, user, {
        storage: 'local',
        expiration: CACHE_EXPIRATION.AUTH,
        secure: true
      });
    } else {
      this.remove(CACHE_KEYS.AUTH_USER);
    }
  }

  /**
   * Get cached user authentication data
   */
  public getCachedAuthUser(): User | null {
    return this.get<User>(CACHE_KEYS.AUTH_USER, {
      storage: 'local',
      secure: true
    });
  }

  /**
   * Cache user profile data
   */
  public cacheUserProfile(profile: any): void {
    this.set(CACHE_KEYS.USER_PROFILE, profile, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.USER_PROFILE
    });
  }

  /**
   * Get cached user profile data
   */
  public getCachedUserProfile(): any {
    return this.get(CACHE_KEYS.USER_PROFILE, {
      storage: 'local'
    });
  }

  /**
   * Cache user preferences
   */
  public cacheUserPreferences(preferences: any): void {
    this.set(CACHE_KEYS.USER_PREFERENCES, preferences, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.AUTH
    });
  }

  /**
   * Get cached user preferences
   */
  public getCachedUserPreferences(): any {
    return this.get(CACHE_KEYS.USER_PREFERENCES, {
      storage: 'local'
    });
  }

  /**
   * Cache categories data
   */
  public cacheCategories(categories: any[]): void {
    this.set(CACHE_KEYS.CATEGORIES, categories, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.CATEGORIES
    });
  }

  /**
   * Get cached categories data
   */
  public getCachedCategories(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.CATEGORIES, {
      storage: 'local'
    });
  }

  /**
   * Cache questions for a specific category
   */
  public cacheQuestions(categoryId: string, points: number, questions: any[]): void {
    const key = `${CACHE_KEYS.QUESTIONS}_${categoryId}_${points}`;
    this.set(key, questions, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.QUESTIONS
    });
  }

  /**
   * Get cached questions for a specific category
   */
  public getCachedQuestions(categoryId: string, points: number): any[] | null {
    const key = `${CACHE_KEYS.QUESTIONS}_${categoryId}_${points}`;
    return this.get<any[]>(key, {
      storage: 'local'
    });
  }

  /**
   * Cache game session data
   */
  public cacheGameSession(sessionId: string, sessionData: any): void {
    const key = `${CACHE_KEYS.GAME_SESSION}_${sessionId}`;
    this.set(key, sessionData, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.GAME_SESSION
    });
  }

  /**
   * Get cached game session data
   */
  public getCachedGameSession(sessionId: string): any | null {
    const key = `${CACHE_KEYS.GAME_SESSION}_${sessionId}`;
    return this.get(key, {
      storage: 'local'
    });
  }

  /**
   * Cache site configuration
   */
  public cacheSiteConfig(config: any): void {
    this.set(CACHE_KEYS.SITE_CONFIG, config, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.SITE_CONFIG
    });
  }

  /**
   * Get cached site configuration
   */
  public getCachedSiteConfig(): any | null {
    return this.get(CACHE_KEYS.SITE_CONFIG, {
      storage: 'local'
    });
  }

  /**
   * Cache navigation structure
   */
  public cacheNavigation(navigation: any): void {
    this.set(CACHE_KEYS.NAVIGATION, navigation, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.NAVIGATION
    });
  }

  /**
   * Get cached navigation structure
   */
  public getCachedNavigation(): any | null {
    return this.get(CACHE_KEYS.NAVIGATION, {
      storage: 'local'
    });
  }

  /**
   * Save form data for auto-recovery
   */
  public saveFormData(formId: string, data: Record<string, any>): void {
    const formDataCache = this.get<FormDataCache>(CACHE_KEYS.FORM_DATA, { storage: 'local' }) || {};
    
    formDataCache[formId] = {
      data,
      timestamp: Date.now()
    };
    
    this.set(CACHE_KEYS.FORM_DATA, formDataCache, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.FORM_DATA
    });
  }

  /**
   * Get saved form data for auto-recovery
   */
  public getSavedFormData(formId: string): Record<string, any> | null {
    const formDataCache = this.get<FormDataCache>(CACHE_KEYS.FORM_DATA, { storage: 'local' });
    
    if (formDataCache && formDataCache[formId]) {
      return formDataCache[formId].data;
    }
    
    return null;
  }

  /**
   * Clear saved form data
   */
  public clearFormData(formId: string): void {
    const formDataCache = this.get<FormDataCache>(CACHE_KEYS.FORM_DATA, { storage: 'local' });
    
    if (formDataCache && formDataCache[formId]) {
      delete formDataCache[formId];
      this.set(CACHE_KEYS.FORM_DATA, formDataCache, {
        storage: 'local',
        expiration: CACHE_EXPIRATION.FORM_DATA
      });
    }
  }

  /**
   * Get cache size information
   */
  public getCacheSize(): { local: number, session: number, memory: number } {
    let localSize = 0;
    let sessionSize = 0;
    
    try {
      // Calculate localStorage size
      if (typeof localStorage !== 'undefined' && !this.isPrivateMode) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              localSize += key.length + value.length;
            }
          }
        }
      }
      
      // Calculate sessionStorage size
      if (typeof sessionStorage !== 'undefined' && !this.isPrivateMode) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const value = sessionStorage.getItem(key);
            if (value) {
              sessionSize += key.length + value.length;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
    
    // Calculate memory cache size (approximate)
    const memorySize = Array.from(memoryCache.entries()).reduce((size, [key, value]) => {
      return size + key.length + JSON.stringify(value).length;
    }, 0);
    
    return {
      local: localSize,
      session: sessionSize,
      memory: memorySize
    };
  }

  /**
   * Check if browser supports caching
   */
  public isCachingSupported(): { localStorage: boolean, sessionStorage: boolean, serviceWorker: boolean } {
    return {
      localStorage: typeof localStorage !== 'undefined' && !this.isPrivateMode,
      sessionStorage: typeof sessionStorage !== 'undefined' && !this.isPrivateMode,
      serviceWorker: 'serviceWorker' in navigator
    };
  }

  /**
   * Update cache version (useful for cache busting)
   */
  public updateCacheVersion(newVersion: string): void {
    this.cacheVersion = newVersion;
    // Clear all caches when version changes
    this.clear();
    this.clear(undefined, { storage: 'session' });
    memoryCache.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export cache keys and expiration times for external use
export { CACHE_KEYS, CACHE_EXPIRATION };