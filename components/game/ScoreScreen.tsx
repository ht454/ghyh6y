import React from 'react';
import { GameSession } from '../../types/game';
import { Trophy, X } from 'lucide-react';

interface ScoreScreenProps {
  gameSession: GameSession;
  handleTeamScored: (teamId: string) => void;
  handleNoOneScored: () => void;
  handleBackToAnswer: () => void;
}

export const ScoreScreen: React.FC<ScoreScreenProps> = ({
  gameSession,
  handleTeamScored,
  handleNoOneScored,
  handleBackToAnswer
}) => {
  if (!gameSession.currentQuestion) return null;

  return (
    <div className="game-page-container min-h-screen w-full overflow-auto bg-black flex flex-col">
      {}
      <div className="bg-white p-6 rounded-b-3xl shadow-lg mx-4 mb-8 sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          من جاوب صح؟
        </h2>
        <p className="text-center text-gray-600">
          اختر الفريق الذي أجاب إجابة صحيحة
        </p>
      </div>

      {}
      <div className="flex-grow overflow-auto p-4">
        {}
        <div className="grid grid-cols-1 gap-4 mb-4">
          {}
          <button
            onClick={() => handleTeamScored(gameSession.teams[0]?.id || 'team-1')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-xl flex items-center justify-center"
          >
            <Trophy className="w-6 h-6 mr-2" />
            {gameSession.teams[0]?.name || 'الفريق الأول'}
          </button>
          
          {}
          <button
            onClick={() => handleTeamScored(gameSession.teams[1]?.id || 'team-2')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-xl flex items-center justify-center"
          >
            <Trophy className="w-6 h-6 mr-2" />
            {gameSession.teams[1]?.name || 'الفريق الثاني'}
          </button>
        </div>
        
        {}
        <div className="mb-4">
          <button
            onClick={handleNoOneScored}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl text-lg w-full flex items-center justify-center"
          >
            <X className="w-5 h-5 mr-2" />
            ولا أحد
          </button>
        </div>
      </div>
      
      {}
      <div className="px-4 py-4 bg-black sticky bottom-0">
        <button
          onClick={handleBackToAnswer}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-lg w-full"
        >
          العودة للإجابة
        </button>
      </div>
    </div>
  );
};