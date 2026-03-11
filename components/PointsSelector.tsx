import React from 'react';

interface PointsSelectorProps {
  onSelectPoints: (points: number) => void;
  availablePoints: number[];
}

export const PointsSelector: React.FC<PointsSelectorProps> = ({ onSelectPoints, availablePoints }) => {
  const getDifficultyLabel = (points: number) => {
    switch (points) {
      case 100: return 'سهل';
      case 200: return 'متوسط';
      case 300: return 'صعب';
      default: return '';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
      {[100, 200, 300].map(points => (
        <div
          key={points}
          className={`points-card ${
            availablePoints.includes(points)
              ? 'cursor-pointer hover:scale-110'
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={() => availablePoints.includes(points) && onSelectPoints(points)}
        >
          <div className="text-center">
            <div className="text-3xl font-black mb-2">{points}</div>
            <div className="text-sm font-medium">{getDifficultyLabel(points)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};