import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start p-4">
      {/* Logo */}
      <div className="text-center mb-8 mt-8">
        <Link to="/" className="inline-block mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg mx-auto">
            <Search className="text-white w-8 h-8" />
          </div>
        </Link>
      </div>

      {/* Content Container */}
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/auth/signup" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>العودة</span>
          </Link>
        </div>

        {/* Privacy Content */}
        <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-black text-white mb-8 text-center">
            سياسة الخصوصية
          </h1>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <div className="space-y-4">
                <p>
                  يحتفظ تطبيق "شيرلوك" ببيانات المستخدمين (مثل البريد الإلكتروني أو الاسم أو أرقام الهواتف) لأغراض تحسين الخدمة والتواصل والإعلانات والعروض الترويجية.
                </p>
                <p>
                  قد يتم استخدام بياناتك في إرسال إشعارات أو تنبيهات أو رسائل تتعلق بتجربة اللعب أو التحديثات الجديدة.
                </p>
                <p>
                  لا يتم بيع أو مشاركة البيانات مع أي طرف ثالث خارج فريق العمل بدون إذن صريح من المستخدم، إلا إذا طُلب ذلك قانونيًا.
                </p>
                <p>
                  باستخدامك للتطبيق، فإنك توافق ضمنيًا على هذه السياسة وعلى جمع واستخدام المعلومات وفق ما ورد أعلاه.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">التعديلات على الشروط وسياسة الخصوصية</h2>
              <div className="space-y-3">
                <p>
                  تحتفظ إدارة "شيرلوك" بحق تعديل أو تحديث هذه الشروط والأحكام وسياسة الخصوصية في أي وقت، سواء تم إشعار المستخدمين أو لا.
                </p>
                <p>
                  ويُعتبر استمرار المستخدم في استخدام التطبيق بعد أي تعديل قبولًا وموافقةً ضمنية على تلك التغييرات، دون الحاجة إلى إخطار مسبق.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-sm mb-4">
              © 2024 شيرلوك. جميع الحقوق محفوظة.
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
    </div>
  );
};