import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  Trophy, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader,
  GamepadIcon,
  ArrowLeft,
  Users,
  Star,
  BarChart2
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { sessionService } from '../services/sessionService';

interface GameHistoryItem {
  id: string;
  game_type: string;
  game_id?: string;
  started_at: string;
  ended_at?: string;
  duration?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  score: number;
  xp_earned: number;
  level_reached: number;
  team_name?: string;
  categories?: string[];
}

export const PreviousGamesPage: React.FC = () => {
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingGame, setResumingGame] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadGameHistory();
    }
  }, [user]);

  const loadGameHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's game history
      const { sessions, count } = await sessionService.getSessionHistory(1, 50);
      
      setGameHistory(sessions.map(session => ({
        id: session.id,
        game_type: session.gameType,
        game_id: session.gameId,
        started_at: session.startedAt.toISOString(),
        ended_at: session.endedAt?.toISOString(),
        duration: session.duration ? formatDuration(session.duration) : undefined,
        status: session.status,
        score: session.score,
        xp_earned: session.xpEarned,
        level_reached: session.levelReached,
        team_name: 'فريقي', // Default team name
        categories: ['عام', 'تاريخ', 'جغرافيا'] // Default categories
      })));
    } catch (err) {
      console.error('Error loading game history:', err);
      setError('حدث خطأ أثناء تحميل سجل الألعاب');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (durationString: string): string => {
    // Parse PostgreSQL interval format
    const matches = durationString.match(/(?:(\d+):)?(\d+):(\d+)/);
    if (matches) {
      const [, hours, minutes, seconds] = matches;
      return `${hours ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
    }
    
    return durationString;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">نشطة</span>;
      case 'paused':
        return <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">متوقفة مؤقتاً</span>;
      case 'completed':
        return <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">مكتملة</span>;
      case 'abandoned':
        return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">متروكة</span>;
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const handleResumeGame = async (gameId: string) => {
    try {
      setResumingGame(gameId);
      
      // Here you would implement the logic to resume the game
      // This could involve loading the game state from the database
      // and redirecting to the game page with the appropriate state
      
      // For now, we'll just navigate to the game page
      setTimeout(() => {
        navigate('/game');
      }, 1000);
    } catch (err) {
      console.error('Error resuming game:', err);
      setError('حدث خطأ أثناء استئناف اللعبة');
      setResumingGame(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="max-w-3xl mx-auto bg-black/80 rounded-3xl shadow-xl p-8 border border-gray-800 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">يجب تسجيل الدخول</h2>
            <p className="text-gray-400 mb-6">يرجى تسجيل الدخول لعرض ألعابك السابقة</p>
            <button
              onClick={() => navigate('/auth/login')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-4 py-12 pt-32">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">ألعابي السابقة</h1>
              <p className="text-gray-400">استعرض سجل ألعابك السابقة واستأنف الألعاب غير المكتملة</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>العودة للرئيسية</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                  <GamepadIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">إجمالي الألعاب</div>
                  <div className="text-xl font-bold text-white">{gameHistory.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">ألعاب مكتملة</div>
                  <div className="text-xl font-bold text-white">
                    {gameHistory.filter(game => game.status === 'completed').length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-900 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">ألعاب نشطة</div>
                  <div className="text-xl font-bold text-white">
                    {gameHistory.filter(game => game.status === 'active' || game.status === 'paused').length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">إجمالي النقاط</div>
                  <div className="text-xl font-bold text-white">
                    {gameHistory.reduce((sum, game) => sum + game.score, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game History List */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">جاري تحميل سجل الألعاب...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadGameHistory}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : gameHistory.length === 0 ? (
              <div className="p-12 text-center">
                <GamepadIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد ألعاب سابقة</h3>
                <p className="text-gray-400 mb-6">لم تقم بلعب أي ألعاب بعد</p>
                <button
                  onClick={() => navigate('/game')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-colors"
                >
                  ابدأ لعبة جديدة
                </button>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">اللعبة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">النقاط</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">المدة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {gameHistory.map((game) => (
                        <tr key={game.id} className="hover:bg-gray-900/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <GamepadIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-white">{game.game_type}</div>
                                <div className="text-sm text-gray-400">
                                  {game.team_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {game.team_name}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{formatDate(game.started_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(game.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-white font-bold">{game.score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-400">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{game.duration || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(game.status === 'active' || game.status === 'paused') ? (
                              <button
                                onClick={() => handleResumeGame(game.id)}
                                disabled={resumingGame === game.id}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                              >
                                {resumingGame === game.id ? (
                                  <>
                                    <Loader className="w-3 h-3 animate-spin" />
                                    جاري الاستئناف...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    استئناف
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // View game details
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                              >
                                <BarChart2 className="w-3 h-3" />
                                التفاصيل
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};