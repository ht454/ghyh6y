import React from 'react';
import { ArrowLeft, Share2, Smartphone, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InstallPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Logo */}
        <div className="mb-12">
          <img
            src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754344717242-ea62zdgegpk.png"
            alt="شيرلوك"
            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/logo.png';
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-center mb-8">
          تثبيت شيرلوك
        </h1>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6">طريقة التثبيت</h2>
            
            <div className="space-y-6 text-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <span>اضغط زر المشاركة</span>
                <Share2 className="w-6 h-6 text-orange-400" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
                <span>اختر "Add to Home Screen" أو "إضافة إلى شاشة الحوال"</span>
                <Smartphone className="w-6 h-6 text-orange-400" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
                <span>وبكدا صار عندك شيرلوك بجوالك</span>
                <Download className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">تطبيق كامل</h3>
              <p className="text-white/70">يعمل مثل التطبيق الأصلي</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">عمل بدون إنترنت</h3>
              <p className="text-white/70">العب حتى بدون اتصال</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">وصول سريع</h3>
              <p className="text-white/70">من الشاشة الرئيسية</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-12">
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 mx-auto"
            >
              <Smartphone className="w-5 h-5" />
              ابدأ اللعب الآن
            </button>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}; 