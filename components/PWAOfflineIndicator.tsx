import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface PWAOfflineIndicatorProps {
  className?: string;
}

export const PWAOfflineIndicator: React.FC<PWAOfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5" />
          <span className="font-bold">أنت غير متصل بالإنترنت</span>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">إعادة المحاولة</span>
        </button>
      </div>
    </div>
  );
}; 