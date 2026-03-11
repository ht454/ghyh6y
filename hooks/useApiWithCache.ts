import { useState, useEffect, useCallback } from 'react';
import { apiCacheService } from '../services/apiCacheService';

/**
 * Custom hook for API calls with caching
 */
export function useApiWithCache<T>(
  endpoint: string,
  options: {
    params?: Record<string, any>;
    expiration?: number;
    enabled?: boolean;
    initialData?: T | null;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    refetchInterval?: number | null;
    forceRefresh?: boolean;
  } = {}
) {
  const {
    params = null,
    expiration,
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    refetchInterval = null,
    forceRefresh = false
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Fetch data function
  const fetchData = useCallback(async (options: { force?: boolean } = {}) => {
    if (!enabled) return;
    
    const { force = forceRefresh } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // If not forcing refresh, try to get from cache first
      if (!force) {
        const cachedData = apiCacheService.getCachedApiResponse<T>(endpoint, params);
        
        if (cachedData) {
          setData(cachedData);
          setLastFetched(Date.now());
          
          if (onSuccess) {
            onSuccess(cachedData);
          }
          
          setLoading(false);
          return;
        }
      }
      
      // Fetch from API
      const response = await fetch(endpoint + (params ? `?${new URLSearchParams(params as any).toString()}` : ''));
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Cache the response
      apiCacheService.cacheApiResponse(endpoint, params, responseData, expiration);
      
      // Update state
      setData(responseData);
      setLastFetched(Date.now());
      
      // Call success callback
      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Call error callback
      if (onError) {
        onError(error);
      }
      
      // Try to get from cache as fallback
      const cachedData = apiCacheService.getCachedApiResponse<T>(endpoint, params);
      
      if (cachedData) {
        setData(cachedData);
        setLastFetched(null); // We don't know when this was cached
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, expiration, enabled, onSuccess, onError, forceRefresh]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Set up refetch interval if specified
  useEffect(() => {
    if (refetchInterval && enabled) {
      const intervalId = setInterval(() => {
        fetchData({ force: true });
      }, refetchInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [refetchInterval, enabled, fetchData]);

  // Function to manually refetch data
  const refetch = useCallback((options: { force?: boolean } = {}) => {
    return fetchData(options);
  }, [fetchData]);

  // Function to update data and cache
  const updateData = useCallback((newData: T | ((prevData: T | null) => T)) => {
    setData(prevData => {
      // Handle function updates
      const updatedData = typeof newData === 'function' 
        ? (newData as ((prevData: T | null) => T))(prevData)
        : newData;
      
      // Update cache
      apiCacheService.cacheApiResponse(endpoint, params, updatedData, expiration);
      
      setLastFetched(Date.now());
      return updatedData;
    });
  }, [endpoint, params, expiration]);

  // Function to clear the cached data
  const clearCache = useCallback(() => {
    apiCacheService.clearApiCache(endpoint);
    setData(initialData);
    setLastFetched(null);
  }, [endpoint, initialData]);

  return {
    data,
    loading,
    error,
    refetch,
    updateData,
    clearCache,
    lastFetched
  };
}