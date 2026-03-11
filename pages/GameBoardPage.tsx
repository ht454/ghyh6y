import React, { useState, useEffect } from 'react';
import { GameBoard } from '../components/GameBoard';
import { ArrowLeft, Home, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GameBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [currentCategory, setCurrentCategory] = useState(0);
  const [totalCategories, setTotalCategories] = useState(6);

  // Monitor screen size changes
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCategorySelect = (categoryIndex: number, points: number) => {
    console.log(`Selected category ${categoryIndex} with ${points} points`);
    // Handle category selection logic here
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const nextCategory = () => {
    setCurrentCategory(prev => (prev + 1) % totalCategories);
  };

  const prevCategory = () => {
    setCurrentCategory(prev => (prev - 1 + totalCategories) % totalCategories);
  };

  // Determine if we should show category navigation (for small screens)
  const showCategoryNavigation = windowSize.width < 768;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black flex flex-col">
      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-2 sm:p-3 md:p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-white hover:bg-white/30 transition-colors text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">العودة</span>
            </button>
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-white hover:bg-white/30 transition-colors text-xs sm:text-sm"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-white hover:bg-white/30 transition-colors text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white">شير لوك</h1>
            <p className="text-white/80 text-xs sm:text-sm">لوحة اللعب</p>
          </div>
          
          <div className="text-right">
            <div className="text-white font-bold text-sm sm:text-base">جيم</div>
            <div className="text-white/80 text-xs hidden sm:block">شير لوك</div>
          </div>
        </div>
      </div>

      {/* Category Navigation for Mobile/Small Screens */}
      {showCategoryNavigation && (
        <div className="bg-black/50 p-2 flex justify-between items-center">
          <button 
            onClick={prevCategory}
            className="bg-orange-500 text-white p-2 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="text-white text-sm">
            الفئة {currentCategory + 1} من {totalCategories}
          </div>
          <button 
            onClick={nextCategory}
            className="bg-orange-500 text-white p-2 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Game Board - Flex-grow to fill available space */}
      <div className="flex-grow flex items-center justify-center overflow-hidden">
        <GameBoard 
          onCategorySelect={handleCategorySelect} 
          currentCategory={currentCategory}
          showCategoryNavigation={showCategoryNavigation}
        />
      </div>
    </div>
  );
};