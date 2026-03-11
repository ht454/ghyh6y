import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Search,
  Filter,
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Palette,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { gameService } from '../../services/gameService';
import { Category } from '../../types/admin';

export const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ isConfigured: boolean, error?: string }>({ isConfigured: true });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    icon: '',
    description: '',
    color: '#ff6b35',
    illustration: '',
    is_active: true
  });

  const quickColorOptions = [
    { name: 'برتقالي', value: '#ff6b35', preview: '#ff6b35' },
    { name: 'أحمر', value: '#dc2626', preview: '#dc2626' },
    { name: 'أزرق', value: '#2563eb', preview: '#2563eb' },
    { name: 'أخضر', value: '#16a34a', preview: '#16a34a' },
    { name: 'بنفسجي', value: '#7c3aed', preview: '#7c3aed' },
    { name: 'وردي', value: '#db2777', preview: '#db2777' },
    { name: 'أصفر', value: '#eab308', preview: '#eab308' },
    { name: 'عنبري', value: '#d97706', preview: '#d97706' },
    { name: 'تركوازي', value: '#0891b2', preview: '#0891b2' },
    { name: 'نيلي', value: '#4338ca', preview: '#4338ca' },
    { name: 'رمادي', value: '#6b7280', preview: '#6b7280' },
    { name: 'أسود', value: '#1f2937', preview: '#1f2937' }
  ];

  useEffect(() => {
    loadCategories();
    checkStorageSetup();
  }, []);

  const checkStorageSetup = async () => {
    try {
      const status = await adminService.checkStorageStatus();
      setStorageStatus(status);
    } catch (error) {
      console.error('Error checking storage:', error);
      setStorageStatus({ 
        isConfigured: false, 
        error: 'فشل في فحص إعدادات Storage' 
      });
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) {
      console.log('⚠️ جاري معالجة الطلب السابق، يرجى الانتظار...');
      return;
    }
    
    try {
      setSubmitting(true);
      setSaving(true);
      
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
      } else {
        await adminService.createCategory({
          ...formData,
          sort_order: categories.length
        });
      }
      
      await loadCategories();
      
      await gameService.refreshData();
      
      handleCloseModal();
      
      alert('تم حفظ الفئة بنجاح! الألوان ستظهر في لوحة اللعب فوراً.');
      
    } catch (error) {
      console.error('Error saving category:', error);
      alert('حدث خطأ في حفظ الفئة');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_en: category.name_en || '',
      icon: category.icon || '',
      description: category.description || '',
      color: category.color,
      illustration: category.illustration || '',
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      try {
        await adminService.deleteCategory(id);
        await loadCategories();
        
        // إعادة تحميل بيانات اللعبة
        await gameService.refreshData();
        
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await adminService.updateCategory(category.id, {
        is_active: !category.is_active
      });
      await loadCategories();
      
      // إعادة تحميل بيانات اللعبة
      await gameService.refreshData();
      
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      name_en: '',
      icon: '',
      description: '',
      color: '#ff6b35',
      illustration: '',
      is_active: true
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storageStatus.isConfigured) {
      alert('خطأ: نظام رفع الصور غير مُعد بشكل صحيح.');
      return;
    }

    try {
      setUploadingImage(true);
      console.log('🚀 بدء رفع الصورة...');
      
      const imageUrl = await adminService.uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, illustration: imageUrl }));
      
      console.log('✅ تم رفع الصورة بنجاح:', imageUrl);
      alert('تم رفع الصورة بنجاح!');
      
    } catch (error: any) {
      console.error('❌ خطأ في رفع الصورة:', error);
      alert(`خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const getColorPreview = (colorValue: string) => {
    if (colorValue.startsWith('#') && (colorValue.length === 4 || colorValue.length === 7)) {
      return colorValue;
    }
    
    
    const quickOption = quickColorOptions.find(option => option.value === colorValue);
    if (quickOption) {
      return quickOption.preview;
    }
    
    return '#6b7280'; 
  };

  const refreshGameData = async () => {
    try {
      console.log('🔄 إعادة تحميل بيانات اللعبة...');
      await gameService.refreshData();
      alert('تم تحديث بيانات اللعبة بنجاح! الألوان الجديدة ستظهر في لوحة اللعب.');
    } catch (error) {
      console.error('Error refreshing game data:', error);
      alert('حدث خطأ في تحديث بيانات اللعبة.');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الفئات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">إدارة الفئات</h1>
          <p className="text-gray-400 text-sm sm:text-base">إدارة فئات الأسئلة وتنظيمها مع التحكم في الألوان المخصصة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={refreshGameData}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
            title="تحديث بيانات اللعبة"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث اللعبة</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فئة جديدة</span>
          </button>
        </div>
      </div>

      {}
      {!storageStatus.isConfigured && (
        <div className="bg-red-900 border border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-300 text-sm">
            <p className="font-medium mb-1">⚠️ تحذير: نظام رفع الصور غير مُعد</p>
            <p>{storageStatus.error}</p>
            <button
              onClick={checkStorageSetup}
              className="mt-2 text-red-400 hover:text-red-300 underline text-sm"
            >
              إعادة فحص الإعدادات
            </button>
          </div>
        </div>
      )}

      {}
      <div className="bg-blue-900 border border-blue-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
        <Palette className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-blue-300 text-sm">
          <p className="font-medium mb-1">💡 نصيحة مهمة</p>
          <p>
            استخدم أكواد الألوان المباشرة مثل #575c2b أو اختر من الألوان السريعة. بعد التغيير، اضغط "تحديث اللعبة".
          </p>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث في الفئات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>
          <button className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>فلترة</span>
          </button>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الترتيب</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الصورة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">اسم الفئة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">اللون</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">الوصف</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden lg:table-cell">تاريخ الإنشاء</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-900">
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 cursor-move" />
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-800">
                      {category.illustration ? (
                        <img 
                          src={category.illustration} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl text-gray-400">
                          {category.icon || '📁'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div>
                      <div className="font-medium text-white text-sm">{category.name}</div>
                      {category.name_en && (
                        <div className="text-xs text-gray-400">{category.name_en}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm border border-gray-700"
                        style={{ backgroundColor: getColorPreview(category.color) }}
                      ></div>
                      <div className="text-xs text-gray-400">
                        <div className="font-medium">
                          {quickColorOptions.find(option => option.value === category.color)?.name || 'مخصص'}
                        </div>
                        <div className="text-gray-500 font-mono text-xs hidden sm:block">
                          {category.color}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-400 max-w-xs truncate">
                      {category.description || 'لا يوجد وصف'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {category.is_active ? (
                        <>
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">نشط</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">غير نشط</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-gray-400 hidden lg:table-cell">
                    {new Date(category.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    اسم الفئة (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    اسم الفئة (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    الأيقونة (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    placeholder="🏛️"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                />
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                  <Palette className="w-4 h-4 inline mr-2" />
                  لون الفئة *
                </label>
                
                {}
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">الألوان السريعة:</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {quickColorOptions.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: colorOption.value }))}
                        className={`relative w-full h-8 sm:h-12 rounded-lg border-2 transition-all duration-200 ${
                          formData.color === colorOption.value 
                            ? 'border-blue-500 scale-105 shadow-lg' 
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        style={{ backgroundColor: colorOption.preview }}
                        title={`${colorOption.name} - ${colorOption.value}`}
                      >
                        {formData.color === colorOption.value && (
                          <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div className="border-t border-gray-700 pt-3 sm:pt-4">
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">أو أدخل كود اللون المخصص:</p>
                  <div className="space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#575c2b"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs sm:text-sm text-white"
                    />
                    
                    {}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm text-gray-400">معاينة:</span>
                      <div 
                        className="w-12 h-6 sm:w-16 sm:h-8 rounded-lg border border-gray-700 shadow-sm"
                        style={{ backgroundColor: getColorPreview(formData.color) }}
                      ></div>
                      <span className="text-xs text-gray-500 font-mono">{formData.color}</span>
                    </div>
                  </div>
                  
                  {}
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1 sm:mb-2">أمثلة على أكواد الألوان:</p>
                    <div className="text-xs text-gray-500 space-y-1 font-mono">
                      <div>• #575c2b (أخضر زيتوني)</div>
                      <div>• #8b4513 (بني)</div>
                      <div>• #2f4f4f (رمادي داكن)</div>
                      <div>• #800080 (بنفسجي)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  صورة الفئة
                </label>
                
                {}
                {!storageStatus.isConfigured && (
                  <div className="bg-yellow-900 border border-yellow-800 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                    <p className="text-yellow-300 text-xs sm:text-sm">
                      ⚠️ نظام رفع الصور غير مُعد. يرجى إدخال رابط الصورة يدوياً.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 sm:space-y-4">
                  {}
                  {storageStatus.isConfigured && (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className={`bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm ${
                          uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                            رفع صورة
                          </>
                        )}
                      </label>
                      
                      {formData.illustration && (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                          <img 
                            src={formData.illustration} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      أو أدخل رابط الصورة
                    </label>
                    <input
                      type="url"
                      value={formData.illustration}
                      onChange={(e) => setFormData(prev => ({ ...prev, illustration: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                  فئة نشطة
                </label>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 sm:pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={uploadingImage || saving || submitting}
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
                      {editingCategory ? 'تحديث' : 'إضافة'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};