import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  User,
  LogOut,
  Settings, 
  ChevronDown,
  Home,
  GamepadIcon,
  HelpCircle,
  Bell,
  Smartphone,
  Trophy
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-transparent' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {}
        <div className="bg-black rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-2 sm:py-4 shadow-2xl border border-gray-800">
          <div className="flex items-center justify-between">
            {}
            <div className="hidden lg:flex items-center gap-4 xl:gap-8">
              <Link to="/" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base">الرئيسية</Link>
              <Link to="/game" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base">اللعبة</Link>
              <Link to="/install" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base flex items-center gap-1">
                <Smartphone className="w-4 h-4" />
                تثبيت الجوال
              </Link>
              <Link to="/ewc" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                بطولة EWC
              </Link>
              {user && (
                <Link to="/previous-games" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base">ألعابي السابقة</Link>
              )}
              <a href="/#categories" className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base">الفئات</a>
              <a 
                href="https://9carpugc.forms.app/sherlooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-orange-400 transition-colors font-medium text-sm xl:text-base flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                استبيان
              </a>
            </div>

            {}
            <div className="flex items-center justify-center">
              <img 
                src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751345679481-tj5b9gt3apj.png" 
                alt="شير لوك" 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                onClick={handleLogoClick}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg hidden transition-all duration-300 hover:scale-110 cursor-pointer" onClick={handleLogoClick}>
                <Search className="text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
              </div>
            </div>

            {}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/80 px-3 py-2 rounded-full transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'User'} 
                        className="w-8 h-8 rounded-full object-cover border border-white/30"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346816765-lyg2xtd3xj.png';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-white text-sm">{profile?.full_name || user?.email}</span>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-black border border-gray-800 rounded-xl shadow-xl z-50">
                      <div className="py-1">
                        <Link 
                          to="/profile" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          الملف الشخصي
                        </Link>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors w-full text-right"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/auth/login"
                    className="text-white hover:text-orange-400 transition-colors px-3 py-2"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 xl:px-6 py-2 xl:py-3 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-sm xl:text-base"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>

            {}
            <div className="lg:hidden flex items-center gap-3">
              {user && (
                <Link to="/profile" className="mr-2">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover border border-white/30"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346816765-lyg2xtd3xj.png';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </Link>
              )}
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {}
          {isMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-800">
              <div className="flex flex-col gap-4">
                <Link to="/" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base">الرئيسية</Link>
                <Link to="/game" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base">اللعبة</Link>
                <Link to="/install" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  تثبيت الجوال
                </Link>
                <Link to="/ewc" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4" />
                  بطولة EWC
                </Link>
                {user && (
                  <Link to="/previous-games" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base">ألعابي السابقة</Link>
                )}
                <a href="/#categories" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base">الفئات</a>
                <a 
                  href="https://9carpugc.forms.app/sherlooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  استبيان
                </a>
                
                {user ? (
                  <>
                    <Link to="/profile" className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base">الملف الشخصي</Link>
                    <button
                      onClick={handleSignOut}
                      className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    <Link
                      to="/auth/login"
                      className="text-white hover:text-orange-400 transition-colors font-medium text-center py-2 text-sm sm:text-base"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/auth/signup"
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-bold mx-4 text-sm sm:text-base text-center"
                    >
                      إنشاء حساب
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
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
    </nav>
  );
};