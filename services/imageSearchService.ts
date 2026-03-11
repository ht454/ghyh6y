interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
}

class ImageSearchService {
  private readonly PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
  private readonly PEXELS_API_URL = 'https://api.pexels.com/v1/search';
  
 
  private imageCache = new Map<string, { url: string; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة
  
 
  private pendingSearches = new Map<string, Promise<string>>();

  async searchImage(query: string): Promise<string> {
   
    const normalizedQuery = query.trim().toLowerCase();
    
    
    const cached = this.imageCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🖼️ استخدام صورة من الكاش للاستعلام:', normalizedQuery);
      return cached.url;
    }
    
    
    if (this.pendingSearches.has(normalizedQuery)) {
      console.log('⏳ عملية بحث جارية للاستعلام:', normalizedQuery);
      return this.pendingSearches.get(normalizedQuery)!;
    }
    
    console.log('🔍 البحث عن صورة للاستعلام:', normalizedQuery);
    
   
    const searchPromise = this.performSearch(normalizedQuery);
    this.pendingSearches.set(normalizedQuery, searchPromise);
    
    try {
      const imageUrl = await searchPromise;
      
      
      this.imageCache.set(normalizedQuery, {
        url: imageUrl,
        timestamp: Date.now()
      });
      
      return imageUrl;
    } finally {
      
      this.pendingSearches.delete(normalizedQuery);
    }
  }

  private async performSearch(query: string): Promise<string> {
    
    if (!this.PEXELS_API_KEY) {
      console.log('لا يوجد Pexels API key، استخدام الصور الافتراضية');
      return this.getFallbackImage(query);
    }

    try {
      const searchQuery = this.translateToEnglish(query);
      console.log('البحث بالإنجليزية:', searchQuery);
      
      
      const response = await fetch(
        `${this.PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=15&orientation=landscape&size=medium`, 
        {
          headers: {
            'Authorization': this.PEXELS_API_KEY,
            'Content-Type': 'application/json'
          },
          
          signal: AbortSignal.timeout(10000) // 10 ثوانٍ
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        
      
        const selectedImage = data.photos[randomIndex].src.medium;
        console.log('✅ تم العثور على صورة:', selectedImage);
        return selectedImage;
      }

      console.log('لم يتم العثور على صور، استخدام الصورة الافتراضية');
      return this.getFallbackImage(query);
    } catch (error) {
      console.error('خطأ في البحث عن الصور:', error);
      return this.getFallbackImage(query);
    }
  }

  private translateToEnglish(arabicQuery: string): string {
    
    const translations = {
      'الكعبة': 'kaaba mecca',
      'برج خليفة': 'burj khalifa dubai',
      'مسجد': 'mosque',
      'قصر': 'palace',
      'معلم': 'landmark',
      'جغرافيا': 'geography',
      'تاريخ': 'history',
      'شعر': 'poetry',
      'لغة': 'language',
      'قرآن': 'quran',
      'إسلامي': 'islamic',
      'كتب': 'books'
    };

    let englishQuery = arabicQuery;
    
    
    for (const [arabic, english] of Object.entries(translations)) {
      if (arabicQuery.includes(arabic)) {
        englishQuery = english;
        break;
      }
    }

    
    if (englishQuery === arabicQuery) {
      englishQuery = 'middle east landmarks architecture';
    }

    return englishQuery;
  }

  private getFallbackImage(query: string): string {
    console.log('استخدام الصورة الافتراضية للاستعلام:', query);
    
    
    const fallbackImages = {
      'الكعبة': 'https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=800',
      'برج خليفة': 'https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=800',
      'مسجد': 'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800',
      'قصر': 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800',
      'معلم': 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800',
      'جغرافيا': 'https://images.pexels.com/photos/335393/pexels-photo-335393.jpeg?auto=compress&cs=tinysrgb&w=800',
      'تاريخ': 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800',
      'شعر': 'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=800',
      'لغة': 'https://images.pexels.com/photos/159581/dictionary-reference-book-learning-meaning-159581.jpeg?auto=compress&cs=tinysrgb&w=800',
      'قرآن': 'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=800',
      'إسلامي': 'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=800',
      'كتب': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800'
    };

    
    for (const [keyword, imageUrl] of Object.entries(fallbackImages)) {
      if (query.includes(keyword)) {
        return imageUrl;
      }
    }

    
    return 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
  
  
  clearImageCache(): void {
    this.imageCache.clear();
    console.log('🧹 تم تنظيف كاش الصور');
  }
}

export const imageSearchService = new ImageSearchService();