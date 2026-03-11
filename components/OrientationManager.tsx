import React, { useEffect, useState } from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';

interface OrientationManagerProps {
  forceOrientation: 'portrait' | 'landscape' | 'both';
  children: React.ReactNode;
}

export const OrientationManager: React.FC<OrientationManagerProps> = ({ 
  forceOrientation, 
  children 
}) => {
  const [isPhone, setIsPhone] = useState(false);
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showOrientationMessage, setShowOrientationMessage] = useState(false);

  useEffect(() => {
    // Check if device is a phone
    const checkIfPhone = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/.test(userAgent);
      return isMobile && !isTablet;
    };

    // Check if device is iPhone SE (667x375)
    const checkIfIPhoneSE = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // iPhone SE can be in both orientations
      return (width === 667 && height === 375) || (width === 375 && height === 667);
    };

    const isPhoneDevice = checkIfPhone();
    const isIPhoneSE = checkIfIPhoneSE();
    setIsPhone(isPhoneDevice || isIPhoneSE);

    if (!isPhoneDevice && !isIPhoneSE) {
      return; // Only apply orientation forcing on phones and iPhone SE
    }

    // If orientation is set to 'both', don't force any orientation
    if (forceOrientation === 'both') {
      return;
    }

    // Get current orientation
    const getOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        return 'portrait';
      } else {
        return 'landscape';
      }
    };

    const updateOrientation = () => {
      const orientation = getOrientation();
      setCurrentOrientation(orientation);
      
      // Show message if orientation doesn't match required orientation
      if (orientation !== forceOrientation) {
        setShowOrientationMessage(true);
      } else {
        setShowOrientationMessage(false);
      }
    };

    // Initial check
    updateOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [forceOrientation]);

  // Don't show anything if not a phone
  if (!isPhone) {
    return <>{children}</>;
  }

  // Show orientation message if needed
  if (showOrientationMessage) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm mx-auto text-center">
          <div className="flex justify-center mb-4">
            {forceOrientation === 'portrait' ? (
              <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white rotate-90" />
              </div>
            ) : (
              <div className="w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {forceOrientation === 'portrait' ? 'استخدم الوضع العمودي' : 'استخدم الوضع الأفقي'}
          </h2>
          
          <p className="text-gray-300 mb-4">
            {forceOrientation === 'portrait' 
              ? 'يرجى تدوير الهاتف إلى الوضع العمودي للاستمرار'
              : 'يرجى تدوير الهاتف إلى الوضع الأفقي للاستمرار'
            }
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <RotateCcw className="w-4 h-4" />
            <span>قم بتدوير الهاتف</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 