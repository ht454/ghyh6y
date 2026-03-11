import { cacheService, CACHE_KEYS, CACHE_EXPIRATION } from './cacheService';

// API cache prefix
const API_CACHE_PREFIX = 'api_cache_';

/**
 * Service for caching API responses
 */
class ApiCacheService {
  /**
   * Cache an API response
   */
  public cacheApiResponse(
    endpoint: string, 
    params: Record<string, any> | null, 
    data: any, 
    expiration: number = CACHE_EXPIRATION.CATEGORIES
  ): void {
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    cacheService.set(cacheKey, {
      data,
      timestamp: Date.now()
    }, {
      storage: 'local',
      expiration
    });
  }

  /**
   * Get a cached API response
   */
  public getCachedApiResponse<T>(
    endpoint: string, 
    params: Record<string, any> | null
  ): T | null {
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    const cachedResponse = cacheService.get<{ data: T, timestamp: number }>(cacheKey, {
      storage: 'local'
    });
    
    if (cachedResponse) {
      return cachedResponse.data;
    }
    
    return null;
  }

  /**
   * Generate a cache key for an API endpoint and params
   */
  private generateCacheKey(endpoint: string, params: Record<string, any> | null): string {
    let key = `${API_CACHE_PREFIX}${endpoint}`;
    
    if (params) {
      // Sort params to ensure consistent cache keys
      const sortedParams = Object.keys(params).sort().reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        }, 
        {} as Record<string, any>
      );
      
      key += `_${JSON.stringify(sortedParams)}`;
    }
    
    return key;
  }

  /**
   * Clear cache for a specific API endpoint
   */
  public clearApiCache(endpoint: string): void {
    cacheService.clear(`${API_CACHE_PREFIX}${endpoint}`);
  }

  /**
   * Clear all API caches
   */
  public clearAllApiCache(): void {
    cacheService.clear(API_CACHE_PREFIX);
  }

  /**
   * Fetch data with caching
   */
  public async fetchWithCache<T>(
    endpoint: string,
    fetchFn: () => Promise<T>,
    options: {
      params?: Record<string, any>;
      expiration?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const { 
      params = null, 
      expiration = CACHE_EXPIRATION.CATEGORIES,
      forceRefresh = false
    } = options;
    
    // If force refresh, skip cache
    if (forceRefresh) {
      const data = await fetchFn();
      this.cacheApiResponse(endpoint, params, data, expiration);
      return data;
    }
    
    // Try to get from cache first
    const cachedData = this.getCachedApiResponse<T>(endpoint, params);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch and cache
    try {
      const data = await fetchFn();
      this.cacheApiResponse(endpoint, params, data, expiration);
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiCacheService = new ApiCacheService();