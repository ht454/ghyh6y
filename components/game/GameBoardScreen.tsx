import React from 'react';
import { GameSession } from '../../types/game';
import { ArrowLeft, Home, RefreshCw, AlertTriangle, Trophy } from 'lucide-react';

interface GameBoardScreenProps {
  gameSession: GameSession;
  onSelectQuestion: (categoryId: string, points: number, questionNumber: number) => void;
  onEndGame: () => void;
  isQuestionUsed: (categoryId: string, points: number, questionNumber: number) => boolean;
  onRefreshData?: () => void;
  remainingQuestions: number;
  isGameNearEnd: boolean;
  progressPercentage: number;
  getTotalPossibleQuestions: () => number;
  currentTeam: any;
}

export const GameBoardScreen: React.FC<GameBoardScreenProps> = ({
  gameSession,
  onSelectQuestion,
  onEndGame,
  isQuestionUsed,
  onRefreshData,
  remainingQuestions,
  isGameNearEnd,
  progressPercentage,
  getTotalPossibleQuestions,
  currentTeam
}) => {
  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'الفئة';
  };

  // Get category color from database - direct codes
  const getCategoryColor = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    
    console.log('🎨 Getting color for category:', categoryId, 'Found category:', category);
    
    if (!category || !category.color) {
      console.warn('⚠️ Category not found or missing color:', categoryId, category);
      return '#ff6b35';
    }

    // 🔥 Use direct color from database (this should be a hex code like #ff6b35)
    console.log('✅ Using category color:', category.color, 'for category:', category.name);
    return category.color;
  };

  // Define color schemes for each category position
  const getCategoryColorScheme = (index: number) => {
    const colorSchemes = [
      '#6B7280', // Gray
      '#6B7280', // Gray
      '#3B82F6', // Blue
      '#3B82F6', // Blue
      '#D97706', // Orange/Brown
      '#D97706', // Orange/Brown
      '#06B6D4', // Cyan
      '#06B6D4', // Cyan
      '#F59E0B', // Yellow
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#EF4444', // Red
    ];
    return colorSchemes[index] || '#6B7280';
  };

  return (
    <div className="game-page-container h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex flex-col">
      {/* Header - RESPONSIVE */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-2 sm:p-3 md:p-4 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onEndGame}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-white hover:bg-white/30 transition-colors text-xs sm:text-sm backdrop-blur-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">الفريق الأول</span>
            </button>
            <button
              onClick={onEndGame}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-white hover:bg-white/30 transition-colors text-xs sm:text-sm backdrop-blur-sm"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">شيرلوك</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white font-bold text-sm">🏆</span>
              <span className="text-white font-bold text-sm mx-2">ما سؤال جيم</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
              النتائج 🏆
            </div>
            <div className="text-white font-bold text-sm">كأس العالم</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-1 flex-shrink-0">
        <div className="text-center text-white text-sm font-bold">
          ٦/٩ أسئلة مكتملة
        </div>
      </div>

      {/* 🔥 End of questions warning - RESPONSIVE */}
      {remainingQuestions === 0 && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-white">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-bold">🎉 تم الانتهاء من جميع الأسئلة! اضغط "النتائج" لمشاهدة الفائز</span>
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      )}

      {/* Near end of questions warning - RESPONSIVE */}
      {isGameNearEnd && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-white">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-sm">⚠️ تحذير: {remainingQuestions} أسئلة متبقية فقط!</span>
          </div>
        </div>
      )}

      {/* Game Board - NEW GRID DESIGN */}
      <div className="flex-grow overflow-hidden bg-black">
        <div className="h-full w-full p-4 flex flex-col">
          {gameSession.categories.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                {onRefreshData && (
                  <button
                    onClick={onRefreshData}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    تحديث الفئات
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* NEW GRID LAYOUT - 3x2 GRID FOR 6 CATEGORIES */
            <div className="flex-grow grid grid-cols-3 grid-rows-2 gap-4 h-full">
              {gameSession.selectedCategories.slice(0, 6).map((categoryId, index) => {
                const category = gameSession.categories.find(c => c.id === categoryId);
                if (!category) return null;
                
                // Get colors from database or use position-based colors
                const categoryColor = getCategoryColor(categoryId);
                const pointValues = [200, 400, 600];
                
                // 🔥 Calculate remaining questions for this category
                const categoryRemainingQuestions = pointValues.reduce((count, points) => {
                  const q1Used = isQuestionUsed(categoryId, points, 1);
                  const q2Used = isQuestionUsed(categoryId, points, 2);
                  return count + (q1Used ? 0 : 1) + (q2Used ? 0 : 1);
                }, 0);
                
                return (
                  <div key={categoryId} className="relative h-full">
                    {/* Category Section */}
                    <div 
                      className="h-full rounded-2xl p-4 flex flex-col relative overflow-hidden shadow-2xl border-4 border-black"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {/* Category Header */}
                      <div className="text-center mb-4">
                        <h3 className="text-white font-black text-lg sm:text-xl md:text-2xl drop-shadow-lg">
                          {category.name}
                        </h3>
                        <div className="text-white/80 text-sm font-bold">
                          {categoryRemainingQuestions === 0 ? (
                            <span className="text-yellow-300">مكتملة ✓</span>
                          ) : (
                            <span>{categoryRemainingQuestions} متبقي</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Points Grid - 2x3 LAYOUT */}
                      <div className="flex-grow grid grid-cols-2 gap-3">
                        {pointValues.map((points) => (
                          <React.Fragment key={`points-${points}`}>
                            {/* Question 1 */}
                            <button
                              onClick={() => onSelectQuestion(categoryId, points, 1)}
                              disabled={isQuestionUsed(categoryId, points, 1)}
                              className={`
                                bg-white/90 backdrop-blur-sm text-black font-black text-2xl sm:text-3xl md:text-4xl
                                rounded-xl border-4 border-black
                                flex items-center justify-center
                                transition-all duration-300 transform
                                ${isQuestionUsed(categoryId, points, 1) 
                                  ? 'opacity-30 cursor-not-allowed bg-gray-600 text-gray-400' 
                                  : 'hover:scale-105 hover:bg-white hover:shadow-2xl active:scale-95'
                                }
                                min-h-[80px] sm:min-h-[100px] md:min-h-[120px]
                              `}
                              style={{ 
                                backgroundColor: isQuestionUsed(categoryId, points, 1) ? '#6b7280' : 'rgba(255, 255, 255, 0.95)'
                              }}
                            >
                              {points}
                            </button>
                            
                            {/* Question 2 */}
                            <button
                              onClick={() => onSelectQuestion(categoryId, points, 2)}
                              disabled={isQuestionUsed(categoryId, points, 2)}
                              className={`
                                bg-white/90 backdrop-blur-sm text-black font-black text-2xl sm:text-3xl md:text-4xl
                                rounded-xl border-4 border-black
                                flex items-center justify-center
                                transition-all duration-300 transform
                                ${isQuestionUsed(categoryId, points, 2) 
                                  ? 'opacity-30 cursor-not-allowed bg-gray-600 text-gray-400' 
                                  : 'hover:scale-105 hover:bg-white hover:shadow-2xl active:scale-95'
                                }
                                min-h-[80px] sm:min-h-[100px] md:min-h-[120px]
                              `}
                              style={{ 
                                backgroundColor: isQuestionUsed(categoryId, points, 2) ? '#6b7280' : 'rgba(255, 255, 255, 0.95)'
                              }}
                            >
                              {points}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none rounded-2xl"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Team Scores and Controls */}
      <div className="flex-shrink-0 bg-black p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Team 1 */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-center border-4 border-white/20">
            <div className="text-white font-black text-xl mb-2">
              {gameSession.teams[0]?.name || 'الفريق الأول'}
            </div>
            <div className="text-white font-black text-4xl" key={`team1-score-${gameSession.teams[0]?.id}-${gameSession.teams[0]?.score}`}>
              {gameSession.teams[0]?.score || 0}
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-center border-4 border-white/20">
            <div className="text-white font-black text-xl mb-2">
              {gameSession.teams[1]?.name || 'الفريق الثاني'}
            </div>
            <div className="text-white font-black text-4xl" key={`team2-score-${gameSession.teams[1]?.id}-${gameSession.teams[1]?.score}`}>
              {gameSession.teams[1]?.score || 0}
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          <button className="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-red-700 transition-colors">
            الفريق الأحمر
          </button>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
          </div>
          <button className="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-red-700 transition-colors">
            الإجابة الصحيحة
          </button>
        </div>
      </div>
    </div>
  );
};