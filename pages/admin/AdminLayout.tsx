import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  HelpCircle, 
  GamepadIcon,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Search,
  Crown,
  Shield,
  Sparkles,
  Zap,
  Target,
  Users,
  Image,
  Wrench
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AdminUser } from '../../types/admin';

export const AdminLayout: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const admin = await adminService.getCurrentAdmin();
      if (!admin) {
        navigate('/admin/login');
        return;
      }
      setCurrentAdmin(admin);
    } catch (error) {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await adminService.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      path: '/admin',
      exact: true,
      color: 'from-blue-500 to-blue-600',
      description: 'الإحصائيات والنظرة العامة'
    },
    {
      title: 'إدارة الفئات',
      icon: FolderOpen,
      path: '/admin/categories',
      color: 'from-green-500 to-green-600',
      description: 'تنظيم فئات الأسئلة'
    },
    {
      title: 'إدارة الأسئلة',
      icon: HelpCircle,
      path: '/admin/questions',
      color: 'from-purple-500 to-purple-600',
      description: 'بنك الأسئلة والمحتوى'
    },
    {
      title: 'جلسات اللعب',
      icon: GamepadIcon,
      path: '/admin/games',
      color: 'from-orange-500 to-orange-600',
      description: 'متابعة الألعاب النشطة'
    },
    {
      title: 'جلسات المستخدمين',
      icon: Users,
      path: '/admin/sessions',
      color: 'from-teal-500 to-teal-600',
      description: 'متابعة جلسات اللعب للمستخدمين'
    },
    {
      title: 'سجل النشاطات',
      icon: Activity,
      path: '/admin/activities',
      color: 'from-red-500 to-red-600',
      description: 'تتبع العمليات والأنشطة'
    },
    {
      title: 'إدارة المستخدمين',
      icon: Users,
      path: '/admin/users',
      color: 'from-yellow-500 to-yellow-600',
      description: 'إدارة حسابات المستخدمين'
    },
    {
      title: 'إدارة المحتوى',
      icon: FileText,
      path: '/admin/content',
      color: 'from-indigo-500 to-indigo-600',
      description: 'الصفحات والبنرات والإشعارات'
    },
    {
      title: 'إدارة الصور',
      icon: Image,
      path: '/admin/images',
      color: 'from-pink-500 to-pink-600',
      description: 'إدارة صور الموقع والبنرات'
    },
    {
      title: 'الأدوات المساعدة',
      icon: Wrench,
      path: '/admin/tools',
      color: 'from-teal-500 to-teal-600',
      description: 'أدوات مساعدة متنوعة'
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      path: '/admin/settings',
      color: 'from-gray-500 to-gray-600',
      description: 'إعدادات النظام العامة'
    }
  ];

  const isActiveRoute = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">جاري التحميل...</div>
          <div className="text-gray-400">تحضير لوحة التحكم</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 sm:w-72 md:w-80 bg-black shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-l border-gray-800`}>
        {}
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 px-4 sm:px-5 md:px-6 border-b border-gray-800 bg-gradient-to-r from-orange-500 to-red-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="https://res.cloudinary.com/dxssp4uo1/image/upload/v1750015111/Untitled_design_46_cue6c4.png" 
              alt="شير لوك" 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border-2 border-white/50"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl hidden border-2 border-white/50">
              <Search className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <span className="text-base sm:text-lg md:text-xl font-black text-white">شير لوك</span>
              <div className="text-xs text-orange-100 font-medium">لوحة التحكم الإدارية</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {}
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-800">
          <div className="bg-black rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  {currentAdmin?.full_name}
                </div>
                <div className="text-xs sm:text-sm text-orange-600 font-medium">
                  {currentAdmin?.role === 'super_admin' && '👑 مدير عام'}
                  {currentAdmin?.role === 'admin' && '🛡️ مدير'}
                  {currentAdmin?.role === 'moderator' && '⚡ مشرف'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>متصل الآن</span>
            </div>
          </div>
        </div>

        {}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
          <div className="space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 ${
                  isActiveRoute(item.path, item.exact)
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-900 hover:text-white'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActiveRoute(item.path, item.exact)
                      ? 'bg-white/20 text-white'
                      : `bg-gradient-to-r ${item.color} text-white group-hover:scale-110`
                  }`}>
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="font-bold text-base sm:text-lg">{item.title}</div>
                    <div className={`text-xs sm:text-sm opacity-80 ${
                      isActiveRoute(item.path, item.exact) ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
                
                {}
                {isActiveRoute(item.path, item.exact) && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                
                {}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            ))}
          </div>
        </nav>

        {}
        <div className="p-4 sm:p-5 md:p-6 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-red-500 hover:bg-red-950 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 font-medium"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-950 rounded-lg sm:rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 lg:mr-80">
        {}
        <div className="bg-black shadow-sm border-b border-gray-800 h-16 sm:h-18 md:h-20 flex items-center justify-between px-4 sm:px-5 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 sm:p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg sm:rounded-xl transition-all duration-300"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 bg-gray-900 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 min-w-[200px] sm:min-w-[250px] md:min-w-[300px]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في لوحة التحكم..."
                className="bg-transparent border-none outline-none flex-1 text-gray-300 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {}
            <button className="relative p-2 sm:p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg sm:rounded-xl transition-all duration-300">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </button>
            
            {}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 border border-orange-900">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <div className="text-xs sm:text-sm">
                <div className="font-bold text-white">مرحباً، {currentAdmin?.full_name}</div>
                <div className="text-gray-400">إدارة ممتازة اليوم! 🎯</div>
              </div>
            </div>
          </div>
        </div>

        {}
        <main className="flex-1 p-4 sm:p-5 md:p-6 bg-black">
          <Outlet />
        </main>
      </div>

      {}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};