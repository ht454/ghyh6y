import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Upload,
  Save,
  X,
  Eye,
  Image as ImageIcon,
  FileText,
  Bell,
  Link as LinkIcon,
  Calendar,
  Globe,
  Settings,
  Megaphone,
  Layout,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  BarChart3,
  TrendingUp,
  Loader
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { contentService } from '../../services/contentService';
import { supabase } from '../../services/supabaseClient';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  position: 'hero' | 'sidebar' | 'footer';
  target_audience: 'all' | 'guests' | 'users' | 'admins';
  start_date: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_active: boolean;
  target_audience: 'all' | 'admins' | 'users';
  auto_dismiss: boolean;
  dismiss_after: number;
  created_at: string;
  updated_at: string;
}

export const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pages' | 'banners' | 'notifications'>('pages');
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  
  const [pageForm, setPageForm] = useState({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    is_published: true
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    position: 'hero' as 'hero' | 'sidebar' | 'footer',
    target_audience: 'all' as 'all' | 'guests' | 'users' | 'admins',
    start_date: '',
    end_date: ''
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    is_active: true,
    target_audience: 'all' as 'all' | 'admins' | 'users',
    auto_dismiss: false,
    dismiss_after: 5000
  });

  useEffect(() => {
    loadContent();
    
    // Set up real-time updates for content
    const contentSubscription = supabase
      .channel('content_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'content_pages'
      }, () => {
        if (activeTab === 'pages') loadContent();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'banners'
      }, () => {
        if (activeTab === 'banners') loadContent();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        if (activeTab === 'notifications') loadContent();
      })
      .subscribe();
      
    setSubscription(contentSubscription);
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeTab]);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'pages') {
        const data = await contentService.getContentPages();
        setPages(data);
      } else if (activeTab === 'banners') {
        const data = await contentService.getBanners();
        setBanners(data);
      } else {
        const data = await contentService.getNotifications();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await adminService.uploadImage(file);
      setBannerForm(prev => ({ ...prev, image_url: imageUrl }));
      alert('تم رفع الصورة بنجاح!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (activeTab === 'pages') {
        if (editingItem) {
          await contentService.updateContentPage(editingItem.id, pageForm);
        } else {
          await contentService.createContentPage(pageForm);
        }
      } else if (activeTab === 'banners') {
        if (editingItem) {
          await contentService.updateBanner(editingItem.id, bannerForm);
        } else {
          await contentService.createBanner(bannerForm);
        }
      } else {
        if (editingItem) {
          await contentService.updateNotification(editingItem.id, notificationForm);
        } else {
          await contentService.createNotification(notificationForm);
        }
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForms();
      // Content will be updated via real-time subscription
      
      alert('تم الحفظ بنجاح!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      if (activeTab === 'pages') {
        await contentService.deleteContentPage(id);
      } else if (activeTab === 'banners') {
        await contentService.deleteBanner(id);
      } else {
        await contentService.deleteNotification(id);
      }
      
      // Content will be updated via real-time subscription
      alert('تم الحذف بنجاح!');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('حدث خطأ في الحذف');
    }
  };

  const resetForms = () => {
    setPageForm({
      slug: '',
      title: '',
      content: '',
      meta_description: '',
      is_published: true
    });
    setBannerForm({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true,
      position: 'hero',
      target_audience: 'all',
      start_date: '',
      end_date: ''
    });
    setNotificationForm({
      title: '',
      message: '',
      type: 'info',
      is_active: true,
      target_audience: 'all',
      auto_dismiss: false,
      dismiss_after: 5000
    });
  };

  const tabs = [
    {
      id: 'pages',
      title: 'الصفحات الثابتة',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      description: 'إدارة صفحات الموقع'
    },
    {
      id: 'banners',
      title: 'البنرات والعروض',
      icon: ImageIcon,
      color: 'from-purple-500 to-purple-600',
      description: 'إدارة الإعلانات والبنرات'
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: Bell,
      color: 'from-orange-500 to-orange-600',
      description: 'إدارة التنبيهات للمستخدمين'
    }
  ];

  const filteredData = () => {
    const data = activeTab === 'pages' ? pages : activeTab === 'banners' ? banners : notifications;
    return data.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item as any).description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item as any).message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      {}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-3 sm:mb-4 border border-indigo-900">
          <Layout className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />
          <span className="text-indigo-400 font-bold text-sm sm:text-base">إدارة المحتوى</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">مركز إدارة المحتوى</h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400">تحكم كامل في محتوى الموقع والإشعارات</p>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 transition-all duration-300 text-right ${
              activeTab === tab.id
                ? 'border-indigo-500 bg-black shadow-xl scale-105'
                : 'border-gray-800 hover:border-indigo-800 hover:shadow-lg bg-black'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r ${tab.color} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center`}>
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{tab.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{tab.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {}
      <div className="bg-black rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-800">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 md:p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r ${tabs.find(t => t.id === activeTab)?.color} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center`}>
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || FileText, { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" })}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {tabs.find(t => t.id === activeTab)?.title}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">{tabs.find(t => t.id === activeTab)?.description}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="البحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
              />
            </div>

            {}
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 text-sm font-bold"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              إضافة جديد
            </button>
          </div>
        </div>

        {}
        <div className="p-3 sm:p-4 md:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500 animate-spin mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredData().map((item: any) => (
                <div key={item.id} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300 bg-black border border-gray-800 hover:border-gray-700`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{item.title}</h3>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                          item.is_published || item.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {item.is_published || item.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                        {activeTab === 'banners' && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-bold">
                            {item.position}
                          </span>
                        )}
                        {activeTab === 'notifications' && (
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                            item.type === 'info' ? 'bg-blue-900 text-blue-300' :
                            item.type === 'success' ? 'bg-green-900 text-green-300' :
                            item.type === 'warning' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {item.type}
                          </span>
                        )}
                      </div>
                      
                      {activeTab === 'pages' && (
                        <>
                          <p className="text-gray-400 mb-2 text-xs sm:text-sm">/{item.slug}</p>
                          <p className="text-gray-500 text-xs sm:text-sm line-clamp-2">{item.meta_description}</p>
                        </>
                      )}
                      
                      {activeTab === 'banners' && (
                        <>
                          <p className="text-gray-400 mb-2 text-xs sm:text-sm line-clamp-2">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.link_url}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                              {item.view_count} مشاهدة
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              {item.click_count} نقرة
                            </span>
                          </div>
                        </>
                      )}
                      
                      {activeTab === 'notifications' && (
                        <>
                          <p className="text-gray-400 mb-2 text-xs sm:text-sm line-clamp-2">{item.message}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <span>👥 {item.target_audience}</span>
                            <span>📅 {new Date(item.created_at).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {activeTab === 'banners' && item.image_url && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gray-800 ml-0 sm:ml-6">
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          if (activeTab === 'pages') {
                            setPageForm({
                              slug: item.slug,
                              title: item.title,
                              content: item.content,
                              meta_description: item.meta_description,
                              is_published: item.is_published
                            });
                          } else if (activeTab === 'banners') {
                            setBannerForm({
                              title: item.title,
                              description: item.description,
                              image_url: item.image_url,
                              link_url: item.link_url,
                              is_active: item.is_active,
                              position: item.position,
                              target_audience: item.target_audience,
                              start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '',
                              end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : ''
                            });
                          } else {
                            setNotificationForm({
                              title: item.title,
                              message: item.message,
                              type: item.type,
                              is_active: item.is_active,
                              target_audience: item.target_audience,
                              auto_dismiss: item.auto_dismiss,
                              dismiss_after: item.dismiss_after
                            });
                          }
                          setShowModal(true);
                        }}
                        className="p-1.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredData().length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-gray-500 mb-3 sm:mb-4">لا توجد عناصر</div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 font-bold mx-auto text-sm"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    إضافة أول عنصر
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {editingItem ? 'تعديل' : 'إضافة'} {tabs.find(t => t.id === activeTab)?.title}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForms();
                }}
                className="text-gray-400 hover:text-gray-300 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              {}
              {activeTab === 'pages' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">عنوان الصفحة *</label>
                      <input
                        type="text"
                        value={pageForm.title}
                        onChange={(e) => setPageForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
                        placeholder="عنوان الصفحة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">الرابط (Slug) *</label>
                      <input
                        type="text"
                        value={pageForm.slug}
                        onChange={(e) => setPageForm(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
                        placeholder="about-us"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">وصف الصفحة (Meta Description)</label>
                    <input
                      type="text"
                      value={pageForm.meta_description}
                      onChange={(e) => setPageForm(prev => ({ ...prev, meta_description: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
                      placeholder="وصف مختصر للصفحة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">محتوى الصفحة *</label>
                    <textarea
                      value={pageForm.content}
                      onChange={(e) => setPageForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={10}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
                      placeholder="محتوى الصفحة بصيغة HTML أو Markdown"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={pageForm.is_published}
                      onChange={(e) => setPageForm(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_published" className="text-sm font-bold text-gray-300">
                      نشر الصفحة
                    </label>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'banners' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">عنوان البنر *</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                        placeholder="عنوان البنر"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">موقع البنر</label>
                      <select
                        value={bannerForm.position}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, position: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      >
                        <option value="hero">الصفحة الرئيسية</option>
                        <option value="sidebar">الشريط الجانبي</option>
                        <option value="footer">أسفل الصفحة</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">وصف البنر</label>
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      placeholder="وصف البنر"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">صورة البنر</label>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="banner-image-upload"
                        />
                        <label
                          htmlFor="banner-image-upload"
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
                        
                        {bannerForm.image_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-800">
                            <img 
                              src={bannerForm.image_url} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="url"
                        value={bannerForm.image_url}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                        placeholder="أو أدخل رابط الصورة"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">رابط البنر</label>
                    <input
                      type="url"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, link_url: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">الجمهور المستهدف</label>
                      <select
                        value={bannerForm.target_audience}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, target_audience: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      >
                        <option value="all">جميع المستخدمين</option>
                        <option value="guests">الزوار فقط</option>
                        <option value="users">المستخدمين المسجلين</option>
                        <option value="admins">المديرين فقط</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6 sm:pt-8">
                      <input
                        type="checkbox"
                        id="banner_is_active"
                        checked={bannerForm.is_active}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="banner_is_active" className="text-sm font-bold text-gray-300">
                        بنر نشط
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">تاريخ البداية</label>
                      <input
                        type="datetime-local"
                        value={bannerForm.start_date}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">تاريخ النهاية</label>
                      <input
                        type="datetime-local"
                        value={bannerForm.end_date}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'notifications' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">عنوان الإشعار *</label>
                      <input
                        type="text"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-sm"
                        placeholder="عنوان الإشعار"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">نوع الإشعار</label>
                      <select
                        value={notificationForm.type}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-sm"
                      >
                        <option value="info">معلومات</option>
                        <option value="success">نجاح</option>
                        <option value="warning">تحذير</option>
                        <option value="error">خطأ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">رسالة الإشعار *</label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-sm"
                      placeholder="محتوى الإشعار"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">الجمهور المستهدف</label>
                      <select
                        value={notificationForm.target_audience}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, target_audience: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-sm"
                      >
                        <option value="all">جميع المستخدمين</option>
                        <option value="admins">المديرين فقط</option>
                        <option value="users">المستخدمين فقط</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1 sm:mb-2">مدة الإغلاق (بالثواني)</label>
                      <input
                        type="number"
                        value={notificationForm.dismiss_after}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, dismiss_after: parseInt(e.target.value) }))}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-sm"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="notification_is_active"
                        checked={notificationForm.is_active}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="notification_is_active" className="text-sm font-bold text-gray-300">
                        إشعار نشط
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="auto_dismiss"
                        checked={notificationForm.auto_dismiss}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, auto_dismiss: e.target.checked }))}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="auto_dismiss" className="text-sm font-bold text-gray-300">
                        إغلاق تلقائي
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {}
              <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 md:pt-6 border-t border-gray-800 mt-4 sm:mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {editingItem ? 'تحديث' : 'إضافة'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForms();
                  }}
                  className="bg-gray-700 text-white px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-bold"
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