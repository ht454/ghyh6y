import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  BarChart2, 
  Award, 
  Play, 
  Pause, 
  CheckCircle, 
  X, 
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Eye,
  Loader
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface UserGamingSession {
  id: string;
  user_id: string;
  game_type: string;
  game_id: string;
  started_at: string;
  ended_at: string;
  duration: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  score: number;
  xp_earned: number;
  level_reached: number;
  device_info: any;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_full_name?: string;
}

interface SessionActivity {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  points_earned: number;
  timestamp: string;
}

export const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<UserGamingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<UserGamingSession | null>(null);
  const [sessionActivities, setSessionActivities] = useState<SessionActivity[]>([]);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadSessions();
  }, [currentPage, statusFilter, gameTypeFilter, dateFilter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserGamingSessions(
        currentPage,
        itemsPerPage,
        statusFilter,
        gameTypeFilter,
        dateFilter
      );
      
      setSessions(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error loading gaming sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSessions();
  };

  const handleViewSession = async (session: UserGamingSession) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
    
    try {
      setLoadingActivities(true);
      const activities = await adminService.getSessionActivities(session.id);
      setSessionActivities(activities);
    } catch (error) {
      console.error('Error loading session activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleExportSessionData = async (sessionId: string) => {
    try {
      setExportLoading(true);
      
      // Get session details
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      // Get session activities
      const activities = await adminService.getSessionActivities(sessionId);
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Gaming Session Report', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add session info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Session ID: ${session.id}`, 20, 40);
      doc.text(`User: ${session.user_full_name || session.user_email || session.user_id}`, 20, 50);
      doc.text(`Game Type: ${session.game_type}`, 20, 60);
      doc.text(`Status: ${session.status}`, 20, 70);
      doc.text(`Started: ${new Date(session.started_at).toLocaleString()}`, 20, 80);
      
      if (session.ended_at) {
        doc.text(`Ended: ${new Date(session.ended_at).toLocaleString()}`, 20, 90);
        doc.text(`Duration: ${session.duration}`, 20, 100);
      }
      
      doc.text(`Score: ${session.score}`, 20, 110);
      doc.text(`XP Earned: ${session.xp_earned}`, 20, 120);
      doc.text(`Level Reached: ${session.level_reached}`, 20, 130);
      
      // Add activities table
      if (activities.length > 0) {
        doc.text('Session Activities', 20, 150);
        
        const tableColumn = ["Time", "Activity Type", "Points"];
        const tableRows = activities.map(activity => [
          new Date(activity.timestamp).toLocaleTimeString(),
          activity.activity_type,
          activity.points_earned.toString()
        ]);
        
        (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 160,
          styles: { halign: 'center' },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }
      
      // Save PDF
      doc.save(`session-${sessionId}.pdf`);
    } catch (error) {
      console.error('Error exporting session data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportAllSessions = async () => {
    try {
      setExportLoading(true);
      
      // Get all sessions
      const allSessions = await adminService.getAllUserGamingSessions();
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('All Gaming Sessions Report', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // Add sessions table
      const tableColumn = ["User", "Game Type", "Status", "Started", "Duration", "Score"];
      const tableRows = allSessions.map(session => [
        session.user_full_name || session.user_email || session.user_id,
        session.game_type,
        session.status,
        new Date(session.started_at).toLocaleString(),
        session.duration || '-',
        session.score.toString()
      ]);
      
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save PDF
      doc.save('all-gaming-sessions.pdf');
    } catch (error) {
      console.error('Error exporting all sessions:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const formatDuration = (durationString: string): string => {
    if (!durationString) return '-';
    
    // Parse PostgreSQL interval format
    const matches = durationString.match(/(?:(\d+):)?(\d+):(\d+)/);
    if (matches) {
      const [, hours, minutes, seconds] = matches;
      return `${hours ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
    }
    
    return durationString;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs font-medium">نشطة</span>;
      case 'paused':
        return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">متوقفة مؤقتاً</span>;
      case 'completed':
        return <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">مكتملة</span>;
      case 'abandoned':
        return <span className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-xs font-medium">متروكة</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">جلسات اللعب</h1>
          <p className="text-gray-400 text-sm sm:text-base">إدارة ومراقبة جلسات اللعب للمستخدمين</p>
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
            onClick={handleExportAllSessions}
            disabled={exportLoading}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {exportLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">تصدير الكل</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
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
              <div className="text-xs sm:text-sm text-gray-400">إجمالي المستخدمين</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {new Set(sessions.map(s => s.user_id)).size}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">متوسط النقاط</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {sessions.length > 0 
                  ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) 
                  : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
            <option value="active">نشطة</option>
            <option value="paused">متوقفة مؤقتاً</option>
            <option value="completed">مكتملة</option>
            <option value="abandoned">متروكة</option>
          </select>

          <select
            value={gameTypeFilter}
            onChange={(e) => {
              setGameTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع أنواع الألعاب</option>
            <option value="quiz">اختبارات</option>
            <option value="trivia">ألغاز</option>
            <option value="memory">ألعاب الذاكرة</option>
            <option value="puzzle">ألعاب التفكير</option>
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
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">المستخدم</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">نوع اللعبة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">النقاط</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">تاريخ البدء</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden lg:table-cell">المدة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-4 md:px-6 py-8 text-center text-gray-400">
                    لا توجد جلسات لعب متطابقة مع معايير البحث
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-900">
                    <td className="px-3 sm:px-4 md:px-6 py-3">
                      <div className="font-medium text-white text-sm">
                        {session.user_full_name || session.user_email || 'مستخدم غير معروف'}
                      </div>
                      <div className="text-xs text-gray-400">{session.user_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3">
                      <div className="text-sm text-gray-300">{session.game_type}</div>
                      {session.game_id && (
                        <div className="text-xs text-gray-500">{session.game_id}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3">
                      <div className="text-sm font-medium text-white">{session.score}</div>
                      <div className="text-xs text-gray-400">XP: {session.xp_earned}</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-400">
                        {new Date(session.started_at).toLocaleDateString('ar-SA')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(session.started_at).toLocaleTimeString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-400">
                        {formatDuration(session.duration)}
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
                          disabled={exportLoading}
                        >
                          {exportLoading ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                تفاصيل الجلسة
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
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  معلومات الجلسة
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">المستخدم:</span>
                    <span className="font-medium text-gray-300 text-sm">
                      {selectedSession.user_full_name || selectedSession.user_email || selectedSession.user_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">نوع اللعبة:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.game_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الحالة:</span>
                    <span>{getStatusBadge(selectedSession.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">تاريخ البدء:</span>
                    <span className="font-medium text-gray-300 text-sm">
                      {new Date(selectedSession.started_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  {selectedSession.ended_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">تاريخ الانتهاء:</span>
                      <span className="font-medium text-gray-300 text-sm">
                        {new Date(selectedSession.ended_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  )}
                  {selectedSession.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">المدة:</span>
                      <span className="font-medium text-gray-300 text-sm">
                        {formatDuration(selectedSession.duration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  إحصائيات الجلسة
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">النقاط:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">XP المكتسبة:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.xp_earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">المستوى:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedSession.level_reached}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الأنشطة:</span>
                    <span className="font-medium text-gray-300 text-sm">{sessionActivities.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Activities */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                أنشطة الجلسة
              </h3>
              
              {loadingActivities ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">جاري تحميل الأنشطة...</p>
                </div>
              ) : sessionActivities.length === 0 ? (
                <div className="bg-gray-900 rounded-xl p-6 text-center">
                  <p className="text-gray-400">لا توجد أنشطة مسجلة لهذه الجلسة</p>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-400">الوقت</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-400">نوع النشاط</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-400">النقاط</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-400">البيانات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {sessionActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-800">
                          <td className="px-3 sm:px-4 py-2 text-xs text-gray-300">
                            {new Date(activity.timestamp).toLocaleTimeString('ar-SA')}
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs">
                              {activity.activity_type}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-xs">
                            {activity.points_earned > 0 ? (
                              <span className="text-green-400">+{activity.points_earned}</span>
                            ) : activity.points_earned < 0 ? (
                              <span className="text-red-400">{activity.points_earned}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-xs text-gray-400">
                            <div className="max-w-xs truncate">
                              {JSON.stringify(activity.activity_data)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Device Info */}
            {selectedSession.device_info && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  معلومات الجهاز
                </h3>
                <div className="bg-gray-900 rounded-xl p-4">
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                    {JSON.stringify(selectedSession.device_info, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleExportSessionData(selectedSession.id)}
                disabled={exportLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                تصدير التقرير
              </button>
              <button
                onClick={() => setShowSessionDetails(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};