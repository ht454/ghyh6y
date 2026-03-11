import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Upload, 
  Save, 
  X, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  RefreshCw, 
  Plus, 
  Check, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  Loader
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface HeroImage {
  id: string;
  url: string;
  title: string;
  description: string;
  isActive: boolean;
  position: 'hero' | 'category' | 'banner';
}

export const ImageManagement: React.FC = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<HeroImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    url: '',
    title: '',
    description: '',
    isActive: true,
    position: 'hero' as 'hero' | 'category' | 'banner'
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    setLoading(true);
    try {
     
      const savedImages = localStorage.getItem('heroImages');
      
      if (savedImages) {
        setImages(JSON.parse(savedImages));
      } else {
        const defaultImages: HeroImage[] = [
          {
            id: '1',
            url: 'https://i.postimg.cc/cJhhd8sM/1.png',
            title: 'أشخاص يلعبون شير لوك',
            description: 'استمتع بتجربة لعب مثيرة مع الأصدقاء والعائلة',
            isActive: true,
            position: 'hero'
          },
          {
            id: '2',
            url: 'https://i.postimg.cc/J0fcpNqm/2.png',
            title: 'جلسات تفاعلية',
            description: 'تحدي معلوماتك مع الآخرين في جو من المرح',
            isActive: true,
            position: 'hero'
          },
          {
            id: '3',
            url: 'https://i.postimg.cc/G3HWSbQS/3.png',
            title: 'تعلم وترفيه',
            description: 'اكتسب معلومات جديدة أثناء الاستمتاع باللعب',
            isActive: true,
            position: 'hero'
          },
          {
            id: '4',
            url: 'https://i.postimg.cc/L6Pr2vGt/4.png',
            title: 'تحدي الأصدقاء',
            description: 'منافسة ممتعة مع الأصدقاء والعائلة',
            isActive: true,
            position: 'hero'
          }
        ];
        
        setImages(defaultImages);
        localStorage.setItem('heroImages', JSON.stringify(defaultImages));
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setError('حدث خطأ في تحميل الصور');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setFormData({
      id: '',
      url: '',
      title: '',
      description: '',
      isActive: true,
      position: 'hero'
    });
    setShowAddModal(true);
  };

  const handleEditImage = (image: HeroImage) => {
    setFormData({
      id: image.id,
      url: image.url,
      title: image.title,
      description: image.description,
      isActive: image.isActive,
      position: image.position
    });
    setCurrentImage(image);
    setShowEditModal(true);
  };

  const handleDeleteImage = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      const updatedImages = images.filter(img => img.id !== id);
      setImages(updatedImages);
      localStorage.setItem('heroImages', JSON.stringify(updatedImages));
    }
  };

  const handleToggleActive = (id: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, isActive: !img.isActive } : img
    );
    setImages(updatedImages);
    localStorage.setItem('heroImages', JSON.stringify(updatedImages));
  };

  const handleSaveImage = () => {
    setSaving(true);
    setError(null);
    
    try {
      if (!formData.url) {
        setError('يرجى إدخال رابط الصورة');
        setSaving(false);
        return;
      }
      
      if (!formData.title) {
        setError('يرجى إدخال عنوان الصورة');
        setSaving(false);
        return;
      }
      
      if (showAddModal) {
        const newImage: HeroImage = {
          id: Date.now().toString(),
          url: formData.url,
          title: formData.title,
          description: formData.description,
          isActive: formData.isActive,
          position: formData.position
        };
        
        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        localStorage.setItem('heroImages', JSON.stringify(updatedImages));
        
        setShowAddModal(false);
      } else if (showEditModal && currentImage) {
        const updatedImages = images.map(img => 
          img.id === currentImage.id ? { ...formData, id: img.id } : img
        );
        setImages(updatedImages);
        localStorage.setItem('heroImages', JSON.stringify(updatedImages));
        
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      setError('حدث خطأ في حفظ الصورة');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePreviewPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const filteredImages = images.filter(image => 
    image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">إدارة الصور</h1>
          <p className="text-gray-400 text-sm sm:text-base">إدارة صور الموقع والبنرات الإعلانية</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={loadImages}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={handleAddImage}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صورة جديدة</span>
          </button>
        </div>
      </div>

      {}
      {images.length > 0 && (
        <div className="bg-black rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-6 md:mb-8 border border-gray-800">
          <div className="relative">
            <img 
              src={images[currentIndex].url} 
              alt={images[currentIndex].title}
              className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{images[currentIndex].title}</h3>
              <p className="text-white/80 text-xs sm:text-sm md:text-base">{images[currentIndex].description}</p>
            </div>
            
            <button
              onClick={handlePreviewPrev}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 sm:p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            
            <button
              onClick={handlePreviewNext}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 sm:p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
              {currentIndex + 1} / {images.length}
            </div>
            
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-1 sm:gap-2">
              <button
                onClick={() => handleEditImage(images[currentIndex])}
                className="bg-blue-600 text-white p-1 sm:p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => handleDeleteImage(images[currentIndex].id)}
                className="bg-red-600 text-white p-1 sm:p-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => handleToggleActive(images[currentIndex].id)}
                className={`${
                  images[currentIndex].isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                } text-white p-1 sm:p-2 rounded-lg transition-colors`}
              >
                {images[currentIndex].isActive ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث في الصور..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>
          <select
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            onChange={(e) => setSearchTerm(e.target.value === 'all' ? '' : e.target.value)}
          >
            <option value="all">جميع المواقع</option>
            <option value="hero">الصفحة الرئيسية</option>
            <option value="category">صفحة الفئات</option>
            <option value="banner">البنرات الإعلانية</option>
          </select>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-400">جاري تحميل الصور...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">لا توجد صور</h3>
            <p className="text-gray-400 mb-4">لم يتم العثور على صور مطابقة</p>
            <button
              onClick={handleAddImage}
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              إضافة صورة جديدة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6">
            {filteredImages.map((image) => (
              <div key={image.id} className="bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-800">
                <div className="relative h-36 sm:h-48">
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {image.position === 'hero' && 'الصفحة الرئيسية'}
                    {image.position === 'category' && 'صفحة الفئات'}
                    {image.position === 'banner' && 'بنر إعلاني'}
                  </div>
                  <div className="absolute top-2 left-2">
                    {image.isActive ? (
                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        نشط
                      </div>
                    ) : (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        غير نشط
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-white mb-1 truncate text-sm sm:text-base">{image.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{image.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">
                      {image.url.substring(0, 20)}...
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEditImage(image)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="تعديل"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(image.id)}
                        className={`p-1 ${image.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                        title={image.isActive ? 'إلغاء التنشيط' : 'تنشيط'}
                      >
                        {image.isActive ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                إضافة صورة جديدة
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-300">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  رابط الصورة *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <button
                    className="bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                    title="رفع صورة (غير متاح حالياً)"
                    disabled
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">رفع</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  عنوان الصورة *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  placeholder="عنوان الصورة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  وصف الصورة
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  placeholder="وصف الصورة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  موقع الصورة
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                >
                  <option value="hero">الصفحة الرئيسية</option>
                  <option value="category">صفحة الفئات</option>
                  <option value="banner">بنر إعلاني</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                  نشط
                </label>
              </div>

              {formData.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    معاينة
                  </label>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={formData.url} 
                      alt="Preview"
                      className="w-full h-36 sm:h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveImage}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      حفظ
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {showEditModal && currentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                تعديل الصورة
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-300">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  رابط الصورة *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <button
                    className="bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                    title="رفع صورة (غير متاح حالياً)"
                    disabled
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">رفع</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  عنوان الصورة *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  placeholder="عنوان الصورة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  وصف الصورة
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  placeholder="وصف الصورة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  موقع الصورة
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                >
                  <option value="hero">الصفحة الرئيسية</option>
                  <option value="category">صفحة الفئات</option>
                  <option value="banner">بنر إعلاني</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active_edit" className="text-sm font-medium text-gray-300">
                  نشط
                </label>
              </div>

              {formData.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    معاينة
                  </label>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={formData.url} 
                      alt="Preview"
                      className="w-full h-36 sm:h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveImage}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      حفظ التغييرات
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};