import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Play, 
  Users, 
  Trophy, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Menu,
  X,
  Quote,
  Award,
  Clock,
  Target,
  Sparkles,
  Brain,
  GamepadIcon,
  Crown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Settings,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { gameService } from '../services/gameService';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { getConnectionState } from '../services/supabaseClient';
import { EWCPage } from './EWCPage';


interface HeroImage {
  id: string;
  url: string;
  title: string;
  description: string;
  isActive?: boolean;
  position?: string;
}

export const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animatedNumbers, setAnimatedNumbers] = useState({
    players: 0,
    questions: 0,
    satisfaction: 0,
    support: 0
  });
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const navigate = useNavigate();
  // Provide fallback for connectionStatus in case useAuth fails
  const auth = useAuth();
  const user = auth?.user;
  const connectionStatus = auth?.connectionStatus || getConnectionState();
  const retryConnection = auth?.retryConnection || (() => Promise.resolve(false));
  
  
  const [heroImages, setHeroImages] = useState<HeroImage[]>([
    {
      id: '1',
      url: 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342280479-zic6p2xl66c.png',
      title: 'شير لوك - منصة الألعاب التفاعلية',
      description: 'استمتع بتجربة لعب مثيرة مع الأصدقاء والعائلة'
    },
    {
      id: '2',
      url: 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342288274-8l6yo8xvfa.png',
      title: 'ألعاب تفاعلية ذكية',
      description: 'أسئلة لا نهائية مدعومة بالذكاء الاصطناعي'
    },
    {
      id: '3',
      url: 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342291641-sx68isk91vr.png',
      title: 'تجربة لعب ممتعة',
      description: 'تصميم جميل ومتجاوب لجميع الأجهزة'
    },
    {
      id: '4',
      url: 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342294382-615ne80gbda.png',
      title: 'منصة شير لوك',
      description: 'اكتشف عالم الألعاب التفاعلية'
    },
    {
      id: '5',
      url: 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342296631-9vufh3iyran.png',
      title: 'منصة شير لوك المتطورة',
      description: 'أحدث التقنيات في عالم الألعاب التفاعلية'
    }
  ]);
  
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadCategories();
    loadHeroImagesFromStorage();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const animateNumbers = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;
      
      const targets = {
        players: 10000,
        questions: 50000,
        satisfaction: 98,
        support: 24
      };

      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setAnimatedNumbers({
          players: Math.floor(targets.players * easeOutQuart),
          questions: Math.floor(targets.questions * easeOutQuart),
          satisfaction: Math.floor(targets.satisfaction * easeOutQuart),
          support: Math.floor(targets.support * easeOutQuart)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setAnimatedNumbers(targets);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    };

    const timeout = setTimeout(animateNumbers, 500);
    return () => clearTimeout(timeout);
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await gameService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadHeroImagesFromStorage = () => {
    try {
      const savedImages = localStorage.getItem('heroImages');
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages);
        const activeImages = parsedImages.filter((img: HeroImage) => img.isActive !== false && img.position === 'hero');
        
        if (activeImages && activeImages.length > 0) {
          console.log('✅ تم تحميل الصور من localStorage:', activeImages.length);
          setHeroImages(activeImages);
        } else {
          console.log('⚠️ لا توجد صور نشطة في localStorage، استخدام الصور الافتراضية');
        }
      } else {
        console.log('⚠️ لا توجد صور في localStorage، استخدام الصور الافتراضية');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل الصور من localStorage:', error);
    }
  };

  const handleStartGame = () => {
    console.log('🎮 التوجه إلى صفحة اللعبة...');
    navigate('/game');
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(categories.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(categories.length / 3)) % Math.ceil(categories.length / 3));
  };
  
  const nextHeroImage = () => {
    setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
  };
  
  const prevHeroImage = () => {
    setCurrentHeroImage((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const getVisibleCategories = () => {
    const itemsPerSlide = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const startIndex = currentSlide * itemsPerSlide;
    return categories.slice(startIndex, startIndex + itemsPerSlide);
  };

  const handleLogoClick = () => {
    setAdminClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowAdminButton(true);
        setTimeout(() => {
          setShowAdminButton(false);
          setAdminClickCount(0);
        }, 5000);
      }
      return newCount;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {}
      <section className="relative pt-32 pb-32 bg-gradient-to-br from-[#FF914D] to-[#FF3131] overflow-hidden">
        {}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {}
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/30">
                <Crown className="w-4 h-4" />
                حياك
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                حياك الله
                <span className="block text-white/90">
                  في
                </span>
                شيرلوك
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              هنا التحدي على أصوله… أسئلة ترفع الحماس وفئات ما تنمل.
معك اهلك ولا اخوياك؟ تعالوا شوفوا مين الأذكى بينكم.
ادخل الجولة… والحسم لك.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button
                  onClick={handleStartGame}
                  className="bg-black text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-black/80 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 border border-white/30"
                >
                  <Play className="w-5 h-5" />
                  ابدأ اللعب مجاناً
                </button>
                {!user && (
                  <Link 
                    to="/auth/signup" 
                    className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-[#FF914D] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    إنشاء حساب
                  </Link>
                )}
              </div>

              {}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>مجاني تماماً</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>بدون تسجيل</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>آمن 100%</span>
                </div>
              </div>
            </div>

            {}
            <div className="relative">
              <div className="relative z-10">
                {}
                <div className="relative group">
                  <img
                    src={heroImages[currentHeroImage]?.url || 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342280479-zic6p2xl66c.png'}
                    alt={heroImages[currentHeroImage]?.title || 'شير لوك'}
                    className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/30 object-cover"
                    style={{ height: '500px', objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342280479-zic6p2xl66c.png';
                    }}
                  />
                  
                  {}
                  <button
                    onClick={prevHeroImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm shadow-xl rounded-full p-3 hover:bg-black/70 transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <button
                    onClick={nextHeroImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm shadow-xl rounded-full p-3 hover:bg-black/70 transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  
                  {}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentHeroImage(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          currentHeroImage === index 
                            ? 'bg-white scale-125' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {}
                <div className="absolute -top-6 -right-6 bg-black/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <div>
                      <div className="text-sm font-bold text-white">+10,000</div>
                      <div className="text-xs text-gray-300">لاعب نشط</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-orange-400" />
                    <div>
                      <div className="text-sm font-bold text-white">AI مدعوم</div>
                      <div className="text-xs text-gray-300">أسئلة ذكية</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {}
              <div className="absolute top-10 right-10 w-20 h-20 bg-white/20 rounded-full opacity-50 animate-pulse"></div>
              <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/20 rounded-full opacity-50 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="categories" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              استكشف فئات الأسئلة
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              اختر من مجموعة متنوعة من الفئات الشيقة واختبر معلوماتك في مختلف المجالات
            </p>
          </div>

          {}
          <div className="relative max-w-7xl mx-auto">
            {}
            {categories.length > 3 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-4 hover:bg-white transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-4 hover:bg-white transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 max-w-7xl mx-auto">
              {getVisibleCategories().map((category, index) => (
                <div
                  key={category.id}
                  className="group relative bg-black rounded-3xl overflow-hidden shadow-2xl hover:shadow-orange-500/20 transition-all duration-700 transform hover:scale-105 hover:-translate-y-4 cursor-pointer border border-gray-800 hover:border-orange-500/50"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    maxWidth: '100%',
                    margin: '0 auto',
                    aspectRatio: '0.75'
                  }}
                  onClick={handleStartGame}
                >
                  {}
                  <div className="relative w-full h-full overflow-hidden">
                    <img 
                      src={category.illustration}
                      alt={category.name}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                      style={{
                        objectFit: 'contain',
                        objectPosition: 'center'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/logo.png';
                      }}
                    />
                    
                    {}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {}
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white text-xl font-bold drop-shadow-2xl">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  {}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: category.color || '#ff6b35' }}
                  ></div>

                  {}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ff914d]/0 to-[#ff3131]/0 group-hover:from-[#ff914d]/10 group-hover:to-[#ff3131]/10 transition-all duration-500 rounded-3xl"></div>
                </div>
              ))}
            </div>

            {}
            {categories.length > 3 && (
              <div className="flex justify-center mt-12 gap-3">
                {Array.from({ length: Math.ceil(categories.length / 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'bg-orange-500 scale-125' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {}
          <div className="text-center mt-16">
            <button
              onClick={handleStartGame}
              className="bg-gradient-to-r from-[#ff914d] to-[#ff3131] text-white px-12 py-4 rounded-full text-xl font-bold hover:from-[#ff914d]/90 hover:to-[#ff3131]/90 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <GamepadIcon className="w-6 h-6" />
              ابدأ اللعب مع هذه الفئات
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {}
      <section id="features" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              لماذا تختار شير لوك ؟
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              نقدم تجربة لعب فريدة ومتطورة تجمع بين المتعة والتعلم والتفاعل الاجتماعي
            </p>
          </div>

          {}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-green-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">محتوى عربي أصيل</h3>
              <p className="text-gray-300 leading-relaxed">أسئلة باللغة العربية تغطي الثقافة والتاريخ والجغرافيا العربية</p>
            </div>

            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-red-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">تفاعل اجتماعي</h3>
              <p className="text-gray-300 leading-relaxed">العب مع الأصدقاء والعائلة في جلسات تفاعلية ممتعة ومثيرة</p>
            </div>

            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-orange-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">ذكاء اصطناعي متقدم</h3>
              <p className="text-gray-300 leading-relaxed">أسئلة لا نهائية ومتنوعة يولدها الذكاء الاصطناعي بناءً على اهتماماتك</p>
            </div>

            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">تجربة مخصصة</h3>
              <p className="text-gray-300 leading-relaxed">اختر الفئات والمستويات التي تناسبك لتجربة لعب مثالية</p>
            </div>

            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">آمان وخصوصية</h3>
              <p className="text-gray-300 leading-relaxed">حماية كاملة لبياناتك مع ضمان الخصوصية والأمان التام</p>
            </div>

            {}
            <div className="group bg-black border border-white/20 rounded-3xl p-8 hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">سرعة فائقة</h3>
              <p className="text-gray-300 leading-relaxed">تحميل سريع وأداء ممتاز على جميع الأجهزة بدون تأخير</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="testimonials" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              ماذا يقول عملاؤنا؟
            </h2>
            <p className="text-xl text-gray-300">
              آراء حقيقية من مستخدمين راضين عن تجربتهم مع شير لوك
            </p>
          </div>

          {}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { 
                number: `+${animatedNumbers.players.toLocaleString()}`, 
                label: 'لاعب نشط',
                gradient: 'from-[#ff914d] to-[#ff3131]'
              },
              { 
                number: `+${animatedNumbers.questions.toLocaleString()}`, 
                label: 'سؤال متاح',
                gradient: 'from-[#ff914d] to-[#ff3131]'
              },
              { 
                number: `${animatedNumbers.satisfaction}%`, 
                label: 'رضا العملاء',
                gradient: 'from-[#ff914d] to-[#ff3131]'
              },
              { 
                number: `${animatedNumbers.support}/7`, 
                label: 'دعم فني',
                gradient: 'from-[#ff914d] to-[#ff3131]'
              }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 transition-all duration-300 hover:scale-110`}>
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>

          {}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'أحمد محمد',
                role: 'مدرس',
                avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
                content: 'شير لوك غيّر طريقة تعليمي للطلاب. الأسئلة التفاعلية تجعل التعلم ممتعاً ومثيراً.',
                rating: 5
              },
              {
                name: 'فاطمة العلي',
                role: 'أم لثلاثة أطفال',
                avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
                content: 'أطفالي يحبون اللعب مع شير لوك. إنه وسيلة رائعة لقضاء وقت ممتع ومفيد مع العائلة.',
                rating: 5
              },
              {
                name: 'خالد السعيد',
                role: 'مطور برمجيات',
                avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
                content: 'التقنية المستخدمة في شير لوك مذهلة. الذكاء الاصطناعي يولد أسئلة متنوعة ومثيرة.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-black border-2 border-dashed border-gray-600 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 hover:border-gray-500">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-orange-400 mb-4" />
                <p className="text-white mb-6 leading-relaxed">{testimonial.content}</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-gradient-to-r from-[#ff914d] to-[#ff3131]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            جاهز لبدء المغامرة؟
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            انضم إلى آلاف اللاعبين واستمتع بتجربة لعب فريدة ومثيرة مع شير لوك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartGame}
              className="bg-white text-orange-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              <GamepadIcon className="w-5 h-5" />
              ابدأ اللعب الآن
            </button>
            {!user && (
              <Link 
                to="/auth/signup" 
                className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-orange-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                إنشاء حساب
              </Link>
            )}
          </div>
        </div>
      </section>

      {}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          {}
          <div className="max-w-6xl mx-auto">
            {}
            <div className="border-2 border-dashed border-gray-600 rounded-3xl p-12">
              <div className="grid md:grid-cols-2 gap-16">
                
                {}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-8 border-b border-gray-600 pb-4">
                    الصفحات
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">عن</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <div className="border-b border-gray-700"></div>
                    
                    <div className="flex items-center justify-between group cursor-pointer">
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">مميزات</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <div className="border-b border-gray-700"></div>
                  </div>
                </div>

                {}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-8 border-b border-gray-600 pb-4">
                    سوشل ميديا
                  </h3>
                  <div className="space-y-6">
                    <a 
                      href="https://www.tiktok.com/@sherlook.ksa?is_from_webapp=1&sender_device=pc" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">تيك توك</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </a>
                    <div className="border-b border-gray-700"></div>
                    
                    <a 
                      href="https://www.instagram.com/sherlook.ksa" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">انستقرام</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </a>
                    <div className="border-b border-gray-700"></div>
                    
                    <Link 
                      to="/ewc" 
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">بطولة EWC</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </Link>
                    <div className="border-b border-gray-700"></div>
                    
                    <a 
                      href="https://9carpugc.forms.app/sherlooks" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-white text-lg hover:text-orange-400 transition-colors">استبيان</span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </a>
                    <div className="border-b border-gray-700"></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </footer>

      {}
      {showAdminButton && (
        <div className="fixed bottom-4 right-4 admin-button-appear">
          <Link 
            to="/admin/login" 
            className="bg-black text-white px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2 shadow-lg"
          >
            <Settings className="w-4 h-4" />
            <span>لوحة الإدارة</span>
          </Link>
        </div>
      )}
      
      {}
      <div className="fixed bottom-4 right-4 z-50">
        <ConnectionStatus 
          status={connectionStatus} 
          onRetry={retryConnection}
          className="shadow-lg"
        />
      </div>
    </div>
  );
};