import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Info, User, Key, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { supabase, checkSupabaseConnection } from '../../services/supabaseClient';

export const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '', 
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      console.log('فحص الاتصال بـ Supabase من صفحة تسجيل الدخول...');
      setConnectionStatus('checking');
      
      const isConnected = await checkSupabaseConnection();
      
      if (isConnected) {
        console.log('✅ اتصال Supabase يعمل بنجاح');
        setConnectionStatus('connected');
      } else {
        console.log('❌ فشل الاتصال بـ Supabase');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🚀 بدء عملية تسجيل الدخول...');
      await adminService.signIn(formData.email, formData.password);
      console.log('✅ تم تسجيل الدخول بنجاح، التوجه إلى لوحة التحكم...');
      navigate('/admin');
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      setError(error.message || 'فشل في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">ش</span>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                شير لوك
              </h1>
              <p className="text-gray-600 text-sm">لوحة التحكم الإدارية</p>
            </div>
          </div>
        </div>

        {}
        <ConnectionStatus 
          status={connectionStatus} 
          onRetry={checkConnection} 
          className="mb-6"
        />

        {}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">تسجيل الدخول</h2>
            <p className="text-gray-600">ادخل بياناتك للوصول إلى لوحة التحكم</p>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || connectionStatus === 'disconnected'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              للحصول على صلاحيات الدخول، تواصل مع مدير النظام
            </p>
          </div>
        </div>



        {}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-4">
            © 2024 شير لوك. جميع الحقوق محفوظة.
          </p>
          <a 
            href="https://9carpugc.forms.app/sherlooks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <span>استبيان</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};