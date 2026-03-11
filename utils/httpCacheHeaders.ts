/**
 * Utility functions for working with HTTP cache headers
 */

/**
 * Generate cache control headers for different content types
 */
export const generateCacheHeaders = (contentType: 'html' | 'css' | 'js' | 'image' | 'font' | 'api' | 'static'): Record<string, string> => {
  switch (contentType) {
    case 'html':
      // HTML should not be cached for long to ensure fresh content
      return {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
    case 'css':
    case 'js':
      // CSS and JS can be cached for longer, but should revalidate
      return {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Expires': new Date(Date.now() + 86400 * 1000).toUTCString()
      };
      
    case 'image':
      // Images can be cached for longer
      return {
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        'Expires': new Date(Date.now() + 604800 * 1000).toUTCString()
      };
      
    case 'font':
      // Fonts can be cached for a very long time
      return {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString()
      };
      
    case 'api':
      // API responses should be validated but can use cache
      return {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=600',
        'Expires': new Date(Date.now() + 60 * 1000).toUTCString()
      };
      
    case 'static':
      // Static assets like icons can be cached for a long time
      return {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString()
      };
      
    default:
      // Default to no caching
      return {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
  }
};

/**
 * Generate ETag for content
 */
export const generateETag = (content: string): string => {
  let hash = 0;
  
  if (content.length === 0) return hash.toString(16);
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16);
};

/**
 * Check if a response is cacheable
 */
export const isCacheable = (response: Response): boolean => {
  // Check status code (only 200 OK responses should be cached)
  if (response.status !== 200) {
    return false;
  }
  
  // Check cache control headers
  const cacheControl = response.headers.get('Cache-Control');
  if (cacheControl && (
    cacheControl.includes('no-store') || 
    cacheControl.includes('no-cache') || 
    cacheControl.includes('private')
  )) {
    return false;
  }
  
  return true;
};

/**
 * Parse cache control header
 */
export const parseCacheControl = (cacheControl: string | null): Record<string, string | number | boolean> => {
  if (!cacheControl) {
    return {};
  }
  
  const directives: Record<string, string | number | boolean> = {};
  
  cacheControl.split(',').forEach(directive => {
    const parts = directive.trim().split('=');
    const key = parts[0].trim();
    
    if (parts.length === 1) {
      // Boolean directive
      directives[key] = true;
    } else {
      // Value directive
      const value = parts[1].trim();
      
      // Try to convert to number if possible
      const numValue = parseInt(value, 10);
      directives[key] = isNaN(numValue) ? value : numValue;
    }
  });
  
  return directives;
};

/**
 * Get max age from cache control header
 */
export const getMaxAge = (cacheControl: string | null): number => {
  const directives = parseCacheControl(cacheControl);
  
  if (typeof directives['max-age'] === 'number') {
    return directives['max-age'] as number;
  }
  
  return 0;
};

/**
 * Check if a response is stale
 */
export const isResponseStale = (response: Response): boolean => {
  // Check date header
  const dateHeader = response.headers.get('Date');
  if (!dateHeader) {
    return true;
  }
  
  const date = new Date(dateHeader).getTime();
  const now = Date.now();
  
  // Get max-age from cache control
  const cacheControl = response.headers.get('Cache-Control');
  const maxAge = getMaxAge(cacheControl);
  
  // Check if response is older than max-age
  return now - date > maxAge * 1000;
};

/**
 * Add cache headers to a fetch request
 */
export const addCacheHeaders = (url: string, options: RequestInit = {}): RequestInit => {
  // Determine content type from URL
  let contentType: 'html' | 'css' | 'js' | 'image' | 'font' | 'api' | 'static' = 'api';
  
  if (url.endsWith('.html') || url.endsWith('/')) {
    contentType = 'html';
  } else if (url.endsWith('.css')) {
    contentType = 'css';
  } else if (url.endsWith('.js')) {
    contentType = 'js';
  } else if (/\.(jpe?g|png|gif|svg|webp)$/i.test(url)) {
    contentType = 'image';
  } else if (/\.(woff2?|ttf|otf|eot)$/i.test(url)) {
    contentType = 'font';
  } else if (/\.(ico|json|xml)$/i.test(url)) {
    contentType = 'static';
  }
  
  // Generate appropriate cache headers
  const headers = generateCacheHeaders(contentType);
  
  // Merge with existing headers
  const newOptions = { ...options };
  newOptions.headers = { ...newOptions.headers, ...headers };
  
  return newOptions;
};

/**
 * Fetch with cache headers
 */
export const fetchWithCacheHeaders = (url: string, options: RequestInit = {}): Promise<Response> => {
  const newOptions = addCacheHeaders(url, options);
  return fetch(url, newOptions);
};