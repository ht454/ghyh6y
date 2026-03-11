import React, { useState, useEffect } from 'react';
import { sessionService, GamingSession, SessionStats } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Award, Activity, BarChart2, Play, Pause, X, Save, Loader } from 'lucide-react';

interface SessionManagerProps {
  gameType: string;
  gameId?: string;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionData: GamingSession) => void;
  showStats?: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  gameType,
  gameId,
  onSessionStart,
  onSessionEnd,
  showStats = true
}) => {
  const [activeSession, setActiveSession] = useState<GamingSession | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Check for active session on component mount
  useEffect(() => {
    checkActiveSession();
    if (showStats) {
      loadSessionStats();
    }
  }, []);

  // Update elapsed time for active session
  useEffect(() => {
    let interval: number | null = null;
    
    if (activeSession && activeSession.status === 'active') {
      interval = window.setInterval(() => {
        const startTime = new Date(activeSession.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeSession]);

  const checkActiveSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const session = await sessionService.getActiveSession();
      setActiveSession(session);
      
      if (session) {
        const startTime = new Date(session.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      setError('Failed to check active session');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    try {
      if (!user) return;
      
      const stats = await sessionService.getUserStats();
      setSessionStats(stats);
    } catch (err) {
      console.error('Error loading session stats:', err);
    }
  };

  const handleStartSession = async () => {
    try {
      setStarting(true);
      setError(null);
      
      // Get device info
      const deviceInfo = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      };
      
      const session = await sessionService.startSession(gameType, gameId, deviceInfo);
      
      if (session) {
        setActiveSession(session);
        setElapsedTime(0);
        
        if (onSessionStart) {
          onSessionStart(session.id);
        }
      } else {
        setError('Failed to start session');
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    
    try {
      setEnding(true);
      setError(null);
      
      const success = await sessionService.endSession(
        activeSession.id,
        activeSession.score,
        activeSession.xpEarned,
        activeSession.levelReached
      );
      
      if (success) {
        if (onSessionEnd) {
          onSessionEnd(activeSession);
        }
        
        setActiveSession(null);
        setElapsedTime(0);
        
        // Refresh stats
        if (showStats) {
          loadSessionStats();
        }
      } else {
        setError('Failed to end session');
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    } finally {
      setEnding(false);
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    
    try {
      setPausing(true);
      setError(null);
      
      const success = await sessionService.pauseSession(activeSession.id);
      
      if (success) {
        setActiveSession({
          ...activeSession,
          status: 'paused'
        });
      } else {
        setError('Failed to pause session');
      }
    } catch (err) {
      console.error('Error pausing session:', err);
      setError('Failed to pause session');
    } finally {
      setPausing(false);
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    
    try {
      setPausing(true);
      setError(null);
      
      const success = await sessionService.resumeSession(activeSession.id);
      
      if (success) {
        setActiveSession({
          ...activeSession,
          status: 'active'
        });
      } else {
        setError('Failed to resume session');
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      setError('Failed to resume session');
    } finally {
      setPausing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
        <Loader className="w-5 h-5 text-white animate-spin mr-2" />
        <span className="text-white">Loading session...</span>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      {activeSession ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-lg">Active Session</h3>
              <p className="text-white/70 text-sm">{activeSession.gameType}</p>
            </div>
            <div className="bg-black/30 px-3 py-1 rounded-full flex items-center">
              <Clock className="w-4 h-4 text-white/70 mr-2" />
              <span className="text-white font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-white/70 text-xs mb-1">Score</div>
              <div className="text-white font-bold text-xl">{activeSession.score}</div>
            </div>
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-white/70 text-xs mb-1">XP Earned</div>
              <div className="text-white font-bold text-xl">{activeSession.xpEarned}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {activeSession.status === 'active' ? (
              <button
                onClick={handlePauseSession}
                disabled={pausing}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pausing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Pause
              </button>
            ) : (
              <button
                onClick={handleResumeSession}
                disabled={pausing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pausing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Resume
              </button>
            )}
            
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {ending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              End Session
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">Start New Session</h3>
          </div>
          
          <button
            onClick={handleStartSession}
            disabled={starting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {starting ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Start Session
          </button>
        </div>
      )}
      
      {showStats && sessionStats && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <h3 className="text-white font-bold text-lg mb-3">Your Stats</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <div className="text-white/70 text-xs">Total Sessions</div>
              </div>
              <div className="text-white font-bold text-lg">{sessionStats.totalSessions}</div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-400" />
                <div className="text-white/70 text-xs">Avg. Duration</div>
              </div>
              <div className="text-white font-bold text-lg">
                {sessionStats.avgSessionDuration ? 
                  formatTime(Math.floor(sessionStats.avgSessionDuration / 1000)) : 
                  '0:00'}
              </div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <div className="text-white/70 text-xs">Total Score</div>
              </div>
              <div className="text-white font-bold text-lg">{sessionStats.totalScore}</div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <div className="text-white/70 text-xs">Achievements</div>
              </div>
              <div className="text-white font-bold text-lg">{sessionStats.achievementsEarned}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};