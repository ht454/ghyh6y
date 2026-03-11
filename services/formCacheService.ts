import { cacheService, CACHE_KEYS, CACHE_EXPIRATION } from './cacheService';

// Form cache prefix
const FORM_CACHE_PREFIX = 'form_cache_';

/**
 * Service for caching form data for auto-recovery
 */
class FormCacheService {
  /**
   * Save form data for auto-recovery
   */
  public saveFormData(formId: string, data: Record<string, any>): void {
    const cacheKey = `${FORM_CACHE_PREFIX}${formId}`;
    
    cacheService.set(cacheKey, {
      data,
      timestamp: Date.now()
    }, {
      storage: 'local',
      expiration: CACHE_EXPIRATION.FORM_DATA
    });
  }

  /**
   * Get saved form data
   */
  public getSavedFormData(formId: string): Record<string, any> | null {
    const cacheKey = `${FORM_CACHE_PREFIX}${formId}`;
    
    const cachedForm = cacheService.get<{ data: Record<string, any>, timestamp: number }>(cacheKey, {
      storage: 'local'
    });
    
    if (cachedForm) {
      return cachedForm.data;
    }
    
    return null;
  }

  /**
   * Clear saved form data
   */
  public clearFormData(formId: string): void {
    const cacheKey = `${FORM_CACHE_PREFIX}${formId}`;
    cacheService.remove(cacheKey);
  }

  /**
   * Clear all saved form data
   */
  public clearAllFormData(): void {
    cacheService.clear(FORM_CACHE_PREFIX);
  }

  /**
   * Get all saved forms
   */
  public getAllSavedForms(): Record<string, { data: Record<string, any>, timestamp: number }> {
    const result: Record<string, { data: Record<string, any>, timestamp: number }> = {};
    
    // Check localStorage
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(FORM_CACHE_PREFIX)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const cacheItem = JSON.parse(item);
              if (cacheItem.data && cacheItem.version) {
                const formId = key.replace(FORM_CACHE_PREFIX, '');
                result[formId] = {
                  data: cacheItem.data.data,
                  timestamp: cacheItem.data.timestamp
                };
              }
            }
          } catch (e) {
            // Skip invalid items
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Create a form with auto-save functionality
   */
  public createAutoSaveForm(
    formId: string, 
    initialData: Record<string, any> = {}, 
    options: {
      saveInterval?: number;
      onSave?: (data: Record<string, any>) => void;
    } = {}
  ): {
    data: Record<string, any>;
    handleChange: (field: string, value: any) => void;
    handleSubmit: (callback: (data: Record<string, any>) => void) => (e: React.FormEvent) => void;
    resetForm: () => void;
  } {
    const { saveInterval = 5000, onSave } = options;
    
    // Try to load saved data
    const savedData = this.getSavedFormData(formId) || {};
    
    // Merge saved data with initial data
    const formData = { ...initialData, ...savedData };
    
    // Set up auto-save interval
    let autoSaveInterval: number | null = null;
    let currentData = { ...formData };
    
    const startAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
      
      autoSaveInterval = window.setInterval(() => {
        this.saveFormData(formId, currentData);
        if (onSave) {
          onSave(currentData);
        }
      }, saveInterval);
    };
    
    const stopAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
      }
    };
    
    // Start auto-save
    startAutoSave();
    
    // Clean up on unmount
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveFormData(formId, currentData);
        stopAutoSave();
      });
    }
    
    return {
      data: formData,
      
      handleChange: (field: string, value: any) => {
        currentData = { ...currentData, [field]: value };
      },
      
      handleSubmit: (callback: (data: Record<string, any>) => void) => (e: React.FormEvent) => {
        e.preventDefault();
        callback(currentData);
        this.clearFormData(formId);
        stopAutoSave();
      },
      
      resetForm: () => {
        currentData = { ...initialData };
        this.clearFormData(formId);
      }
    };
  }
}

// Export singleton instance
export const formCacheService = new FormCacheService();