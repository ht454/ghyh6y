import React from 'react';
import { Calendar } from 'lucide-react';

interface YearRangeDisplayProps {
  enabled: boolean;
  value: number;
}

const YearRangeDisplay: React.FC<YearRangeDisplayProps> = ({ enabled, value }) => {
  if (!enabled) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-md mx-auto">
      <Calendar className="w-4 h-4" />
      <span>
        نطاق السنة المقبول: ±{value} {value === 1 ? 'سنة' : 'سنوات'}
      </span>
    </div>
  );
};

export default YearRangeDisplay;