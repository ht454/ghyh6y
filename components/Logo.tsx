import React from 'react';
import { Search } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src="/src/components/Untitled design (41).png" 
        alt="شير لوك" 
        className={`${sizeClasses[size]} rounded-xl shadow-lg border-2 border-orange-500/50`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg hidden border-2 border-orange-500/50`}>
        <Search className="text-white w-1/2 h-1/2" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent`}>
            Sherlook
          </h1>
          <p className="text-orange-400 text-sm font-bold">شير لوك</p>
        </div>
      )}
    </div>
  );
};