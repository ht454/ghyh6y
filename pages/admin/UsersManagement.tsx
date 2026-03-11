import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  RefreshCw,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  FileText,
  Users as UsersIcon,
  UserPlus,
  Loader
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { UserProfile } from '../../types/admin';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type RoleFilter = '' | 'user' | 'admin' | 'super_admin' | 'moderator';
type StatusFilter = '' | 'active' | 'inactive';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [todayUsers, setTodayUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [emailUsers, setEmailUsers] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(
        currentPage,
        itemsPerPage,
        searchTerm,
        roleFilter,
        statusFilter
      );
      
      setUsers(response.data);
      setTotalCount(response.count);
      setTotalUsers(response.count);
      
      // Set sample statistics based on count
      setTodayUsers(Math.floor(response.count * 0.1));
      setEmailUsers(Math.floor(response.count * 0.8));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const exportToPDF = async () => {
    try {
      setExportLoading(true);
      console.log('Exporting users data to PDF...');
      
      // Get all users data
      const usersData = await adminService.exportUsers();
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('تقرير المستخدمين', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // Add user count
      doc.text(`إجمالي المستخدمين: ${usersData.length}`, doc.internal.pageSize.width / 2, 40, { align: 'center' });
      
      // Prepare table data
      const tableColumn = ["الاسم", "البريد الإلكتروني", "رقم الهاتف", "تاريخ التسجيل", "الألعاب", "النقاط"];
      const tableRows = usersData.map(user => [
        user.full_name || 'غير محدد',
        user.email || 'غير محدد',
        user.phone_number || 'غير محدد',
        new Date(user.created_at).toLocaleDateString('ar-SA'),
        user.total_games_played?.toString() || '0',
        user.total_points_earned?.toString() || '0'
      ]);
      
      // Add table
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { halign: 'right', font: 'helvetica' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save PDF
      doc.save('users-report.pdf');
      
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-600">إدارة وعرض بيانات المستخدمين المسجلين في النظام</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">مستخدمون جدد اليوم</p>
              <p className="text-2xl font-bold text-gray-900">{todayUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">مستخدمون بإيميل</p>
              <p className="text-2xl font-bold text-gray-900">{emailUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الإيميل أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الأدوار</option>
                <option value="user">مستخدم</option>
                <option value="admin">مدير</option>
                <option value="super_admin">مدير عام</option>
                <option value="moderator">مشرف</option>
              </select>
            </div>

            {}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>

            {}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                بحث
              </button>
              <button
                onClick={exportToPDF}
                disabled={exportLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    تصدير PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  معلومات الاتصال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">جاري تحميل البيانات...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">لا توجد مستخدمون</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email && (
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.email}
                          </div>
                        )}
                        {user.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {user.phone_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <Shield className="h-3 w-3 ml-1" />
                        {user.role === 'super_admin' ? 'مدير عام' :
                         user.role === 'admin' ? 'مدير' :
                         user.role === 'moderator' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.email_verified ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle edit
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}إلى{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>
                  {' '}من{' '}
                  <span className="font-medium">{totalCount}</span>
                  {' '}نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">تفاصيل المستخدم</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedUser.avatar_url ? (
                  <img className="h-16 w-16 rounded-full" src={selectedUser.avatar_url} alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold">{selectedUser.full_name || selectedUser.username}</h4>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">الإيميل</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.phone_number || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الدور</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.role === 'super_admin' ? 'مدير عام' :
                     selectedUser.role === 'admin' ? 'مدير' :
                     selectedUser.role === 'moderator' ? 'مشرف' : 'مستخدم'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">العملات</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.coins || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ التسجيل</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">آخر تحديث</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.updated_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              {selectedUser.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">النبذة الشخصية</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.bio}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  
                  // Export user details to PDF
                  const doc = new jsPDF();
                  
                  // Add title
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(18);
                  doc.text(`تقرير المستخدم: ${selectedUser.full_name || selectedUser.username}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
                  
                  // Add user details
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(12);
                  doc.text(`البريد الإلكتروني: ${selectedUser.email || 'غير محدد'}`, 20, 40);
                  doc.text(`رقم الهاتف: ${selectedUser.phone_number || 'غير محدد'}`, 20, 50);
                  doc.text(`تاريخ التسجيل: ${new Date(selectedUser.created_at).toLocaleDateString('ar-SA')}`, 20, 60);
                  doc.text(`عدد الألعاب: ${selectedUser.total_games_played || 0}`, 20, 70);
                  doc.text(`إجمالي النقاط: ${selectedUser.total_points_earned || 0}`, 20, 80);
                  
                  // Save PDF
                  doc.save(`user-${selectedUser.id}.pdf`);
                }}
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};