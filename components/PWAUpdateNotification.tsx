import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface PWAUpdateNotificationProps {
  className?: string;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({ className = '' }) => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdateNotification(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdateNotification(false);
  };

  if (!showUpdateNotification) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <div>
              <h3 className="font-bold text-sm">تحديث متاح</h3>
              <p className="text-xs opacity-90">إصدار جديد من التطبيق متاح</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-bold transition-colors"
            >
              تحديث
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 