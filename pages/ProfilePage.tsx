import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Camera, 
  Edit, 
  Save, 
  X, 
  LogOut,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Search,
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { CacheManager } from '../components/CacheManager';

export const ProfilePage: React.FC = () => {
  const { user, profile, signOut, updateProfile, getRandomAvatar } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Profile data in ProfilePage:', profile);
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || ''
      });
    }
  }, [profile]);

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || ''
      });
    }
    setEditing(false);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      if (!formData.full_name.trim()) {
        throw new Error('الاسم الكامل مطلوب');
      }
      
      const { success, error } = await updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: formData.email // Include email in the update
      });
      
      if (success) {
        setSuccess('تم تحديث الملف الشخصي بنجاح');
        setEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(error || 'فشل في تحديث الملف الشخصي');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const newAvatarUrl = getRandomAvatar();
      
      const { success, error } = await updateProfile({
        avatar_url: newAvatarUrl
      });
      
      if (success) {
        setSuccess('تم تغيير الصورة الرمزية بنجاح');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(error || 'فشل في تغيير الصورة الرمزية');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تغيير الصورة الرمزية');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    console.log('No user found in ProfilePage, showing loading state');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-4 py-12 pt-32">
        <div className="max-w-3xl mx-auto">
          {}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>

          {}
          <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
            {}
            {success && (
              <div className="bg-green-900/50 border border-green-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {}
            {error && (
              <div className="bg-red-900/50 border border-red-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <img 
                    src={profile?.avatar_url || getRandomAvatar()} 
                    alt={profile?.full_name || 'User'} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-orange-500 cursor-pointer"
                    onClick={handleAvatarClick}
                  />
                  <button 
                    className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg"
                    onClick={handleAvatarClick}
                    disabled={loading}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm text-center">اضغط لتغيير الصورة</p>
              
              {/* Welcome message */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">يا زين هالطلة، وش هالنور؟</h3>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
                  <p className="text-white text-center mb-3">منور المنصة بوجودك معنا</p>
                  <p className="text-gray-400 text-sm text-center">استمتع بأجمل الأوقات مع شير لوك</p>
                </div>
              </div>
              </div>

              {}
              <div className="flex-1">
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        الاسم الكامل
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        البريد الإلكتروني (لا يمكن تغييره)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 border border-gray-700 bg-gray-800/50 rounded-2xl text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        رقم الجوال
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            حفظ التغييرات
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-700 text-white py-3 rounded-2xl font-bold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white">الملف الشخصي</h2>
                      <button
                        onClick={handleEditClick}
                        className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        تعديل
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-2xl">
                        <User className="w-5 h-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-400">الاسم الكامل</p>
                          <p className="text-white font-medium">{profile?.full_name || user?.user_metadata?.full_name || 'غير محدد'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-2xl">
                        <Mail className="w-5 h-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-400">البريد الإلكتروني</p>
                          <p className="text-white font-medium">{profile?.email || user?.email || 'غير محدد'}</p>
                        </div>
                      </div>

                      {profile?.phone_number && (
                        <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-2xl">
                          <Phone className="w-5 h-5 text-orange-500" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">رقم الجوال</p>
                            <p className="text-white font-medium">{profile.phone_number || 'غير محدد'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full bg-red-900/30 text-red-400 py-3 rounded-2xl font-bold hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 mt-8 border border-red-900/50"
                    >
                      <LogOut className="w-5 h-5" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};