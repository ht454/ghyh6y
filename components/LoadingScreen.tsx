import React from 'react';
import { Search, Loader, Brain, Sparkles } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Search className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Sherlook
            </h1>
            <p className="text-gray-600 text-lg font-medium">شير لوك</p>
          </div>
        </div>

        {}
        <div className="mb-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-gray-200 rounded-full mx-auto"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
        </div>

        {}
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-gray-800">الذكاء الاصطناعي يعمل...</h2>
          <p className="text-gray-600">جاري إنشاء سؤال فريد ومميز خصيصاً لك</p>
        </div>

        {}
        <div className="space-y-4 max-w-md mx-auto mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Brain className="w-5 h-5 animate-pulse text-purple-500" />
            <span>تحليل الفئة ومستوى الصعوبة...</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Sparkles className="w-5 h-5 animate-bounce text-orange-500" />
            <span>توليد سؤال فريد بالذكاء الاصطناعي...</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Search className="w-5 h-5 animate-spin text-blue-500" />
            <span>البحث عن الصورة المناسبة...</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader className="w-5 h-5 animate-spin text-green-500" />
            <span>التأكد من عدم التكرار...</span>
          </div>
        </div>

        {}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-3">🤖 مميزات الذكاء الاصطناعي</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>أسئلة لا نهائية بدون تكرار</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>مستويات صعوبة متدرجة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>صور تلقائية مناسبة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>معلومات إضافية شيقة</span>
            </div>
          </div>
        </div>

        {}
        <div className="mt-8 max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">جاري المعالجة...</p>
        </div>
      </div>
    </div>
  );
};