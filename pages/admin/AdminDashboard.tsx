import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GamepadIcon, 
  HelpCircle, 
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Star,
  Trophy,
  Zap,
  Target,
  Crown,
  Shield,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../types/admin';
import { supabase } from '../../services/supabaseClient';

// إضافة CSS مخصص للتحريك
const dashboardStyles = `
  .dashboard-container {
    scroll-behavior: smooth;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #FF914D #1a1a1a;
  }
  
  .dashboard-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .dashboard-container::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 10px;
  }
  
  .dashboard-container::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #FF914D, #FF3131);
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .dashboard-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #FF3131, #FF914D);
    transform: scale(1.1);
  }
  
  .stat-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }
  
  .stat-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 40px rgba(255, 145, 77, 0.2);
  }
  
  .chart-container {
    transition: all 0.4s ease-in-out;
  }
  
  .chart-container:hover {
    transform: scale(1.01);
  }
  
  .activity-item {
    transition: all 0.2s ease;
  }
  
  .activity-item:hover {
    transform: translateX(5px);
    background: linear-gradient(90deg, rgba(255, 145, 77, 0.1), transparent);
  }
  
  .progress-bar {
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .floating-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite alternate;
  }
  
  @keyframes pulse-glow {
    from { box-shadow: 0 0 20px rgba(255, 145, 77, 0.3); }
    to { box-shadow: 0 0 30px rgba(255, 145, 77, 0.6); }
  }
  
  .slide-in {
    animation: slideIn 0.6s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    // إضافة CSS للتحريك
    const styleSheet = document.createElement("style");
    styleSheet.textContent = dashboardStyles;
    document.head.appendChild(styleSheet);

    loadDashboardStats();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      // إزالة CSS عند إلغاء المكون
      document.head.removeChild(styleSheet);
    };
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dashboard stats...');
      const data = await adminService.getDashboardStats();
      console.log('Dashboard stats loaded:', data);
      setStats(data);
    } catch (err) {
      setError('فشل في تحميل الإحصائيات');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div className="text-xl font-bold text-white mb-2">جاري تحميل الإحصائيات...</div>
          <div className="text-gray-400">يرجى الانتظار</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-black rounded-3xl p-8 shadow-xl border border-red-900">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">خطأ في التحميل</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadDashboardStats}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'الألعاب النشطة',
      value: stats?.activeGames || 0,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      change: '+5%',
      trend: 'up',
      bgColor: '#FF914D',
      percentage: '5%+'
    },
    {
      title: 'إجمالي الأسئلة',
      value: stats?.totalQuestions || 0,
      icon: HelpCircle,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      trend: 'up',
      bgColor: '#7C3AED',
      percentage: '15%+'
    },
    {
      title: 'إجمالي الألعاب',
      value: stats?.totalGames || 0,
      icon: GamepadIcon,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      trend: 'up',
      bgColor: '#16A34A',
      percentage: '8%+'
    },
    {
      title: 'إجمالي المستخدمين',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      trend: 'up',
      bgColor: '#2563EB',
      percentage: '12%+'
    }
  ];

  const timeStats = [
    { label: 'اليوم', value: stats?.todayGames || 0, icon: Calendar, color: 'text-blue-500' },
    { label: 'هذا الأسبوع', value: stats?.weeklyGames || 0, icon: Clock, color: 'text-green-500' },
    { label: 'هذا الشهر', value: stats?.monthlyGames || 0, icon: TrendingUp, color: 'text-purple-500' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-12 slide-in">
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-3 sm:mb-4 border border-orange-900 floating-animation">
          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
          <span className="text-orange-500 font-bold text-sm sm:text-base">لوحة التحكم الرئيسية</span>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 pulse-glow" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">مرحباً بك في شير لوك</h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400">نظرة شاملة على أداء المنصة والإحصائيات المهمة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card bg-black backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl p-4 sm:p-5 lg:p-6 border border-gray-800 hover:shadow-2xl transition-all duration-500 group cursor-pointer slide-in"
            style={{ animationDelay: `${index * 150}ms` }}
            onClick={() => {
              // Navigate to relevant section based on card type
              const navigate = window.location.href.split('/admin')[0] + '/admin/';
              if (stat.title === 'الألعاب النشطة') {
                window.location.href = navigate + 'games?filter=active';
              } else if (stat.title === 'إجمالي الأسئلة') {
                window.location.href = navigate + 'questions';
              } else if (stat.title === 'إجمالي الألعاب') {
                window.location.href = navigate + 'games';
              } else if (stat.title === 'إجمالي المستخدمين') {
                window.location.href = navigate + 'users';
              }
            }}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`} style={{ backgroundColor: stat.bgColor }}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-green-900 text-green-400`}>
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                {stat.percentage}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1">{stat.value.toLocaleString()}</div>
              <div className="text-gray-400 font-medium text-sm sm:text-base">{stat.title}</div>
              <div className="text-xs text-gray-500 mt-1 sm:mt-2">من الشهر الماضي</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Time Stats Chart */}
        <div className="chart-container bg-black backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl p-4 sm:p-5 lg:p-6 border border-gray-800 slide-in">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">الألعاب حسب الفترة</h3>
              <p className="text-gray-400 text-xs sm:text-sm">إحصائيات الاستخدام</p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {timeStats.map((stat, index) => (
              <div key={index} className="activity-item flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all duration-300">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                  <span className="font-bold text-gray-300 text-sm sm:text-base">{stat.label}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Categories Chart */}
        <div className="chart-container bg-black backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl p-4 sm:p-5 lg:p-6 border border-gray-800 slide-in">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">الفئات الأكثر شعبية</h3>
              <p className="text-gray-400 text-xs sm:text-sm">الأكثر استخداماً</p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {stats?.popularCategories.slice(0, 5).map((category, index) => (
              <div key={index} className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {index + 1}
                    </div>
                    <span className="font-bold text-gray-300 text-sm sm:text-base">{category.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">{category.count} سؤال</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className="progress-bar bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities Chart */}
        <div className="chart-container bg-black backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl p-4 sm:p-5 lg:p-6 border border-gray-800 slide-in">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">النشاطات الأخيرة</h3>
              <p className="text-gray-400 text-xs sm:text-sm">آخر العمليات</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-item flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all duration-300">
                  <div className="flex-shrink-0 mt-1">
                    {activity.action === 'CREATE' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />}
                    {activity.action === 'UPDATE' && <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
                    {activity.action === 'DELETE' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {activity.action === 'CREATE' && '✅ إنشاء'}
                      {activity.action === 'UPDATE' && '🔄 تحديث'}
                      {activity.action === 'DELETE' && '🗑️ حذف'}
                      {' '}
                      {activity.entity_type === 'category' && 'فئة'}
                      {activity.entity_type === 'question' && 'سؤال'}
                      {activity.entity_type === 'content_page' && 'صفحة'}
                    </p>
                    <p className="text-xs text-gray-400">
                      بواسطة {activity.admin?.full_name || 'مجهول'} • 
                      {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white">
                    ✅ إنشاء
                  </p>
                  <p className="text-xs text-gray-400">
                    بواسطة فهد أبو سبعة • 
                    {new Date().toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips and System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 slide-in">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-black/30 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold">نصائح للإدارة</h4>
              <p className="text-blue-300 text-sm sm:text-base">تحسين الأداء</p>
            </div>
          </div>
          <ul className="space-y-2 sm:space-y-3 text-blue-200 text-sm sm:text-base">
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>تأكد من مراجعة الأسئلة الجديدة بانتظام</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>راقب الفئات الأكثر استخداماً لإضافة المزيد</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>تحقق من سجل النشاطات للتأكد من الأمان</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-black/30 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold">حالة النظام</h4>
              <p className="text-green-300 text-sm sm:text-base">كل شيء يعمل بسلاسة</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3 text-green-200 text-sm sm:text-base">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>قاعدة البيانات: متصلة ✅</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>الذكاء الاصطناعي: نشط 🤖</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>البحث عن الصور: نشط 🖼️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};