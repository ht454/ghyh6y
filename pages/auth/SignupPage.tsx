import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formCacheService } from '../../services/formCacheService';
import { useFormCache } from '../../hooks/useFormCache';

export const SignupPage: React.FC = () => {
  // Use form cache hook for auto-recovery
  const { 
    formData, 
    updateFormData, 
    updateFormFields, 
    handleSubmit: createHandleSubmit,
    clearSavedForm
  } = useFormCache('signup-form', {
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRobot, setNotRobot] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData(name, value);
    setError(null);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateFormData(name, checked);
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('الرجاء إدخال الاسم الكامل');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('الرجاء إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return false;
    }
    
    if (!formData.acceptTerms) {
      setError('يجب الموافقة على الشروط والأحكام');
      return false;
    }
    
    if (!notRobot) {
      setError('الرجاء التحقق من أنك لست روبوت');
      return false;
    }
    
    return true;
  };

  const submitForm = async (data: typeof formData) => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('Submitting signup form...', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone_number: data.phone_number
      });
      
      const { success, error } = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone_number: formData.phone_number
      });
      
      if (success) {
        console.log('Signup successful!');
        setSuccess(true);
        
        // Clear saved form data
        clearSavedForm();
        
        setTimeout(() => {
          navigate('/auth/login', { state: { message: 'تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول' } });
        }, 3000);
      } else {
        console.error('Signup error:', error);
        setError(error || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch (err: any) {
      console.error('Unexpected error during signup:', err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // Create submit handler with form cache
  const handleSubmit = createHandleSubmit(submitForm);

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: '', color: '', width: '0%' };
    if (password.length < 6) return { strength: 'ضعيفة', color: 'text-red-500', width: '33%' };
    if (password.length < 10) return { strength: 'متوسطة', color: 'text-yellow-500', width: '66%' };
    return { strength: 'قوية', color: 'text-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
            <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">تم إنشاء الحساب!</h1>
            <p className="text-gray-400 mb-4">تم تسجيل معلوماتك بنجاح</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              جاري التوجيه إلى صفحة تسجيل الدخول...
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-400">انضم إلى شير لوك واستمتع بالألعاب التفاعلية</p>
        </div>

        {}
        <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
          {error && (
            <div className="bg-red-900/50 border border-red-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          {/* Form Recovery Notice */}
          {(formData.email || formData.full_name) && (
            <div className="bg-blue-900/50 border border-blue-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-blue-400 text-sm">تم استعادة بيانات النموذج المحفوظة سابقاً</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {}
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
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            {}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                رقم الجوال (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="+966501234567"
                  dir="ltr"
                />
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">قوة كلمة المرور:</span>
                    <span className={passwordStrength.color}>{passwordStrength.strength}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 'ضعيفة' ? 'bg-red-500' :
                        passwordStrength.strength === 'متوسطة' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: passwordStrength.width }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {}
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-xs">كلمات المرور متطابقة</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-xs">كلمات المرور غير متطابقة</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {}
            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-2xl">
              <input
                type="checkbox"
                id="not-robot"
                name="notRobot"
                checked={notRobot}
                onChange={() => setNotRobot(!notRobot)}
                className="w-5 h-5 rounded border-gray-700 bg-black text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="not-robot" className="text-white">
                أنا لست روبوت
              </label>
            </div>

            {}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms || false}
                onChange={handleCheckboxChange}
                className="mt-1 rounded border-gray-700 bg-black text-orange-600 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-400">
                أوافق على{' '}
                <Link to="/terms" className="text-orange-500 hover:text-orange-400 font-medium">
                  الشروط والأحكام
                </Link>
                {' '}و{' '}
                <Link to="/privacy" className="text-orange-500 hover:text-orange-400 font-medium">
                  سياسة الخصوصية
                </Link>
              </p>
            </div>

            {}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </form>

          {}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              لديك حساب بالفعل؟{' '}
              <Link
                to="/auth/login"
                className="text-orange-500 hover:text-orange-400 font-bold"
              >
                تسجيل الدخول
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