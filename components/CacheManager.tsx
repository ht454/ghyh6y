import React, { useState, useEffect } from 'react';
import { useCache } from '../contexts/CacheContext';
import { Database, RefreshCw, Wifi, WifiOff, Shield, Trash2, Clock, HardDrive, Download, Upload } from 'lucide-react';

interface CacheManagerProps {
  showDetails?: boolean;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ showDetails = false }) => {
  const {
    isCacheSupported,
    isPrivateMode,
    isOffline,
    cacheSize,
    serviceWorkerRegistered,
    updateAvailable,
    clearAllCache,
    clearAuthCache,
    applyServiceWorkerUpdate,
    registerServiceWorker
  } = useCache();

  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(showDetails);

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate total cache size
  const totalCacheSize = cacheSize.local + cacheSize.session + cacheSize.memory;

  return (
    <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">مدير التخزين المؤقت</h3>
            <p className="text-sm text-gray-400">إدارة البيانات المخزنة مؤقتاً</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* Status Summary */}
      <div className="p-4 bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : (
              <Wifi className="w-4 h-4 text-green-400" />
            )}
            <span className="text-sm text-gray-300">
              {isOffline ? 'غير متصل بالإنترنت' : 'متصل بالإنترنت'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {formatBytes(totalCacheSize)} مخزنة
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${Math.min(100, (totalCacheSize / (5 * 1024 * 1024)) * 100)}%` }}
          ></div>
        </div>

        {/* Service worker status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">
              {serviceWorkerRegistered ? 'وضع التصفح المتقدم نشط' : 'وضع التصفح العادي'}
            </span>
          </div>
          {updateAvailable && (
            <button
              onClick={() => applyServiceWorkerUpdate()}
              className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              تحديث
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-gray-800">
          {/* Cache Support */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white mb-2">دعم التخزين المؤقت</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900 p-2 rounded flex items-center justify-between">
                <span className="text-xs text-gray-400">التخزين المحلي</span>
                <span className={`text-xs ${isCacheSupported.localStorage ? 'text-green-400' : 'text-red-400'}`}>
                  {isCacheSupported.localStorage ? 'مدعوم' : 'غير مدعوم'}
                </span>
              </div>
              <div className="bg-gray-900 p-2 rounded flex items-center justify-between">
                <span className="text-xs text-gray-400">تخزين الجلسة</span>
                <span className={`text-xs ${isCacheSupported.sessionStorage ? 'text-green-400' : 'text-red-400'}`}>
                  {isCacheSupported.sessionStorage ? 'مدعوم' : 'غير مدعوم'}
                </span>
              </div>
              <div className="bg-gray-900 p-2 rounded flex items-center justify-between">
                <span className="text-xs text-gray-400">Service Worker</span>
                <span className={`text-xs ${isCacheSupported.serviceWorker ? 'text-green-400' : 'text-red-400'}`}>
                  {isCacheSupported.serviceWorker ? 'مدعوم' : 'غير مدعوم'}
                </span>
              </div>
              <div className="bg-gray-900 p-2 rounded flex items-center justify-between">
                <span className="text-xs text-gray-400">وضع التصفح الخاص</span>
                <span className={`text-xs ${isPrivateMode ? 'text-yellow-400' : 'text-green-400'}`}>
                  {isPrivateMode ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Size */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white mb-2">حجم التخزين المؤقت</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">التخزين المحلي</div>
                <div className="text-sm text-white">{formatBytes(cacheSize.local)}</div>
              </div>
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">تخزين الجلسة</div>
                <div className="text-sm text-white">{formatBytes(cacheSize.session)}</div>
              </div>
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">الذاكرة</div>
                <div className="text-sm text-white">{formatBytes(cacheSize.memory)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2">الإجراءات</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-red-900 hover:bg-red-800 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                مسح جميع البيانات المخزنة
              </button>
              <button
                onClick={clearAuthCache}
                className="bg-yellow-900 hover:bg-yellow-800 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                مسح بيانات تسجيل الدخول
              </button>
              {!serviceWorkerRegistered && isCacheSupported.serviceWorker && (
                <button
                  onClick={registerServiceWorker}
                  className="bg-purple-900 hover:bg-purple-800 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  تفعيل وضع التصفح المتقدم
                </button>
              )}
              {isOffline && (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة الاتصال
                </button>
              )}
            </div>
          </div>

          {/* Confirmation Dialog */}
          {showConfirm && (
            <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-300 mb-3">
                هل أنت متأكد من رغبتك في مسح جميع البيانات المخزنة مؤقتاً؟ سيؤدي هذا إلى تسجيل خروجك وفقدان أي بيانات غير محفوظة.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    clearAllCache();
                    setShowConfirm(false);
                    window.location.reload();
                  }}
                  className="bg-red-700 text-white px-3 py-1 rounded text-xs"
                >
                  تأكيد المسح
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-2 bg-gray-900 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>آخر تحديث: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          <span>{formatBytes(totalCacheSize)}</span>
        </div>
      </div>
    </div>
  );
};