import React from 'react';

interface GameBoardCardProps {
  points: number;
  category: string;
  illustration: string;
  onClick: () => void;
  used?: boolean;
  questionNumber?: number; 
}

export const GameBoardCard: React.FC<GameBoardCardProps> = ({ 
  points, 
  category, 
  illustration, 
  onClick, 
  used = false,
  questionNumber = 1
}) => {
  return (
    <div
      className={`rounded-full bg-gray-300 p-0.5 flex items-center justify-between min-h-[60px] sm:min-h-[70px] md:min-h-[80px] transition-all duration-300 ${
        used ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:bg-gray-400'
      }`}
      onClick={!used ? onClick : undefined}
    >
      {}
      <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center">
        <span className="text-red-600 font-black text-xs sm:text-sm md:text-base">{points}</span>
      </div>
      
      {}
      <div className="flex-1 flex flex-col items-center justify-center px-0.5 sm:px-1">
        <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-lg overflow-hidden mb-1 bg-blue-100">
          <img 
            src={illustration} 
            alt={category}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400';
            }}
          />
        </div>
        <div className="bg-orange-500 text-white px-0.5 sm:px-1 py-0.25 sm:py-0.5 rounded text-[0.6rem] sm:text-xs font-bold text-center min-w-[40px] sm:min-w-[50px] md:min-w-[60px]">
          {category}
        </div>
      </div>
      
      {}
      <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center">
        <span className="text-red-600 font-black text-xs sm:text-sm md:text-base">{points}</span>
      </div>
    </div>
  );
};