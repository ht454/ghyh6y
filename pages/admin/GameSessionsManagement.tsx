import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye,
  Download, 
  Calendar, 
  Clock, 
  Users, 
  HelpCircle, 
  Trophy, 
  Gamepad2, 
  Play, 
  Pause, 
  CheckCircle, 
  X, 
  BarChart3,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { GameSession, Team } from '../../types/admin';

export const GameSessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadSessions();
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentPage, statusFilter, dateFilter]);

  // Set up real-time updates
  useEffect(() => {
    if (realTimeEnabled && !subscription) {
      const sub = supabase
        .channel('game_sessions_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_sessions'
        }, (payload) => {
          console.log('Real-time update received:', payload);
          loadSessions();
        })
        .subscribe();
        
      setSubscription(sub);
    } else if (!realTimeEnabled && subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
  }, [realTimeEnabled]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, count } = await adminService.getGameSessions(
        currentPage,
        itemsPerPage,
        statusFilter,
        dateFilter
      );
      setSessions(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading game sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (session: GameSession) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const handleExportSessionData = async (sessionId: string) => {
    try {
      await adminService.exportSessionData(sessionId);
      alert('تم تصدير بيانات الجلسة بنجاح!');
    } catch (error) {
      console.error('Error exporting session data:', error);
      alert('حدث خطأ في تصدير البيانات.');
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: 'active' | 'paused' | 'completed') => {
    try {
      await adminService.updateGameSession(sessionId, { status: newStatus });
      loadSessions();
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession({
          ...selectedSession,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('حدث خطأ في تحديث حالة الجلسة.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">في الانتظار</span>;
      case 'active':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs font-medium">نشطة</span>;
      case 'paused':
        return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">متوقفة مؤقتاً</span>;
      case 'completed':
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">مكتملة</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate) return 'غير محدد';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} ساعة ${remainingMinutes} دقيقة`;
    }
  };

  const getWinningTeam = (teams: Team[]) => {
    if (!teams || teams.length === 0) return null;
    return teams.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  };

  const filteredSessions = sessions.filter(session => 
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.host_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل جلسات اللعب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">جلسات اللعب</h1>
          <p className="text-gray-400 text-sm sm:text-base">إدارة ومراقبة جلسات اللعب النشطة والسابقة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={loadSessions}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`${
              realTimeEnabled ? 'bg-green-600' : 'bg-gray-600'
            } text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">{realTimeEnabled ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}</span>
          </button>
          <button
            onClick={() => {
              adminService.exportAllSessionsData();
              alert('جاري تصدير جميع البيانات...');
            }}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير الكل</span>
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">إجمالي الجلسات</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{totalCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">الجلسات النشطة</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'active').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">إجمالي الفرق</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {sessions.reduce((total, session) => total + (session.teams?.length || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">إجمالي الأسئلة</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {sessions.reduce((total, session) => total + (session.questions_asked || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث في الجلسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع الحالات</option>
            <option value="waiting">في الانتظار</option>
            <option value="active">نشطة</option>
            <option value="paused">متوقفة مؤقتاً</option>
            <option value="completed">مكتملة</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع الأوقات</option>
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
          </select>

          <button className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>فلترة متقدمة</span>
          </button>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">اسم الجلسة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">المضيف</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الفرق</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الأسئلة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">تاريخ البدء</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden lg:table-cell">المدة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-900">
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="font-medium text-white text-sm">{session.session_name}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {session.host_name || 'غير محدد'}
                      {session.created_by && <span className="text-xs text-blue-400 mr-1">(مسجل)</span>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">{session.teams?.length || 0} فريق</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {session.questions_asked || 0} / {session.total_questions || 0}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-400">{formatDate(session.started_at || session.created_at)}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 hidden lg:table-cell">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {calculateDuration(session.started_at || session.created_at, session.ended_at)}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleViewSession(session)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportSessionData(session.id)}
                        className="text-green-400 hover:text-green-300 p-1"
                        title="تصدير البيانات"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {session.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(session.id, 'paused')}
                          className="text-yellow-400 hover:text-yellow-300 p-1"
                          title="إيقاف مؤقت"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {session.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(session.id, 'active')}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="استئناف"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {(session.status === 'active' || session.status === 'paused') && (
                        <button
                          onClick={() => handleStatusChange(session.id, 'completed')}
                          className="text-gray-400 hover:text-gray-300 p-1"
                          title="إنهاء"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        {totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-400">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalCount)} من {totalCount} جلسة
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                السابق
              </button>
              <span className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                تفاصيل الجلسة: {selectedSession.session_name}
              </h2>
              <button
                onClick={() => setShowSessionDetails(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  معلومات الجلسة
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">المضيف:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.host_name || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الحالة:</span>
                    <span>{getStatusBadge(selectedSession.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">تاريخ البدء:</span>
                    <span className="font-medium text-gray-300 text-sm">{formatDate(selectedSession.started_at || selectedSession.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">تاريخ الانتهاء:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.ended_at ? formatDate(selectedSession.ended_at) : 'لم ينته بعد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">المدة:</span>
                    <span className="font-medium text-gray-300 text-sm">{calculateDuration(selectedSession.started_at || selectedSession.created_at, selectedSession.ended_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الأسئلة:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.questions_asked || 0} / {selectedSession.total_questions || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  إحصائيات الجلسة
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">عدد الفرق:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.teams?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الفريق الفائز:</span>
                    <span className="font-medium text-gray-300 text-sm">
                      {selectedSession.teams && selectedSession.teams.length > 0 
                        ? getWinningTeam(selectedSession.teams)?.name || 'غير محدد'
                        : 'لا يوجد فرق'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">أعلى نتيجة:</span>
                    <span className="font-medium text-gray-300 text-sm">
                      {selectedSession.teams && selectedSession.teams.length > 0 
                        ? getWinningTeam(selectedSession.teams)?.score || 0
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الفئات المختارة:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.selected_categories?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">تاريخ الإنشاء:</span>
                    <span className="font-medium text-gray-300 text-sm">{formatDate(selectedSession.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            {selectedSession.teams && selectedSession.teams.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  الفرق المشاركة
                </h3>
                <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-400">اسم الفريق</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-400">النقاط</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-400">عدد الأعضاء</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {selectedSession.teams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-900">
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" 
                                style={{ backgroundColor: team.color || '#ccc' }}
                              ></div>
                              <span className="font-medium text-white text-xs sm:text-sm">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className="font-bold text-blue-400 text-xs sm:text-sm">{team.score}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className="text-gray-300 text-xs sm:text-sm">{team.members_count || 1}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            {team.is_active ? (
                              <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs">نشط</span>
                            ) : (
                              <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs">غير نشط</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                {selectedSession.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(selectedSession.id, 'paused')}
                    className="bg-yellow-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2 text-sm"
                  >
                    <Pause className="w-4 h-4" />
                    <span className="hidden sm:inline">إيقاف مؤقت</span>
                  </button>
                )}
                {selectedSession.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange(selectedSession.id, 'active')}
                    className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">استئناف</span>
                  </button>
                )}
                {(selectedSession.status === 'active' || selectedSession.status === 'paused') && (
                  <button
                    onClick={() => handleStatusChange(selectedSession.id, 'completed')}
                    className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">إنهاء الجلسة</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleExportSessionData(selectedSession.id)}
                  className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">تصدير البيانات</span>
                </button>
                <button
                  onClick={() => {
                    // Generate PDF report for this session
                    const doc = new jsPDF();
                    
                    // Add title
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(18);
                    doc.text(`تقرير جلسة اللعب: ${selectedSession.session_name}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
                    
                    // Add session details
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(12);
                    doc.text(`المضيف: ${selectedSession.host_name || 'غير محدد'}`, 20, 40);
                    doc.text(`الحالة: ${selectedSession.status}`, 20, 50);
                    doc.text(`تاريخ البدء: ${formatDate(selectedSession.started_at || selectedSession.created_at)}`, 20, 60);
                    doc.text(`تاريخ الانتهاء: ${selectedSession.ended_at ? formatDate(selectedSession.ended_at) : 'لم ينته بعد'}`, 20, 70);
                    doc.text(`الأسئلة: ${selectedSession.questions_asked || 0} / ${selectedSession.total_questions || 0}`, 20, 80);
                    
                    // Add teams table
                    if (selectedSession.teams && selectedSession.teams.length > 0) {
                      const tableColumn = ["اسم الفريق", "النقاط", "عدد الأعضاء", "الحالة"];
                      const tableRows = selectedSession.teams.map(team => [
                        team.name,
                        team.score.toString(),
                        team.members_count?.toString() || '1',
                        team.is_active ? 'نشط' : 'غير نشط'
                      ]);
                      
                      // Add table
                      (doc as any).autoTable({
                        head: [tableColumn],
                        body: tableRows,
                        startY: 100,
                        styles: { halign: 'right', font: 'helvetica' },
                        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                        alternateRowStyles: { fillColor: [245, 245, 245] }
                      });
                    }
                    
                    // Save PDF
                    doc.save(`game-session-${selectedSession.id}.pdf`);
                  }}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">تقرير PDF</span>
                </button>
                <button
                  onClick={() => setShowSessionDetails(false)}
                  className="bg-gray-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};