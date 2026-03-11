# Sherlook PWA - نسخة التطبيق المحسن

نسخة محسنة من تطبيق شير لوك تعمل كتطبيق ويب تقدمي (PWA) مع دعم كامل للجوال.

## 🚀 المميزات الجديدة

### 📱 PWA Features
- **تثبيت التطبيق**: يمكن تثبيت التطبيق على الشاشة الرئيسية
- **العمل بدون إنترنت**: يعمل التطبيق حتى بدون اتصال بالإنترنت
- **شريط الحالة**: يعرض الوقت والبطارية وحالة الاتصال
- **مؤشر عدم الاتصال**: يظهر عند فقدان الاتصال بالإنترنت

### 🎨 UI/UX Improvements
- **تصميم محسن للجوال**: تجربة مستخدم محسنة للأجهزة المحمولة
- **أيقونات محسنة**: أيقونات عالية الجودة لجميع الأحجام
- **ألوان متناسقة**: نظام ألوان موحد في جميع أنحاء التطبيق
- **تحميل سريع**: تحسينات الأداء والتحميل

## 📋 المتطلبات

### ملفات الأيقونات المطلوبة
يجب وجود الملفات التالية في مجلد `public/`:

```
public/
├── logo.png             # أيقونة الموقع و PWA
└── browserconfig.xml    # إعدادات Windows
```

### متغيرات البيئة
انسخ ملف `env.example` إلى `.env` وأضف قيمك:

```env
# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Pexels API
VITE_PEXELS_API_KEY=your_pexels_api_key_here

# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# PWA Settings
VITE_PWA_NAME=Sherlook
VITE_PWA_SHORT_NAME=Sherlook
VITE_PWA_DESCRIPTION=لعبة الأسئلة التفاعلية المدعومة بالذكاء الاصطناعي
VITE_PWA_THEME_COLOR=#FF914D
VITE_PWA_BACKGROUND_COLOR=#000000
```

## 🛠️ الإعداد والتشغيل

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp env.example .env
# ثم أضف قيمك الحقيقية في ملف .env
```

### 3. إنشاء الأيقونات
استخدم الصورة المرفقة `Blue Minimalist B letter Business Company Logo.png` لإنشاء الأيقونات المطلوبة:

- `logo192.png` (192x192 pixels)
- `logo512.png` (512x512 pixels)
- `favicon.ico` (16x16, 32x32, 48x48 pixels)

### 4. تشغيل التطبيق
```bash
npm run dev
```

### 5. بناء التطبيق للإنتاج
```bash
npm run build
```

## 📱 اختبار PWA

### على الجوال
1. افتح التطبيق في متصفح الجوال
2. ستظهر رسالة "إضافة إلى الشاشة الرئيسية"
3. اضغط على "تثبيت" لإضافة التطبيق
4. التطبيق سيفتح بكامل الشاشة بدون شريط المتصفح

### على الكمبيوتر
1. افتح Chrome DevTools
2. اذهب إلى تبويب Application
3. ستجد PWA Manifest و Service Worker
4. يمكنك اختبار التثبيت من DevTools

## 🔧 المكونات الجديدة

### PWAInstallButton
زر تثبيت التطبيق يظهر تلقائياً عند توفر إمكانية التثبيت.

### PWAStatusBar
شريط الحالة يعرض الوقت والبطارية وحالة الاتصال.



### PWAOfflineIndicator
مؤشر عدم الاتصال يظهر عند فقدان الاتصال بالإنترنت.

## 🎯 التحسينات التقنية

### Service Worker
- **Cache Strategy**: استراتيجية ذكية للتخزين المؤقت
- **Offline Support**: دعم كامل للعمل بدون إنترنت
- **Background Sync**: مزامنة البيانات في الخلفية
- **Push Notifications**: إشعارات دفع (قابل للتطوير)

### Performance
- **Lazy Loading**: تحميل تدريجي للمكونات
- **Image Optimization**: تحسين الصور
- **Font Loading**: تحسين تحميل الخطوط
- **Bundle Splitting**: تقسيم الحزم لتحسين الأداء

### Security
- **HTTPS Required**: يتطلب HTTPS للتشغيل
- **Content Security Policy**: سياسة أمان المحتوى
- **XSS Protection**: حماية من XSS
- **CSRF Protection**: حماية من CSRF

## 🌐 النشر

### على Netlify
```bash
npm run build
# ثم ارفع مجلد dist إلى Netlify
```

### على Vercel
```bash
npm run build
# ثم ارفع المشروع إلى Vercel
```

### على GitHub Pages
```bash
npm run build
# ثم ارفع محتويات مجلد dist إلى GitHub Pages
```

## 📊 مراقبة الأداء

### Lighthouse Score
- **Performance**: 95+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+
- **PWA**: 100

### Core Web Vitals
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## 🔄 التحديثات

### تحديث Service Worker
```javascript
// في service-worker.js
const CACHE_VERSION = '1.0.1'; // تحديث هذا الرقم
```

### تحديث Manifest
```json
{
  "version": "1.0.1",
  "description": "تحديث الوصف هنا"
}
```

## 🐛 استكشاف الأخطاء

### مشاكل التثبيت
- تأكد من وجود HTTPS
- تأكد من وجود manifest.json
- تأكد من وجود service-worker.js

### مشاكل الأداء
- تحقق من حجم الصور
- تحقق من تحميل الخطوط
- تحقق من حجم JavaScript bundle

### مشاكل الاتصال
- تحقق من إعدادات Supabase
- تحقق من مفاتيح API
- تحقق من CORS settings

## 📞 الدعم

للدعم والاستفسارات:
- افتح issue في GitHub
- راسلنا على البريد الإلكتروني
- تواصل معنا على وسائل التواصل الاجتماعي

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**ملاحظة**: تأكد من اختبار التطبيق على أجهزة مختلفة قبل النشر النهائي. 