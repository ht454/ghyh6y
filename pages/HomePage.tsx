import React, { useState, useEffect } from 'react';
import { CategoryCard } from '../components/CategoryCard';
import { Team } from '../types/game';
import { gameService } from '../services/gameService';
import { Search, Minus, Plus, RefreshCw, ArrowLeft, Star, Trophy, Users, Gamepad2, Play, Zap, Target, Brain, Sparkles, Crown, Shield, Swords, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useAuth } from '../contexts/AuthContext';
import { OrientationManager } from '../components/OrientationManager';

interface HomePageProps {
  onStartGame: (teams: Team[], totalQuestions: number, selectedCategories: string[], gameName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {
  const [gameMode, setGameMode] = useState<'category-selection' | 'team-setup'>('category-selection');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [gameName, setGameName] = useState('');
  const [teams, setTeams] = useState([
    { 
      id: 'team-1', 
      name: 'الفريق الأول', 
      score: 0, 
      color: 'bg-red-500',
      helperTools: {
        callFriend: true,
        twoAnswers: true,
        steal: true
      }
    },
    { 
      id: 'team-2', 
      name: 'الفريق الثاني', 
      score: 0, 
      color: 'bg-blue-500',
      helperTools: {
        callFriend: true,
        twoAnswers: true,
        steal: true
      }
    }
  ]);
  const [teamCounts, setTeamCounts] = useState([1, 1]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { connectionStatus, retryConnection } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🎮 تحميل الفئات من قاعدة البيانات...');
      
      const categoriesData = await gameService.getCategories();
      
      if (categoriesData.length === 0) {
        setError('لا توجد فئات متاحة. يرجى إضافة فئات من لوحة التحكم الإدارية.');
      } else {
        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          color: cat.color, // 🔥 تضمين اللون من قاعدة البيانات
          illustration: cat.illustration
        })));
        console.log(`✅ تم تحميل ${categoriesData.length} فئة مع الألوان`);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل الفئات:', error);
      setError('خطأ في تحميل الفئات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    console.log('🎯 تبديل اختيار الفئة:', categoryId);
    
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    } else if (selectedCategories.length < 6) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setError('لا يمكن اختيار أكثر من 6 فئات');
      return;
    }
    
    // Clear any existing errors when user makes a valid selection
    if (error) {
      setError('');
    }
  };

  const handleStartGame = () => {
    if (gameMode === 'category-selection') {
      // Check minimum category requirement
      if (selectedCategories.length === 0) {
        setError('يرجى اختيار فئة واحدة على الأقل');
        return;
      }
      
      console.log('➡️ الانتقال لإعداد الفرق مع الفئات:', selectedCategories);
      setGameMode('team-setup');
      setError('');
    } else {
      if (!gameName.trim()) {
        setError('لا تنسى تضيف اسم الجولة');
        return;
      }
      if (teams.some(team => !team.name.trim())) {
        setError('يرجى إدخال أسماء جميع الفرق');
        return;
      }
      console.log('🚀 بدء اللعبة مع:', { teams, selectedCategories, gameName });
     console.log('Categories being passed:', selectedCategories);
     onStartGame(teams, 0, selectedCategories, gameName);
    }
  };

  const updateTeamName = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index].name = name;
    setTeams(newTeams);
    
    
    if (error && error.includes('أسماء جميع الفرق')) {
      setError('');
    }
  };

  const updateTeamCount = (index: number, change: number) => {
    const newCounts = [...teamCounts];
    newCounts[index] = Math.max(1, newCounts[index] + change);
    setTeamCounts(newCounts);
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleBackToCategories = () => {
    setGameMode('category-selection');
    setError('');
  };

  
  if (gameMode === 'category-selection') {
    return (
      <OrientationManager forceOrientation="both">
        <div className="min-h-screen bg-black relative overflow-y-auto">
        {/* Subtle background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-gray-800/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-40 sm:w-80 h-40 sm:h-80 bg-gray-800/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[600px] h-80 sm:h-[600px] bg-gray-800/10 rounded-full blur-3xl"></div>
        </div>

        {}
        <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl">
            
            {}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4">
              <div className="flex items-center gap-3 sm:gap-6">
 
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl hidden border-2 border-white/50">
                  <Search className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>

                </div>
              </div>

              {}
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="">
                </div>
                <div className="">
                </div>
                <div className="">
                </div>
              </div>
            </div>

            {}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-black backdrop-blur-sm text-white px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 mb-6 sm:mb-8">
                <Gamepad2 className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="font-bold text-sm sm:text-lg">اختر فئات اللعبة</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
                ابدأ 
                <span className="block text-white/90">
                ورنا شغلك
                </span>
              </h2>
              
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                اختار الفئات , كل فريق يختار 3 فئات فنان فيها 
              </p>
            </div>
            <img 
                  src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754344717242-ea62zdgegpk.png" 
                  alt="شير لوك" 
                  className="w-12 h-12 sm:w-40 sm:h-40 "
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
            {}
            {connectionStatus === 'disconnected' && (
              <div className="mb-8 sm:mb-12">
                <ConnectionStatus 
                  status={connectionStatus} 
                  onRetry={retryConnection}
                  className="max-w-md mx-auto"
                />
              </div>
            )}

            {}
            {error && (
              <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl sm:rounded-2xl text-red-100 text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-lg">{error}</span>
                </div>
              </div>
            )}

            {}
            {loading ? (
              <div className="text-center py-24 sm:py-32">
                <div className="inline-flex items-center gap-3 sm:gap-4 bg-black/30 backdrop-blur-sm px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl border border-white/30">
                  <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
                  <span className="text-white font-bold text-lg sm:text-2xl">جاري تحميل الفئات...</span>
                </div>
              </div>
            ) : (
              <>
                {}
                {/* All Categories */}
                <div className="space-y-8 mb-12 sm:mb-16 max-w-7xl mx-auto">
                  
                  {/* All Categories */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
                      جميع الفئات
                    </h3>
                    <div className="w-32 h-2 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 rounded-full mx-auto mb-6"></div>
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2 md:gap-4 lg:gap-6"
                         style={{
                           // Dynamic grid layout based on screen dimensions
                           ...(window.innerWidth <= 667 && window.innerHeight <= 375 ? { 
                             gridTemplateColumns: 'repeat(3, 1fr)',
                             gridTemplateRows: 'repeat(2, 1fr)',
                             gap: '4px'
                           } : {}),
                           ...(window.innerWidth <= 375 && window.innerHeight <= 667 ? { 
                             gridTemplateColumns: 'repeat(3, 1fr)',
                             gridTemplateRows: 'repeat(2, 1fr)',
                             gap: '4px'
                           } : {})
                         }}>
                      {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedCategories.includes(category.id) ? 'scale-105' : ''
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                        >
                          <div 
                            className={`relative w-full rounded-md sm:rounded-lg md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-md sm:shadow-lg md:shadow-2xl border-0.5 sm:border-1 md:border-2 lg:border-4 transition-all duration-300 ${
                              selectedCategories.includes(category.id) 
                                ? 'border-orange-500 shadow-orange-500/50' 
                                : 'border-gray-800 hover:border-gray-600'
                            }`}
                            style={{ 
                              aspectRatio: '2/3', 
                              height: '120px sm:h-150px md:h-200px lg:h-250px xl:h-300px 2xl:h-350px',
                              // Dynamic sizing based on screen dimensions
                              ...(window.innerWidth <= 667 && window.innerHeight <= 375 ? { height: '120px' } : {}),
                              ...(window.innerWidth <= 375 && window.innerHeight <= 667 ? { height: '140px' } : {})
                            }}
                          >
                            {/* Background Image */}
                            <img 
                              src={category.illustration}
                              alt=""
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                              style={{
                                objectPosition: 'center',
                                backgroundColor: 'rgba(0,0,0,0.1)'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400&h=600';
                              }}
                            />
                            
                            {/* Selection Indicator */}
                            {selectedCategories.includes(category.id) && (
                              <div className="absolute top-0.5 sm:top-1 md:top-3 right-0.5 sm:right-1 md:right-3">
                                <div className="bg-orange-500 text-white rounded-full p-0.5 sm:p-1 md:p-2 shadow-md sm:shadow-lg">
                                  <CheckCircle className="w-1 h-1 sm:w-2 sm:h-2 md:w-4 md:h-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entertainment Categories */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
                      الفئات الترفيهية
                    </h3>
                    <div className="w-32 h-2 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-600 rounded-full mx-auto mb-6"></div>
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2 md:gap-4 lg:gap-6"
                         style={{
                           // Dynamic grid layout based on screen dimensions
                           ...(window.innerWidth <= 667 && window.innerHeight <= 375 ? { 
                             gridTemplateColumns: 'repeat(3, 1fr)',
                             gridTemplateRows: 'repeat(2, 1fr)',
                             gap: '4px'
                           } : {}),
                           ...(window.innerWidth <= 375 && window.innerHeight <= 667 ? { 
                             gridTemplateColumns: 'repeat(3, 1fr)',
                             gridTemplateRows: 'repeat(2, 1fr)',
                             gap: '4px'
                           } : {})
                         }}>

                    </div>
                  </div>
                </div>

                {}
                {selectedCategories.length > 0 && (
                  <div className="mb-8 sm:mb-12 text-center">
                    <div className="inline-flex items-center gap-2 sm:gap-3 bg-orange-500/20 backdrop-blur-sm text-orange-100 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl border border-orange-500/30 mb-2">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="font-bold text-sm sm:text-lg">
                        تم اختيار {selectedCategories.length} من 6 فئات
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      الحد الأدنى: فئة واحدة • الحد الأقصى: 6 فئات
                    </p>
                  </div>
                )}

                {}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <button
                    onClick={handleBackToLanding}
                    className="flex items-center gap-2 sm:gap-4 bg-black backdrop-blur-sm text-white px-6 sm:px-10 py-3 sm:py-5 rounded-full border border-white/30 hover:bg-black/80 hover:text-white transition-all duration-300 font-bold text-sm sm:text-lg"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                    العودة للرئيسية
                  </button>
                  
                  <button
                    onClick={handleStartGame}
                    className="flex items-center gap-2 sm:gap-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 sm:px-16 py-3 sm:py-5 rounded-full font-bold text-lg sm:text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 border-2 border-orange-400/30"
                  >
                    <Play className="w-5 h-5 sm:w-7 sm:h-7" />
                    التالي: إعداد الفرق
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </OrientationManager>
    );
  }

  
  return (
    <OrientationManager forceOrientation="both">
      <div className="min-h-screen bg-black relative overflow-y-auto">
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-32 h-16 sm:h-32 bg-gray-800/30 rounded-full blur-xl"></div>
        <div className="absolute top-20 sm:top-40 right-16 sm:right-32 w-12 sm:w-24 h-12 sm:h-24 bg-gray-800/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-16 sm:bottom-32 left-1/3 w-20 sm:w-40 h-20 sm:h-40 bg-gray-800/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-14 sm:w-28 h-14 sm:h-28 bg-gray-800/30 rounded-full blur-xl"></div>
        
        {/* Subtle pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="container mx-auto max-w-4xl">
          {}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-black backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/30 mb-4 sm:mb-6">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-sm sm:text-base">ضبط فريقك !</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 text-center">
             جهز فريقك للطحن
            </h2>
            
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto text-center">
              اكتب اسامي الفرق و خلنا نبدا
            </p>
          </div>

          {}
          <div className="mb-6 sm:mb-8">
            <label className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg text-center">
            اسم الجولة
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => {
                setGameName(e.target.value);
                if (error && error.includes('اسم الجولة')) {
                  setError('');
                }
              }}
              placeholder="اكنب اسم الجولة ..."
              className="w-full bg-black border border-white/30 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder-white/60 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-base sm:text-lg text-center"
            />
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {teams.map((team, index) => (
              <div key={team.id} className="bg-black border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${team.color}`}></div>
                  <h3 className="text-white font-bold text-base sm:text-lg text-center">الفريق {index + 1}</h3>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base text-center">
                      اسم الفريق
                    </label>
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeamName(index, e.target.value)}
                      placeholder={`الفريق ${index + 1}`}
                      className="w-full bg-black/50 border border-white/30 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-white/60 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 text-center text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base text-center">
                      عدد الاشخاص
                    </label>
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => updateTeamCount(index, -1)}
                        className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600 border border-white/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                      >
                        <Minus className="w-3 h-3 sm:w-5 sm:h-5" />
                      </button>
                      <span className="text-white font-bold text-lg sm:text-xl min-w-[3rem] text-center">
                        {teamCounts[index]}
                      </span>
                      <button
                        onClick={() => updateTeamCount(index, 1)}
                        className="w-8 h-8 sm:w-12 sm:h-12 bg-green-600 border border-white/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-white hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {}
          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg sm:rounded-xl text-red-100 text-center">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base text-center">{error}</span>
              </div>
            </div>
          )}

          {}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-2 sm:gap-3 bg-black backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/30 hover:bg-black/80 hover:text-white transition-all duration-300 font-bold text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              العودة للفئات
            </button>
            
            <button
              onClick={handleStartGame}
              className="flex items-center gap-2 sm:gap-3 bg-black text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-white/50"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              ابدا الجولة 
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {}
      <div className="fixed bottom-4 right-4 z-50">
        <ConnectionStatus 
          status={connectionStatus} 
          onRetry={retryConnection}
          className="shadow-lg"
        />
      </div>
    </div>
    </OrientationManager>
  );
};