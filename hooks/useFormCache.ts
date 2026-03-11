import { useState, useEffect, useCallback } from 'react';
import { formCacheService } from '../services/formCacheService';

/**
 * Custom hook for form data caching and auto-recovery
 */
export function useFormCache<T extends Record<string, any>>(
  formId: string,
  initialData: T,
  options: {
    autoSave?: boolean;
    saveInterval?: number;
    clearOnSubmit?: boolean;
  } = {}
) {
  const {
    autoSave = true,
    saveInterval = 5000, // 5 seconds
    clearOnSubmit = true
  } = options;

  // Try to get saved form data or use initial data
  const [formData, setFormData] = useState<T>(() => {
    const savedData = formCacheService.getSavedFormData(formId);
    return savedData ? { ...initialData, ...savedData } : initialData;
  });
  
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Save form data to cache
  const saveFormData = useCallback(() => {
    if (isDirty) {
      formCacheService.saveFormData(formId, formData);
      setLastSaved(Date.now());
      setIsDirty(false);
    }
  }, [formId, formData, isDirty]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSave && saveInterval > 0) {
      const intervalId = setInterval(saveFormData, saveInterval);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [autoSave, saveInterval, saveFormData]);

  // Save on window unload
  useEffect(() => {
    const handleUnload = () => {
      if (isDirty) {
        formCacheService.saveFormData(formId, formData);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [formId, formData, isDirty]);

  // Update form data
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Update multiple fields at once
  const updateFormFields = useCallback((fields: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    setIsDirty(true);
  }, []);

  // Reset form to initial data
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsDirty(true);
    saveFormData();
  }, [initialData, saveFormData]);

  // Clear saved form data
  const clearSavedForm = useCallback(() => {
    formCacheService.clearFormData(formId);
    setLastSaved(null);
  }, [formId]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (data: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Call the provided onSubmit function
      onSubmit(formData);
      
      // Clear form data if clearOnSubmit is true
      if (clearOnSubmit) {
        clearSavedForm();
      }
    };
  }, [formData, clearOnSubmit, clearSavedForm]);

  return {
    formData,
    updateFormData,
    updateFormFields,
    resetForm,
    clearSavedForm,
    handleSubmit,
    isDirty,
    lastSaved,
    saveFormData
  };
}