import React from 'react';
import { Category } from '../types/game';
import { Info, CheckCircle } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  isSelected = false,
  onToggle,
  disabled = false
}) => {
  return (
    <div
      className={`relative bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl border-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${isSelected ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100' : 'border-orange-200 hover:border-orange-400'}`}
      onClick={!disabled ? onToggle : undefined}
      style={{ 
        aspectRatio: '0.75',
        maxWidth: '100%',
        margin: '0 auto',
        animationDelay: '0.2s'
      }}
    >
      {}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center z-20 shadow-lg">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )}

      {}
      <div className="relative h-full overflow-hidden">
        <img 
          src={category.illustration} 
          alt={category.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {}
        <div className="absolute top-3 left-3 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      </div>

      {}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-black/70">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <span className="text-xl sm:text-2xl">{category.icon}</span>
          <h3 className="text-base sm:text-lg font-bold text-white">{category.name}</h3>
        </div>
        
        <p className="text-gray-200 text-xs leading-relaxed mb-2 line-clamp-1">
          {category.description}
        </p>
        
        {}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((star) => (
            <div key={star} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full"></div>
          ))}
        </div>
      </div>

      {}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {}
      {isSelected && (
        <div className="absolute inset-0 bg-green-500/10 pointer-events-none"></div>
      )}
    </div>
  );
};