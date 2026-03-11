import { useState, useEffect, useCallback } from 'react';
import { offlineCacheService } from '../services/offlineCacheService';

/**
 * Custom hook for working with offline cache
 */
export function useOfflineCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    initialData?: T | null;
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
    refetchOnReconnect?: boolean;
  } = {}
) {
  const {
    enabled = true,
    initialData = null,
    onError,
    onSuccess,
    refetchOnReconnect = true
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (refetchOnReconnect) {
        fetchData();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetchOnReconnect]);

  // Fetch data function
  const fetchData = useCallback(async (options: { force?: boolean } = {}) => {
    if (!enabled) return;
    
    const { force = false } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // If we're offline and not forcing a refresh, try to get from cache
      if (!isOnline && !force) {
        const cachedData = offlineCacheService.getOfflineCache<T>(key);
        
        if (cachedData) {
          setData(cachedData);
          setLastUpdated(null); // We don't know when this was cached
          return;
        }
        
        throw new Error('You are offline and no cached data is available');
      }
      
      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Cache for offline use
      offlineCacheService.cacheForOffline(key, freshData);
      
      // Update state
      setData(freshData);
      setLastUpdated(Date.now());
      
      // Call success callback
      if (onSuccess) {
        onSuccess(freshData);
      }
    } catch (err) {
      console.error(`Error fetching data for key ${key}:`, err);
      
      // Try to get from cache as fallback
      const cachedData = offlineCacheService.getOfflineCache<T>(key);
      
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(null); // We don't know when this was cached
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        // Call error callback
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, enabled, isOnline, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Function to update data and cache
  const updateData = useCallback((newData: T | ((prevData: T | null) => T)) => {
    setData(prevData => {
      // Handle function updates
      const updatedData = typeof newData === 'function' 
        ? (newData as ((prevData: T | null) => T))(prevData)
        : newData;
      
      // Update cache
      offlineCacheService.cacheForOffline(key, updatedData);
      
      setLastUpdated(Date.now());
      return updatedData;
    });
  }, [key]);

  // Function to clear the cached data
  const clearData = useCallback(() => {
    offlineCacheService.clearOfflineCache(key);
    setData(null);
    setLastUpdated(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    isOnline,
    lastUpdated,
    refetch: fetchData,
    updateData,
    clearData
  };
}