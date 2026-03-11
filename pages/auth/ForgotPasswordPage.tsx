import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('الرجاء إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { success, error } = await resetPassword(email);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' } 
          });
        }, 3000);
      } else {
        setError(error || 'فشل في إرسال رابط إعادة تعيين كلمة المرور');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
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
          <h1 className="text-3xl font-black text-white mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-gray-400">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور</p>
        </div>

        {}
        <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">تم إرسال الرابط!</h2>
              <p className="text-gray-400 mb-4">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
                <br />
                يرجى التحقق من بريدك الإلكتروني واتباع التعليمات.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                جاري التوجيه إلى صفحة تسجيل الدخول...
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-700 bg-black/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري إرسال الرابط...
                    </div>
                  ) : (
                    'إرسال رابط إعادة التعيين'
                  )}
                </button>
              </form>
            </>
          )}

          {}
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </Link>
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