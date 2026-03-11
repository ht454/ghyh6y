import React from 'react';
import { Team } from '../types/game';
import { Minus, Plus, RotateCcw, Phone, Hand } from 'lucide-react';

interface TeamScoreCardProps {
  team: Team;
  onUpdateScore: (teamId: string, points: number) => void;
  isActive?: boolean;
}

export const TeamScoreCard: React.FC<TeamScoreCardProps> = ({ 
  team, 
  onUpdateScore, 
  isActive = false 
}) => {
  const handleScoreDecrease = () => {
    console.log(`🔻 Decreasing score for team: ${team.id} (${team.name})`);
    onUpdateScore(team.id, -100);
  };

  const handleScoreIncrease = () => {
    console.log(`🔺 Increasing score for team: ${team.id} (${team.name})`);
    onUpdateScore(team.id, 100);
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg ${isActive ? 'ring-4 ring-red-500' : ''}`}>
      <div className="text-center mb-4">
        <div className={`inline-block px-6 py-2 rounded-full text-white font-bold text-lg ${
          isActive ? 'bg-red-500' : 'bg-gray-400'
        }`}>
          {team.name}
        </div>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-4xl font-black">{team.score}</div>
        <div className="text-sm text-gray-600">وسائل المساعدة</div>
      </div>
      
      <div className="flex justify-center gap-2 mb-4">
        <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <Hand className="w-4 h-4" />
        </button>
      </div>
      
      <div className="score-counter justify-center">
        <button
          className="score-btn score-btn-minus"
          onClick={handleScoreDecrease}
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          className="score-btn score-btn-plus"
          onClick={handleScoreIncrease}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};