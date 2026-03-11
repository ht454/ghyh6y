import React from 'react';
import { GameSession } from '../../types/game';
import { CheckCircle, HelpCircle, ArrowLeft, Camera, SplitSquareVertical } from 'lucide-react';

interface AnswerScreenProps {
  gameSession: GameSession;
  onNextQuestion: () => void;
  onShowScoreScreen: () => void;
  currentTeam: any;
}

export const AnswerScreen: React.FC<AnswerScreenProps> = ({
  gameSession,
  onNextQuestion,
  onShowScoreScreen,
  currentTeam
}) => {
  const currentQuestion = gameSession.currentQuestion;
  if (!currentQuestion) return null;

  const getCategoryName = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'الفئة';
  };

  return (
    <div className="game-page-container min-h-screen w-full overflow-auto bg-gradient-to-br from-gray-900 to-black flex flex-col">
      {}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-2 flex-shrink-0 sticky top-0 z-30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1">
              <div className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                <span>{getCategoryName(currentQuestion.category)}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold">{gameSession.gameName || 'شير لوك'}</div>
            </div>

            <div className="flex items-center gap-1">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs">
                <span>{currentTeam?.name || 'الفريق'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-grow overflow-auto flex flex-col p-2">
        {}
        <div className="bg-white rounded-lg p-4 mb-3 shadow-lg flex-shrink-0 border-2 border-green-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-green-600 text-center">
              الإجابة الصحيحة
            </h2>
          </div>
          
          {}
          {currentQuestion.questionType === 'image_answer' && currentQuestion.answerImageUrl ? (
            <div className="flex flex-col items-center">
              <img 
                src={currentQuestion.answerImageUrl} 
                alt="صورة الإجابة" 
                className="max-h-60 object-contain rounded-lg mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
              <p className="text-gray-800 text-center text-lg font-bold mt-2">
                {currentQuestion.answer}
              </p>
            </div>
          ) : currentQuestion.questionType === 'mixed' && currentQuestion.answerImageUrl ? (
            <div className="flex flex-col items-center">
              <p className="text-gray-800 text-center text-lg font-bold mb-3">
                {currentQuestion.answer}
              </p>
              <img 
                src={currentQuestion.answerImageUrl} 
                alt="صورة الإجابة" 
                className="max-h-60 object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
            </div>
          ) : (
            <p className="text-gray-800 text-center text-lg font-bold">
              {currentQuestion.answer}
            </p>
          )}
        </div>
        
        {}
        {currentQuestion.additionalInfo && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-bold text-sm">معلومات إضافية</span>
            </div>
            <p className="text-blue-800 text-sm">
              {currentQuestion.additionalInfo}
            </p>
          </div>
        )}
        
        {}
        <div className="flex-grow flex flex-col justify-end">
          <div className="grid grid-cols-2 gap-2 sticky bottom-0 bg-white pt-2 pb-2">
            <button
              onClick={onShowScoreScreen}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              من جاوب صح؟
            </button>
            <button
              onClick={onNextQuestion}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              السؤال التالي
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-2 bg-gray-800 sticky bottom-0">
        {/* Team 1 */}
        <div className="bg-black/50 rounded-lg p-2">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-red-600">
              {gameSession.teams[0]?.name || 'الفريق الأول'}
            </span>
            <span className="text-white font-bold text-lg">
              {gameSession.teams[0]?.score || 0}
            </span>
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-black/50 rounded-lg p-2">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-red-600">
              {gameSession.teams[1]?.name || 'الفريق الثاني'}
            </span>
            <span className="text-white font-bold text-lg">
              {gameSession.teams[1]?.score || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};