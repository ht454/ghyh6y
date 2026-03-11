import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formCacheService } from '../../services/formCacheService';

export const LoginPage: React.FC = () => {
  // Use form cache for auto-recovery
  const [formData, setFormData] = useState(() => {
    const savedForm = formCacheService.getSavedFormData('login-form');
    return savedForm || {
      email: '',
      password: '',
      rememberMe: false
    };
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { signIn, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Save form data when it changes
  useEffect(() => {
    // Only save email and remember me, never save password
    formCacheService.saveFormData('login-form', {
      email: formData.email,
      rememberMe: formData.rememberMe
    });
  }, [formData.email, formData.rememberMe]);

  // Clear form data on successful login
  useEffect(() => {
    if (user) {
      formCacheService.clearFormData('login-form');
    }
  }, [user]);

  // Original code continues...
  
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);
  
  
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to profile');
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    
    if (!formData.password) {
      setError('الرجاء إدخال كلمة المرور');
      return false;
    }
    
    return true;
  };

  const getErrorMessage = (error: string) => {
    
    if (error.includes('Invalid login credentials') || error.includes('invalid_credentials')) {
      return 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور وحاول مرة أخرى.';
    }
    
    if (error.includes('Email not confirmed')) {
      return 'يجب تأكيد البريد الإلكتروني أولاً. تحقق من صندوق الوارد الخاص بك.';
    }
    
    if (error.includes('Too many requests')) {
      return 'تم تجاوز عدد المحاولات المسموح. الرجاء المحاولة لاحقاً.';
    }
    
    if (error.includes('Network')) {
      return 'مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.';
    }
    
    
    return error || 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting login form...');
      const { success, error } = await signIn({
        email: formData.email || oldFormData.email,
        password: formData.password || oldFormData.password
      });
      
      console.log('Login result:', { success, error });
      
      if (success) {
        console.log('Login successful, navigating to profile page');
        
        // Clear form data on successful login
        formCacheService.clearFormData('login-form');
        
        navigate('/profile');
      } else {
        setError(getErrorMessage(error || ''));
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getErrorMessage(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Search className="text-white w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        {}
        <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
          {successMessage && (
            <div className="bg-green-900/50 border border-green-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-800 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-red-400 text-sm block">{error}</span>
                  {error.includes('بيانات الدخول غير صحيحة') && (
                    <div className="mt-2 text-red-300 text-xs">
                      <p>تأكد من:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>كتابة البريد الإلكتروني بشكل صحيح</li>
                        <li>كتابة كلمة المرور بدقة (انتبه لحالة الأحرف)</li>
                        <li>أن لديك حساب مسجل بالفعل</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="example@gmail.com"
                  autoComplete="email"
                />
                {formData.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember-me"
                name="rememberMe"
                checked={formData.rememberMe || false}
                onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-700 bg-black text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="remember-me" className="text-sm text-gray-400">
                تذكرني
              </label>
            </div>

            {}
            <div className="text-right">
              <Link
                to="/auth/forgot-password"
                className="text-orange-500 hover:text-orange-400 text-sm font-medium"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            {}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading || authLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              ليس لديك حساب؟{' '}
              <Link
                to="/auth/signup"
                className="text-orange-500 hover:text-orange-400 font-bold"
              >
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>

        {}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};