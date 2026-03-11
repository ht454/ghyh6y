import React, { useState, useEffect, useCallback } from 'react';
import { GameSession } from '../types/game';
import { ArrowLeft, Home, ArrowRight, RotateCcw, Phone, Hand, Minus, Plus, Play, Pause, RotateCcw as Reset, RefreshCw, Trophy, AlertTriangle, Clock, CheckCircle, X, HelpCircle, Volume2, Eye } from 'lucide-react';
import YearRangeDisplay from '../components/YearRangeDisplay';
import { AudioQuestion } from '../components/AudioQuestion';
import { checkSupabaseConnection } from '../services/supabaseClient';
import { OrientationManager } from '../components/OrientationManager';

interface GamePageProps {
  gameSession: GameSession;
  onSelectQuestion: (categoryId: string, points: number, questionNumber: number) => void;
  onShowAnswer: () => void;
  onNextQuestion: () => void;
  onUpdateScore: (teamId: string, points: number) => void;
  onEndGame: () => void;
  isQuestionUsed: (categoryId: string, points: number, questionNumber: number) => boolean;
  onRefreshData?: () => void;
  activateHelperTool: (toolType: 'callFriend' | 'twoAnswers' | 'steal', teamId: string, targetTeamId?: string) => void;
  updateCallFriendTimer: (newTime: number) => void;
  endHelperTool: () => void;
  executeSteal: (stealingTeamId: string, targetTeamId: string, points: number) => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  gameSession,
  onSelectQuestion,
  onShowAnswer,
  onNextQuestion,
  onUpdateScore,
  onEndGame,
  isQuestionUsed,
  onRefreshData,
  activateHelperTool,
  updateCallFriendTimer,
  endHelperTool,
  executeSteal
}) => {
  const [timer, setTimer] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showScoreScreen, setShowScoreScreen] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [retryingConnection, setRetryingConnection] = useState(false);

  const currentTeam = gameSession.teams[gameSession.currentTeam];
  const activeHelperTool = gameSession.activeHelperTool;

  // Log current question details when it changes
  useEffect(() => {
    if (gameSession.currentQuestion) {
      console.log('🎮 Current Question Details:', gameSession.currentQuestion);
    }
  }, [gameSession.currentQuestion]);

  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    // Check connection immediately
    checkConnection();
    
    // Set up interval to check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Retry connection when disconnected
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !retryingConnection) {
      setRetryingConnection(true);
      
      const retryConnection = async () => {
        console.log('🔄 Retrying connection to Supabase...');
        const isConnected = await checkSupabaseConnection();
        
        if (isConnected) {
          console.log('✅ Connection restored!');
          setConnectionStatus('connected');
          
          // Refresh data if connection is restored
          if (onRefreshData) {
            onRefreshData();
          }
        } else {
          console.log('❌ Still disconnected, will retry later');
        }
        
        setRetryingConnection(false);
      };
      
      // Retry after 5 seconds
      const timeout = setTimeout(retryConnection, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, retryingConnection, onRefreshData]);

  // 🔥 Calculate remaining questions
  const getTotalPossibleQuestions = () => {
    return gameSession.selectedCategories.length * 6; // 3 levels × 2 questions per level
  };

  const getRemainingQuestions = () => {
    const total = getTotalPossibleQuestions();
    const used = gameSession.usedQuestions.length;
    return Math.max(0, total - used);
  };

  const getProgressPercentage = () => {
    const total = getTotalPossibleQuestions();
    const used = gameSession.usedQuestions.length;
    return total > 0 ? (used / total) * 100 : 0;
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
    if (gameSession.currentQuestion && !gameSession.showAnswer) {
      setTimer(120);
      setIsTimerRunning(true);
      setIsTimerPaused(false);
      setShowScoreScreen(false);
    }
  }, [gameSession.currentQuestion, gameSession.showAnswer]);

  // Call Friend timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeHelperTool?.type === 'callFriend' && activeHelperTool.timeRemaining && activeHelperTool.timeRemaining > 0) {
      interval = setInterval(() => {
        const newTime = activeHelperTool.timeRemaining! - 1;
        updateCallFriendTimer(newTime);
        
        if (newTime <= 0) {
          endHelperTool();
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeHelperTool, updateCallFriendTimer, endHelperTool]);

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

  const handleShowScoreScreen = () => {
    setShowScoreScreen(true);
  };

  const handleBackToAnswer = () => {
    console.log('🔄 handleBackToAnswer called');
    console.log('📊 Current state:', { 
      showScoreScreen, 
      showAnswer: gameSession.showAnswer,
      currentQuestion: !!gameSession.currentQuestion 
    });
    
    // Reset all states to return to question display
    setShowScoreScreen(false);
    
    // Try to return to question by calling onShowAnswer
    // If that doesn't work, we'll try a different approach
    try {
      onShowAnswer();
      console.log('✅ onShowAnswer called successfully');
    } catch (error) {
      console.error('❌ Error calling onShowAnswer:', error);
    }
    
    console.log('✅ handleBackToAnswer completed');
  };

  // Handle team scoring with detailed logging
  const handleTeamScored = useCallback((teamId: string) => {
    if (!gameSession.currentQuestion) return;
    
    console.log('🎯 handleTeamScored called with:', { teamId, points: gameSession.currentQuestion.points });
    console.log('🔍 Available teams:', gameSession.teams.map(t => ({ id: t.id, name: t.name, score: t.score })));
    
    const pointsToAdd = gameSession.currentQuestion.points;
    console.log(`🎯 الفريق المختار للنقاط: ${teamId} - نقاط السؤال: ${pointsToAdd}`);
    console.log('🔍 معرفات الفرق المتاحة:', gameSession.teams.map(t => ({ id: t.id, name: t.name, score: t.score })));
    console.log('📊 الفرق قبل التحديث:', JSON.stringify(gameSession.teams.map(t => ({ id: t.id, name: t.name, score: t.score }))));
    
    // 🔥 التأكد من أن teamId صحيح ومطابق لأحد الفرق
    const targetTeam = gameSession.teams.find(t => t.id === teamId);
    if (!targetTeam) {
      console.error('❌ خطأ: لم يتم العثور على الفريق بالمعرف:', teamId);
      console.log('🔍 الفرق المتاحة:', gameSession.teams.map(t => ({ id: t.id, name: t.name })));
      return;
    }
    
    console.log(`✅ تم العثور على الفريق: ${targetTeam.name} (${targetTeam.id})`);
    
    // Update the score for the selected team only
    onUpdateScore(teamId, pointsToAdd);
    
    // Move to next question
    setShowScoreScreen(false);
    onNextQuestion();
  }, [gameSession.currentQuestion, gameSession.teams, onUpdateScore, onNextQuestion]);

  const handleNoOneScored = useCallback(() => {
    console.log('❌ handleNoOneScored called - no points awarded');
    setShowScoreScreen(false);
    onNextQuestion();
  }, [onNextQuestion]);

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'الفئة';
  };

  // Get category color from database - direct codes
  const getCategoryColor = (categoryId: string) => {
    const category = gameSession.categories.find(cat => cat.id === categoryId);
    if (!category || !category.color) {
      return { frame: '#ff6b35', button: '#ff6b35' };
    }

    // Use direct color from database
    return { frame: category.color, button: category.color };
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

  const handleExecuteSteal = (stealingTeamId: string, targetTeamId: string, points: number) => {
    executeSteal(stealingTeamId, targetTeamId, points);
  };

  // Connection status indicator - MOBILE OPTIMIZED
  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') {
      return null; // Don't show anything when connected
    }
    
    return (
      <div className={`fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-50 rounded-lg shadow-lg p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
        connectionStatus === 'checking' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'
      }`}>
        {connectionStatus === 'checking' ? (
          <>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            <span className="truncate max-w-[120px] sm:max-w-none">جاري فحص الاتصال...</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span className="truncate max-w-[100px] sm:max-w-none">لا يوجد اتصال بالخادم</span>
            {retryingConnection && <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin flex-shrink-0" />}
          </>
        )}
      </div>
    );
  };

  // Game Board Screen - FULLY RESPONSIVE
  if (!gameSession.currentQuestion) {
    const remainingQuestions = getRemainingQuestions();
    const progressPercentage = getProgressPercentage();
    const isGameNearEnd = remainingQuestions <= 3 && remainingQuestions > 0;
    
    return (
      <OrientationManager forceOrientation="both">
        <div className="game-page-container h-screen w-screen overflow-y-auto bg-black flex flex-col">
        {/* Header - MINIMAL FOR LANDSCAPE */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-0.5 flex-shrink-0">
          <div className="w-full max-w-7xl mx-auto px-0.5">
            <div className="flex items-center justify-between text-white gap-0.5">
              {/* Left Controls - MINIMAL */}
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={onEndGame} 
                  className="bg-white bg-opacity-20 p-0.5 rounded hover:bg-opacity-30 transition-all"
                  title="الرئيسية"
                >
                  <Home className="w-2.5 h-2.5" />
                </button>
                <button 
                  onClick={onEndGame}
                  className="bg-white bg-opacity-20 p-0.5 rounded hover:bg-opacity-30 transition-all"
                  title="رجوع"
                >
                  <ArrowLeft className="w-2.5 h-2.5" />
                </button>
                {onRefreshData && (
                  <button 
                    onClick={onRefreshData}
                    className="bg-white bg-opacity-20 p-0.5 rounded hover:bg-opacity-30 transition-all"
                    title="تحديث"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                )}
                <button 
                  onClick={onEndGame}
                  className="bg-yellow-500 bg-opacity-90 p-0.5 rounded hover:bg-opacity-100 transition-all font-bold text-white"
                  title="النتائج"
                >
                  <Trophy className="w-2.5 h-2.5" />
                </button>
              </div>
              
              {/* Center Title - MINIMAL */}
              <div className="text-center flex-1 min-w-0 px-0.5">
                <div className="text-xs font-black truncate">{gameSession.gameName || 'شير لوك'}</div>
                <div className="text-xs opacity-75">
                  {remainingQuestions > 0 ? (
                    <span className={isGameNearEnd ? 'text-yellow-300 font-bold' : ''}>
                      {remainingQuestions} متبقي
                    </span>
                  ) : (
                    <span className="text-yellow-300 font-bold">🏁 انتهت!</span>
                  )}
                </div>
              </div>
              
              {/* Right Info - MINIMAL */}
              <div className="flex items-center gap-0.5">
                <div className="bg-white bg-opacity-20 px-1 py-0.5 rounded text-xs min-w-0">
                  <span className="truncate max-w-[40px]">{currentTeam?.name || 'غير محدد'}</span>
                </div>
              </div>
            </div>
            
            {/* Progress bar - MINIMAL */}
            {getTotalPossibleQuestions() > 0 && (
              <div className="mt-0.5">
                <div className="w-full bg-white/20 rounded-full h-0.5">
                  <div 
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      progressPercentage >= 100 ? 'bg-yellow-400' : 
                      progressPercentage >= 80 ? 'bg-orange-500' : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-white/80 mt-0.5">
                  {gameSession.usedQuestions.length} / {getTotalPossibleQuestions()} مكتملة
                </div>
              </div>
            )}
          </div>
        </div>

        {/* End of questions warning - MOBILE OPTIMIZED */}
        {remainingQuestions === 0 && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-0.5 text-center flex-shrink-0">
            <div className="flex items-center justify-center gap-1 text-white">
              <Trophy className="w-2.5 h-2.5" />
              <span className="text-xs font-bold">🎉 انتهت! اضغط النتائج</span>
              <Trophy className="w-2.5 h-2.5" />
            </div>
          </div>
        )}

        {/* Near end of questions warning - ULTRA COMPACT */}
        {isGameNearEnd && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-0.5 text-center flex-shrink-0">
            <div className="flex items-center justify-center gap-1 text-white">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="font-bold text-xs">⚠️ {remainingQuestions} متبقي!</span>
            </div>
          </div>
        )}

        {/* Game Board - LANDSCAPE OPTIMIZED */}
        <div className="flex-grow overflow-y-auto">
          <div className="h-full w-full p-0.5 flex flex-col">
            {gameSession.categories.length === 0 ? (
              <div className="flex-grow flex items-center justify-center p-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 max-w-xs sm:max-w-md mx-auto text-center">
                  {onRefreshData && (
                    <button
                      onClick={onRefreshData}
                      className="bg-yellow-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                      تحديث الفئات
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow grid grid-cols-3 gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-1 min-[600px]:gap-1.5 min-[700px]:gap-2 min-[800px]:gap-2.5 min-[900px]:gap-3 min-[1000px]:gap-4 min-[1200px]:gap-6 p-0.25 min-[400px]:p-0.5 min-[500px]:p-1 min-[600px]:p-1.5 min-[700px]:p-2 min-[800px]:p-2.5 min-[900px]:p-3 min-[1000px]:p-4 h-full">
                {gameSession.selectedCategories.slice(0, 6).map((categoryId, index) => {
                  const category = gameSession.categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  // Get colors from database
                  const colors = getCategoryColor(categoryId);
                  const pointValues = [200, 400, 600];
                  
                  return (
                    <div key={categoryId} className="flex items-center justify-center">
                      {/* Responsive Category Card - Maintains 3x2 Layout */}
                      <div className="relative w-full h-full max-w-[40px] min-[400px]:max-w-[50px] min-[500px]:max-w-[65px] min-[600px]:max-w-[80px] min-[700px]:max-w-[100px] min-[800px]:max-w-[120px] min-[900px]:max-w-[140px] min-[1000px]:max-w-[160px] min-[1200px]:max-w-[200px] min-[1400px]:max-w-[240px] min-[1600px]:max-w-[280px] aspect-[3/4] flex flex-col rounded-md min-[500px]:rounded-lg min-[700px]:rounded-xl shadow-md min-[500px]:shadow-lg min-[700px]:shadow-xl group hover:scale-105 transition-all duration-200">
                        {/* Category Image - Responsive */}
                        <div className="flex-grow flex items-center justify-center p-0.25 min-[400px]:p-0.5 min-[500px]:p-1 min-[600px]:p-1.5 min-[700px]:p-2 min-[800px]:p-2.5 min-[900px]:p-3 min-[1000px]:p-4">
                          <img 
                            src={category.illustration}
                            alt={category.name}
                            className="w-full h-full object-cover rounded-sm min-[500px]:rounded-md min-[700px]:rounded-lg transition-transform duration-200 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400&h=600';
                            }}
                          />
                        </div>
                        
                        {/* Questions on Left Side - Responsive */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col gap-0.125 min-[400px]:gap-0.25 min-[500px]:gap-0.5 min-[600px]:gap-0.75 min-[700px]:gap-1 min-[800px]:gap-1.5 min-[900px]:gap-2 min-[1000px]:gap-2.5 ml-8 min-[400px]:ml-12 min-[500px]:ml-16 min-[600px]:ml-20 min-[700px]:ml-24 min-[800px]:ml-32 min-[900px]:ml-40 min-[1000px]:ml-48 min-[1200px]:ml-56 min-[1400px]:ml-64 z-50">
                          {pointValues.map((points) => (
                            <React.Fragment key={`left-${points}`}>
                              <button
                                onClick={() => onSelectQuestion(categoryId, points, 1)}
                                disabled={isQuestionUsed(categoryId, points, 1)}
                                className={`
                                  w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 min-[500px]:w-6 min-[500px]:h-6 min-[600px]:w-7 min-[600px]:h-7 min-[700px]:w-8 min-[700px]:h-8 min-[800px]:w-9 min-[800px]:h-9 min-[900px]:w-10 min-[900px]:h-10 min-[1000px]:w-12 min-[1000px]:h-12 min-[1200px]:w-14 min-[1200px]:h-14 min-[1400px]:w-16 min-[1400px]:h-16 min-[1600px]:w-18 min-[1600px]:h-18 
                                  rounded-sm min-[500px]:rounded-md min-[700px]:rounded-lg min-[900px]:rounded-xl flex items-center justify-center text-white font-bold 
                                  text-[7px] min-[400px]:text-[8px] min-[500px]:text-[9px] min-[600px]:text-[10px] min-[700px]:text-xs min-[800px]:text-sm min-[900px]:text-base min-[1000px]:text-lg min-[1200px]:text-xl min-[1400px]:text-2xl z-50
                                  ${isQuestionUsed(categoryId, points, 1) ? 'opacity-30 cursor-not-allowed bg-gray-600' : 'hover:scale-110 transition-all duration-200 active:scale-95 shadow-lg'}
                                `}
                                style={{
                                  backgroundColor: isQuestionUsed(categoryId, points, 1) ? '#6b7280' : colors.button
                                }}
                              >
                                {points}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                        
                        {/* Questions on Right Side - Responsive */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col gap-0.125 min-[400px]:gap-0.25 min-[500px]:gap-0.5 min-[600px]:gap-0.75 min-[700px]:gap-1 min-[800px]:gap-1.5 min-[900px]:gap-2 min-[1000px]:gap-2.5 mr-8 min-[400px]:mr-12 min-[500px]:mr-16 min-[600px]:mr-20 min-[700px]:mr-24 min-[800px]:mr-32 min-[900px]:mr-40 min-[1000px]:mr-48 min-[1200px]:mr-56 min-[1400px]:mr-64 z-50">
                          {pointValues.map((points) => (
                            <React.Fragment key={`right-${points}`}>
                              <button
                                onClick={() => onSelectQuestion(categoryId, points, 2)}
                                disabled={isQuestionUsed(categoryId, points, 2)}
                                className={`
                                  w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 min-[500px]:w-6 min-[500px]:h-6 min-[600px]:w-7 min-[600px]:h-7 min-[700px]:w-8 min-[700px]:h-8 min-[800px]:w-9 min-[800px]:h-9 min-[900px]:w-10 min-[900px]:h-10 min-[1000px]:w-12 min-[1000px]:h-12 min-[1200px]:w-14 min-[1200px]:h-14 min-[1400px]:w-16 min-[1400px]:h-16 min-[1600px]:w-18 min-[1600px]:h-18 
                                  rounded-sm min-[500px]:rounded-md min-[700px]:rounded-lg min-[900px]:rounded-xl flex items-center justify-center text-white font-bold 
                                  text-[7px] min-[400px]:text-[8px] min-[500px]:text-[9px] min-[600px]:text-[10px] min-[700px]:text-xs min-[800px]:text-sm min-[900px]:text-base min-[1000px]:text-lg min-[1200px]:text-xl min-[1400px]:text-2xl z-50
                                  ${isQuestionUsed(categoryId, points, 2) ? 'opacity-30 cursor-not-allowed bg-gray-600' : 'hover:scale-110 transition-all duration-200 active:scale-95 shadow-lg'}
                                `}
                                style={{
                                  backgroundColor: isQuestionUsed(categoryId, points, 2) ? '#6b7280' : colors.button
                                }}
                              >
                                {points}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Team Scores at Bottom - FULLY RESPONSIVE */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-1 min-[600px]:gap-1.5 min-[700px]:gap-2 min-[800px]:gap-2.5 min-[900px]:gap-3 min-[1000px]:gap-4 min-[1200px]:gap-6 mt-0.25 min-[400px]:mt-0.5 min-[500px]:mt-1 min-[600px]:mt-1.5 min-[700px]:mt-2 min-[800px]:mt-2.5 min-[900px]:mt-3 min-[1000px]:mt-4">
              {/* Team 1 */}
              <div className="bg-black/80 rounded-lg p-0.25 min-[400px]:p-0.5 min-[500px]:p-1 min-[600px]:p-1.5 min-[700px]:p-2 min-[800px]:p-2.5 min-[900px]:p-3 min-[1000px]:p-4 flex flex-col">
                <div className="flex justify-between items-center mb-0.25 min-[400px]:mb-0.5 min-[500px]:mb-1 min-[600px]:mb-1.5 min-[700px]:mb-2 min-[800px]:mb-2.5 min-[900px]:mb-3">
                  <span className="text-white font-bold text-[8px] min-[400px]:text-[9px] min-[500px]:text-[10px] min-[600px]:text-xs min-[700px]:text-sm min-[800px]:text-base min-[900px]:text-lg min-[1000px]:text-xl px-0.25 min-[400px]:px-0.5 min-[500px]:px-1 min-[600px]:px-1.5 min-[700px]:px-2 min-[800px]:px-2.5 min-[900px]:px-3 py-0.125 min-[400px]:py-0.25 min-[500px]:py-0.5 min-[600px]:py-0.75 min-[700px]:py-1 min-[800px]:py-1.5 rounded bg-red-600 truncate max-w-[40%] min-[400px]:max-w-[45%] min-[500px]:max-w-[50%] min-[600px]:max-w-[55%] min-[700px]:max-w-[60%]">
                    {gameSession.teams[0]?.name || 'الفريق الأول'}
                  </span>
                  <span className="text-white font-bold text-[9px] min-[400px]:text-[10px] min-[500px]:text-xs min-[600px]:text-sm min-[700px]:text-base min-[800px]:text-lg min-[900px]:text-xl min-[1000px]:text-2xl flex-shrink-0">
                    {gameSession.teams[0]?.score || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  {/* Helper Tools */}
                  <div className="flex gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-0.75 min-[600px]:gap-1 min-[700px]:gap-1.5 min-[800px]:gap-2 min-[900px]:gap-2.5 min-[1000px]:gap-3">
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[0]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[0]?.helperTools?.callFriend}
                      onClick={() => gameSession.teams[0] && handleActivateCallFriend(gameSession.teams[0].id)}
                      title="اتصال بصديق"
                    >
                      <Phone className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[0]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[0]?.helperTools?.twoAnswers}
                      onClick={() => gameSession.teams[0] && handleActivateTwoAnswers(gameSession.teams[0].id)}
                      title="محاولتان"
                    >
                      <Eye className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[0]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[0]?.helperTools?.steal}
                      onClick={() => gameSession.teams[0] && gameSession.teams[1] && handleActivateSteal(gameSession.teams[0].id, gameSession.teams[1].id)}
                      title="سرقة نقاط"
                    >
                      <Hand className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                  </div>
                  
                  {/* Score Controls */}
                  <div className="flex gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-0.75 min-[600px]:gap-1 min-[700px]:gap-1.5 min-[800px]:gap-2 min-[900px]:gap-2.5 min-[1000px]:gap-3">
                    <button 
                      className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 bg-red-500 text-white rounded-full flex items-center justify-center"
                      onClick={() => gameSession.teams[0] && onUpdateScore(gameSession.teams[0].id, -100)}
                      title="خصم 100 نقطة"
                    >
                      <Minus className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 bg-green-500 text-white rounded-full flex items-center justify-center"
                      onClick={() => gameSession.teams[0] && onUpdateScore(gameSession.teams[0].id, 100)}
                      title="إضافة 100 نقطة"
                    >
                      <Plus className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div className="bg-black/80 rounded-lg p-0.25 min-[400px]:p-0.5 min-[500px]:p-1 min-[600px]:p-1.5 min-[700px]:p-2 min-[800px]:p-2.5 min-[900px]:p-3 min-[1000px]:p-4 flex flex-col">
                <div className="flex justify-between items-center mb-0.25 min-[400px]:mb-0.5 min-[500px]:mb-1 min-[600px]:mb-1.5 min-[700px]:mb-2 min-[800px]:mb-2.5 min-[900px]:mb-3">
                  <span className="text-white font-bold text-[8px] min-[400px]:text-[9px] min-[500px]:text-[10px] min-[600px]:text-xs min-[700px]:text-sm min-[800px]:text-base min-[900px]:text-lg min-[1000px]:text-xl px-0.25 min-[400px]:px-0.5 min-[500px]:px-1 min-[600px]:px-1.5 min-[700px]:px-2 min-[800px]:px-2.5 min-[900px]:px-3 py-0.125 min-[400px]:py-0.25 min-[500px]:py-0.5 min-[600px]:py-0.75 min-[700px]:py-1 min-[800px]:py-1.5 rounded bg-red-600 truncate max-w-[40%] min-[400px]:max-w-[45%] min-[500px]:max-w-[50%] min-[600px]:max-w-[55%] min-[700px]:max-w-[60%]">
                    {gameSession.teams[1]?.name || 'الفريق الثاني'}
                  </span>
                  <span className="text-white font-bold text-[9px] min-[400px]:text-[10px] min-[500px]:text-xs min-[600px]:text-sm min-[700px]:text-base min-[800px]:text-lg min-[900px]:text-xl min-[1000px]:text-2xl flex-shrink-0">
                    {gameSession.teams[1]?.score || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  {/* Helper Tools */}
                  <div className="flex gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-0.75 min-[600px]:gap-1 min-[700px]:gap-1.5 min-[800px]:gap-2 min-[900px]:gap-2.5 min-[1000px]:gap-3">
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[1]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[1]?.helperTools?.callFriend}
                      onClick={() => gameSession.teams[1] && handleActivateCallFriend(gameSession.teams[1].id)}
                      title="اتصال بصديق"
                    >
                      <Phone className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[1]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[1]?.helperTools?.twoAnswers}
                      onClick={() => gameSession.teams[1] && handleActivateTwoAnswers(gameSession.teams[1].id)}
                      title="محاولتان"
                    >
                      <Eye className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className={`w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 rounded-full flex items-center justify-center ${
                        gameSession.teams[1]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                      disabled={!gameSession.teams[1]?.helperTools?.steal}
                      onClick={() => gameSession.teams[1] && gameSession.teams[0] && handleActivateSteal(gameSession.teams[1].id, gameSession.teams[0].id)}
                      title="سرقة نقاط"
                    >
                      <Hand className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                  </div>
                  
                  {/* Score Controls */}
                  <div className="flex gap-0.25 min-[400px]:gap-0.5 min-[500px]:gap-0.75 min-[600px]:gap-1 min-[700px]:gap-1.5 min-[800px]:gap-2 min-[900px]:gap-2.5 min-[1000px]:gap-3">
                    <button 
                      className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 bg-red-500 text-white rounded-full flex items-center justify-center"
                      onClick={() => gameSession.teams[1] && onUpdateScore(gameSession.teams[1].id, -100)}
                      title="خصم 100 نقطة"
                    >
                      <Minus className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                    <button 
                      className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 min-[500px]:w-4 min-[500px]:h-4 min-[600px]:w-5 min-[600px]:h-5 min-[700px]:w-6 min-[700px]:h-6 min-[800px]:w-7 min-[800px]:h-7 min-[900px]:w-8 min-[900px]:h-8 min-[1000px]:w-9 min-[1000px]:h-9 min-[1200px]:w-10 min-[1200px]:h-10 min-[1400px]:w-12 min-[1400px]:h-12 bg-green-500 text-white rounded-full flex items-center justify-center"
                      onClick={() => gameSession.teams[1] && onUpdateScore(gameSession.teams[1].id, 100)}
                      title="إضافة 100 نقطة"
                    >
                      <Plus className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 min-[600px]:w-3 min-[600px]:h-3 min-[700px]:w-3.5 min-[700px]:h-3.5 min-[800px]:w-4 min-[800px]:h-4 min-[900px]:w-4.5 min-[900px]:h-4.5 min-[1000px]:w-5 min-[1000px]:h-5 min-[1200px]:w-6 min-[1200px]:h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection Status Indicator */}
        {renderConnectionStatus()}
      </div>
      </OrientationManager>
    );
  }

  // Question Display Screen - FULLY RESPONSIVE
  if (gameSession.currentQuestion && !gameSession.showAnswer && !showScoreScreen) {
    // Log audio question details for debugging
    if (gameSession.currentQuestion.questionType === 'audio' || gameSession.currentQuestion.audio_url) {
      console.log('🎵 Audio Question Details:', {
        audio_url: gameSession.currentQuestion.audio_url,
        questionType: gameSession.currentQuestion.questionType,
        question: gameSession.currentQuestion.question
      });
    }
    
    return (
      <OrientationManager forceOrientation="both">
        <div className="game-page-container h-screen w-screen overflow-y-auto bg-gradient-to-br from-black-900 to-black flex flex-col">
        {/* Header - MOBILE OPTIMIZED */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-1 sm:p-2 flex-shrink-0">
          <div className="w-full max-w-7xl mx-auto px-1 sm:px-2 md:px-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1">
                <div className="bg-white/20 px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">
                  <span className="truncate max-w-[80px] sm:max-w-none">{getCategoryName(gameSession.currentQuestion.category)}</span>
                </div>
              </div>

              <div className="text-center flex-1 min-w-0">
                <div className="text-sm sm:text-base md:text-lg font-bold truncate">{gameSession.gameName || 'شير لوك'}</div>
              </div>

              <div className="flex items-center gap-1">
                <div className="bg-white/20 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                  <span className="truncate max-w-[60px] sm:max-w-none">{currentTeam?.name || 'الفريق'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Section - MOBILE OPTIMIZED */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-0.5 sm:py-1 bg-black flex-shrink-0">
          <div className="bg-black text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <button 
              onClick={toggleTimer}
              className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-700 rounded-full flex items-center justify-center"
            >
              {isTimerRunning && !isTimerPaused ? <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            </button>
            
            <div className="font-mono font-bold text-lg sm:text-xl md:text-2xl">
              {formatTime(timer)}
            </div>
            
            <button 
              onClick={resetTimer}
              className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-700 rounded-full flex items-center justify-center"
            >
              <Reset className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </div>
          
          <div className="bg-black text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">
            <span className="font-bold">{gameSession.currentQuestion.points}</span>
          </div>
        </div>

        {/* Helper Tool Active Indicator - MOBILE OPTIMIZED */}
        {activeHelperTool && (
          <div className={`p-0.5 sm:p-1 text-center text-xs sm:text-sm text-white ${
            activeHelperTool.type === 'callFriend' ? 'bg-blue-600' :
            activeHelperTool.type === 'twoAnswers' ? 'bg-purple-600' : 'bg-red-600'
          }`}>
            {activeHelperTool.type === 'callFriend' && (
              <div className="flex items-center justify-center gap-1">
                <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="truncate">اتصال بصديق: {activeHelperTool.timeRemaining} ثانية متبقية</span>
              </div>
            )}
            {activeHelperTool.type === 'twoAnswers' && (
              <div className="flex items-center justify-center gap-1">
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>محاولتان للإجابة</span>
              </div>
            )}
            {activeHelperTool.type === 'steal' && (
              <div className="flex items-center justify-center gap-1">
                <Hand className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>سرقة النقاط من الفريق الآخر</span>
              </div>
            )}
          </div>
        )}

        {/* Year Range Display if enabled */}
        {gameSession.currentQuestion.year_range_enabled && (
          <div className="p-0.5 sm:p-1 flex-shrink-0">
            <YearRangeDisplay 
              enabled={gameSession.currentQuestion.year_range_enabled} 
              value={gameSession.currentQuestion.year_range_value || 1} 
            />
          </div>
        )}

        {/* Main Content - LANDSCAPE OPTIMIZED */}
        <div className="flex-grow overflow-y-auto flex flex-col bg-black">
          <div className="h-full flex flex-col p-0.5">
            {/* Dashed Border Frame for Question and Photo */}
            <div className="border-[6px] sm:border-[8px] md:border-[10px] lg:border-[12px] xl:border-[14px] border-dashed rounded-lg p-0.25 sm:p-0.5 md:p-1 lg:p-2 xl:p-3 mb-0.25 sm:mb-0.5 md:mb-1 mx-auto w-[85%] sm:w-[80%] md:w-[75%] lg:w-[70%] xl:w-[65%]" style={{ borderColor: '#ff3d00' }}>
              {/* Question Card - LANDSCAPE OPTIMIZED */}
              <div className="bg-black rounded-lg p-0.25 sm:p-0.5 md:p-1 lg:p-2 xl:p-3 mb-0.25 sm:mb-0.5 md:mb-1 shadow-lg flex-shrink-0">
                <h2 className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-bold text-white text-center leading-tight px-0.5 sm:px-1 md:px-2 lg:px-3">
                  {gameSession.currentQuestion.question}
                </h2>
              </div>
              
              {/* Media Content - LANDSCAPE OPTIMIZED */}
              <div className="flex-grow flex items-center justify-center overflow-y-auto mb-0.5 sm:mb-1 md:mb-2 min-h-0 max-h-[30vh] sm:max-h-[40vh] md:max-h-[50vh] lg:max-h-[60vh]">
              {/* Check for audio question type or audio_url property */}
              {(gameSession.currentQuestion.questionType === 'audio' || gameSession.currentQuestion.audio_url) && (
                <div className="w-full max-w-full h-auto">
                  <AudioQuestion 
                    audio_url={gameSession.currentQuestion.audio_url || ''}
                    question={gameSession.currentQuestion.question}
                  />
                </div>
              )}
              
              {/* Blurry image question */}
              {gameSession.currentQuestion.questionType === 'blurry_image' && gameSession.currentQuestion.imageUrl && (
                <div className="w-full h-full flex items-center justify-center p-0.5 sm:p-1">
                  <div className="relative max-h-full max-w-full">
                    <img 
                      src={gameSession.currentQuestion.imageUrl} 
                      alt={gameSession.currentQuestion.imageDescription || 'صورة السؤال'}
                      className="max-h-full max-w-full object-contain rounded-lg max-h-[25vh] sm:max-h-[35vh] md:max-h-[45vh] lg:max-h-[55vh]"
                      style={{ filter: `blur(${gameSession.currentQuestion.blurLevel || 5}px)` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Regular image question */}
              {!gameSession.currentQuestion.audio_url && 
               gameSession.currentQuestion.questionType !== 'audio' && 
               gameSession.currentQuestion.questionType !== 'blurry_image' && 
               gameSession.currentQuestion.imageUrl && (
                <div className="w-full h-full flex items-center justify-center p-0.5 sm:p-1">
                  <img 
                    src={gameSession.currentQuestion.imageUrl} 
                    alt={gameSession.currentQuestion.imageDescription || 'صورة السؤال'}
                    className="max-h-full max-w-full object-contain rounded-lg max-h-[25vh] sm:max-h-[35vh] md:max-h-[45vh] lg:max-h-[55vh]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';
                    }}
                  />
                </div>
              )}
              
              {/* Fallback if no media */}
              {!gameSession.currentQuestion.audio_url && 
               !gameSession.currentQuestion.imageUrl && 
               gameSession.currentQuestion.questionType !== 'audio' && 
               gameSession.currentQuestion.questionType !== 'blurry_image' && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                  <HelpCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                </div>
              )}
            </div>
            </div>
            
            {/* Action Buttons - LANDSCAPE OPTIMIZED */}
            <div className="flex justify-center gap-1 flex-shrink-0">
              <button
                onClick={onShowAnswer}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 sm:px-3 rounded-full text-xs active:scale-95 transition-all"
              >
                الإجابة
              </button>
              <button
                onClick={handleShowScoreScreen}
                className="bg-orange-500 hover:bg-red-600 text-white font-bold py-1 px-2 sm:px-3 rounded-full text-xs active:scale-95 transition-all"
              >
                من جاوب صح؟
              </button>
            </div>
          </div>
        </div>

        {/* Teams Section - LANDSCAPE OPTIMIZED */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-0.5 p-0.5 bg-black">
          {/* Team 1 - LANDSCAPE OPTIMIZED */}
          <div className="bg-black/80 rounded-lg p-0.5 flex flex-col">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-white font-bold text-xs px-1 py-0.5 rounded bg-red-600 truncate max-w-[50%]">
                {gameSession.teams[0]?.name || 'الفريق الأول'}
              </span>
              <span className="text-white font-bold text-sm flex-shrink-0">
                {gameSession.teams[0]?.score || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              {/* Helper Tools */}
              <div className="flex gap-0.5">
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[0]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[0]?.helperTools?.callFriend || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[0] && handleActivateCallFriend(gameSession.teams[0].id)}
                  title="اتصال بصديق"
                >
                  <Phone className="w-2 h-2" />
                </button>
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[0]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[0]?.helperTools?.twoAnswers || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[0] && handleActivateTwoAnswers(gameSession.teams[0].id)}
                  title="محاولتان"
                >
                  <Eye className="w-2 h-2" />
                </button>
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[0]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[0]?.helperTools?.steal || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[0] && gameSession.teams[1] && handleActivateSteal(gameSession.teams[0].id, gameSession.teams[1].id)}
                  title="سرقة نقاط"
                >
                  <Hand className="w-2 h-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Team 2 - LANDSCAPE OPTIMIZED */}
          <div className="bg-black/80 rounded-lg p-0.5 flex flex-col">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-white font-bold text-xs px-1 py-0.5 rounded bg-red-600 truncate max-w-[50%]">
                {gameSession.teams[1]?.name || 'الفريق الثاني'}
              </span>
              <span className="text-white font-bold text-sm flex-shrink-0">
                {gameSession.teams[1]?.score || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              {/* Helper Tools */}
              <div className="flex gap-0.5">
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[1]?.helperTools?.callFriend ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[1]?.helperTools?.callFriend || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[1] && handleActivateCallFriend(gameSession.teams[1].id)}
                  title="اتصال بصديق"
                >
                  <Phone className="w-2 h-2" />
                </button>
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[1]?.helperTools?.twoAnswers ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[1]?.helperTools?.twoAnswers || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[1] && handleActivateTwoAnswers(gameSession.teams[1].id)}
                  title="محاولتان"
                >
                  <Eye className="w-2 h-2" />
                </button>
                <button 
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    gameSession.teams[1]?.helperTools?.steal ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  disabled={!gameSession.teams[1]?.helperTools?.steal || activeHelperTool !== undefined}
                  onClick={() => gameSession.teams[1] && gameSession.teams[0] && handleActivateSteal(gameSession.teams[1].id, gameSession.teams[0].id)}
                  title="سرقة نقاط"
                >
                  <Hand className="w-2 h-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection Status Indicator */}
        {renderConnectionStatus()}
      </div>
      </OrientationManager>
    );
  }

  // Score Screen - FULLY RESPONSIVE, NO SCROLL
  if (showScoreScreen && gameSession.currentQuestion) {
    return (
      <div className="game-page-container h-screen w-screen overflow-y-auto bg-black flex flex-col">
        {/* Header - RESPONSIVE */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-2 flex-shrink-0">
          <div className="container mx-auto">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1">
                <div className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                  <span>{getCategoryName(gameSession.currentQuestion.category)}</span>
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

        {/* Main Content - FULLY RESPONSIVE, NO SCROLL */}
        <div className="flex-grow overflow-y-auto flex flex-col p-2 bg-black">
          <div className="bg-black rounded-lg p-4 mb-3 shadow-lg flex-shrink-0">
                          <h2 className="text-xl font-bold text-white text-center mb-2">
                من جاوب صح؟
              </h2>
              <p className="text-gray-300 text-center text-sm">
                اختر الفريق الذي أجاب إجابة صحيحة
              </p>
          </div>
          
          {/* Team Buttons */}
          <div className="flex-grow flex flex-col justify-center gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleTeamScored(gameSession.teams[0]?.id || 'team-1')}
                className="bg-orange-500 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl text-lg flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                {gameSession.teams[0]?.name || 'الفريق الأول'}
              </button>
              <button
                onClick={() => handleTeamScored(gameSession.teams[1]?.id || 'team-2')}
                className="bg-orange-500 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl text-lg flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                {gameSession.teams[1]?.name || 'الفريق الثاني'}
              </button>
            </div>
            
            <button
              onClick={handleNoOneScored}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl text-lg flex items-center justify-center gap-2 mx-auto"
            >
              <X className="w-5 h-5" />
              لا أحد
            </button>
          </div>
          
          {/* Back Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleBackToAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-sm w-full"
            >
              العودة للإجابة
            </button>
          </div>
        </div>
        
        {/* Connection Status Indicator */}
        {renderConnectionStatus()}
      </div>
    );
  }

  // Answer Display Screen - FULLY RESPONSIVE, NO SCROLL
  if (gameSession.currentQuestion && gameSession.showAnswer) {
    return (
      <div className="game-page-container h-screen w-screen overflow-y-auto bg-black flex flex-col">
        {/* Header - RESPONSIVE */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-2 flex-shrink-0">
          <div className="container mx-auto">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1">
                <div className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                  <span>{getCategoryName(gameSession.currentQuestion.category)}</span>
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

        {/* Main Content - FULLY RESPONSIVE, NO SCROLL */}
        <div className="flex-grow overflow-hidden flex flex-col p-2 bg-black">
          {/* Answer Card */}
          <div className="bg-black rounded-lg p-4 mb-3 shadow-lg flex-shrink-0 border-2 border-green-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-green-600 text-center">
                الإجابة الصحيحة
              </h2>
            </div>
            <p className="text-white text-center text-lg font-bold">
              {gameSession.currentQuestion.answer}
            </p>
          </div>
          
          {/* Additional Info */}
          {gameSession.currentQuestion.additionalInfo && (
            <div className="bg-black rounded-lg p-3 mb-3 border border-blue-200 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 font-bold text-sm">معلومات إضافية</span>
              </div>
              <p className="text-blue-300 text-sm">
                {gameSession.currentQuestion.additionalInfo}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex-grow flex flex-col justify-end">
            <div className="flex justify-center">
              <button
                onClick={handleShowScoreScreen}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                من جاوب صح؟
              </button>
            </div>
          </div>
        </div>

        {/* Teams Section - COMPACT */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-2 bg-black">
          {/* Team 1 */}
          <div className="bg-black/80 rounded-lg p-2">
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
          <div className="bg-black/80 rounded-lg p-2">
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
        
        {/* Connection Status Indicator */}
        {renderConnectionStatus()}
      </div>
    );
  }

  // Steal Tool Active Screen
  if (activeHelperTool?.type === 'steal') {
    const stealingTeam = gameSession.teams.find(t => t.id === activeHelperTool.teamId);
    const targetTeam = gameSession.teams.find(t => t.id === activeHelperTool.targetTeamId);
    
    if (!stealingTeam || !targetTeam) return null;
    
    const stealPoints = 100; // Fixed amount to steal
    
    return (
      <div className="game-page-container h-screen w-screen overflow-y-auto bg-black flex flex-col">
        {/* Header */}
        <div className="bg-red-600 p-2 flex-shrink-0">
          <div className="container mx-auto">
            <div className="flex items-center justify-between text-white">
              <div className="text-center w-full">
                <div className="text-lg font-bold">وسيلة المساعدة: سرقة النقاط</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow overflow-hidden flex flex-col p-4 bg-black">
          <div className="bg-black/80 rounded-lg p-4 mb-4 shadow-lg flex-shrink-0 border border-red-500">
            <h2 className="text-xl font-bold text-white text-center mb-4">
              سرقة النقاط
            </h2>
            <p className="text-gray-300 text-center mb-6">
              فريق <span className="font-bold text-red-400">{stealingTeam.name}</span> سيسرق {stealPoints} نقطة من فريق <span className="font-bold text-red-400">{targetTeam.name}</span>
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black p-3 rounded-lg text-center">
                <div className="text-sm text-gray-400 mb-1">الفريق السارق</div>
                <div className="text-lg font-bold text-white">{stealingTeam.name}</div>
                <div className="text-2xl font-black text-white mt-2">{stealingTeam.score} <span className="text-green-500">+{stealPoints}</span></div>
              </div>
              
              <div className="bg-black p-3 rounded-lg text-center">
                <div className="text-sm text-gray-400 mb-1">الفريق المستهدف</div>
                <div className="text-lg font-bold text-white">{targetTeam.name}</div>
                <div className="text-2xl font-black text-white mt-2">{targetTeam.score} <span className="text-red-500">-{stealPoints}</span></div>
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleExecuteSteal(stealingTeam.id, targetTeam.id, stealPoints)}
                className="bg-red-600 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg text-lg flex items-center justify-center gap-2"
              >
                <Hand className="w-5 h-5" />
                تنفيذ السرقة
              </button>
              
              <button
                onClick={endHelperTool}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
        
        {/* Connection Status Indicator */}
        {renderConnectionStatus()}
      </div>
    );
  }

  return null;
};