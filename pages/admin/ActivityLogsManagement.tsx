import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  FileText, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ActivityLog } from '../../types/admin';

export const ActivityLogsManagement: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, [currentPage, actionFilter, entityFilter, dateFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getActivityLogs(
        currentPage,
        itemsPerPage,
        actionFilter,
        entityFilter,
        dateFilter
      );
      setLogs(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log: ActivityLog) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const handleExportLogs = async () => {
    try {
      await adminService.exportActivityLogs(actionFilter, entityFilter, dateFilter);
      alert('تم تصدير سجل النشاطات بنجاح!');
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('حدث خطأ في تصدير السجلات.');
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs font-medium">إنشاء</span>;
      case 'UPDATE':
        return <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">تحديث</span>;
      case 'DELETE':
        return <span className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-xs font-medium">حذف</span>;
      case 'LOGIN':
        return <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded-full text-xs font-medium">تسجيل دخول</span>;
      case 'LOGOUT':
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">تسجيل خروج</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">{action}</span>;
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'category':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs">فئة</span>;
      case 'question':
        return <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs">سؤال</span>;
      case 'game_session':
        return <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded-full text-xs">جلسة لعب</span>;
      case 'team':
        return <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded-full text-xs">فريق</span>;
      case 'admin_user':
        return <span className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-xs">مدير</span>;
      case 'user_profile':
        return <span className="bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full text-xs">مستخدم</span>;
      case 'content_page':
        return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full text-xs">صفحة</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs">{entityType}</span>;
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
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.admin?.full_name && log.admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل سجل النشاطات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">سجل النشاطات</h1>
          <p className="text-gray-400 text-sm sm:text-base">تتبع جميع العمليات والتغييرات في النظام</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={loadLogs}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={handleExportLogs}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير السجل</span>
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">إجمالي النشاطات</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{totalCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">عمليات الإنشاء</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {logs.filter(log => log.action === 'CREATE').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">عمليات التحديث</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {logs.filter(log => log.action === 'UPDATE').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-900 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">عمليات الحذف</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {logs.filter(log => log.action === 'DELETE').length}
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
              placeholder="البحث في النشاطات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع العمليات</option>
            <option value="CREATE">إنشاء</option>
            <option value="UPDATE">تحديث</option>
            <option value="DELETE">حذف</option>
            <option value="LOGIN">تسجيل دخول</option>
            <option value="LOGOUT">تسجيل خروج</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع الكيانات</option>
            <option value="category">فئات</option>
            <option value="question">أسئلة</option>
            <option value="game_session">جلسات لعب</option>
            <option value="team">فرق</option>
            <option value="admin_user">مديرين</option>
            <option value="user_profile">مستخدمين</option>
            <option value="content_page">صفحات</option>
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

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">العملية</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الكيان</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">المستخدم</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">التاريخ</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">عنوان IP</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900">
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="flex items-center gap-2">
                      {getEntityBadge(log.entity_type)}
                      <span className="text-xs text-gray-500 font-mono hidden sm:inline">{log.entity_id?.substring(0, 8) || '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {log.admin?.full_name || 'غير معروف'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">{formatDate(log.created_at)}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-400 font-mono">{log.ip_address || '-'}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <button
                      onClick={() => handleViewLog(log)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalCount)} من {totalCount} نشاط
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
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                تفاصيل النشاط
              </h2>
              <button
                onClick={() => setShowLogDetails(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  معلومات النشاط
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">العملية:</span>
                    <span>{getActionBadge(selectedLog.action)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">الكيان:</span>
                    <span>{getEntityBadge(selectedLog.entity_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">معرف الكيان:</span>
                    <span className="font-mono text-gray-300 text-xs sm:text-sm">{selectedLog.entity_id || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">التاريخ:</span>
                    <span className="text-gray-300 text-xs sm:text-sm">{formatDate(selectedLog.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  معلومات المستخدم
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">المستخدم:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedLog.admin?.full_name || 'غير معروف'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">البريد الإلكتروني:</span>
                    <span className="font-medium text-gray-300 text-sm">{selectedLog.admin?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">عنوان IP:</span>
                    <span className="font-mono text-gray-300 text-xs sm:text-sm">{selectedLog.ip_address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">متصفح المستخدم:</span>
                    <span className="text-xs truncate text-gray-300">{selectedLog.user_agent || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {selectedLog.old_data && (
                <div className="bg-red-900/30 rounded-xl p-4 sm:p-5 md:p-6 border border-red-900/50">
                  <h3 className="text-base sm:text-lg font-bold text-red-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    البيانات القديمة
                  </h3>
                  <pre className="bg-black p-3 sm:p-4 rounded-lg text-xs overflow-auto max-h-40 sm:max-h-60 text-gray-300 font-mono">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div className="bg-green-900/30 rounded-xl p-4 sm:p-5 md:p-6 border border-green-900/50">
                  <h3 className="text-base sm:text-lg font-bold text-green-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    البيانات الجديدة
                  </h3>
                  <pre className="bg-black p-3 sm:p-4 rounded-lg text-xs overflow-auto max-h-40 sm:max-h-60 text-gray-300 font-mono">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {}
            <div className="flex justify-end pt-3 sm:pt-4 border-t border-gray-800">
              <button
                onClick={() => setShowLogDetails(false)}
                className="bg-gray-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
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