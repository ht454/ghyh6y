import { cacheService, CACHE_KEYS, CACHE_EXPIRATION } from './cacheService';

// Offline cache prefix
const OFFLINE_CACHE_PREFIX = 'offline_cache_';

// Pending operations queue
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
}

/**
 * Service for handling offline caching and synchronization
 */
class OfflineCacheService {
  private isOnline: boolean = navigator.onLine;
  private pendingOperations: PendingOperation[] = [];
  private syncInProgress: boolean = false;
  
  constructor() {
    this.setupNetworkListeners();
    this.loadPendingOperations();
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingOperations();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Load pending operations from cache
   */
  private loadPendingOperations(): void {
    const operations = cacheService.get<PendingOperation[]>(`${OFFLINE_CACHE_PREFIX}pending_operations`, {
      storage: 'local'
    });
    
    if (operations) {
      this.pendingOperations = operations;
    }
  }

  /**
   * Save pending operations to cache
   */
  private savePendingOperations(): void {
    cacheService.set(`${OFFLINE_CACHE_PREFIX}pending_operations`, this.pendingOperations, {
      storage: 'local',
      expiration: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  /**
   * Add a pending operation to the queue
   */
  public addPendingOperation(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): string {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: PendingOperation = {
      id,
      type,
      endpoint,
      data,
      timestamp: Date.now()
    };
    
    this.pendingOperations.push(operation);
    this.savePendingOperations();
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
    
    return id;
  }

  /**
   * Sync pending operations with the server
   */
  public async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log(`Syncing ${this.pendingOperations.length} pending operations...`);
      
      const completedOperations: string[] = [];
      
      for (const operation of this.pendingOperations) {
        try {
          // Process operation based on type
          switch (operation.type) {
            case 'create':
              await this.processCreateOperation(operation);
              break;
            case 'update':
              await this.processUpdateOperation(operation);
              break;
            case 'delete':
              await this.processDeleteOperation(operation);
              break;
          }
          
          // Mark as completed
          completedOperations.push(operation.id);
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
          // Skip this operation and continue with others
        }
      }
      
      // Remove completed operations
      if (completedOperations.length > 0) {
        this.pendingOperations = this.pendingOperations.filter(
          op => !completedOperations.includes(op.id)
        );
        this.savePendingOperations();
      }
      
      console.log(`Sync completed. ${completedOperations.length} operations processed, ${this.pendingOperations.length} remaining.`);
    } catch (error) {
      console.error('Error syncing pending operations:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a create operation
   */
  private async processCreateOperation(operation: PendingOperation): Promise<void> {
    // Implementation depends on your API structure
    console.log(`Processing CREATE operation for ${operation.endpoint}`);
    
    // Example implementation:
    // const response = await fetch(operation.endpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(operation.data)
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Failed to create: ${response.statusText}`);
    // }
  }

  /**
   * Process an update operation
   */
  private async processUpdateOperation(operation: PendingOperation): Promise<void> {
    // Implementation depends on your API structure
    console.log(`Processing UPDATE operation for ${operation.endpoint}`);
    
    // Example implementation:
    // const response = await fetch(operation.endpoint, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(operation.data)
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Failed to update: ${response.statusText}`);
    // }
  }

  /**
   * Process a delete operation
   */
  private async processDeleteOperation(operation: PendingOperation): Promise<void> {
    // Implementation depends on your API structure
    console.log(`Processing DELETE operation for ${operation.endpoint}`);
    
    // Example implementation:
    // const response = await fetch(operation.endpoint, {
    //   method: 'DELETE'
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Failed to delete: ${response.statusText}`);
    // }
  }

  /**
   * Get pending operations count
   */
  public getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }

  /**
   * Clear all pending operations
   */
  public clearPendingOperations(): void {
    this.pendingOperations = [];
    this.savePendingOperations();
  }

  /**
   * Cache data for offline use
   */
  public cacheForOffline(key: string, data: any, expiration: number = 7 * 24 * 60 * 60 * 1000): void {
    const cacheKey = `${OFFLINE_CACHE_PREFIX}${key}`;
    
    cacheService.set(cacheKey, data, {
      storage: 'local',
      expiration
    });
  }

  /**
   * Get cached offline data
   */
  public getOfflineCache<T>(key: string): T | null {
    const cacheKey = `${OFFLINE_CACHE_PREFIX}${key}`;
    
    return cacheService.get<T>(cacheKey, {
      storage: 'local'
    });
  }

  /**
   * Clear offline cache for a specific key
   */
  public clearOfflineCache(key: string): void {
    const cacheKey = `${OFFLINE_CACHE_PREFIX}${key}`;
    cacheService.remove(cacheKey);
  }

  /**
   * Clear all offline caches
   */
  public clearAllOfflineCache(): void {
    cacheService.clear(OFFLINE_CACHE_PREFIX);
  }
}

// Export singleton instance
export const offlineCacheService = new OfflineCacheService();