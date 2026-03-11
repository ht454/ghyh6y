import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ChampionPageProps {
  championName: string;
  onClose: () => void;
}

export const ChampionPage: React.FC<ChampionPageProps> = ({ championName, onClose }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // تأخير عرض المحتوى قليلاً للحصول على تأثير انتقال جميل
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // إغلاق الصفحة تلقائياً بعد 8 ثوان
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(autoCloseTimer);
  }, [onClose]);

  return (
    <div className="champion-page-overlay">
      <div className="champion-background">
        {/* خلفية متدرجة */}
        <div className="champion-gradient"></div>
        
        {/* نجوم متحركة */}
        <div className="stars">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`star star-${i % 5}`}></div>
          ))}
        </div>

        {/* المحتوى الرئيسي */}
        <div className={`champion-content ${showContent ? 'show' : ''}`}>
          {/* عنوان التهنئة */}
          <h1 className="champion-title">
            تهانينا
          </h1>

          {/* اسم البطل */}
          <div>
            <h2 className="champion-name">{championName}</h2>
            <div className="champion-subtitle">بطل البطولة</div>
          </div>

          {/* الأنيميشن الرئيسي */}
          <div className="champion-animation-main">
            <DotLottieReact
              src="https://lottie.host/d279d54d-0b98-4b77-8100-68fa1989db40/sXuTX8pkJt.lottie"
              loop
              autoplay
            />
          </div>



          {/* رسالة تهنئة */}
          <div className="champion-message">
            <p>لقد حققت الفوز في بطولة شيرلوك</p>
            <p>للرياضات الإلكترونية EWC</p>
          </div>

          {/* زر الإغلاق */}
          <button onClick={onClose} className="champion-close-btn">
            العودة للبطولة
          </button>
        </div>
      </div>
    </div>
  );
};