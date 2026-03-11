import React, { useState, useEffect } from 'react';
import { GameSession, Question } from '../../types/game';
import { Play, Pause, RotateCcw, Phone, Hand, Eye, HelpCircle } from 'lucide-react';
import YearRangeDisplay from '../../components/YearRangeDisplay';
import { AudioQuestion } from '../../components/AudioQuestion';

interface QuestionScreenProps {
  gameSession: GameSession;
  onShowAnswer: () => void;
  onShowScoreScreen: () => void;
  currentTeam: any;
  activateHelperTool: (toolType: 'callFriend' | 'twoAnswers' | 'steal', teamId: string, targetTeamId?: string) => void;
  endHelperTool: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  gameSession,
  onShowAnswer,
  onShowScoreScreen,
  currentTeam,
  activateHelperTool,
  endHelperTool
}) => {
  const [timer, setTimer] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  const activeHelperTool = gameSession.activeHelperTool;
  const currentQuestion = gameSession.currentQuestion;

  if (!currentQuestion) return null;

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'الفئة';
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && !isTimerPaused && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, timer]);

  // Start timer when question is displayed
  useEffect(() => {
    if (currentQuestion && !gameSession.showAnswer) {
      setTimer(120);
      setIsTimerRunning(true);
      setIsTimerPaused(false);
    }
  }, [currentQuestion, gameSession.showAnswer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerPaused(!isTimerPaused);
    } else {
      setIsTimerRunning(true);
      setIsTimerPaused(false);
    }
  };

  const resetTimer = () => {
    setTimer(120);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
  };

  // Helper tool handlers
  const handleActivateCallFriend = (teamId: string) => {
    activateHelperTool('callFriend', teamId);
  };

  const handleActivateTwoAnswers = (teamId: string) => {
    activateHelperTool('twoAnswers', teamId);
  };

  const handleActivateSteal = (stealingTeamId: string, targetTeamId: string) => {
    activateHelperTool('steal', stealingTeamId, targetTeamId);
  };

  return (
    <div className="game-page-container h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black flex flex-col">
      {/* Header - RESPONSIVE */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-2 flex-shrink-0">
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

      {/* Timer Section - RESPONSIVE - CHANGED TO WHITE BACKGROUND */}
      <div className="flex items-center justify-center gap-2 py-1 bg-white flex-shrink-0">
        <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm border border-gray-200 shadow-sm">
          <button 
            onClick={toggleTimer}
            className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"
          >
            {isTimerRunning && !isTimerPaused ? <Pause className="w-3 h-3 text-gray-700" /> : <Play className="w-3 h-3 text-gray-700" />}
          </button>
          
          <div className="font-mono font-bold text-gray-800">
            {formatTime(timer)}
          </div>
          
          <button 
            onClick={resetTimer}
            className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"
          >
            <RotateCcw className="w-3 h-3 text-gray-700" />
          </button>
        </div>
        
        <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-lg text-sm border border-gray-200 shadow-sm">
          <span className="font-bold">{currentQuestion.points}</span>
        </div>
      </div>

      {/* Helper Tool Active Indicator */}
      {activeHelperTool && (
        <div className={`p-1 text-center text-xs text-white ${
          activeHelperTool.type === 'callFriend' ? 'bg-blue-600' :
          activeHelperTool.type === 'twoAnswers' ? 'bg-purple-600' : 'bg-red-600'
        }`}>
          {activeHelperTool.type === 'callFriend' && (
            <div className="flex items-center justify-center gap-1">
              <Phone className="w-3 h-3" />
              <span>اتصال بصديق: {activeHelperTool.timeRemaining} ثانية متبقية</span>
            </div>
          )}
          {activeHelperTool.type === 'twoAnswers' && (
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" />
              <span>محاولتان للإجابة</span>
            </div>
          )}
          {activeHelperTool.type === 'steal' && (
            <div className="flex items-center justify-center gap-1">
              <Hand className="w-3 h-3" />
              <span>سرقة النقاط من الفريق الآخر</span>
            </div>
          )}
        </div>
      )}

      {/* Year Range Display if enabled */}
      {currentQuestion.year_range_enabled && (
        <div className="p-1 flex-shrink-0">
          <YearRangeDisplay 
            enabled={currentQuestion.year_range_enabled} 
            value={currentQuestion.year_range_value || 1} 
          />
        </div>
      )}

      {/* Main Content - FULLY RESPONSIVE, NO SCROLL */}
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="h-full flex flex-col p-2 bg-white">
          {/* Question Card */}
          <div className="bg-white rounded-lg p-3 mb-2 shadow-lg flex-shrink-0 border border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 text-center">
              {currentQuestion.question}
            </h2>
          </div>
          
          {/* Media Content - RESPONSIVE */}
          <div className="flex-grow flex items-center justify-center overflow-hidden mb-2 bg-white">
            {/* Check for audio question type or audio_url property */}
            {(currentQuestion.questionType === 'audio' || currentQuestion.audio_url) && (
              <div className="w-full max-w-full h-auto">
                <AudioQuestion 
                  audio_url={currentQuestion.audio_url || ''}
                  question={currentQuestion.question}
                />
              </div>
            )}
            
            {/* Blurry image question */}
            {currentQuestion.questionType === 'blurry_image' && currentQuestion.imageUrl && (
              <div className="w-full h-full flex items-center justify-center p-2">
                <div className="relative max-h-full max-w-full">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt={currentQuestion.imageDescription || 'صورة السؤال'}
                    className="max-h-full max-w-full object-contain rounded-lg"
                    style={{ filter: `blur(${currentQuestion.blurLevel || 5}px)` }}
                  />
                </div>
              </div>
            )}
            
            {/* Regular image question */}
            {!currentQuestion.audio_url && 
             currentQuestion.questionType !== 'audio' && 
             currentQuestion.questionType !== 'blurry_image' && 
             currentQuestion.imageUrl && (
              <div className="w-full h-full flex items-center justify-center p-2">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt={currentQuestion.imageDescription || 'صورة السؤال'}
                  className="max-h-full max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';
                  }}
                />
              </div>
            )}
            
            {/* Fallback if no media */}
            {!currentQuestion.audio_url && 
             !currentQuestion.imageUrl && 
             currentQuestion.questionType !== 'audio' && 
             currentQuestion.questionType !== 'blurry_image' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <HelpCircle className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-2 flex-shrink-0">
            <button
              onClick={onShowAnswer}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full text-sm"
            >
              الإجابة
            </button>
            <button
              onClick={onShowScoreScreen}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full text-sm"
            >
              من جاوب صح؟
            </button>
          </div>
        </div>
      </div>

      {/* Teams Section - COMPACT */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-2 bg-gray-800">
        {/* Team 1 */}
        <div className="bg-black/50 rounded-lg p-2 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-red-600">
              {gameSession.teams[0]?.name || 'الفريق الأول'}
            </span>
            <span className="text-white font-bold text-lg">
              {gameSession.teams[0]?.score || 0}
            </span>
          </div>
          <div className="flex justify-between">
            {/* Helper Tools */}
            <div className="flex gap-1">
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[0]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[0]?.helperTools?.callFriend || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[0] && handleActivateCallFriend(gameSession.teams[0].id)}
              >
                <Phone className="w-3 h-3" />
              </button>
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[0]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[0]?.helperTools?.twoAnswers || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[0] && handleActivateTwoAnswers(gameSession.teams[0].id)}
              >
                <Eye className="w-3 h-3" />
              </button>
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[0]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[0]?.helperTools?.steal || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[0] && gameSession.teams[1] && handleActivateSteal(gameSession.teams[0].id, gameSession.teams[1].id)}
              >
                <Hand className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-black/50 rounded-lg p-2 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-red-600">
              {gameSession.teams[1]?.name || 'الفريق الثاني'}
            </span>
            <span className="text-white font-bold text-lg">
              {gameSession.teams[1]?.score || 0}
            </span>
          </div>
          <div className="flex justify-between">
            {/* Helper Tools */}
            <div className="flex gap-1">
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[1]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[1]?.helperTools?.callFriend || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[1] && handleActivateCallFriend(gameSession.teams[1].id)}
              >
                <Phone className="w-3 h-3" />
              </button>
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[1]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[1]?.helperTools?.twoAnswers || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[1] && handleActivateTwoAnswers(gameSession.teams[1].id)}
              >
                <Eye className="w-3 h-3" />
              </button>
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  gameSession.teams[1]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!gameSession.teams[1]?.helperTools?.steal || activeHelperTool !== undefined}
                onClick={() => gameSession.teams[1] && gameSession.teams[0] && handleActivateSteal(gameSession.teams[1].id, gameSession.teams[0].id)}
              >
                <Hand className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};