import React from 'react';
import { Link } from 'react-router-dom';
import { GamepadIcon } from 'lucide-react';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 'md',
  showName = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <Link to="/game" className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white`}>
        <GamepadIcon className="w-1/2 h-1/2" />
      </div>
      {showName && (
        <div>
          <div className="text-white font-medium">ابدأ اللعب</div>
          <div className="text-xs text-gray-400">بدون تسجيل</div>
        </div>
      )}
    </Link>
  );
};