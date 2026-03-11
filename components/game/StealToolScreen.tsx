import React from 'react';
import { GameSession } from '../../types/game';
import { Hand } from 'lucide-react';

interface StealToolScreenProps {
  gameSession: GameSession;
  handleExecuteSteal: (stealingTeamId: string, targetTeamId: string, points: number) => void;
  endHelperTool: () => void;
}

export const StealToolScreen: React.FC<StealToolScreenProps> = ({
  gameSession,
  handleExecuteSteal,
  endHelperTool
}) => {
  const activeHelperTool = gameSession.activeHelperTool;
  
  if (!activeHelperTool || activeHelperTool.type !== 'steal') return null;
  
  const stealingTeam = gameSession.teams.find(t => t.id === activeHelperTool.teamId);
  const targetTeam = gameSession.teams.find(t => t.id === activeHelperTool.targetTeamId);
  
  if (!stealingTeam || !targetTeam) return null;
  
  const stealPoints = 100; 

  return (
    <div className="game-page-container h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black flex flex-col">
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
      <div className="flex-grow overflow-hidden flex flex-col p-4">
        <div className="bg-black/50 rounded-lg p-4 mb-4 shadow-lg flex-shrink-0 border border-red-500">
          <h2 className="text-xl font-bold text-white text-center mb-4">
            سرقة النقاط
          </h2>
          <p className="text-gray-300 text-center mb-6">
            فريق <span className="font-bold text-red-400">{stealingTeam.name}</span> سيسرق {stealPoints} نقطة من فريق <span className="font-bold text-red-400">{targetTeam.name}</span>
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">الفريق السارق</div>
              <div className="text-lg font-bold text-white">{stealingTeam.name}</div>
              <div className="text-2xl font-black text-white mt-2">{stealingTeam.score} <span className="text-green-500">+{stealPoints}</span></div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">الفريق المستهدف</div>
              <div className="text-lg font-bold text-white">{targetTeam.name}</div>
              <div className="text-2xl font-black text-white mt-2">{targetTeam.score} <span className="text-red-500">-{stealPoints}</span></div>
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleExecuteSteal(stealingTeam.id, targetTeam.id, stealPoints)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-lg flex items-center justify-center gap-2"
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
    </div>
  );
};