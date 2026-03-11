/**
 * Utility functions for encrypting and decrypting cached data
 * 
 * NOTE: This is a simple implementation for demonstration purposes.
 * In a production environment, use a proper encryption library.
 */

/**
 * Generate a simple encryption key
 */
export const generateEncryptionKey = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Simple XOR encryption/decryption
 * NOTE: This is NOT secure for production use!
 */
export const xorEncryptDecrypt = (text: string, key: string): string => {
  // Extend the key to match the text length
  let extendedKey = '';
  for (let i = 0; i < text.length; i++) {
    extendedKey += key[i % key.length];
  }
  
  // XOR each character
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const keyChar = extendedKey.charCodeAt(i);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  
  return result;
};

/**
 * Encrypt data for storage
 */
export const encryptData = (data: any, key: string): string => {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Encrypt the string
    const encrypted = xorEncryptDecrypt(jsonString, key);
    
    // Convert to base64 for safe storage
    return btoa(encrypted);
  } catch (error) {
    console.error('Error encrypting data:', error);
    return '';
  }
};

/**
 * Decrypt data from storage
 */
export const decryptData = <T>(encryptedData: string, key: string): T | null => {
  try {
    // Convert from base64
    const encrypted = atob(encryptedData);
    
    // Decrypt the string
    const jsonString = xorEncryptDecrypt(encrypted, key);
    
    // Parse JSON
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

/**
 * Securely store encryption key
 */
export const storeEncryptionKey = (key: string): void => {
  try {
    // In a real implementation, you would use a more secure method
    // This is just for demonstration
    sessionStorage.setItem('encryption_key', key);
  } catch (error) {
    console.error('Error storing encryption key:', error);
  }
};

/**
 * Retrieve encryption key
 */
export const getEncryptionKey = (): string => {
  try {
    // Try to get from session storage
    const key = sessionStorage.getItem('encryption_key');
    
    if (key) {
      return key;
    }
    
    // Generate a new key if not found
    const newKey = generateEncryptionKey();
    storeEncryptionKey(newKey);
    return newKey;
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    return generateEncryptionKey();
  }
};

/**
 * Encrypt sensitive data for cache storage
 */
export const encryptForCache = <T>(data: T): string => {
  const key = getEncryptionKey();
  return encryptData(data, key);
};

/**
 * Decrypt sensitive data from cache storage
 */
export const decryptFromCache = <T>(encryptedData: string): T | null => {
  const key = getEncryptionKey();
  return decryptData<T>(encryptedData, key);
};

/**
 * Mask sensitive data (e.g., for logging)
 */
export const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'object' && data !== null) {
    const maskedData = { ...data };
    
    // Mask common sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 
      'credit_card', 'card', 'cvv', 'ssn', 'social'
    ];
    
    for (const key in maskedData) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        maskedData[key] = '********';
      } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        maskedData[key] = maskSensitiveData(maskedData[key]);
      }
    }
    
    return maskedData;
  }
  
  return data;
};