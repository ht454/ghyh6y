import React from 'react';
import { useCache } from '../contexts/CacheContext';
import { Database, Wifi, WifiOff, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface CacheStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  showDetails = false,
  className = ''
}) => {
  const {
    isOffline,
    isPrivateMode,
    updateAvailable,
    applyServiceWorkerUpdate
  } = useCache();

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {isOffline ? (
          <div className="flex items-center gap-1 bg-red-900/50 text-red-300 px-2 py-1 rounded-full text-xs">
            <WifiOff className="w-3 h-3" />
            <span>غير متصل</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-green-900/50 text-green-300 px-2 py-1 rounded-full text-xs">
            <Wifi className="w-3 h-3" />
            <span>متصل</span>
          </div>
        )}
        
        {updateAvailable && (
          <button
            onClick={() => applyServiceWorkerUpdate()}
            className="flex items-center gap-1 bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>تحديث</span>
          </button>
        )}
        
        {isPrivateMode && (
          <div className="flex items-center gap-1 bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded-full text-xs">
            <Shield className="w-3 h-3" />
            <span>وضع خاص</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed status
  return (
    <div className={`rounded-lg border border-gray-800 overflow-hidden ${className}`}>
      <div className="bg-gray-900 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">حالة التخزين المؤقت</span>
        </div>
      </div>
      
      <div className="p-3 bg-black">
        <div className="space-y-2">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">حالة الاتصال:</span>
            {isOffline ? (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <WifiOff className="w-3 h-3" />
                <span>غير متصل</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <Wifi className="w-3 h-3" />
                <span>متصل</span>
              </div>
            )}
          </div>
          
          {/* Private Mode */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">وضع التصفح الخاص:</span>
            {isPrivateMode ? (
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>نشط</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>غير نشط</span>
              </div>
            )}
          </div>
          
          {/* Update Available */}
          {updateAvailable && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">تحديث متوفر:</span>
              <button
                onClick={() => applyServiceWorkerUpdate()}
                className="flex items-center gap-1 text-purple-400 text-xs hover:text-purple-300"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تثبيت التحديث</span>
              </button>
            </div>
          )}
          
          {/* Warnings */}
          {isOffline && (
            <div className="mt-2 bg-red-900/30 border border-red-800 rounded p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل بشكل صحيح.
              </div>
            </div>
          )}
          
          {isPrivateMode && (
            <div className="mt-2 bg-yellow-900/30 border border-yellow-800 rounded p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-300">
                أنت في وضع التصفح الخاص. لن يتم حفظ البيانات بين الجلسات.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};