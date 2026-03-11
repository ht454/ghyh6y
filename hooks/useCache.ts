import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '../services/cacheService';

/**
 * Custom hook for working with the cache service
 */
export function useCache<T>(
  key: string,
  initialData: T | null = null,
  options: {
    storage?: 'local' | 'session' | 'memory';
    expiration?: number;
    secure?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
    fetchFn?: () => Promise<T>;
  } = {}
) {
  const {
    storage = 'local',
    expiration,
    secure = false,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    fetchFn
  } = options;

  const [data, setData] = useState<T | null>(() => {
    // Try to get from cache first
    const cachedData = cacheService.get<T>(key, { storage, secure });
    return cachedData !== null ? cachedData : initialData;
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Function to refresh data from the fetch function
  const refresh = useCallback(async () => {
    if (!fetchFn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchFn();
      
      // Update cache
      cacheService.set(key, freshData, {
        storage,
        expiration,
        secure
      });
      
      // Update state
      setData(freshData);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error(`Error refreshing cached data for key ${key}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, storage, expiration, secure]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (autoRefresh && fetchFn && refreshInterval > 0) {
      const intervalId = setInterval(refresh, refreshInterval);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, fetchFn, refresh, refreshInterval]);

  // Initial fetch if needed
  useEffect(() => {
    if (data === null && fetchFn) {
      refresh();
    }
  }, [data, fetchFn, refresh]);

  // Function to update data and cache
  const updateData = useCallback((newData: T | ((prevData: T | null) => T)) => {
    setData(prevData => {
      // Handle function updates
      const updatedData = typeof newData === 'function' 
        ? (newData as ((prevData: T | null) => T))(prevData)
        : newData;
      
      // Update cache
      cacheService.set(key, updatedData, {
        storage,
        expiration,
        secure
      });
      
      setLastUpdated(Date.now());
      return updatedData;
    });
  }, [key, storage, expiration, secure]);

  // Function to clear the cached data
  const clearData = useCallback(() => {
    cacheService.remove(key, { storage });
    setData(null);
    setLastUpdated(null);
  }, [key, storage]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    updateData,
    clearData
  };
}