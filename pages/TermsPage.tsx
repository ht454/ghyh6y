import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export const TermsPage: React.FC = () => {
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

        {/* Terms Content */}
        <div className="bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-black text-white mb-8 text-center">
            شروط وأحكام استخدام لعبة شيرلوك
          </h1>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">أولاً: الدخول إلى اللعبة</h2>
              <p>
                يوافق المستخدم على شروط وأحكام هذه الاتفاقية عند استخدام تطبيق "شيرلوك"، وفي حال عدم الرضا عن محتوى التطبيق أو خدماته، يمكنه التوقف عن استخدامه فورًا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">ثانيًا: حقوق الملكية الفكرية</h2>
              <div className="space-y-3">
                <p>
                  جميع خصائص ومحتوى تطبيق "شيرلوك" (بما يشمل وليس حصرًا: النصوص، الصور، التصاميم، الأسئلة، الواجهات، الأسلوب العام، العلامة التجارية، والمحتوى البرمجي) هي ملك حصري للتطبيق وفريقه، ومحميّة بموجب قوانين الملكية الفكرية.
                </p>
                <p>
                  يُمنع على المستخدم نسخ أو تعديل أو توزيع أو إعادة نشر أي جزء من التطبيق دون إذن كتابي مسبق.
                </p>
                <p>
                  يُمنع حذف أو تغيير العلامات التجارية أو الحقوق الفكرية من أي جزء من محتوى التطبيق.
                </p>
                <p>
                  لا يجوز استخدام اللعبة أو محتواها في أي غرض تجاري أو ربحي.
                </p>
                <p>
                  اسم "شيرلوك" وشعاره وكافة التصاميم والمفردات الخاصة بالتطبيق هي علامات تجارية مملوكة للتطبيق فقط.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">ثالثًا: التزامات المستخدم</h2>
              <div className="space-y-3">
                <p>
                  يلتزم المستخدم باستخدام التطبيق لأغراض مشروعة فقط.
                </p>
                <p>
                  يتعهد بعدم التسبب في أي ضرر مباشر أو غير مباشر للتطبيق أو لمستخدميه.
                </p>
                <p>
                  يُمنع استخدام تقنيات تضر أو تؤثر على أداء التطبيق مثل إدخال فيروسات أو أدوات اختراق.
                </p>
                <p>
                  لا يجوز للمستخدم انتحال شخصية أي جهة داخل التطبيق أو خارجه.
                </p>
                <p>
                  يُمنع نشر روابط خارجية أو علامات تجارية أخرى داخل التطبيق دون إذن رسمي.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">رابعًا: المراقبة وإنهاء الخدمة</h2>
              <div className="space-y-3">
                <p>
                  تحتفظ إدارة "شيرلوك" بحق إنهاء أو إيقاف حساب المستخدم في حال تم استخدام التطبيق بشكل مخالف أو مسيء.
                </p>
                <p>
                  يحق للإدارة اتخاذ الإجراءات القانونية المناسبة في حال تم خرق الاتفاقية أو محاولة التلاعب بمحتوى التطبيق.
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