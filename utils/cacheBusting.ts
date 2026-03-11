/**
 * Utility functions for cache busting
 */

/**
 * Generate a cache-busting URL by appending a timestamp or version
 */
export const cacheBustUrl = (url: string, version?: string): string => {
  if (!url) return url;
  
  // Skip URLs that already have cache busting
  if (url.includes('v=') || url.includes('_v=') || url.includes('?t=')) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  
  if (version) {
    // Use provided version
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  } else {
    // Use timestamp
    return `${url}${separator}t=${Date.now()}`;
  }
};

/**
 * Generate a cache-busting version based on build time
 */
export const generateCacheBustVersion = (): string => {
  // Use build timestamp if available
  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now().toString();
  
  // Use short hash for better caching
  return buildTimestamp.toString().substring(0, 8);
};

/**
 * Add cache busting to all image sources in HTML
 */
export const cacheBustHtml = (html: string, version?: string): string => {
  if (!html) return html;
  
  const cacheBustVersion = version || generateCacheBustVersion();
  
  // Replace image sources
  return html.replace(
    /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi,
    (match, before, src, after) => {
      const bustedSrc = cacheBustUrl(src, cacheBustVersion);
      return `<img${before}src="${bustedSrc}"${after}>`;
    }
  );
};

/**
 * Add cache busting to all CSS/JS links in HTML
 */
export const cacheBustAssets = (html: string, version?: string): string => {
  if (!html) return html;
  
  const cacheBustVersion = version || generateCacheBustVersion();
  
  // Replace CSS links
  let result = html.replace(
    /<link([^>]*)href=["']([^"']+\.css)["']([^>]*)>/gi,
    (match, before, href, after) => {
      const bustedHref = cacheBustUrl(href, cacheBustVersion);
      return `<link${before}href="${bustedHref}"${after}>`;
    }
  );
  
  // Replace JS scripts
  result = result.replace(
    /<script([^>]*)src=["']([^"']+\.js)["']([^>]*)>/gi,
    (match, before, src, after) => {
      const bustedSrc = cacheBustUrl(src, cacheBustVersion);
      return `<script${before}src="${bustedSrc}"${after}>`;
    }
  );
  
  return result;
};

/**
 * Create a cache-busting asset loader
 */
export const createAssetLoader = (version?: string) => {
  const cacheBustVersion = version || generateCacheBustVersion();
  
  return {
    /**
     * Load a script with cache busting
     */
    loadScript: (src: string, async: boolean = true): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = cacheBustUrl(src, cacheBustVersion);
        script.async = async;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        
        document.head.appendChild(script);
      });
    },
    
    /**
     * Load a stylesheet with cache busting
     */
    loadStylesheet: (href: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cacheBustUrl(href, cacheBustVersion);
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
        
        document.head.appendChild(link);
      });
    },
    
    /**
     * Load an image with cache busting
     */
    loadImage: (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = cacheBustUrl(src, cacheBustVersion);
        
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      });
    },
    
    /**
     * Get a cache-busted URL
     */
    getUrl: (url: string): string => {
      return cacheBustUrl(url, cacheBustVersion);
    }
  };
};