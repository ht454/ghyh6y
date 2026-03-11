import React from 'react';
import { Team } from '../types/game';
import { Users, Trophy } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  isActive?: boolean;
  rank?: number;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, isActive = false, rank }) => {
  return (
    <div className={`card p-6 ${isActive ? 'ring-4 ring-purple-500 bg-purple-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${team.color}`}>
            <Users className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
            {rank && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Trophy className="w-4 h-4" />
                <span>المركز {rank}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-left">
          <div className="text-3xl font-black text-gray-800">{team.score}</div>
          <div className="text-sm text-gray-600">نقطة</div>
        </div>
      </div>
      {isActive && (
        <div className="bg-purple-100 rounded-lg p-3 text-center">
          <span className="text-purple-700 font-semibold">الدور الحالي</span>
        </div>
      )}
    </div>
  );
};