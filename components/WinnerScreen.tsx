import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Star, Sparkles, PartyPopper, Medal, Zap, Heart, Gift, SettingsIcon as Confetti, Home, RotateCcw, Share2, Camera, Volume2, VolumeX } from 'lucide-react';
import { Team } from '../types/game';

interface WinnerScreenProps {
  teams: Team[];
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameName: string;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  teams,
  onPlayAgain,
  onGoHome,
  gameName
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];
  const isDrawGame = sortedTeams[0].score === sortedTeams[1]?.score;

  useEffect(() => {
    const phases = [
      () => setAnimationPhase(1), 
      () => setAnimationPhase(2), 
      () => setAnimationPhase(3), 
      () => setAnimationPhase(4), 
    ];

    phases.forEach((phase, index) => {
      setTimeout(phase, (index + 1) * 800);
    });

    setTimeout(() => setShowConfetti(false), 10000);
  }, []);

  const generateConfetti = () => {
    const confettiElements = [];
    for (let i = 0; i < 50; i++) {
      const colors = ['#ff6b35', '#dc2626', '#2563eb', '#16a34a', '#7c3aed', '#db2777', '#eab308'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomDelay = Math.random() * 3;
      const randomDuration = 3 + Math.random() * 2;
      const randomX = Math.random() * 100;

      confettiElements.push(
        <div
          key={i}
          className="absolute w-0.25 h-0.25 sm:w-1 sm:h-1 md:w-2 md:h-2 opacity-80"
          style={{
            backgroundColor: randomColor,
            left: `${randomX}%`,
            animationDelay: `${randomDelay}s`,
            animationDuration: `${randomDuration}s`,
            animation: 'confetti-fall linear infinite'
          }}
        />
      );
    }
    return confettiElements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF914D] to-[#FF3131] relative overflow-hidden">
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes crown-bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0) scale(1);
            }
            40% {
              transform: translateY(-20px) scale(1.1);
            }
            60% {
              transform: translateY(-10px) scale(1.05);
            }
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `
      }} />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {generateConfetti()}
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-1 sm:top-8 md:top-20 left-1 sm:left-8 md:left-20 w-2 h-2 sm:w-12 sm:h-12 md:w-32 md:h-32 bg-yellow-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-2 sm:top-16 md:top-40 right-1 sm:right-8 md:right-32 w-1.5 h-1.5 sm:w-10 sm:h-10 md:w-24 md:h-24 bg-purple-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-2 sm:bottom-16 md:bottom-32 left-1/3 w-2.5 h-2.5 sm:w-16 sm:h-16 md:w-40 md:h-40 bg-blue-400/20 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-1 sm:bottom-8 md:bottom-20 right-1 sm:right-8 md:right-20 w-1.75 h-1.75 sm:w-12 sm:h-12 md:w-28 md:h-28 bg-pink-400/20 rounded-full animate-pulse delay-3000"></div>
        
        {/* Sparkles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.125 h-0.125 sm:w-1 sm:h-1 md:w-2 md:h-2 bg-yellow-300 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `sparkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-0.5 sm:p-3 md:p-6">
        
        {/* Crown */}
        <div 
          className={`mb-0.5 sm:mb-4 md:mb-8 transition-all duration-1000 ${
            animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          style={{ animation: animationPhase >= 1 ? 'crown-bounce 2s ease-in-out infinite' : 'none' }}
        >
          <div className="relative">
            <Crown className="w-6 h-6 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 text-yellow-400 drop-shadow-2xl" />
            <div className="absolute inset-0 w-6 h-6 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 bg-yellow-400/30 rounded-full blur-xl"></div>
            
            {/* Crown Jewels */}
            <div className="absolute top-0.25 sm:top-2 md:top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-0.25 h-0.25 sm:w-1.5 sm:h-1.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute top-0.5 sm:top-2.5 md:top-6 left-0.5 sm:left-3 md:left-8">
              <div className="w-0.125 h-0.125 sm:w-1 sm:h-1 md:w-2 md:h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
            </div>
            <div className="absolute top-0.5 sm:top-2.5 md:top-6 right-0.5 sm:right-3 md:right-8">
              <div className="w-0.125 h-0.125 sm:w-1 sm:h-1 md:w-2 md:h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div 
          className={`text-center mb-0.5 sm:mb-4 md:mb-8 transition-all duration-1000 delay-300 ${
            animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {isDrawGame ? (
            <>
              <h1 className="text-sm sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-0.25 sm:mb-2 md:mb-4 drop-shadow-lg">
                تعادل!
              </h1>
              <p className="text-[10px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-white/90 font-bold">
                حلو بدعتو والله
              </p>
            </>
          ) : (
            <>
              <h1 className="text-sm sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-0.25 sm:mb-2 md:mb-4 drop-shadow-lg">
                مبروك تساهل يا قوي !
              </h1>
              <p className="text-[10px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-white/90 font-bold">
                🎉 الفائز هو
              </p>
            </>
          )}
        </div>

        {/* Winner Name */}
        <div 
          className={`text-center mb-0.5 sm:mb-4 md:mb-8 transition-all duration-1000 delay-600 ${
            animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div 
            className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-0.5 sm:px-4 md:px-8 lg:px-12 py-0.25 sm:py-2 md:py-4 lg:py-6 rounded-sm sm:rounded-xl md:rounded-3xl shadow-2xl border-0.25 sm:border-2 md:border-4 border-yellow-300"
            style={{ animation: animationPhase >= 3 ? 'pulse-glow 2s ease-in-out infinite' : 'none' }}
          >
            <h2 className="text-[8px] sm:text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-6xl font-black">
              {isDrawGame ? 'تعادل صعب  ' : `👑 ${winner.name}`}
            </h2>
          </div>
        </div>

        {/* Team Scores */}
        <div 
          className={`mb-0.75 sm:mb-6 md:mb-12 transition-all duration-1000 delay-900 ${
            animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 sm:gap-3 md:gap-6 max-w-[200px] sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full px-0.25 sm:px-2 md:px-4">
            {sortedTeams.map((team, index) => (
              <div 
                key={team.id}
                className={`bg-black rounded-sm sm:rounded-xl md:rounded-2xl p-0.5 sm:p-3 md:p-6 border-0.25 sm:border-2 ${
                  index === 0 && !isDrawGame 
                    ? 'border-yellow-400 bg-black' 
                    : 'border-white/30 bg-black'
                }`}
                style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${index * 0.5}s` }}
              >
                <div className="flex items-center justify-between mb-0.25 sm:mb-2 md:mb-4">
                  <div className="flex items-center gap-0.25 sm:gap-2 md:gap-3">
                    {index === 0 && !isDrawGame && (
                      <Medal className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-yellow-400" />
                    )}
                    {index === 1 && !isDrawGame && (
                      <Medal className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-gray-400" />
                    )}
                    {index === 2 && !isDrawGame && (
                      <Medal className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-amber-600" />
                    )}
                    {isDrawGame && (
                      <Trophy className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-yellow-400" />
                    )}
                    <h3 className="text-[8px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-white">{team.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white">{team.score}</div>
                    <div className="text-[6px] sm:text-xs md:text-sm lg:text-base text-white/70">نقطة</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-0.25 sm:h-1.5 md:h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-2000 delay-1000 ${
                      index === 0 && !isDrawGame 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : 'bg-gradient-to-r from-blue-400 to-purple-500'
                    }`}
                    style={{ 
                      width: `${Math.max((team.score / Math.max(...sortedTeams.map(t => t.score))) * 100, 10)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Info */}
        <div 
          className={`text-center mb-0.5 sm:mb-4 md:mb-8 transition-all duration-1000 delay-1200 ${
            animationPhase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-black rounded-sm sm:rounded-xl md:rounded-2xl px-0.5 sm:px-4 md:px-8 py-0.25 sm:py-2 md:py-4 border border-white/20">
            <p className="text-[8px] sm:text-sm md:text-lg lg:text-xl text-white/80">
              🎮 <span className="font-bold">{gameName}</span> • 
              جولة جامدة• 
              ⭐ شكراً لكم جميعاً
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className={`flex flex-col sm:flex-row gap-0.5 sm:gap-3 md:gap-6 transition-all duration-1000 delay-1500 ${
            animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Play Again */}
          <button
            onClick={onPlayAgain}
            className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-0.25 sm:py-2 md:py-4 px-0.5 sm:px-4 md:px-8 rounded-sm sm:rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-0.25 sm:gap-2 md:gap-3 text-[8px] sm:text-sm md:text-lg"
          >
            <RotateCcw className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 group-hover:rotate-180 transition-transform duration-500" />
            ماودك بقيم جديد؟
            <Sparkles className="w-0.75 h-0.75 sm:w-3 sm:h-3 md:w-5 md:h-5 group-hover:animate-spin" />
          </button>

          {/* Share */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'نتيجة لعبة شير لوك',
                  text: `🏆 الفائز: ${winner.name} بـ ${winner.score} نقطة في لعبة ${gameName}!`,
                });
              }
            }}
            className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-0.25 sm:py-2 md:py-4 px-0.5 sm:px-4 md:px-8 rounded-sm sm:rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-0.25 sm:gap-2 md:gap-3 text-[8px] sm:text-sm md:text-lg"
          >
            <Share2 className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
            شهر فيهم
            <Heart className="w-0.75 h-0.75 sm:w-3 sm:h-3 md:w-5 md:h-5 group-hover:animate-pulse" />
          </button>

          {/* Home */}
          <button
            onClick={onGoHome}
            className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-0.25 sm:py-2 md:py-4 px-0.5 sm:px-4 md:px-8 rounded-sm sm:rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-0.25 sm:gap-2 md:gap-3 text-[8px] sm:text-sm md:text-lg"
          >
            <Home className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
            الرئيسية
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="absolute top-0.5 sm:top-4 md:top-8 right-0.5 sm:right-4 md:right-8">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/20 backdrop-blur-sm text-white p-0.25 sm:p-2 md:p-3 rounded-full hover:bg-white/30 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6" /> : <VolumeX className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />}
          </button>
        </div>

        {/* Confetti Toggle */}
        <div className="absolute top-0.5 sm:top-4 md:top-8 left-0.5 sm:left-4 md:left-8">
          <button
            onClick={() => setShowConfetti(!showConfetti)}
            className="bg-white/20 backdrop-blur-sm text-white p-0.25 sm:p-2 md:p-3 rounded-full hover:bg-white/30 transition-colors"
          >
            <PartyPopper className="w-1.5 h-1.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-12 md:h-24 lg:h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </div>
  );
};