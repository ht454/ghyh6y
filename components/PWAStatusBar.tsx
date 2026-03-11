import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Battery, BatteryCharging } from 'lucide-react';

interface PWAStatusBarProps {
  className?: string;
}

export const PWAStatusBar: React.FC<PWAStatusBarProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery status
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(battery.level * 100);
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(battery.level * 100);
          });

          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    getBatteryInfo();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return null;
    
    if (isCharging) {
      return <BatteryCharging className="w-4 h-4 text-green-400" />;
    }
    
    if (batteryLevel <= 20) {
      return <Battery className="w-4 h-4 text-red-400" />;
    } else if (batteryLevel <= 50) {
      return <Battery className="w-4 h-4 text-yellow-400" />;
    } else {
      return <Battery className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 text-white text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold">{formatTime(currentTime)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>
          
          {/* Battery Status */}
          {batteryLevel !== null && (
            <div className="flex items-center gap-1">
              {getBatteryIcon()}
              <span className="text-xs">{Math.round(batteryLevel)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 